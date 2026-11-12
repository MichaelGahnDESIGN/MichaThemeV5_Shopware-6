<?php
declare(strict_types=1);

namespace MichaThemeV5\NotificationCenter\Controller;

use MichaThemeV5\NotificationCenter\Service\NotificationService;
use Psr\Log\LoggerInterface;
use Shopware\Core\PlatformRequest;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Storefront\Framework\Routing\StorefrontRouteScope;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Storefront-Routen für die Glocke (Shopware 6.6 und 6.7).
 * Persönliche Meldungen kommen nur aus dem Kunden der aktuellen Sitzung, nie aus einer ID im Aufruf.
 */
#[Route(defaults: [PlatformRequest::ATTRIBUTE_ROUTE_SCOPE => [StorefrontRouteScope::ID]])]
final class NotificationController
{
    public function __construct(private readonly NotificationService $notifications, private readonly LoggerInterface $logger) {}

    #[Route(path: '/mgd-notification-center', name: 'frontend.mgd.notification.feed', defaults: ['XmlHttpRequest' => true], methods: ['GET'])]
    public function feed(SalesChannelContext $context): JsonResponse
    {
        if (!$this->notifications->isEnabled()) {
            return $this->json(['items' => []]);
        }
        try {
            $items = $this->notifications->publicFeed();
            $customer = $context->getCustomer();
            if ($customer !== null) {
                $items = [...$this->notifications->personalFeed($customer->getId()), ...$items];
            }

            return $this->json(['items' => $items, 'settings' => $this->notifications->settings()]);
        } catch (\Throwable $error) {
            // Keine Fehler-Details nach außen, nur der Typ ins Log
            $this->logger->warning('MichaThemeV5: Benachrichtigungen konnten nicht geladen werden.', ['exceptionType' => $error::class]);

            return $this->json(['items' => []], 503);
        }
    }

    #[Route(path: '/mgd-notification-center/{id}/read', name: 'frontend.mgd.notification.read', requirements: ['id' => '[0-9a-f]{32}'], defaults: ['XmlHttpRequest' => true], methods: ['POST'])]
    public function read(string $id, SalesChannelContext $context): JsonResponse
    {
        return $this->act($context, fn (string $customer): bool => $this->notifications->markRead($id, $customer));
    }

    #[Route(path: '/mgd-notification-center/read-all', name: 'frontend.mgd.notification.read_all', defaults: ['XmlHttpRequest' => true], methods: ['POST'], priority: 10)]
    public function readAll(SalesChannelContext $context): JsonResponse
    {
        return $this->act($context, fn (string $customer): int => $this->notifications->markAllRead($customer));
    }

    #[Route(path: '/mgd-notification-center/{id}/dismiss', name: 'frontend.mgd.notification.dismiss', requirements: ['id' => '[0-9a-f]{32}'], defaults: ['XmlHttpRequest' => true], methods: ['POST'])]
    public function dismiss(string $id, SalesChannelContext $context): JsonResponse
    {
        return $this->act($context, fn (string $customer): bool => $this->notifications->dismiss($id, $customer));
    }

    #[Route(path: '/mgd-notification-center/dismiss-read', name: 'frontend.mgd.notification.dismiss_read', defaults: ['XmlHttpRequest' => true], methods: ['POST'], priority: 10)]
    public function dismissRead(SalesChannelContext $context): JsonResponse
    {
        return $this->act($context, fn (string $customer): int => $this->notifications->dismissRead($customer));
    }

    /** Nur angemeldete Kunden, Kunde immer aus der Sitzung. bool = eine Meldung, int = Sammelaktion */
    private function act(SalesChannelContext $context, callable $action): JsonResponse
    {
        $customer = $context->getCustomer();
        if ($customer === null) {
            return $this->json(['success' => false], 401);
        }
        try {
            $result = $action($customer->getId());

            return is_int($result) ? $this->json(['success' => true, 'count' => $result]) : $this->json(['success' => $result]);
        } catch (\Throwable $error) {
            $this->logger->warning('MichaThemeV5: Meldungsstatus konnte nicht gespeichert werden.', ['exceptionType' => $error::class]);

            return $this->json(['success' => false], 503);
        }
    }

    /** Antworten hängen vom Login ab und dürfen nie in einem gemeinsamen Cache landen. */
    private function json(array $data, int $status = 200): JsonResponse
    {
        $response = new JsonResponse($data, $status);
        $response->headers->set('Cache-Control', 'private, no-store');

        return $response;
    }
}

<?php
declare(strict_types=1);

namespace MichaThemeV5\NotificationCenter\Controller;

use MichaThemeV5\NotificationCenter\Service\NotificationService;
use Shopware\Core\Framework\Routing\Annotation\RouteScope;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

/** Store-API liefert persönliche Daten ausschließlich aus dem authentifizierten Sales-Channel-Kontext. */
#[RouteScope(scopes: ['store-api'])]
final class NotificationController
{
    public function __construct(private readonly NotificationService $notifications) {}
    #[Route(path: '/store-api/mgd-notification-center', name: 'store-api.mgd.notification.feed', methods: ['GET'])]
    public function feed(SalesChannelContext $context): JsonResponse
    {
        $items = $this->notifications->publicFeed();
        if ($context->getCustomer()) $items = [...$items, ...$this->notifications->personalFeed($context->getCustomer()->getId())];
        return new JsonResponse(['items' => $items]);
    }
    #[Route(path: '/store-api/mgd-notification-center/{id}/read', name: 'store-api.mgd.notification.read', methods: ['POST'])]
    public function read(string $id, SalesChannelContext $context): JsonResponse
    {
        if (!$context->getCustomer()) return new JsonResponse(['success' => false], 401);
        return new JsonResponse(['success' => $this->notifications->markRead($id, $context->getCustomer()->getId())]);
    }
}

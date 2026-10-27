<?php
declare(strict_types=1);

namespace MichaThemeV5\NotificationCenter\Controller;

use MichaThemeV5\NotificationCenter\Service\NotificationService;
use Shopware\Core\Framework\Routing\ApiRouteScope;
use Shopware\Core\Framework\Uuid\Uuid;
use Shopware\Core\PlatformRequest;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

/** Diese Route ist nicht im Storefront-Scope. Shopware prüft Admin-Anmeldung und ACL vor dem Aufruf. */
#[Route(defaults: [PlatformRequest::ATTRIBUTE_ROUTE_SCOPE => [ApiRouteScope::ID]])]
final class NotificationAdminController
{
    public function __construct(private readonly NotificationService $notifications) {}

    #[Route(path: '/api/_action/mgd-notification-center', name: 'api.action.mgd.notification.create', defaults: [PlatformRequest::ATTRIBUTE_ACL => ['system_config:update']], methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $scope = (string) $request->request->get('scope', 'public');
        $status = (string) $request->request->get('status', 'draft');
        $title = (string) $request->request->get('title', '');
        $body = (string) $request->request->get('body', '');
        $customerId = (string) $request->request->get('customerId', '');
        $personal = $scope === 'personal';
        if (!in_array($scope, ['public', 'personal'], true) || !in_array($status, ['draft', 'published'], true) || $title === '' || $body === '' || ($personal && !Uuid::isValid($customerId))) {
            return new JsonResponse(['success' => false, 'error' => 'Ungültige Meldung'], 400);
        }
        $id = $this->notifications->createManual($scope, $title, $body, NotificationService::safeTargetUrl((string) $request->request->get('targetUrl', '')), $personal ? $customerId : null, $status);

        return new JsonResponse(['success' => true, 'id' => $id], 201);
    }
}

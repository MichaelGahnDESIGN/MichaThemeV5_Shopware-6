<?php
declare(strict_types=1);
namespace MichaThemeV5\NotificationCenter\Controller;

use MichaThemeV5\NotificationCenter\Service\NotificationService;
use Shopware\Core\Framework\Routing\Annotation\Acl;
use Shopware\Core\Framework\Routing\Annotation\RouteScope;
use Shopware\Core\Framework\Uuid\Uuid;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

/** Diese Route ist nicht im Storefront-Scope. Shopware prüft die ACL vor der Erstellung. */
#[RouteScope(scopes: ['api'])]
final class NotificationAdminController
{
    public function __construct(private readonly NotificationService $notifications) {}
    #[Route(path: '/api/_action/mgd-notification-center', name: 'api.action.mgd.notification.create', methods: ['POST'])]
    #[Acl(['system:config'])]
    public function create(Request $request): JsonResponse
    {
        $scope = (string) $request->request->get('scope', 'public'); $status = (string) $request->request->get('status', 'draft'); $title = (string) $request->request->get('title', ''); $body = (string) $request->request->get('body', ''); $customerId = (string) $request->request->get('customerId', '');
        if (!in_array($scope, ['public', 'personal'], true) || !in_array($status, ['draft', 'published'], true) || $title === '' || $body === '' || ($scope === 'personal' && !Uuid::isValid($customerId))) return new JsonResponse(['success' => false, 'error' => 'Ungültige Meldung'], 400);
        $id = $this->notifications->createManual($scope, $title, $body, filter_var((string) $request->request->get('targetUrl', ''), FILTER_VALIDATE_URL) ?: null, $scope === 'personal' ? $customerId : null, $status);
        return new JsonResponse(['success' => true, 'id' => $id], 201);
    }
}

<?php

declare(strict_types=1);

namespace MichaThemeV5\Administration\Controller;

use MichaThemeV5\Administration\Service\LicenseService;
use MichaThemeV5\Administration\Service\SettingsService;
use Psr\Log\LoggerInterface;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\Routing\ApiRouteScope;
use Shopware\Core\PlatformRequest;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

/** Lizenz: Status lesen, Code speichern/entfernen, neu prüfen. Der Code selbst geht nie an den Browser zurück und nie ins Log. */
#[Route(defaults: [PlatformRequest::ATTRIBUTE_ROUTE_SCOPE => [ApiRouteScope::ID]])]
final class LicenseController
{
    public function __construct(
        private readonly LicenseService $license,
        private readonly SettingsService $settings,
        private readonly LoggerInterface $logger,
    ) {
    }

    #[Route(path: '/api/_action/micha-theme-v5/license/status', name: 'api.action.micha_theme_v5.license.status', defaults: [PlatformRequest::ATTRIBUTE_ACL => ['theme:read', 'system_config:read']], methods: ['POST'])]
    public function status(Request $request, Context $context): JsonResponse
    {
        return $this->run($request, $context, fn (string $id): array => $this->license->status($id, $context));
    }

    #[Route(path: '/api/_action/micha-theme-v5/license/save', name: 'api.action.micha_theme_v5.license.save', defaults: [PlatformRequest::ATTRIBUTE_ACL => ['theme:update', 'system_config:update']], methods: ['POST'])]
    public function save(Request $request, Context $context): JsonResponse
    {
        $token = $request->getPayload()->getString('token');

        return $this->run($request, $context, function (string $id) use ($token, $context): array {
            $res = $this->license->save($id, $token, $context);

            return $res['ok'] ? ['saved' => true] + $this->license->status($id, $context) : ['saved' => false, 'error' => $res['error'] ?? 'format'];
        });
    }

    #[Route(path: '/api/_action/micha-theme-v5/license/remove', name: 'api.action.micha_theme_v5.license.remove', defaults: [PlatformRequest::ATTRIBUTE_ACL => ['theme:update', 'system_config:update']], methods: ['POST'])]
    public function remove(Request $request, Context $context): JsonResponse
    {
        return $this->run($request, $context, function (string $id) use ($context): array {
            $this->license->remove($id, $context);

            return ['removed' => true] + $this->license->status($id, $context);
        });
    }

    #[Route(path: '/api/_action/micha-theme-v5/license/check', name: 'api.action.micha_theme_v5.license.check', defaults: [PlatformRequest::ATTRIBUTE_ACL => ['theme:read', 'system_config:read']], methods: ['POST'])]
    public function check(Request $request, Context $context): JsonResponse
    {
        return $this->run($request, $context, function (string $id) use ($context): array {
            $fresh = $this->license->recheck($id, $context);

            return ['throttled' => !$fresh] + $this->license->status($id, $context);
        });
    }

    /** @param callable(string):array<string,mixed> $do */
    private function run(Request $request, Context $context, callable $do): JsonResponse
    {
        $themeId = $this->settings->resolveThemeId($request->getPayload()->getString('themeId') ?: null, $context);
        if ($themeId === null) {
            return new JsonResponse(['available' => false], 404);
        }
        try {
            return new JsonResponse(['available' => true, 'themeId' => $themeId] + $do($themeId));
        } catch (\Throwable $e) {
            // bewusst ohne Meldungstext: der Lizenzcode soll nirgends auftauchen
            $this->logger->error('MichaThemeV5: Lizenz-Aktion fehlgeschlagen', ['exception' => $e::class]);

            return new JsonResponse(['available' => true, 'error' => 'failed'], 500);
        }
    }
}

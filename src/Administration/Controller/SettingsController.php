<?php

declare(strict_types=1);

namespace MichaThemeV5\Administration\Controller;

use MichaThemeV5\Administration\Service\SchemaProvider;
use MichaThemeV5\Administration\Service\SettingsService;
use Psr\Log\LoggerInterface;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\Routing\ApiRouteScope;
use Shopware\Core\PlatformRequest;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Einstellungen laden/speichern. Nur Admin-API (Bearer-Token, deshalb kein CSRF-Thema), Rechte prüft Shopware vor dem Aufruf:
 * lesen = theme:read + system_config:read, schreiben = theme:update + system_config:update.
 */
#[Route(defaults: [PlatformRequest::ATTRIBUTE_ROUTE_SCOPE => [ApiRouteScope::ID]])]
final class SettingsController
{
    public function __construct(
        private readonly SettingsService $settings,
        private readonly SchemaProvider $schema,
        private readonly LoggerInterface $logger,
    ) {
    }

    #[Route(path: '/api/_action/micha-theme-v5/settings/load', name: 'api.action.micha_theme_v5.settings.load', defaults: [PlatformRequest::ATTRIBUTE_ACL => ['theme:read', 'system_config:read']], methods: ['POST'])]
    public function load(Request $request, Context $context): JsonResponse
    {
        try {
            $themes = $this->settings->themes($context);
            $payload = $request->getPayload();
            $themeId = $this->settings->resolveThemeId($payload->getString('themeId') ?: null, $context);
            if ($themeId === null) {
                return new JsonResponse(['available' => false, 'themes' => []]);
            }

            return new JsonResponse([
                'available' => true,
                'themeId' => $themeId,
                'themes' => $themes,
                'values' => $this->settings->load($themeId, $context),
                'palette' => $this->settings->palette(),
                'schema' => $this->schema->forLocale($payload->getString('locale')),
            ]);
        } catch (\Throwable $e) {
            $this->logger->error('MichaThemeV5: Einstellungen laden fehlgeschlagen', ['exception' => $e::class, 'message' => $e->getMessage()]);

            return new JsonResponse(['available' => false, 'error' => 'load_failed'], 500);
        }
    }

    #[Route(path: '/api/_action/micha-theme-v5/settings/save', name: 'api.action.micha_theme_v5.settings.save', defaults: [PlatformRequest::ATTRIBUTE_ACL => ['theme:update', 'system_config:update']], methods: ['POST'])]
    public function save(Request $request, Context $context): JsonResponse
    {
        $payload = $request->getPayload();
        $values = $payload->all('values');
        $themeId = $this->settings->resolveThemeId($payload->getString('themeId') ?: null, $context);
        if ($themeId === null || !$values || count($values) > 200) {
            return new JsonResponse(['success' => false, 'error' => 'invalid'], 400);
        }
        try {
            $result = $this->settings->save($themeId, $values, $context);
        } catch (\Throwable $e) {
            $this->logger->error('MichaThemeV5: Einstellungen speichern fehlgeschlagen', ['exception' => $e::class, 'message' => $e->getMessage()]);

            return new JsonResponse(['success' => false, 'error' => 'save_failed'], 500);
        }

        return new JsonResponse(['success' => true] + $result);
    }

    #[Route(path: '/api/_action/micha-theme-v5/palette/save', name: 'api.action.micha_theme_v5.palette.save', defaults: [PlatformRequest::ATTRIBUTE_ACL => ['system_config:update']], methods: ['POST'])]
    public function savePalette(Request $request): JsonResponse
    {
        try {
            return new JsonResponse(['success' => true, 'palette' => $this->settings->savePalette($request->getPayload()->all('palette'))]);
        } catch (\Throwable $e) {
            $this->logger->error('MichaThemeV5: Palette speichern fehlgeschlagen', ['exception' => $e::class]);

            return new JsonResponse(['success' => false, 'error' => 'save_failed'], 500);
        }
    }
}

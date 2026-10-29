<?php

declare(strict_types=1);

namespace MichaThemeV5\Administration\Controller;

use MichaThemeV5\Administration\Service\InfoService;
use MichaThemeV5\Administration\Service\SettingsService;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\Routing\ApiRouteScope;
use Shopware\Core\PlatformRequest;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

/** Info-Seite: Versionen, Zuweisung, Changelog. Nur lesen. */
#[Route(defaults: [PlatformRequest::ATTRIBUTE_ROUTE_SCOPE => [ApiRouteScope::ID]])]
final class InfoController
{
    public function __construct(private readonly InfoService $info, private readonly SettingsService $settings)
    {
    }

    #[Route(path: '/api/_action/micha-theme-v5/info', name: 'api.action.micha_theme_v5.info', defaults: [PlatformRequest::ATTRIBUTE_ACL => ['theme:read', 'system_config:read']], methods: ['POST'])]
    public function info(Request $request, Context $context): JsonResponse
    {
        $themeId = $this->settings->resolveThemeId($request->getPayload()->getString('themeId') ?: null, $context);

        return new JsonResponse($this->info->info($themeId) + ['themeId' => $themeId]);
    }
}

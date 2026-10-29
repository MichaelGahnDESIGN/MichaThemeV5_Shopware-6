<?php

declare(strict_types=1);

namespace MichaThemeV5\Administration\Controller;

use MichaThemeV5\Administration\Service\CatalogService;
use Shopware\Core\Framework\Routing\ApiRouteScope;
use Shopware\Core\PlatformRequest;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

/** Plugin-Empfehlungen: nur lesen, installiert wird hier nichts. Bei Fehlern kommt eine leere Liste, der Shop läuft normal weiter. */
#[Route(defaults: [PlatformRequest::ATTRIBUTE_ROUTE_SCOPE => [ApiRouteScope::ID]])]
final class CatalogController
{
    public function __construct(private readonly CatalogService $catalog)
    {
    }

    #[Route(path: '/api/_action/micha-theme-v5/catalog', name: 'api.action.micha_theme_v5.catalog', defaults: [PlatformRequest::ATTRIBUTE_ACL => ['system_config:read']], methods: ['POST'])]
    public function list(Request $request): JsonResponse
    {
        try {
            $r = $this->catalog->load($request->getPayload()->getBoolean('refresh'));
        } catch (\Throwable) {
            $r = ['items' => [], 'stale' => false, 'error' => 'unreachable', 'checked_at' => 0];
        }

        return new JsonResponse($r);
    }
}

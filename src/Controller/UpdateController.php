<?php declare(strict_types=1);

namespace MichaThemeV5\Controller;

use MichaThemeV5\Update\GitHubReleaseUpdater;
use Psr\Log\LoggerInterface;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\Routing\ApiRouteScope;
use Shopware\Core\PlatformRequest;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

/** Shopware schützt API-Routen durch Admin-Authentifizierung und die angegebene ACL-Berechtigung. */
#[Route(defaults: [PlatformRequest::ATTRIBUTE_ROUTE_SCOPE => [ApiRouteScope::ID]])]
final class UpdateController extends AbstractController
{
    public function __construct(private readonly GitHubReleaseUpdater $updater, private readonly LoggerInterface $logger) {}

    #[Route(path: '/api/_action/micha-theme-v5/update/check', name: 'api.action.micha_theme_v5.update.check', defaults: [PlatformRequest::ATTRIBUTE_ACL => ['system_config:update']], methods: ['POST'])]
    public function check(Context $context): JsonResponse
    {
        try { return new JsonResponse($this->updater->checkAndPrepare($context)); }
        catch (\Throwable $error) {
            // Keine Tokens, signierten Download-URLs oder absoluten Serverpfade in API/Logs ausgeben.
            $this->logger->warning('MichaThemeV5: manuelle Update-Vorbereitung fehlgeschlagen.', ['exceptionType' => $error::class]);
            return new JsonResponse(['error' => 'Update konnte nicht vorbereitet werden. Serverrechte, GitHub-Verfügbarkeit und Plugin-Installation prüfen.'], 503);
        }
    }
}

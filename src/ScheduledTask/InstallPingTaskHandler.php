<?php declare(strict_types=1);

namespace MichaThemeV5\ScheduledTask;

use Psr\Log\LoggerInterface;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Core\Framework\MessageQueue\ScheduledTask\ScheduledTaskHandler;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

// ABGESCHALTET ab 1.6.0: die tägliche Meldung macht der Baukasten (mgd_kit.*.ping). Der Handler bleibt nur, damit ein
// übriger Task-Eintrag aus der DB (micha_theme_v5.install_ping) nicht abstürzt. Er meldet NICHT, sonst gäbe es doppelte Meldungen.
#[AsMessageHandler(handles: InstallPingTask::class)]
final class InstallPingTaskHandler extends ScheduledTaskHandler
{
    public function __construct(EntityRepository $scheduledTaskRepository, LoggerInterface $logger)
    {
        parent::__construct($scheduledTaskRepository, $logger);
    }

    public function run(): void
    {
        // nix mehr zu tun
    }
}

<?php declare(strict_types=1);

namespace MichaThemeV5\ScheduledTask;

use Psr\Log\LoggerInterface;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Core\Framework\MessageQueue\ScheduledTask\ScheduledTaskHandler;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

// ABGESCHALTET ab 1.6.0: Updates kommen vom Baukasten (src/Kit). Der Handler bleibt nur, damit ein übriger Task-Eintrag
// aus der DB (micha_theme_v5.update_check) nicht abstürzt. Er tut nix.
#[AsMessageHandler(handles: UpdateTask::class)]
final class UpdateTaskHandler extends ScheduledTaskHandler
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

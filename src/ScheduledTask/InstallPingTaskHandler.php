<?php declare(strict_types=1);

namespace MichaThemeV5\ScheduledTask;

use MichaThemeV5\InstallReport\InstallReporter;
use Psr\Log\LoggerInterface;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Core\Framework\MessageQueue\ScheduledTask\ScheduledTaskHandler;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(handles: InstallPingTask::class)]
final class InstallPingTaskHandler extends ScheduledTaskHandler
{
    public function __construct(EntityRepository $scheduledTaskRepository, LoggerInterface $logger, private readonly InstallReporter $reporter)
    {
        parent::__construct($scheduledTaskRepository, $logger);
    }

    public function run(): void
    {
        // Schalter aus oder schon heute gemeldet > macht nix
        $this->reporter->ping();
    }
}

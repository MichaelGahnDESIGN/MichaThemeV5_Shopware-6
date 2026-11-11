<?php declare(strict_types=1);

namespace MichaThemeV5\ScheduledTask;

use MichaThemeV5\Update\GitHubReleaseUpdater;
use Psr\Log\LoggerInterface;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Core\Framework\MessageQueue\ScheduledTask\ScheduledTaskHandler;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(handles: UpdateTask::class)]
final class UpdateTaskHandler extends ScheduledTaskHandler
{
    public const LATEST_KEY = 'MichaThemeV5.update.latestVersion';

    public function __construct(EntityRepository $scheduledTaskRepository, LoggerInterface $logger, private readonly SystemConfigService $config, private readonly GitHubReleaseUpdater $updater)
    {
        parent::__construct($scheduledTaskRepository, $logger);
    }

    public function run(): void
    {
        // Updates gelten global; ein Sales-Channel-Override kann sie nicht aktivieren.
        if (!$this->config->getBool('MichaThemeV5.config.automaticUpdates')) { return; }
        // nur nachsehen und merken, eingespielt wird erst per Klick im Admin (Info-Seite)
        try {
            $result = $this->updater->check();
            $this->config->set(self::LATEST_KEY, $result['latestVersion'] ?? '');
        } catch (\Throwable $error) {
            $this->exceptionLogger->warning('MichaThemeV5: automatische Update-Prüfung fehlgeschlagen.', ['exceptionType' => $error::class]);
        }
    }
}

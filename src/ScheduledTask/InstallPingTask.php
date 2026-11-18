<?php declare(strict_types=1);

namespace MichaThemeV5\ScheduledTask;

use Shopware\Core\Framework\MessageQueue\ScheduledTask\ScheduledTask;

// Aktiv-Meldung 1x am Tag, braucht wie alle Tasks den Scheduler. Ohne Cron meldet der Admin (Info-Seite)
final class InstallPingTask extends ScheduledTask
{
    public static function getTaskName(): string { return 'micha_theme_v5.install_ping'; }
    public static function getDefaultInterval(): int { return 86400; }
}

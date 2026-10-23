<?php
declare(strict_types=1);

namespace MichaThemeV5\Migration;

use Doctrine\DBAL\Connection;
use Shopware\Core\Framework\Migration\MigrationStep;

final class Migration1761216000NotificationCenter extends MigrationStep
{
    public function getCreationTimestamp(): int { return 1761216000; }
    public function update(Connection $connection): void
    {
        $connection->executeStatement("CREATE TABLE IF NOT EXISTS `mgd_notification` (`id` BINARY(16) NOT NULL, `scope` VARCHAR(16) NOT NULL, `event_type` VARCHAR(64) NOT NULL, `source_key` VARCHAR(191) NULL, `title` VARCHAR(255) NOT NULL, `body` LONGTEXT NOT NULL, `target_url` VARCHAR(2048) NULL, `status` VARCHAR(16) NOT NULL DEFAULT 'draft', `published_at` DATETIME(3) NULL, `expires_at` DATETIME(3) NULL, `created_at` DATETIME(3) NOT NULL, `updated_at` DATETIME(3) NULL, PRIMARY KEY (`id`), UNIQUE KEY `uniq.mgd_notification.source_key` (`source_key`), KEY `idx.mgd_notification.public_feed` (`scope`,`status`,`published_at`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
        $connection->executeStatement("CREATE TABLE IF NOT EXISTS `mgd_notification_recipient` (`id` BINARY(16) NOT NULL, `notification_id` BINARY(16) NOT NULL, `customer_id` BINARY(16) NOT NULL, `read_at` DATETIME(3) NULL, `dismissed_at` DATETIME(3) NULL, `created_at` DATETIME(3) NOT NULL, PRIMARY KEY (`id`), UNIQUE KEY `uniq.mgd_notification_recipient` (`notification_id`,`customer_id`), KEY `idx.mgd_notification_recipient.inbox` (`customer_id`,`read_at`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
    }
    public function updateDestructive(Connection $connection): void {}
}

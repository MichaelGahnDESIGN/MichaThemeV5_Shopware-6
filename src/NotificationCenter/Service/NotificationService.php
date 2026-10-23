<?php
declare(strict_types=1);

namespace MichaThemeV5\NotificationCenter\Service;

use Doctrine\DBAL\Connection;
use Shopware\Core\Framework\Uuid\Uuid;

/** Kapselt Sichtbarkeits- und Empfängerregeln; Controller geben niemals unfiltrierte Tabelleninhalte aus. */
final class NotificationService
{
    public function __construct(private readonly Connection $connection) {}
    public function publicFeed(): array
    {
        return $this->connection->fetchAllAssociative("SELECT LOWER(HEX(id)) AS id, title, body, target_url AS targetUrl, published_at AS publishedAt FROM mgd_notification WHERE scope = 'public' AND status = 'published' AND published_at <= UTC_TIMESTAMP(3) AND (expires_at IS NULL OR expires_at > UTC_TIMESTAMP(3)) ORDER BY published_at DESC LIMIT 30");
    }
    public function personalFeed(string $customerId): array
    {
        return $this->connection->fetchAllAssociative("SELECT LOWER(HEX(n.id)) AS id, n.title, n.body, n.target_url AS targetUrl, n.published_at AS publishedAt, r.read_at AS readAt FROM mgd_notification n INNER JOIN mgd_notification_recipient r ON r.notification_id = n.id WHERE r.customer_id = :customer AND r.dismissed_at IS NULL AND n.scope = 'personal' AND n.status = 'published' AND n.published_at <= UTC_TIMESTAMP(3) AND (n.expires_at IS NULL OR n.expires_at > UTC_TIMESTAMP(3)) ORDER BY n.published_at DESC LIMIT 30", ['customer' => Uuid::fromHexToBytes($customerId)]);
    }
    public function markRead(string $notificationId, string $customerId): bool
    {
        return 1 === $this->connection->executeStatement('UPDATE mgd_notification_recipient SET read_at = UTC_TIMESTAMP(3) WHERE notification_id = :notification AND customer_id = :customer AND read_at IS NULL', ['notification' => Uuid::fromHexToBytes($notificationId), 'customer' => Uuid::fromHexToBytes($customerId)]);
    }
    public function createOnce(array $notification, ?string $customerId = null): void
    {
        $existing = $this->connection->fetchOne('SELECT id FROM mgd_notification WHERE source_key = :source', ['source' => $notification['sourceKey']]);
        $id = $existing ?: Uuid::randomBytes();
        if (!$existing) $this->connection->insert('mgd_notification', ['id' => $id, 'scope' => $notification['scope'], 'event_type' => $notification['eventType'], 'source_key' => $notification['sourceKey'], 'title' => $notification['title'], 'body' => $notification['body'], 'target_url' => $notification['targetUrl'] ?? null, 'status' => 'published', 'published_at' => (new \DateTimeImmutable())->format('Y-m-d H:i:s.v'), 'created_at' => (new \DateTimeImmutable())->format('Y-m-d H:i:s.v')]);
        if ($customerId && !$existing) $this->connection->insert('mgd_notification_recipient', ['id' => Uuid::randomBytes(), 'notification_id' => $id, 'customer_id' => Uuid::fromHexToBytes($customerId), 'created_at' => (new \DateTimeImmutable())->format('Y-m-d H:i:s.v')]);
    }
    /** Manuelle Einträge werden ausschließlich von einem ACL-geschützten Admin-Controller aufgerufen. */
    public function createManual(string $scope, string $title, string $body, ?string $targetUrl, ?string $customerId, string $status): string
    {
        $id = Uuid::randomBytes();
        $this->connection->insert('mgd_notification', ['id' => $id, 'scope' => $scope, 'event_type' => 'manual', 'source_key' => null, 'title' => trim(strip_tags($title)), 'body' => trim(strip_tags($body)), 'target_url' => $targetUrl, 'status' => $status, 'published_at' => $status === 'published' ? (new \DateTimeImmutable())->format('Y-m-d H:i:s.v') : null, 'created_at' => (new \DateTimeImmutable())->format('Y-m-d H:i:s.v')]);
        if ($scope === 'personal' && $customerId) $this->connection->insert('mgd_notification_recipient', ['id' => Uuid::randomBytes(), 'notification_id' => $id, 'customer_id' => Uuid::fromHexToBytes($customerId), 'created_at' => (new \DateTimeImmutable())->format('Y-m-d H:i:s.v')]);
        return Uuid::fromBytesToHex($id);
    }
}

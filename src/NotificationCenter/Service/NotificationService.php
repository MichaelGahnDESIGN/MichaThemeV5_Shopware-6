<?php
declare(strict_types=1);

namespace MichaThemeV5\NotificationCenter\Service;

use Doctrine\DBAL\Connection;
use Shopware\Core\Framework\Uuid\Uuid;
use Shopware\Core\System\SystemConfig\SystemConfigService;

/** Kapselt Sichtbarkeits- und Empfängerregeln; Controller geben niemals unfiltrierte Tabelleninhalte aus. */
final class NotificationService
{
    // Schalter aus config.xml
    private const CONFIG_ENABLED = 'MichaThemeV5.config.notificationCenterEnabled';
    private const CONFIG_PRODUCT_EVENTS = 'MichaThemeV5.config.notificationProductEvents';
    private const FEED_LIMIT = 30;
    // UTC-Zeit als ISO-Text, damit der Browser sie in Ortszeit umrechnen kann
    private const ISO = "DATE_FORMAT(%s, '%%Y-%%m-%%dT%%H:%%i:%%sZ')";

    public function __construct(private readonly Connection $connection, private readonly SystemConfigService $config) {}

    /** Glocke und Meldungen sind an, solange der Schalter nicht ausdrücklich aus ist. */
    public function isEnabled(): bool
    {
        return $this->config->get(self::CONFIG_ENABLED) !== false;
    }

    /** Meldungen bei Produktänderungen sind nur an, wenn sie ausdrücklich eingeschaltet wurden. */
    public function isProductEventsEnabled(): bool
    {
        return $this->isEnabled() && $this->config->get(self::CONFIG_PRODUCT_EVENTS) === true;
    }

    /** Nur relative Pfade (/account/order) und http(s)-Adressen sind als Link erlaubt, alles andere (z. B. javascript:) fällt weg. */
    public static function safeTargetUrl(?string $url): ?string
    {
        if ($url === null) {
            return null;
        }
        $url = trim($url);
        if ($url === '' || strlen($url) > 2048 || preg_match('/[\x00-\x1F\x7F\\\\]/', $url)) {
            return null;
        }
        if ($url[0] === '/') {
            return str_starts_with($url, '//') ? null : $url;
        }

        return preg_match('~^https?://[^\s]+$~i', $url) === 1 ? $url : null;
    }

    /** @return list<array{id:string,title:string,body:string,targetUrl:?string,publishedAt:?string,scope:string,read:bool}> */
    public function publicFeed(): array
    {
        $sql = 'SELECT LOWER(HEX(id)) AS id, title, body, target_url AS targetUrl, ' . sprintf(self::ISO, 'published_at') . " AS publishedAt FROM mgd_notification WHERE scope = 'public' AND status = 'published' AND published_at <= UTC_TIMESTAMP(3) AND (expires_at IS NULL OR expires_at > UTC_TIMESTAMP(3)) ORDER BY published_at DESC LIMIT " . self::FEED_LIMIT;

        return $this->normalize($this->connection->fetchAllAssociative($sql), 'public');
    }

    /** @return list<array{id:string,title:string,body:string,targetUrl:?string,publishedAt:?string,scope:string,read:bool}> */
    public function personalFeed(string $customerId): array
    {
        $sql = 'SELECT LOWER(HEX(n.id)) AS id, n.title, n.body, n.target_url AS targetUrl, ' . sprintf(self::ISO, 'n.published_at') . " AS publishedAt, r.read_at AS readAt FROM mgd_notification n INNER JOIN mgd_notification_recipient r ON r.notification_id = n.id WHERE r.customer_id = :customer AND r.dismissed_at IS NULL AND n.scope = 'personal' AND n.status = 'published' AND n.published_at <= UTC_TIMESTAMP(3) AND (n.expires_at IS NULL OR n.expires_at > UTC_TIMESTAMP(3)) ORDER BY n.published_at DESC LIMIT " . self::FEED_LIMIT;

        return $this->normalize($this->connection->fetchAllAssociative($sql, ['customer' => Uuid::fromHexToBytes($customerId)]), 'personal');
    }

    public function markRead(string $notificationId, string $customerId): bool
    {
        if (!Uuid::isValid($notificationId)) {
            return false;
        }

        return 1 === $this->connection->executeStatement('UPDATE mgd_notification_recipient SET read_at = UTC_TIMESTAMP(3) WHERE notification_id = :notification AND customer_id = :customer AND read_at IS NULL', ['notification' => Uuid::fromHexToBytes($notificationId), 'customer' => Uuid::fromHexToBytes($customerId)]);
    }

    public function createOnce(array $notification, ?string $customerId = null): void
    {
        $existing = $this->connection->fetchOne('SELECT id FROM mgd_notification WHERE source_key = :source', ['source' => $notification['sourceKey']]);
        if ($existing) {
            return;
        }
        $id = Uuid::randomBytes();
        $now = (new \DateTimeImmutable('now', new \DateTimeZone('UTC')))->format('Y-m-d H:i:s.v');
        $this->connection->insert('mgd_notification', ['id' => $id, 'scope' => $notification['scope'], 'event_type' => $notification['eventType'], 'source_key' => $notification['sourceKey'], 'title' => $notification['title'], 'body' => $notification['body'], 'target_url' => self::safeTargetUrl($notification['targetUrl'] ?? null), 'status' => 'published', 'published_at' => $now, 'created_at' => $now]);
        if ($customerId) {
            $this->connection->insert('mgd_notification_recipient', ['id' => Uuid::randomBytes(), 'notification_id' => $id, 'customer_id' => Uuid::fromHexToBytes($customerId), 'created_at' => $now]);
        }
    }

    /** Manuelle Einträge werden ausschließlich von einem ACL-geschützten Admin-Controller aufgerufen. */
    public function createManual(string $scope, string $title, string $body, ?string $targetUrl, ?string $customerId, string $status): string
    {
        $id = Uuid::randomBytes();
        $now = (new \DateTimeImmutable('now', new \DateTimeZone('UTC')))->format('Y-m-d H:i:s.v');
        $this->connection->insert('mgd_notification', ['id' => $id, 'scope' => $scope, 'event_type' => 'manual', 'source_key' => null, 'title' => trim(strip_tags($title)), 'body' => trim(strip_tags($body)), 'target_url' => self::safeTargetUrl($targetUrl), 'status' => $status, 'published_at' => $status === 'published' ? $now : null, 'created_at' => $now]);
        if ($scope === 'personal' && $customerId) {
            $this->connection->insert('mgd_notification_recipient', ['id' => Uuid::randomBytes(), 'notification_id' => $id, 'customer_id' => Uuid::fromHexToBytes($customerId), 'created_at' => $now]);
        }

        return Uuid::fromBytesToHex($id);
    }

    /**
     * Nur diese Felder verlassen den Server. Keine Kunden-ID, keine Empfängerliste, keine Rohdaten.
     *
     * @param list<array<string,mixed>> $rows
     *
     * @return list<array{id:string,title:string,body:string,targetUrl:?string,publishedAt:?string,scope:string,read:bool}>
     */
    private function normalize(array $rows, string $scope): array
    {
        return array_map(static fn (array $row): array => [
            'id' => (string) $row['id'],
            'title' => (string) $row['title'],
            'body' => (string) $row['body'],
            'targetUrl' => self::safeTargetUrl(isset($row['targetUrl']) ? (string) $row['targetUrl'] : null),
            'publishedAt' => isset($row['publishedAt']) ? (string) $row['publishedAt'] : null,
            'scope' => $scope,
            'read' => $scope === 'public' || !empty($row['readAt']),
        ], $rows);
    }
}

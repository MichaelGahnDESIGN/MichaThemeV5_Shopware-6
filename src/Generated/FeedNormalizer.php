<?php

declare(strict_types=1);

namespace MichaThemeV5\Plugin;

/**
 * Macht aus dem Katalog-Feed (https://theme.michael-gahn.de/api/catalog/plugins.json, schemaVersion 1) eine sichere Anzeigeliste.
 * Regeln 1:1 aus docs/KATALOG.md. Alles Unbekannte oder Verdächtige wird leise verworfen, nie ein Fehler.
 */
final class FeedNormalizer
{
    public const HOST = 'theme.michael-gahn.de';
    public const GITHUB_PREFIX = 'https://github.com/MichaelGahnDESIGN/';
    public const MAX_ITEMS = 80;

    /** Plattform-Schlüssel des Feeds je Hülle; "other" und "all" gehören immer dazu. */
    public const PLATFORMS = [
        'woocommerce' => ['wordpress', 'woocommerce'],
        'shopware' => ['shopware', 'shopware6'],
        'jtl' => ['jtl', 'jtl5'],
        'shopify' => ['shopify'],
    ];

    /**
     * @param array<string,mixed> $feed dekodierter Feed
     * @return list<array<string,mixed>>|null null = Feed unbrauchbar (falsche schemaVersion, kein items), dann alte Liste behalten
     */
    public static function normalize(array $feed, string $platform, string $selfId): ?array
    {
        if (($feed['schemaVersion'] ?? null) !== 1 || !is_array($feed['items'] ?? null)) {
            return null;
        }
        $allowed = array_merge(self::PLATFORMS[$platform] ?? [], ['other', 'all']);
        $items = array_values($feed['items']);
        $self = null;
        foreach ($items as $it) {
            if (is_array($it) && ($it['id'] ?? null) === $selfId) {
                $self = $it;
            }
        }
        $related = is_array($self['related'] ?? null) ? array_values(array_filter($self['related'], 'is_string')) : [];

        $out = [];
        foreach (array_slice($items, 0, self::MAX_ITEMS) as $i => $it) {
            $row = is_array($it) ? self::item($it, $allowed, $selfId, $related, $i) : null;
            if ($row !== null) {
                $out[] = $row;
            }
        }
        // Empfohlene zuerst, dann live vor announced, sonst Reihenfolge des Feeds
        usort($out, static fn (array $a, array $b): int => [-$a['recommended'], $a['status'] === 'live' ? 0 : 1, $a['pos']] <=> [-$b['recommended'], $b['status'] === 'live' ? 0 : 1, $b['pos']]);
        foreach ($out as $i => $_) {
            unset($out[$i]['pos']);
        }

        return $out;
    }

    /** @param list<string> $allowed @param list<string> $related */
    private static function item(array $it, array $allowed, string $selfId, array $related, int $pos): ?array
    {
        $id = $it['id'] ?? null;
        $name = $it['name'] ?? null;
        if (!is_string($id) || $id === '' || strlen($id) > 100 || !is_string($name) || trim($name) === '' || $id === $selfId) {
            return null;
        }
        if (!in_array($it['platform'] ?? '', $allowed, true)) {
            return null;
        }
        $status = $it['status'] ?? '';
        if (!in_array($status, ['live', 'announced'], true)) {
            return null;
        }
        $tier = ($it['tier'] ?? '') === 'paid' ? 'paid' : 'free';
        $details = self::hostUrl($it['detailsUrl'] ?? null);
        $download = $tier === 'free' && $status === 'live' ? self::hostUrl($it['downloadUrl'] ?? null) : null; // Kauf oder Ankündigung: nie Download
        $repo = is_string($it['repositoryUrl'] ?? null) && str_starts_with($it['repositoryUrl'], self::GITHUB_PREFIX) && preg_match('~^[A-Za-z0-9/._-]+$~', substr($it['repositoryUrl'], 8)) === 1 ? $it['repositoryUrl'] : null;
        $imageUrl = self::hostUrl($it['imageUrl'] ?? null);
        $alt = $imageUrl !== null && is_string($it['imageAlt'] ?? null) ? self::plain($it['imageAlt'], 160) : null;
        $accent = is_string($it['accent'] ?? null) && preg_match('/^#[0-9a-fA-F]{6}$/', $it['accent']) === 1 ? strtolower($it['accent']) : null;
        $version = is_string($it['version'] ?? null) ? ltrim(self::plain($it['version'], 30), 'vV') : '';

        return [
            'id' => $id,
            'name' => self::plain($name, 120),
            'description' => self::plain(is_string($it['description'] ?? null) ? $it['description'] : '', 500),
            'tier' => $tier,
            'status' => $status,
            'version' => $version,
            'details_url' => $details,
            'download_url' => $download,
            'repository_url' => $repo,
            'icon_url' => self::hostUrl($it['iconUrl'] ?? null),
            'image_url' => $imageUrl,
            'image_alt' => $alt,
            'accent' => $accent,
            'recommended' => in_array($id, $related, true) ? 1 : 0,
            'pos' => $pos,
        ];
    }

    /** Nur https und genau unser Host, ohne Zugangsdaten und Port. */
    public static function hostUrl(mixed $u): ?string
    {
        if (!is_string($u) || strlen($u) > 500 || preg_match('/[\x00-\x20\x7f<>"\'\\\\]/', $u) === 1) {
            return null;
        }
        $p = parse_url($u);
        if (!is_array($p) || ($p['scheme'] ?? '') !== 'https' || strtolower((string) ($p['host'] ?? '')) !== self::HOST || isset($p['user']) || isset($p['pass']) || isset($p['port'])) {
            return null;
        }

        return $u;
    }

    private static function plain(string $s, int $max): string
    {
        $s = (string) preg_replace('/[\x00-\x1f\x7f]/', ' ', strip_tags($s));

        return trim(mb_substr($s, 0, $max));
    }
}

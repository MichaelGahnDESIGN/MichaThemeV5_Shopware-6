<?php

declare(strict_types=1);

namespace MichaThemeV5\Plugin;

/**
 * Holt die Plugin-Empfehlungen. Regeln: nur https, feste Adresse, keine Weiterleitungen (macht der http-Callback), 5 s, 512 KB.
 * Cache 6 h, bei Fehler 5 Minuten Pause und die letzte gute Liste (bis 7 Tage) mit Hinweis, "Aktualisieren" höchstens 1 x pro Minute.
 * Fehler sind leise: kein Wurf, keine Warnung, nur ein freundlicher Hinweis in der Oberfläche. Im Shop (Frontend) wird nie abgerufen.
 *
 * Callbacks (von der Plattform):
 *  - $http(string $url): ?array   ['status' => int, 'body' => string] oder null (Netzwerkfehler)
 *  - $get(string $key): mixed / $set(string $key, mixed $value, int $ttl): void
 */
final class CatalogFeed
{
    public const URL = 'https://theme.michael-gahn.de/api/catalog/plugins.json';
    public const MAX_BYTES = 524288;
    public const TTL = 21600;
    public const PAUSE = 300;
    public const STALE_MAX = 604800;
    public const REFRESH_GAP = 60;

    /** @var callable */
    private $http;
    /** @var callable */
    private $get;
    /** @var callable */
    private $set;
    /** @var callable */
    private $now;

    public function __construct(private readonly string $platform, private readonly string $selfId, callable $http, callable $get, callable $set, ?callable $now = null)
    {
        $this->http = $http;
        $this->get = $get;
        $this->set = $set;
        $this->now = $now ?? 'time';
    }

    /**
     * @return array{items:list<array<string,mixed>>,stale:bool,error:?string,checked_at:int}
     *   error: null | 'unreachable' | 'invalid' | 'throttled'
     */
    public function load(bool $refresh = false): array
    {
        $now = (int) ($this->now)();
        $good = $this->read('mt_cat_good');
        $fresh = $this->read('mt_cat_fresh');
        $pause = $this->read('mt_cat_pause');

        if ($refresh) {
            $last = $this->read('mt_cat_last_refresh');
            if (is_int($last) && $now - $last < self::REFRESH_GAP) {
                return $this->result($good, $now, 'throttled');
            }
            ($this->set)('mt_cat_last_refresh', $now, self::REFRESH_GAP);
        } else {
            if (is_array($fresh) && is_array($fresh['items'] ?? null)) {
                return ['items' => $fresh['items'], 'stale' => false, 'error' => null, 'checked_at' => (int) ($fresh['at'] ?? $now)];
            }
            if ($pause !== null) {
                return $this->result($good, $now, 'unreachable');
            }
        }

        $items = $this->fetch();
        if ($items === null) {
            ($this->set)('mt_cat_pause', 1, self::PAUSE);

            return $this->result($good, $now, $this->lastFailure ?? 'unreachable');
        }
        ($this->set)('mt_cat_fresh', ['items' => $items, 'at' => $now], self::TTL);
        ($this->set)('mt_cat_good', ['items' => $items, 'at' => $now], self::STALE_MAX);

        return ['items' => $items, 'stale' => false, 'error' => null, 'checked_at' => $now];
    }

    private ?string $lastFailure = null;

    /** @return list<array<string,mixed>>|null */
    private function fetch(): ?array
    {
        $this->lastFailure = null;
        try {
            $res = ($this->http)(self::URL);
        } catch (\Throwable) {
            $res = null;
        }
        if (!is_array($res) || ($res['status'] ?? 0) !== 200 || !is_string($res['body'] ?? null)) {
            return null;
        }
        if (strlen($res['body']) > self::MAX_BYTES) {
            $this->lastFailure = 'invalid';

            return null;
        }
        $feed = json_decode($res['body'], true);
        $items = is_array($feed) ? FeedNormalizer::normalize($feed, $this->platform, $this->selfId) : null;
        if ($items === null) {
            $this->lastFailure = 'invalid';

            return null;
        }

        return $items;
    }

    /** @return array{items:list<array<string,mixed>>,stale:bool,error:?string,checked_at:int} */
    private function result(mixed $good, int $now, string $error): array
    {
        if (is_array($good) && is_array($good['items'] ?? null) && $now - (int) ($good['at'] ?? 0) <= self::STALE_MAX) {
            return ['items' => $good['items'], 'stale' => true, 'error' => $error, 'checked_at' => (int) ($good['at'] ?? 0)];
        }

        return ['items' => [], 'stale' => false, 'error' => $error, 'checked_at' => 0];
    }

    private function read(string $key): mixed
    {
        try {
            return ($this->get)($key);
        } catch (\Throwable) {
            return null;
        }
    }
}

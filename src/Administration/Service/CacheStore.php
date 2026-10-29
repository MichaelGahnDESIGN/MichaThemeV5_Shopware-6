<?php

declare(strict_types=1);

namespace MichaThemeV5\Administration\Service;

use Psr\Cache\CacheItemPoolInterface;

/** cache.object als Speicher für Katalog und Lizenz. Ein Fehler im Cache darf nie die Admin-Seite kaputt machen. */
final class CacheStore
{
    private const PREFIX = 'michatheme_v5_';

    public function __construct(private readonly CacheItemPoolInterface $pool)
    {
    }

    public function get(string $key): mixed
    {
        try {
            $item = $this->pool->getItem(self::PREFIX . $this->safe($key));

            return $item->isHit() ? $item->get() : null;
        } catch (\Throwable) {
            return null;
        }
    }

    public function set(string $key, mixed $value, int $ttl): void
    {
        try {
            $item = $this->pool->getItem(self::PREFIX . $this->safe($key));
            $this->pool->save($item->set($value)->expiresAfter($ttl));
        } catch (\Throwable) {
            // ohne Cache geht es auch, nur langsamer
        }
    }

    private function safe(string $key): string
    {
        return preg_replace('/[^A-Za-z0-9_.]/', '_', $key) ?? 'x';
    }
}

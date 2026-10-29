<?php

declare(strict_types=1);

namespace MichaThemeV5\Administration\Service;

use MichaThemeV5\Plugin\CatalogFeed;

/** Plugin-Empfehlungen aus dem Feed von theme.michael-gahn.de. Fehler sind leise, im Shop wird nie abgerufen. */
class CatalogService
{
    public const SELF_ID = 'plugin-michatheme-v5-shopware';

    public function __construct(private readonly CacheStore $cache, private readonly ?\Closure $http = null)
    {
    }

    /** @return array{items:list<array<string,mixed>>,stale:bool,error:?string,checked_at:int} */
    public function load(bool $refresh): array
    {
        $feed = new CatalogFeed(
            'shopware',
            self::SELF_ID,
            $this->http ?? static fn (string $url): ?array => HttpFetcher::get($url, 5, CatalogFeed::MAX_BYTES),
            fn (string $k): mixed => $this->cache->get($k),
            fn (string $k, mixed $v, int $ttl) => $this->cache->set($k, $v, $ttl)
        );

        return $feed->load($refresh);
    }
}

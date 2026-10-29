<?php

declare(strict_types=1);

namespace MichaThemeV5\Administration\Service;

use Doctrine\DBAL\Connection;
use MichaThemeV5\Plugin\LicenseClient;
use MichaThemeV5\Plugin\LicenseTexts;
use MichaThemeV5\Plugin\Sanitizer;
use Shopware\Core\Framework\Context;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * Lizenzstatus für die Admin-Seite. Der Code liegt im Theme-Feld mt-license-token (wie bisher, das Pro-Theme liest es dort).
 * Der Code verlässt den Server nie Richtung Browser: es gibt nur die letzten 6 Zeichen. Geprüft wird gegen den Lizenzserver,
 * Cache 24 h und Gnadenfrist 48 h im LicenseClient. Der Shop bricht nie: bei jedem Fehler gilt Free.
 */
class LicenseService
{
    public const API = 'https://theme.michael-gahn.de/api';
    private const CHECK_GAP = 10;

    public function __construct(
        private readonly SettingsService $settings,
        private readonly CacheStore $cache,
        private readonly Connection $connection,
        private readonly RequestStack $requests,
        private readonly ?\Closure $http = null, // nur für Tests: ersetzt den echten Abruf
    ) {
    }

    /** @return array<string,mixed> */
    public function status(string $themeId, Context $context): array
    {
        $token = $this->settings->rawField($themeId, SettingsService::LICENSE_KEY, $context);
        $domains = $this->domains($themeId);
        $state = LicenseClient::FREE;
        $domain = $domains[0];
        if ($token !== '') {
            foreach ($domains as $d) {
                $s = $this->client($d)->state($token);
                if ($state === LicenseClient::FREE || ($s['valid'] ?? false)) {
                    $state = $s;
                    $domain = $d;
                }
                if ($s['valid'] ?? false) {
                    break;
                }
            }
        }
        $d = LicenseTexts::describe($state, is_string($state['period_end'] ?? null) ? $state['period_end'] : null);

        return [
            'hasToken' => $token !== '',
            'masked' => $token === '' ? '' : '…' . substr($token, -6),
            'kind' => $d['kind'],
            'title' => $d['title'],
            'text' => $d['text'],
            'valid' => (bool) ($state['valid'] ?? false),
            'tier' => (string) ($state['tier'] ?? 'free'),
            'reason' => (string) ($state['reason'] ?? 'no_token'),
            'source' => (string) ($state['source'] ?? 'none'),
            'modules' => array_values(array_filter((array) ($state['modules'] ?? []), 'is_string')),
            'periodEnd' => is_string($state['period_end'] ?? null) ? $state['period_end'] : null,
            'validUntil' => is_int($state['valid_until'] ?? null) ? $state['valid_until'] : null,
            'domain' => $domain,
            'shopUrl' => LicenseTexts::SHOP_URL,
        ];
    }

    /** @return array{ok:bool,error?:string} */
    public function save(string $themeId, string $token, Context $context): array
    {
        $token = trim($token);
        if (!Sanitizer::licenseFormat($token)) {
            return ['ok' => false, 'error' => 'format'];
        }
        $this->settings->writeField($themeId, SettingsService::LICENSE_KEY, $token, $context);
        foreach ($this->domains($themeId) as $d) {
            $this->client($d)->forget($token);
        }

        return ['ok' => true];
    }

    public function remove(string $themeId, Context $context): void
    {
        $this->settings->writeField($themeId, SettingsService::LICENSE_KEY, '', $context);
    }

    /** "Jetzt prüfen": Cache dieses Codes verwerfen (höchstens alle 10 Sekunden). */
    public function recheck(string $themeId, Context $context): bool
    {
        if ($this->cache->get('lic_gap') !== null) {
            return false;
        }
        $this->cache->set('lic_gap', 1, self::CHECK_GAP);
        $token = $this->settings->rawField($themeId, SettingsService::LICENSE_KEY, $context);
        foreach ($this->domains($themeId) as $d) {
            $this->client($d)->forget($token);
        }

        return true;
    }

    /** @return non-empty-list<string> Hosts der Verkaufskanäle, denen das Theme zugewiesen ist; sonst Host der Anfrage */
    private function domains(string $themeId): array
    {
        $hosts = [];
        try {
            $urls = $this->connection->fetchFirstColumn(
                'SELECT d.url FROM sales_channel_domain d INNER JOIN theme_sales_channel t ON t.sales_channel_id = d.sales_channel_id WHERE t.theme_id = :id LIMIT 20',
                ['id' => hex2bin($themeId)]
            );
            foreach ($urls as $u) {
                $h = parse_url((string) $u, PHP_URL_HOST);
                if (is_string($h) && $h !== '' && !in_array(strtolower($h), $hosts, true)) {
                    $hosts[] = strtolower($h);
                }
            }
        } catch (\Throwable) {
            // ohne Domain-Liste nehmen wir den Host der Anfrage
        }
        if (!$hosts) {
            $hosts[] = strtolower((string) ($this->requests->getCurrentRequest()?->getHost() ?? 'localhost'));
        }

        return $hosts;
    }

    private function client(string $domain): LicenseClient
    {
        return new LicenseClient(
            self::API,
            $domain,
            $this->http ?? static function (string $url): ?array {
                $res = HttpFetcher::get($url, 4, 65536);
                if ($res === null) {
                    return null;
                }
                $json = json_decode($res['body'], true);

                return ['status' => $res['status'], 'json' => is_array($json) ? $json : []];
            },
            fn (string $k): ?array => is_array($v = $this->cache->get($k)) ? $v : null,
            fn (string $k, array $v, int $ttl) => $this->cache->set($k, $v, $ttl)
        );
    }
}

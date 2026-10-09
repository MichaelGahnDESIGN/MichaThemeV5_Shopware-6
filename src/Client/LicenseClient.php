<?php

declare(strict_types=1);

namespace MichaThemeV5\Client;

/**
 * Lizenzprüfung der Themes gegen https://theme.michael-gahn.de (GET /api/license/verify).
 *
 * Plattformneutral: HTTP und Zwischenspeicher werden von der Plattform übergeben.
 *  - $http(string $url): ?array   liefert ['status' => int, 'json' => array] oder null bei Netzwerkfehler
 *  - $cacheGet(string $key): ?array
 *  - $cacheSet(string $key, array $value, int $ttl): void
 *
 * Regeln: Der Shop bricht nie. Ohne gültige Lizenz gilt Free, Pro-Funktionen sind aus.
 * Die Antwort wird bis zu "cache_valid_until" (höchstens 24 h) weiterverwendet. Ist der Lizenzserver nicht erreichbar,
 * gilt eine abgelaufene Antwort noch für die Gnadenfrist, damit ein Ausfall auf unserer Seite keine Kunden-Shops trifft.
 * Sagt der Server "ungültig" (widerrufen, abgelaufen, falsche Domain), wird sofort auf Free zurückgestellt.
 */
final class LicenseClient
{
    public const NEGATIVE_TTL = 300;
    public const FREE = ['valid' => false, 'tier' => 'free', 'modules' => [], 'source' => 'none', 'reason' => 'no_token'];

    /** @var callable */
    private $http;
    /** @var callable */
    private $cacheGet;
    /** @var callable */
    private $cacheSet;
    /** @var callable */
    private $now;

    public function __construct(
        private readonly string $apiBase,
        private readonly string $domain,
        callable $http,
        callable $cacheGet,
        callable $cacheSet,
        private readonly int $graceSeconds = 172800,
        ?callable $now = null
    ) {
        $this->http = $http;
        $this->cacheGet = $cacheGet;
        $this->cacheSet = $cacheSet;
        $this->now = $now ?? 'time';
    }

    /** @return array{valid:bool,tier:string,modules:list<string>,source:string,reason:string} */
    public function state(string $token): array
    {
        $token = trim($token);
        if ($token === '') {
            return self::FREE;
        }
        // Ein vom Server erneuertes Token (Abo-Verlängerung) gilt für genau den eingetragenen Schlüssel.
        $renewKey = 'mt_tok_' . hash('sha256', $token . '|' . $this->domain);
        $renewed = ($this->cacheGet)($renewKey);
        if (is_array($renewed) && is_string($renewed['token'] ?? null) && $renewed['token'] !== '') {
            $token = $renewed['token'];
        }
        $key = 'mt_lic_' . hash('sha256', $token . '|' . $this->domain);
        $now = (int) ($this->now)();
        $cached = ($this->cacheGet)($key);
        if (is_array($cached) && isset($cached['until'], $cached['state'])) {
            if ($now < $cached['until']) {
                return ['source' => 'cache'] + $cached['state'];
            }
        }

        $res = ($this->http)($this->apiBase . '/license/verify?' . http_build_query(['token' => $token, 'domain' => $this->domain]));
        $json = is_array($res) && is_array($res['json'] ?? null) ? $res['json'] : null;

        if ($json !== null && array_key_exists('valid', $json) && ($res['status'] ?? 0) < 500) {
            if ($json['valid'] === true) {
                if (is_string($json['renewed_token'] ?? null) && strlen($json['renewed_token']) < 5000) {
                    ($this->cacheSet)($renewKey, ['token' => $json['renewed_token']], 400 * 86400);
                }
                $lic = is_array($json['license'] ?? null) ? $json['license'] : [];
                $until = strtotime((string) ($json['cache_valid_until'] ?? '')) ?: $now + 3600;
                $until = min($until, $now + 86400);
                $known = in_array($lic['tier'] ?? '', ['free', 'plus', 'pro', 'agency'], true);
                $state = [
                    'valid' => $known,
                    'tier' => $known ? $lic['tier'] : 'free',
                    'modules' => $known ? array_values(array_filter((array) ($lic['modules'] ?? []), 'is_string')) : [],
                    'source' => 'live',
                    'reason' => $known ? 'ok' : 'unknown_tier',
                ];
                ($this->cacheSet)($key, ['until' => $until, 'state' => $state], max(60, $until - $now) + $this->graceSeconds);

                return $state;
            }
            $state = ['valid' => false, 'tier' => 'free', 'modules' => [], 'source' => 'live', 'reason' => (string) ($json['reason'] ?? 'invalid')];
            ($this->cacheSet)($key, ['until' => $now + self::NEGATIVE_TTL, 'state' => $state], self::NEGATIVE_TTL);

            return $state;
        }

        // Server nicht erreichbar oder Fehler 5xx: abgelaufene gültige Antwort innerhalb der Gnadenfrist weiterverwenden.
        if (is_array($cached) && ($cached['state']['valid'] ?? false) === true && $now < $cached['until'] + $this->graceSeconds) {
            return ['source' => 'grace'] + $cached['state'];
        }

        return ['valid' => false, 'tier' => 'free', 'modules' => [], 'source' => 'none', 'reason' => 'unreachable'];
    }

    /** Ist ein Pro-Modul freigeschaltet? Pro und Agentur: alle Module, Plus: die gebuchten. */
    public function allows(string $token, string $module): bool
    {
        $s = $this->state($token);

        return $s['valid'] && (in_array($s['tier'], ['pro', 'agency'], true) || in_array($module, $s['modules'], true));
    }
}

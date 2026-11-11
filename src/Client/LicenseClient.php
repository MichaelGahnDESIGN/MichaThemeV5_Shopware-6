<?php

declare(strict_types=1);

namespace MichaThemeV5\Client;

/**
 * Lizenzprüfung der Themes gegen https://theme.michael-gahn.de (POST /api/license/verify).
 *
 * Plattformneutral: HTTP und Zwischenspeicher werden von der Plattform übergeben.
 *  - $http(string $url, array $request): ?array liefert ['status' => int, 'json' => array] oder null.
 *    Die Hülle muss Methode, Header und Body übernehmen, TLS prüfen und Weiterleitungen sperren.
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

    /** @return array{valid:bool,tier:string,modules:list<string>,source:string,reason:string,period_end?:?string,valid_until?:int} */
    public function state(string $token): array
    {
        $token = trim($token);
        if ($token === '') {
            return self::FREE;
        }
        // Kein Token an Klartext-URLs, eingebettete Zugangsdaten oder unklare Zieladressen senden.
        $base = parse_url($this->apiBase);
        if (!is_array($base) || ($base['scheme'] ?? '') !== 'https' || empty($base['host'])
            || isset($base['user']) || isset($base['pass']) || isset($base['query']) || isset($base['fragment'])) {
            return ['reason' => 'insecure_endpoint'] + self::FREE;
        }
        if (strlen($token) > 5000 || !preg_match('/^[A-Za-z0-9_.-]+$/D', $token)) {
            return ['reason' => 'invalid_token'] + self::FREE;
        }
        // Ein vom Server erneuertes Token (Abo-Verlängerung) gilt für genau den eingetragenen Schlüssel.
        $renewKey = 'mt_tok_' . hash('sha256', $token . '|' . $this->domain);
        $renewed = ($this->cacheGet)($renewKey);
        if (is_array($renewed) && is_string($renewed['token'] ?? null) && strlen($renewed['token']) <= 5000
            && preg_match('/^[A-Za-z0-9_.-]+$/D', $renewed['token'])) {
            $token = $renewed['token'];
        }
        $key = 'mt_lic_' . hash('sha256', $token . '|' . $this->domain);
        $now = (int) ($this->now)();
        $cached = ($this->cacheGet)($key);
        if (is_array($cached) && isset($cached['until'], $cached['state'])) {
            if ($now < $cached['until']) {
                return ['source' => 'cache'] + $cached['state'];
            }
            // Server grad weg (gemerkt 2 min) > nicht bei jedem Seitenaufruf bis zum Timeout warten
            if (($cached['state']['valid'] ?? false) === true && $now < (int) ($cached['down_until'] ?? 0) && $now < $cached['until'] + $this->graceSeconds) {
                return ['source' => 'grace'] + $cached['state'];
            }
        }

        // Token nur im Header; die Domain gehört in den JSON-Body, niemals in eine Token-URL.
        try {
            $res = ($this->http)(rtrim($this->apiBase, '/') . '/license/verify', [
                'method' => 'POST',
                'headers' => ['Authorization' => 'Bearer ' . $token, 'Accept' => 'application/json', 'Content-Type' => 'application/json'],
                'body' => json_encode(['domain' => $this->domain], JSON_THROW_ON_ERROR),
            ]);
        } catch (\Throwable) {
            // Fremde HTTP-Hüllen dürfen weder den Shop abbrechen noch Header in Fehlertexte schreiben.
            $res = null;
        }
        $json = is_array($res) && is_array($res['json'] ?? null) ? $res['json'] : null;

        if ($json !== null && array_key_exists('valid', $json) && in_array($res['status'] ?? 0, [200, 403], true)) {
            if ($json['valid'] === true && $res['status'] === 200) {
                if (is_string($json['renewed_token'] ?? null) && strlen($json['renewed_token']) <= 5000
                    && preg_match('/^[A-Za-z0-9_.-]+$/D', $json['renewed_token'])) {
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
                    // nur zur Anzeige (Plugin): Ende der Lizenz und Ende des Zwischenspeichers
                    'period_end' => is_string($lic['period_end'] ?? null) ? $lic['period_end'] : null,
                    'valid_until' => $until,
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
            ($this->cacheSet)($key, ['down_until' => $now + 120] + $cached, max(60, $cached['until'] + $this->graceSeconds - $now));
            return ['source' => 'grace'] + $cached['state'];
        }

        $down = ['valid' => false, 'tier' => 'free', 'modules' => [], 'source' => 'none', 'reason' => 'unreachable'];
        // kurz merken, damit nicht jeder Seitenaufruf bis zum Timeout wartet; ein vorhandener gültiger Eintrag bleibt für die Gnadenfrist erhalten
        if (!is_array($cached) || ($cached['state']['valid'] ?? false) !== true) {
            ($this->cacheSet)($key, ['until' => $now + 120, 'state' => $down], 120);
        }

        return $down;
    }

    /** "Jetzt prüfen": Zwischenspeicher dieses Codes verwerfen, der nächste state() fragt den Server. */
    public function forget(string $token): void
    {
        $token = trim($token);
        if ($token === '') {
            return;
        }
        $renewed = ($this->cacheGet)('mt_tok_' . hash('sha256', $token . '|' . $this->domain));
        if (is_array($renewed) && is_string($renewed['token'] ?? null) && $renewed['token'] !== '') {
            $token = $renewed['token'];
        }
        $key = 'mt_lic_' . hash('sha256', $token . '|' . $this->domain);
        $cached = ($this->cacheGet)($key);
        // Eintrag bleibt für die Gnadenfrist erhalten (falls der Server gerade fehlt), gilt aber als abgelaufen
        if (is_array($cached) && isset($cached['state'])) {
            ($this->cacheSet)($key, ['until' => 0] + array_diff_key($cached, ['down_until' => true]), $this->graceSeconds);
        }
    }

    /** Ist ein Modul freigeschaltet? Pro und Agentur: alle Module, Plus: die gebuchten. */
    public function allows(string $token, string $module): bool
    {
        $s = $this->state($token);

        return $s['valid'] && (in_array($s['tier'], ['pro', 'agency'], true) || in_array($module, $s['modules'], true));
    }
}

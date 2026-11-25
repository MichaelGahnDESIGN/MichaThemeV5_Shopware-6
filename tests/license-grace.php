<?php

declare(strict_types=1);

// Server weg in der Gnadenfrist: nicht jeder Seitenaufruf wartet bis zum Timeout
defined('ABSPATH') || define('ABSPATH', __DIR__);
defined('PFAD_ROOT') || define('PFAD_ROOT', __DIR__);
$root = dirname(__DIR__);
$files = array_values(array_filter([
    'templates/MichaThemeV5/php/LicenseClient.php', 'plugins/MichaThemeV5/src/Generated/LicenseClient.php',
    'src/Client/LicenseClient.php', 'src/Generated/LicenseClient.php',
    'inc/license-client.php', 'plugin/michatheme-v5/includes/generated/LicenseClient.php',
], static fn(string $f): bool => is_file($root . '/' . $f)));
if ($files === []) {
    throw new RuntimeException('Kein Lizenzclient gefunden.');
}
$fails = 0;
foreach ($files as $f) {
    $before = get_declared_classes();
    require_once $root . '/' . $f;
    $class = null;
    foreach (array_diff(get_declared_classes(), $before) as $c) {
        if (str_ends_with($c, '\\LicenseClient')) { $class = $c; }
    }
    if ($class === null) { throw new RuntimeException('Klasse fehlt in ' . $f); }
    $cache = []; $calls = 0; $now = 1_000_000; $up = true;
    $http = static function (string $url, array $req) use (&$calls, &$up, &$now): ?array {
        $calls++;
        return $up ? ['status' => 200, 'json' => ['valid' => true, 'license' => ['tier' => 'pro', 'modules' => []], 'cache_valid_until' => gmdate('c', $now + 3600)]] : null;
    };
    $get = static function (string $k) use (&$cache, &$now): ?array { return isset($cache[$k]) && $cache[$k][1] > $now ? $cache[$k][0] : null; };
    $set = static function (string $k, array $v, int $ttl) use (&$cache, &$now): void { $cache[$k] = [$v, $now + $ttl]; };
    $client = new $class('https://theme.michael-gahn.de/api', 'shop.example', $http, $get, $set, 172800, static function () use (&$now): int { return $now; });
    $tok = 'aaa.bbb.ccc';
    $ok = $client->state($tok)['valid'] === true && $calls === 1;
    $now += 3700; $up = false;
    $s1 = $client->state($tok);
    $ok = $ok && $s1['valid'] === true && $s1['source'] === 'grace' && $calls === 2;
    $now += 30;
    $s2 = $client->state($tok);
    $ok = $ok && $s2['valid'] === true && $calls === 2; // gemerkt: keine neue Anfrage
    $now += 130;
    $client->state($tok);
    $ok = $ok && $calls === 3; // nach 2 Minuten wieder fragen
    $now += 172800;
    $s3 = $client->state($tok);
    $ok = $ok && $s3['valid'] === false; // Gnadenfrist vorbei, kein endloses Verlängern
    $now += 10; $up = true;
    $client->forget($tok);
    $ok = $ok && $client->state($tok)['valid'] === true; // Server wieder da
    echo ($ok ? 'OK   ' : 'FEHL ') . $f . "\n";
    if (!$ok) { $fails++; echo "     calls=$calls\n"; }
}
exit($fails === 0 ? 0 : 1);

<?php

declare(strict_types=1);

// Lizenz-Plattform: Plugin-Lizenz (wordpress) darf kein Theme freischalten
defined('ABSPATH') || define('ABSPATH', __DIR__);
defined('PFAD_ROOT') || define('PFAD_ROOT', __DIR__);
$root = dirname(__DIR__);
$files = array_values(array_filter([
    'templates/MichaThemeV5/php/LicenseClient.php', 'plugins/MichaThemeV5/src/Generated/LicenseClient.php',
    'src/Client/LicenseClient.php', 'src/Generated/LicenseClient.php',
    'inc/license-client.php',
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
    $own = $class::PLATFORM;
    $run = static function (?string $platform) use ($class): array {
        $cache = [];
        $http = static fn(string $u, array $r): array => ['status' => 200, 'json' => ['valid' => true, 'license' => ['tier' => 'pro', 'modules' => []] + ($platform === null ? [] : ['platform' => $platform]), 'cache_valid_until' => gmdate('c', time() + 3600)]];
        $get = static function (string $k) use (&$cache): ?array { return $cache[$k] ?? null; };
        $set = static function (string $k, array $v, int $ttl) use (&$cache): void { $cache[$k] = $v; };
        return (new $class('https://theme.michael-gahn.de/api', 'shop.example', $http, $get, $set))->state('aaa.bbb.ccc');
    };
    $good = $run($own); $wp = $run('wordpress'); $other = $run($own === 'jtl5' ? 'shopware6' : 'jtl5'); $none = $run(null);
    $ok = in_array($own, ['woocommerce', 'shopware6', 'jtl5'], true) && $good['valid'] === true && $good['tier'] === 'pro'
        && $wp['valid'] === false && $wp['tier'] === 'free' && $wp['reason'] === 'wrong_platform'
        && $other['valid'] === false && $none['valid'] === false;
    echo ($ok ? 'OK   ' : 'FAIL ') . $f . ' (' . $own . ")\n";
    $fails += $ok ? 0 : 1;
}
exit($fails === 0 ? 0 : 1);

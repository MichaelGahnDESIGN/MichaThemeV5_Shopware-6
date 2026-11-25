<?php

declare(strict_types=1);

// Lizenz-Plattform: Plugin-Lizenz (wordpress, kind product) darf kein Theme freischalten
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
    $own = str_starts_with($f, 'inc/') ? 'woocommerce' : (str_starts_with($f, 'src/') ? 'shopware6' : 'jtl5');
    $other = $own === 'jtl5' ? 'shopware6' : 'jtl5';
    $run = static function (array $lic, string $platform) use ($class): array {
        $cache = [];
        $http = static fn(string $u, array $r): array => ['status' => 200, 'json' => ['valid' => true, 'license' => ['tier' => 'pro', 'modules' => []] + $lic, 'cache_valid_until' => gmdate('c', time() + 3600)]];
        $get = static function (string $k) use (&$cache): ?array { return $cache[$k] ?? null; };
        $set = static function (string $k, array $v, int $ttl) use (&$cache): void { $cache[$k] = $v; };
        return (new $class('https://theme.michael-gahn.de/api', 'shop.example', $http, $get, $set, 172800, null, $platform))->state('aaa.bbb.ccc');
    };
    $good = $run(['platform' => $own, 'kind' => 'theme'], $own);
    $plugin = $run(['platform' => 'wordpress', 'kind' => 'product'], $own);
    $wrong = $run(['platform' => $other, 'kind' => 'theme'], $own);
    $prod = $run(['platform' => $own, 'kind' => 'product'], $own);
    $none = $run(['platform' => $own], '');
    $ok = $good['valid'] === true && $good['tier'] === 'pro'
        && $plugin['valid'] === false && $plugin['tier'] === 'free' && $plugin['reason'] === 'wrong_platform'
        && $wrong['valid'] === false && $wrong['reason'] === 'wrong_platform'
        && $prod['valid'] === false && $prod['reason'] === 'wrong_platform'
        && $none['valid'] === false && $none['reason'] === 'platform_missing';
    echo ($ok ? 'OK   ' : 'FAIL ') . $f . ' (' . $own . ")\n";
    $fails += $ok ? 0 : 1;
}
exit($fails === 0 ? 0 : 1);

<?php

declare(strict_types=1);

// Favicon: MichaTheme-M als Standard für sw-logo-favicon, eigenes geht vor
$root = dirname(__DIR__);
$fails = 0;
$ok = static function (string $name, bool $cond) use (&$fails): void {
    echo ($cond ? 'OK   ' : 'FEHL ') . $name . "\n";
    $fails += $cond ? 0 : 1;
};
$theme = json_decode((string) file_get_contents($root . '/src/Resources/theme.json'), true);
$f = $theme['config']['fields']['sw-logo-favicon'] ?? null;
$ok('sw-logo-favicon überschrieben', is_array($f) && ($f['type'] ?? '') === 'media' && ($f['editable'] ?? false) === true);
$png = $root . '/src/Resources/' . ($f['value'] ?? '');
$info = is_file($png) ? getimagesize($png) : false;
$ok('Standard-Favicon vorhanden', is_file($png));
$ok('PNG, quadratisch, mind. 192 px', $info !== false && $info[2] === IMAGETYPE_PNG && $info[0] === $info[1] && $info[0] >= 192);
$ok('Datei liegt im Theme-Asset-Ordner', str_starts_with((string) ($f['value'] ?? ''), 'app/storefront/src/assets/') && in_array('app/storefront/src/assets', $theme['asset'] ?? [], true));
$twig = (string) file_get_contents($root . '/src/Resources/views/storefront/layout/meta.html.twig');
$ok('Twig-Block layout_head_favicon mit Rückfall auf parent()', str_contains($twig, '{% block layout_head_favicon %}') && str_contains($twig, "theme_config('mt-favicon')") && str_contains($twig, 'parent()'));
exit($fails === 0 ? 0 : 1);

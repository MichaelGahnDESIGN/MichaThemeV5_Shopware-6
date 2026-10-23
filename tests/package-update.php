<?php declare(strict_types=1);
require __DIR__ . '/update-security.php';
$root = dirname(__DIR__);
$manifest = json_decode(file_get_contents($root . '/composer.json'), true, 32, JSON_THROW_ON_ERROR);
$files = (new MichaThemeV5\Update\ArchiveValidator())->validate($root . '/dist/MichaThemeV5.zip', $manifest['version']);
check(count($files) > 10, 'Fertiges Release muss alle Laufzeitdateien enthalten.');
echo "OK: echtes Release-ZIP vom installierten Updater akzeptiert.\n";

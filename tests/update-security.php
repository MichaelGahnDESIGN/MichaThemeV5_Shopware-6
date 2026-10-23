<?php declare(strict_types=1);

// Diese eigenständigen Verhaltenstests benötigen nur PHP mit ext-zip.
spl_autoload_register(static function (string $class): void {
    $prefix = 'MichaThemeV5\\';
    if (str_starts_with($class, $prefix)) {
        $path = __DIR__ . '/../src/' . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
        if (is_file($path)) { require $path; }
    }
});

function check(bool $condition, string $message): void
{
    if (!$condition) { throw new RuntimeException($message); }
}

function rejects(callable $operation, string $message): void
{
    try { $operation(); } catch (RuntimeException|InvalidArgumentException $error) { return; }
    throw new RuntimeException($message);
}

function manifest(string $version = '0.2.0', ?array $requirements = ['php' => '>=8.2', 'ext-zip' => '*', 'ext-curl' => '*', 'ext-mbstring' => '*', 'shopware/core' => '~6.7.0', 'shopware/storefront' => '~6.7.0']): string
{
    $manifest = ['name' => 'michael-gahn/micha-theme-v5', 'type' => 'shopware-platform-plugin', 'version' => $version,
        'autoload' => ['psr-4' => ['MichaThemeV5\\' => 'src/']],
        'extra' => ['shopware-plugin-class' => 'MichaThemeV5\\MichaThemeV5']];
    if ($requirements !== null) { $manifest['require'] = $requirements; }
    return json_encode($manifest, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);
}

function archive(array $entries): string
{
    $path = tempnam(sys_get_temp_dir(), 'mgd-eu-test-');
    $zip = new ZipArchive();
    $zip->open($path, ZipArchive::OVERWRITE);
    foreach ($entries as $name => $body) { $zip->addFromString($name, $body); }
    $zip->close();
    return $path;
}

$tests = [];
$tests['Release: ausschließlich stabile höhere Version aus festem Repository'] = static function (): void {
    check(class_exists(MichaThemeV5\Update\ReleaseMetadata::class), 'Release-Prüfung fehlt');
    $release = ['tag_name' => 'v0.2.0', 'draft' => false, 'prerelease' => false, 'assets' => [[
        'name' => 'MichaThemeV5.zip', 'size' => 1000, 'digest' => 'sha256:' . str_repeat('a', 64),
        'browser_download_url' => 'https://github.com/MichaelGahnDESIGN/MichaThemeV5_Shopware-6/releases/download/v0.2.0/MichaThemeV5.zip',
    ]]];
    $parse = static fn(array $value) => MichaThemeV5\Update\ReleaseMetadata::fromGitHub($value, '0.1.0');
    check($parse($release)->version === '0.2.0', 'Stabile neuere Version akzeptieren');
    foreach ([['tag_name' => 'v0.1.0'], ['tag_name' => 'v0.2.0-beta.1'], ['draft' => true], ['prerelease' => true]] as $change) {
        rejects(static fn() => $parse(array_replace($release, $change)), 'Ungültiges Release abweisen');
    }
    foreach ([['digest' => null], ['size' => 30000000], ['browser_download_url' => 'https://evil.example/MichaThemeV5.zip']] as $change) {
        $bad = $release; $bad['assets'][0] = array_replace($bad['assets'][0], $change);
        rejects(static fn() => $parse($bad), 'Ungültiges Asset abweisen');
    }
};

$tests['ZIP: echte Archive, Traversal, Symlinks, falsche Identität und Bomben'] = static function (): void {
    check(class_exists(MichaThemeV5\Update\ArchiveValidator::class), 'Archiv-Prüfung fehlt');
    $validator = new MichaThemeV5\Update\ArchiveValidator();
    $good = ['MichaThemeV5/composer.json' => manifest(), 'MichaThemeV5/src/MichaThemeV5.php' => '<?php // Test'];
    $path = archive($good);
    try { check(count($validator->validate($path, '0.2.0')) === 2, 'Echtes korrektes ZIP akzeptieren'); }
    finally { unlink($path); }
    foreach (['../escape.php', '/absolute.php', 'MichaThemeV5/../escape.php', 'MichaThemeV5/src\\evil.php', 'Other/file.php', 'MichaThemeV5/.env', 'MichaThemeV5/src/config.env'] as $name) {
        $path = archive($good + [$name => 'bad']);
        try { rejects(static fn() => $validator->validate($path, '0.2.0'), 'Gefährlicher Pfad zugelassen: ' . $name); }
        finally { unlink($path); }
    }
    foreach ([str_replace('michael-gahn/micha-theme-v5', 'evil/plugin', manifest()), manifest('0.3.0')] as $body) {
        $path = archive(array_replace($good, ['MichaThemeV5/composer.json' => $body]));
        try { rejects(static fn() => $validator->validate($path, '0.2.0'), 'Falsche Plugin-Identität zugelassen'); }
        finally { unlink($path); }
    }
    $path = archive($good + ['MichaThemeV5/src/link.php' => 'target']);
    $zip = new ZipArchive(); $zip->open($path); $zip->setExternalAttributesName('MichaThemeV5/src/link.php', ZipArchive::OPSYS_UNIX, 0120777 << 16); $zip->close();
    try { rejects(static fn() => $validator->validate($path, '0.2.0'), 'Symlink zugelassen'); }
    finally { unlink($path); }
    $path = archive($good + ['MichaThemeV5/src/bomb.php' => str_repeat('0', 2000000)]);
    try { rejects(static fn() => $validator->validate($path, '0.2.0'), 'Kompressionsbombe zugelassen'); }
    finally { unlink($path); }
};

$tests['Installer: atomarer Austausch und Rückfall bei Refresh-Fehler'] = static function (): void {
    check(class_exists(MichaThemeV5\Update\AtomicInstaller::class), 'Installer fehlt');
    $root = sys_get_temp_dir() . '/mgd-eu-install-' . bin2hex(random_bytes(8));
    mkdir($root . '/custom/plugins/MichaThemeV5', 0700, true);
    mkdir($root . '/public', 0700);
    file_put_contents($root . '/custom/plugins/MichaThemeV5/composer.json', manifest('0.1.0'));
    $path = archive(['MichaThemeV5/composer.json' => manifest(), 'MichaThemeV5/src/MichaThemeV5.php' => '<?php // Test']);
    $installer = new MichaThemeV5\Update\AtomicInstaller(new MichaThemeV5\Update\ArchiveValidator());
    try {
        rejects(static fn() => $installer->install($path, '0.2.0', $root . '/custom/plugins/MichaThemeV5', $root . '/var/micha-theme-v5', static function (): void { throw new RuntimeException('Refresh fehlgeschlagen'); }), 'Refresh-Fehler verschluckt');
        check(json_decode(file_get_contents($root . '/custom/plugins/MichaThemeV5/composer.json'), true)['version'] === '0.1.0', 'Rückfall stellt Original wieder her');
        $refreshCount = 0;
        $installer->install($path, '0.2.0', $root . '/custom/plugins/MichaThemeV5', $root . '/var/micha-theme-v5', static function () use (&$refreshCount): void { ++$refreshCount; });
        check($refreshCount === 1, 'Refresh nach Austausch');
        check(json_decode(file_get_contents($root . '/custom/plugins/MichaThemeV5/composer.json'), true)['version'] === '0.2.0', 'Neue Version installiert');
        rejects(static fn() => $installer->install($path, '0.2.0', $root . '/custom/plugins/MichaThemeV5', $root . '/public/staging', static function (): void {}), 'Staging im Webroot zugelassen');
    } finally {
        unlink($path);
        $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS), RecursiveIteratorIterator::CHILD_FIRST);
        foreach ($files as $file) { $file->isDir() ? rmdir($file->getPathname()) : unlink($file->getPathname()); }
        rmdir($root);
    }
};

$tests['Download: HTTPS-Hostgrenze, Digest und vollständige Größe'] = static function (): void {
    check(class_exists(MichaThemeV5\Update\DownloadPolicy::class), 'Download-Integritätsprüfung fehlt');
    $policy = new MichaThemeV5\Update\DownloadPolicy();
    check($policy->allowedRedirect('https://release-assets.githubusercontent.com/github-production-release-asset/123/file?token=temporary'), 'GitHub Assethost erlaubt');
    foreach (['http://github.com/a', 'https://evil.example/a', 'https://github.com.evil.example/a', 'https://user:pass@github.com/a', 'https://github.com:8443/a', 'file:///tmp/a'] as $url) {
        check(!$policy->allowedRedirect($url), 'Unsicheres Redirectziel zugelassen: ' . $url);
    }
    $release = MichaThemeV5\Update\ReleaseMetadata::fromGitHub(['tag_name' => 'v0.2.0', 'draft' => false, 'prerelease' => false,
        'assets' => [['name' => 'MichaThemeV5.zip', 'size' => 4, 'digest' => 'sha256:' . hash('sha256', 'good'), 'browser_download_url' => 'https://github.com/MichaelGahnDESIGN/MichaThemeV5_Shopware-6/releases/download/v0.2.0/MichaThemeV5.zip']]], '0.1.0');
    $file = tempnam(sys_get_temp_dir(), 'mgd-eu-digest-');
    try {
        file_put_contents($file, 'good'); $policy->verify($file, $release);
        file_put_contents($file, 'evil'); rejects(static fn() => $policy->verify($file, $release), 'Digestfehler nicht erkannt');
        file_put_contents($file, 'goo'); rejects(static fn() => $policy->verify($file, $release), 'Abbruch nicht erkannt');
    } finally { unlink($file); }
};

$tests['Integration: feste Adminroute, Standard aus und stündlicher Check'] = static function (): void {
    $base = __DIR__ . '/../src/';
    check(is_file($base . 'Controller/UpdateController.php'), 'Manuelle Adminroute fehlt');
    $controller = file_get_contents($base . 'Controller/UpdateController.php');
    check(str_contains($controller, 'ApiRouteScope::ID') && str_contains($controller, "'system_config:update'") && str_contains($controller, "methods: ['POST']"), 'Admin-Authentifizierung und ACL fehlen');
    $config = simplexml_load_file($base . 'Resources/config/config.xml');
    $auto = $config->xpath('//input-field[name="automaticUpdates"]/defaultValue');
    check((string) $auto[0] === 'false', 'Automatik muss standardmäßig aus sein');
    check(str_contains(file_get_contents($base . 'ScheduledTask/UpdateTask.php'), '3600'), 'Stündliches Prüfintervall');
};

$tests['Installer: geänderte Runtime-Anforderungen dürfen niemals aktive Dateien austauschen'] = static function (): void {
    $root = sys_get_temp_dir() . '/mgd-eu-require-' . bin2hex(random_bytes(8));
    mkdir($root . '/custom/plugins/MichaThemeV5', 0700, true);
    $original = manifest('0.1.0');
    file_put_contents($root . '/custom/plugins/MichaThemeV5/composer.json', $original);
    $installer = new MichaThemeV5\Update\AtomicInstaller(new MichaThemeV5\Update\ArchiveValidator());
    $require = json_decode($original, true)['require'];
    $removed = $require; unset($removed['ext-zip']);
    $cases = [null, [], array_replace($require, ['php' => '>=8.4']), array_replace($require, ['shopware/core' => '~6.8.0', 'shopware/storefront' => '~6.8.0']), $removed, $require + ['vendor/new-package' => '^1.0']];
    try {
        foreach ($cases as $requirements) {
            $path = archive(['MichaThemeV5/composer.json' => manifest('0.2.0', $requirements), 'MichaThemeV5/src/MichaThemeV5.php' => '<?php // Test']);
            $refreshes = 0;
            // Außerhalb der Arrow-Closure anlegen, damit die Referenz den echten Zähler verändert.
            $refresh = static function () use (&$refreshes): void { ++$refreshes; };
            try {
                rejects(static fn() => $installer->install($path, '0.2.0', $root . '/custom/plugins/MichaThemeV5', $root . '/var/micha-theme-v5', $refresh), 'Geänderte Runtime-Anforderungen wurden zugelassen');
                check(file_get_contents($root . '/custom/plugins/MichaThemeV5/composer.json') === $original, 'Aktive Dateien wurden vor Kompatibilitätsprüfung verändert');
                check($refreshes === 0, 'Refresh trotz abgewiesener Runtime-Anforderungen');
                check(glob($root . '/var/micha-theme-v5/backup-*') === [], 'Sicherung/Rename trotz abgewiesener Runtime-Anforderungen');
            } finally { unlink($path); }
        }
        // Gleiche Anforderungen bleiben bei anderer JSON-Schlüsselreihenfolge kompatibel.
        $path = archive(['MichaThemeV5/composer.json' => manifest('0.2.0', array_reverse($require, true)), 'MichaThemeV5/src/MichaThemeV5.php' => '<?php // Test']);
        try { $installer->install($path, '0.2.0', $root . '/custom/plugins/MichaThemeV5', $root . '/var/micha-theme-v5', static function (): void {}); }
        finally { unlink($path); }
        check(json_decode(file_get_contents($root . '/custom/plugins/MichaThemeV5/composer.json'), true)['version'] === '0.2.0', 'Identische Anforderungen wurden abgewiesen');
    } finally {
        $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS), RecursiveIteratorIterator::CHILD_FIRST);
        foreach ($files as $file) { $file->isDir() ? rmdir($file->getPathname()) : unlink($file->getPathname()); }
        rmdir($root);
    }
};

foreach ($tests as $name => $test) { $test(); echo "OK: $name\n"; }

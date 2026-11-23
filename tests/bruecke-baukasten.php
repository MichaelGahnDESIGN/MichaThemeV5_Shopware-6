<?php declare(strict_types=1);

// Brückenversion 1.6.0: Plugin-Baukasten (src/Kit) eingebaut, alter Update-/Meldecode abgeschaltet
// ohne Shopware und ohne Netz, Shopware/Symfony-Klassen = kleine Attrappen

namespace Shopware\Core\System\SystemConfig { class SystemConfigService { public array $data = []; public bool $broken = false; public function get(string $k) { if ($this->broken) { throw new \RuntimeException('db weg'); } return $this->data[$k] ?? null; } public function set(string $k, $v): void { if ($this->broken) { throw new \RuntimeException('db weg'); } if ($v === null) { unset($this->data[$k]); return; } $this->data[$k] = $v; } } }
namespace Doctrine\DBAL { class Connection { public array $urls = []; public function fetchFirstColumn(string $sql, array $p = []): array { return $this->urls; } } }
namespace Symfony\Component\DependencyInjection { interface ContainerInterface { public function get(string $id); } }

namespace {
use Doctrine\DBAL\Connection;
use MichaThemeV5\Bridge\KitBridge;
use MichaThemeV5\Kit\Install\{CallbackStore, InstallClient, Response, Transport};
use MichaThemeV5\Kit\Platform\Shopware\ShopwareKit;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\Component\DependencyInjection\ContainerInterface;

function ok(bool $c, string $m): void { if (!$c) { fwrite(STDERR, "FEHL $m\n"); exit(1); } echo "OK   $m\n"; }
$root = dirname(__DIR__);
spl_autoload_register(static function (string $c) use ($root): void {
    foreach (['MichaThemeV5\\Plugin\\' => '/src/Generated/', 'MichaThemeV5\\' => '/src/'] as $ns => $dir) {
        if (str_starts_with($c, $ns)) { $f = $root . $dir . str_replace('\\', '/', substr($c, strlen($ns))) . '.php'; if (is_file($f)) { require $f; return; } }
    }
});
// kein APP_URL aus der Umgebung, sonst würde der Lifecycle echt senden wollen
unset($_SERVER['APP_URL'], $_ENV['APP_URL']); putenv('APP_URL');

$fake = new class implements Transport {
    public array $calls = [];
    public function send(string $method, string $url, array $headers): Response { $this->calls[] = [$method, $url, $headers]; return new Response(200, [], '{}'); }
};
$read = static fn (string $f): string => (string) file_get_contents($root . '/' . $f);
$ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
$KEY = 'abcdefghijklmnopqrstuvwxyz012345';
$OLD = KitBridge::OLD_STATE_KEY; $NEW = KitBridge::STATE_KEY; $SW = KitBridge::SWITCH_KEY;
$state = static fn (SystemConfigService $c): ?array => is_string($c->data[KitBridge::STATE_KEY] ?? null) ? json_decode($c->data[KitBridge::STATE_KEY], true) : null;

// 1) Werte aus der Anleitung
ok(KitBridge::PRODUCT === 'michatheme-v5-shopware', 'Produktname bleibt michatheme-v5-shopware');
ok($NEW === 'MichaThemeV5.config.installState' && $SW === 'MichaThemeV5.config.installReport', 'Schlüssel passen zum Baukasten (<Technischer Name>.config.*)');
$kitServices = $read('src/Kit/Platform/Shopware/Resources/config/services.xml');
ok(str_contains($kitServices, '<argument>michatheme-v5-shopware</argument>') && str_contains($kitServices, '<argument>MichaThemeV5</argument>') && str_contains($kitServices, '<argument>plugin-michatheme-v5-shopware</argument>') && str_contains($kitServices, '<argument>false</argument>'), 'Kit-services.xml: Produkt, technischer Name, Katalog-Kennung, Lizenz aus');
ok(!str_contains(shell_exec('grep -rl "{{KIT_" ' . escapeshellarg($root . '/src') . ' 2>/dev/null') ?? '', '{{KIT_') && trim((string) shell_exec('grep -rl "{{KIT_" ' . escapeshellarg($root . '/src') . ' 2>/dev/null')) === '', 'kein Platzhalter {{KIT_…}} übrig');
ok(str_contains($read('src/Kit/Platform/Shopware/ApiController.php'), "/api/_action/mgd-kit/michatheme-v5-shopware"), 'Kit-Routen unter /api/_action/mgd-kit/michatheme-v5-shopware');

// 2) Baukasten-Dienste und Routen sind angeschlossen
$services = $read('src/Resources/config/services.xml');
$routes = $read('src/Resources/config/routes.xml');
ok(str_contains($services, '<import resource="../../Kit/Platform/Shopware/Resources/config/services.xml"/>'), 'services.xml importiert die Baukasten-Dienste');
ok(str_contains($routes, '<import resource="../../Kit/Platform/Shopware/Resources/config/routes.xml"/>'), 'routes.xml importiert die Baukasten-Routen');
ok(is_file($root . '/src/Kit/Platform/Shopware/Resources/config/services.xml') && is_file($root . '/src/Kit/Platform/Shopware/Resources/config/routes.xml'), 'Baukasten-XML-Dateien da');
$kit = new SimpleXMLElement($kitServices);
$tasks = []; foreach ($kit->services->service as $s) { if ((string) $s->tag['name'] === 'shopware.scheduled.task') { $tasks[] = (string) $s['id']; } }
ok($tasks === ['MichaThemeV5\\Kit\\Platform\\Shopware\\PingTask'], 'tägliche Aufgabe kommt vom Baukasten (PingTask)');
ok(str_contains($read('src/Kit/Platform/Shopware/PingTask.php'), "'mgd_kit.michatheme_v5_shopware.ping'"), 'Task-Name mgd_kit.michatheme_v5_shopware.ping');
ok(preg_match('/__construct\(EntityRepository \$scheduledTaskRepository, LoggerInterface \$logger,/', $read('src/Kit/Platform/Shopware/PingTaskHandler.php')) === 1, 'Baukasten-Handler mit Logger (Shopware 6.7)');

// 3) Alter Update-Task und alte Meldung: nicht mehr angemeldet, Handler bleiben und tun nix
$plain = preg_replace('~<!--.*?-->~s', '', $services);
$mine = new SimpleXMLElement($plain);
$own = []; foreach ($mine->services->service as $s) { if ((string) $s->tag['name'] === 'shopware.scheduled.task') { $own[] = (string) $s['id']; } }
ok($own === [], 'services.xml meldet keinen eigenen Task mehr an');
foreach (['UpdateTask', 'InstallPingTask'] as $t) {
    ok(!str_contains($plain, 'id="MichaThemeV5\\ScheduledTask\\' . $t . '"'), "$t nicht mehr als Task angemeldet");
    ok(str_contains($plain, 'handles="MichaThemeV5\\ScheduledTask\\' . $t . '"'), "$t-Handler bleibt (übrige Task-Einträge in der DB stürzen nicht ab)");
    $h = $read('src/ScheduledTask/' . $t . 'Handler.php');
    ok(preg_match('/function run\(\): void\s*\{\s*(\/\/[^\n]*)?\s*\}/', $h) === 1, "$t-Handler tut nichts");
}
ok(!str_contains($plain, 'InstallReporter') && !str_contains($plain, 'InstallReportSubscriber') && !str_contains($plain, 'UpdateController'), 'kein alter Reporter, Subscriber oder UpdateController als Dienst');
ok(!str_contains(preg_replace('~<!--.*?-->~s', '', $routes), '../../Controller/'), 'alte UpdateController-Routen werden nicht geladen');

// 4) genau ein Schalter, eine Update-Oberfläche
$cfg = $read('src/Resources/config/config.xml');
ok(!str_contains($cfg, 'installReport') && !str_contains($cfg, 'automaticUpdates'), 'config.xml: kein Schalter installReport/automaticUpdates mehr');
ok(substr_count($read('src/Kit/Platform/Shopware/administration/mgd-kit.js'), 'Installation melden') + substr_count($read('src/Kit/Platform/Shopware/administration/mgd-kit.js'), 'install-report') >= 1, 'Baukasten-Seite hat den Schalter');
$built = $read('src/Resources/public/administration/js/micha-theme-v5.js');
ok(substr_count($built, "Shopware.Module.register(MODULE, {") === 1 && str_contains($built, "var PRODUCT = 'michatheme-v5-shopware'"), 'gebautes Admin-JS enthält die Baukasten-Seite genau einmal');
$info = $read('src/Resources/app/administration/src/module/michatheme-v5/page/mt-sw-info.js');
ok(!str_contains(explode('methods:', $info)[0], 'update.install') && !str_contains(explode('methods:', $info)[0], 'checkUpdate'), 'Info-Seite: alte Update-Karte ist nicht mehr im Template');
$nav = $read('src/Resources/app/administration/src/module/michatheme-v5/component/mt-sw-nav.js');
ok(!str_contains($nav, "'michatheme.v5.catalog'") && str_contains($nav, "'mgd.kit.michatheme.v5.shopware.index'"), 'Nav: alte Plugin-Empfehlungen nicht verlinkt, Baukasten-Seite verlinkt');
$entry = $read('src/Resources/app/administration/src/module/michatheme-v5/index.js');
ok(str_contains($entry, "import '../../../../../../Kit/Platform/Shopware/administration/mgd-kit.js';") && is_file($root . '/src/Resources/app/administration/src/module/michatheme-v5/../../../../../../Kit/Platform/Shopware/administration/mgd-kit.js'), 'Admin-Quelle bindet die Baukasten-Seite ein (Pfad stimmt)');
ok(str_contains($read('src/Resources/app/administration/src/module/michatheme-v5/register.js'), "Shopware.Module.register('michatheme-v5'"), 'altes Admin-Modul (Einstellungen, Lizenzen, Info) bleibt');

// 5) Routen ohne Kollision (nur Controller, die routes.xml wirklich lädt)
$files = array_merge(glob($root . '/src/Administration/Controller/*Controller.php'), glob($root . '/src/NotificationCenter/Controller/*Controller.php'), [$root . '/src/Kit/Platform/Shopware/ApiController.php']);
$names = []; $paths = [];
foreach ($files as $f) {
    $prefix = '/api/_action/mgd-kit/michatheme-v5-shopware';
    foreach (explode("\n", (string) file_get_contents($f)) as $line) {
        if (!str_contains($line, '#[Route(') || !str_contains($line, 'path:')) { continue; }
        preg_match("/path: ((?:self::PREFIX \\. )?'[^']*')/", $line, $pm);
        preg_match("/name: '([^']+)'/", $line, $nm);
        preg_match("/methods: \\['(\\w+)'\\]/", $line, $mm);
        $raw = $pm[1] ?? '';
        $path = str_contains($raw, 'self::PREFIX') ? $prefix . str_replace(["self::PREFIX . ", "'"], '', $raw) : str_replace("'", '', $raw);
        $names[] = $nm[1] ?? '?'; $paths[] = $path . ' ' . ($mm[1] ?? '*');
    }
}
ok(count($names) >= 15, 'Routen gefunden: ' . count($names));
ok(count($names) === count(array_unique($names)), 'Routennamen eindeutig');
ok(count($paths) === count(array_unique($paths)), 'Pfad + Methode eindeutig');
ok(substr_count(implode("\n", $paths), '/api/_action/mgd-kit/michatheme-v5-shopware/install-report') === 1, 'genau eine Route für den Schalter');
ok(substr_count(implode("\n", $paths), '/update/status') === 0 && substr_count(implode("\n", $names), 'micha_theme_v5.update') === 0, 'alte Update-Routen werden nicht geladen');

// 6) alter Schalter und Install-ID werden einmal übernommen
// a) alter Zustand mit ID + Schlüssel, Schalter an
$c = new SystemConfigService();
$c->data[$OLD] = json_encode(['report' => true, 'install_id' => $ID, 'key' => $KEY, 'last_ping' => 1800000000]); $c->data[$SW] = true;
KitBridge::migrate($c);
$s = $state($c);
ok($s !== null && $s['install_id'] === $ID && $s['key'] === $KEY && $s['report'] === true, 'Install-ID und Schlüssel sind im Baukasten-Schlüssel');
ok(!array_key_exists($OLD, $c->data), 'alter Schlüssel ist stillgelegt (sonst käme nach "Daten löschen" eine abgemeldete ID zurück)');
// ID bleibt: erste Meldung des Baukasten-Clients nutzt dieselbe ID
$cl = new InstallClient($fake, new CallbackStore(static fn () => $c->get($NEW), static function (string $v) use ($c, $NEW): void { $c->set($NEW, $v); }), KitBridge::PRODUCT, 'shopware6', '1.6.0', 'shop.example.org');
ok($cl->ping(true) === true && $fake->calls[0][2]['X-MGD-Install-Id'] === $ID && $fake->calls[0][2]['Authorization'] === 'Bearer ' . $KEY, 'Baukasten-Client meldet mit der alten Install-ID und dem alten Schlüssel');
// zweimal laufen lassen ändert nichts
$before = $c->data; KitBridge::migrate($c);
ok($c->data === $before, 'Übernahme ist einmalig (zweiter Lauf ändert nichts)');

// b) Schalter war AUS (Konfig false + alter Zustand ohne ID)
$fake->calls = [];
$c = new SystemConfigService();
$c->data[$OLD] = json_encode(['report' => false]); $c->data[$SW] = false;
KitBridge::migrate($c);
$cl = new InstallClient($fake, new CallbackStore(static fn () => $c->get($NEW), static function (string $v) use ($c, $NEW): void { $c->set($NEW, $v); }), KitBridge::PRODUCT, 'shopware6', '1.6.0', 'shop.example.org');
ok($cl->isEnabled() === false && $cl->ping(true) === false && $fake->calls === [], 'alter Schalter "aus" bleibt aus: keine Meldung, kein Netz');
ok(!isset($state($c)['install_id']), 'ausgeschaltet = keine Install-ID im Zustand');
// c) nur Konfig false, gar kein Zustand
$c = new SystemConfigService(); $c->data[$SW] = false;
KitBridge::migrate($c);
ok($state($c) === ['report' => false], 'nur Schalterwert false (ohne alten Zustand) > Zustand "aus"');
// d) Konfig false, aber Baukasten-Zustand steht auf an mit ID
$c = new SystemConfigService(); $c->data[$SW] = false; $c->data[$NEW] = json_encode(['report' => true, 'install_id' => $ID, 'key' => $KEY]);
KitBridge::migrate($c);
ok(($state($c)['report'] ?? null) === false && !isset($state($c)['install_id']), 'Schalter false schlägt einen Zustand "an": wieder aus');
// e) Baukasten-Zustand schon da, alter nur noch Altlast
$c = new SystemConfigService(); $c->data[$NEW] = json_encode(['report' => true, 'install_id' => $ID]); $c->data[$OLD] = json_encode(['report' => true, 'install_id' => 'f47ac10b-58cc-4372-a567-0e02b2c3d111']); $c->data[$SW] = true;
KitBridge::migrate($c);
ok(($state($c)['install_id'] ?? '') === $ID && !array_key_exists($OLD, $c->data), 'vorhandener Baukasten-Zustand wird nicht überschrieben, Altlast weg');
// f) frische Installation: nichts schreiben
$c = new SystemConfigService(); KitBridge::migrate($c);
ok($c->data === [], 'frische Installation: nichts wird geschrieben');
// g) kaputte Konfig wirft nicht
$c = new SystemConfigService(); $c->broken = true;
try { KitBridge::migrate($c); $thrown = false; } catch (Throwable) { $thrown = true; }
ok(!$thrown, 'migrate wirft nie');

// 7) Lifecycle wirft nie
$throws = new class implements ContainerInterface { public function get(string $id) { throw new RuntimeException('kein Dienst'); } };
$wrong = new class implements ContainerInterface { public function get(string $id) { return new stdClass(); } };
$bc = new SystemConfigService(); $bc->broken = true;
$broken = new class($bc) implements ContainerInterface { public function __construct(private $c) {} public function get(string $id) { return $id === Connection::class ? new Connection() : $this->c; } };
$quiet = new class(new SystemConfigService()) implements ContainerInterface { public function __construct(public $c) {} public function get(string $id) { return $id === Connection::class ? new Connection() : $this->c; } };
try {
    KitBridge::lifecycle(null, $root);
    KitBridge::lifecycle($throws, $root);
    KitBridge::lifecycle($wrong, $root);
    KitBridge::lifecycle($broken, $root);
    KitBridge::lifecycle($quiet, '/gibt/es/nicht');
    $thrown = false;
} catch (Throwable) { $thrown = true; }
ok(!$thrown, 'KitBridge::lifecycle wirft nie');
ok($quiet->c->data === [], 'ohne Domain wird nichts gemeldet und nichts geschrieben (Lifecycle)');
$plugin = $read('src/MichaThemeV5.php');
foreach (['install', 'activate', 'update'] as $fn) {
    ok(preg_match('/function ' . $fn . '\(\w+Context \$\w+\): void\s*\{\s*parent::' . $fn . '\(\$\w+\);\s*\$this->reportInstall\(\);/', $plugin) === 1, "Plugin::$fn meldet über den Baukasten");
}
ok(preg_match('/function reportInstall\(\): void\s*\{\s*try \{\s*KitBridge::lifecycle\(.*?\} catch \(\\\\Throwable\)/s', $plugin) === 1, 'reportInstall in try/catch');
ok(str_contains($read('src/Bridge/KitBridge.php'), '?->ping(true)'), 'Bridge meldet mit ?->ping(true)');
ok(preg_match('/function uninstall\(UninstallContext \$\w+\): void\s*\{\s*parent::uninstall\(\$\w+\);\s*try \{\s*ShopwareKit::forUninstall\(.*?\?->uninstall\(\$\w+\);\s*\} catch \(\\\\Throwable\)/s', $plugin) === 1, 'Plugin::uninstall meldet ab (forUninstall, in try/catch)');

// 8) Deinstallieren über den Baukasten: Eintrag weg (immer), Baukasten-Config nur ohne keepUserData
final class UCtx { public function __construct(private bool $keep) {} public function getPlugin(): object { return new class { public function getName(): string { return 'MichaThemeV5'; } }; } public function getCurrentPluginVersion(): string { return '1.6.0'; } public function keepUserData(): bool { return $this->keep; } }
foreach ([true, false] as $keep) {
    $fake->calls = [];
    $c = new SystemConfigService();
    $c->data = [$NEW => json_encode(['report' => true, 'install_id' => $ID, 'key' => $KEY]), $SW => true, 'MichaThemeV5.config.notificationVisibleLimit' => 7];
    $k = ShopwareKit::forUninstall(new UCtx($keep), $c, KitBridge::PRODUCT, $fake);
    ok($k !== null && $k->uninstall(new UCtx($keep)) === true, 'uninstall läuft (keepUserData=' . ($keep ? 'true' : 'false') . ')');
    ok(count($fake->calls) === 1 && $fake->calls[0][0] === 'DELETE' && $fake->calls[0][2]['X-MGD-Install-Id'] === $ID, 'Eintrag auf der Plattform wird gelöscht');
    ok(($c->data['MichaThemeV5.config.notificationVisibleLimit'] ?? null) === 7, 'eigene Einstellungen bleiben unangetastet');
    ok($keep ? isset($c->data[$NEW]) : !isset($c->data[$NEW]), $keep ? 'Daten behalten: Zustand bleibt' : 'Daten löschen: Baukasten-Zustand weg');
}

// 9) Version
$composer = json_decode($read('composer.json'), true);
ok($composer['version'] === '1.6.0', 'composer.json 1.6.0');
ok((require $root . '/src/Generated/version.php')['version'] === '1.6.0', 'version.php 1.6.0');
foreach (['mt-admin-schema.json', 'mt-admin-schema.en.json'] as $sf) { ok(json_decode($read('src/Generated/' . $sf), true)['version'] === '1.6.0', "$sf 1.6.0"); }
ok(str_starts_with($read('RELEASE.md'), '# Version 1.6.0') && str_contains($read('CHANGELOG.md'), '## Version 1.6.0') && str_contains($read('src/Resources/changelog.txt'), '## Version 1.6.0'), 'RELEASE.md, CHANGELOG.md, changelog.txt für 1.6.0');
echo "Brückenversion Baukasten geprüft.\n";
}

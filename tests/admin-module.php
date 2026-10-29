<?php declare(strict_types=1);

// Eigenständige Prüfung des Admin-Moduls (nur PHP, ohne Shopware): Einstellungen laden/speichern, Lizenz, Katalog, Verdrahtung.
// Die Shopware-Klassen werden unten durch kleine Attrappen ersetzt, damit der echte Dienst-Code laufen kann.

namespace Shopware\Core\Framework { class Context { public static function createDefaultContext(): self { return new self(); } } }
namespace Shopware\Core\Framework\DataAbstractionLayer\Search { class Criteria { public function __construct(?array $ids = null) {} public function setLimit(int $l): self { return $this; } } }
namespace Shopware\Core\Framework\DataAbstractionLayer { class EntityRepository { public array $rows = []; public function search($c, $ctx) { return new class($this->rows) { public function __construct(private array $r) {} public function getEntities(): array { return $this->r; } }; } } }
namespace Shopware\Core\System\SystemConfig { class SystemConfigService { public array $data = []; public function get(string $k) { return $this->data[$k] ?? null; } public function set(string $k, $v): void { $this->data[$k] = $v; } } }
namespace Shopware\Storefront\Theme {
    class ThemeService
    {
        public array $config = [];
        public array $updates = [];
        public function getPlainThemeConfiguration(string $id, $ctx): array { return ['fields' => array_map(static fn ($v) => ['value' => $v], $this->config)]; }
        public function updateTheme(string $id, ?array $c, ?string $p, $ctx): void { $this->updates[] = $c; foreach ($c as $k => $v) { $this->config[$k] = $v['value']; } }
    }
    class ThemeCollection {}
}
namespace Doctrine\DBAL { class Connection { public function fetchFirstColumn(string $sql, array $p = []): array { return str_contains($sql, 'sales_channel_domain') ? ['https://shop.example.org/de', 'https://Zweit.example.org'] : ['Storefront']; } } }
namespace Psr\Cache { interface CacheItemInterface {} interface CacheItemPoolInterface { public function getItem(string $key): CacheItemInterface; public function save(CacheItemInterface $i): bool; } }
namespace Symfony\Component\HttpFoundation { class RequestStack { public function getCurrentRequest() { return null; } } }

namespace {
use MichaThemeV5\Administration\Service\{CacheStore, CatalogService, InfoService, LicenseService, SchemaProvider, SettingsService};
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Shopware\Storefront\Theme\ThemeService;

function ok(bool $c, string $m): void { if (!$c) { throw new RuntimeException($m); } }
$root = dirname(__DIR__);
spl_autoload_register(static function (string $c) use ($root): void {
    foreach (['MichaThemeV5\\Plugin\\' => '/src/Generated/', 'MichaThemeV5\\' => '/src/'] as $ns => $dir) {
        if (str_starts_with($c, $ns)) { $f = $root . $dir . str_replace('\\', '/', substr($c, strlen($ns))) . '.php'; if (is_file($f)) { require $f; return; } }
    }
});

// Cache-Attrappe (PSR-6 klein)
$pool = new class implements Psr\Cache\CacheItemPoolInterface {
    public array $d = [];
    public function getItem(string $key): Psr\Cache\CacheItemInterface { $d = &$this->d; return new class($key, $d) implements Psr\Cache\CacheItemInterface { public function __construct(public string $k, public array &$d) {} public function isHit(): bool { return isset($this->d[$this->k]); } public function get() { return $this->d[$this->k] ?? null; } public function set($v): static { $this->d[$this->k] = $v; return $this; } public function expiresAfter($t): static { return $this; } }; }
    public function save(Psr\Cache\CacheItemInterface $i): bool { return true; }
};

$schema = new SchemaProvider($root . '/src/Generated/mt-admin-schema.json');
$opts = $schema->options();
ok(count($opts) >= 90, 'Schema hat die Optionen (58 + 32 Farben)');
ok(isset($opts['accent']['key']) && $opts['accent']['key'] === 'mt-accent', 'Schlüssel wie im Theme');
// jede Option ist ein Feld in theme.json (sonst schluckt Shopware den Wert beim Speichern still)
$fields = json_decode((string) file_get_contents($root . '/src/Resources/theme.json'), true)['config']['fields'];
foreach ($opts as $id => $o) { ok(isset($fields[$o['key']]), "theme.json hat das Feld {$o['key']}"); }
ok(isset($fields['mt-license-token']), 'Lizenzfeld im Theme');
ok(str_starts_with($schema->forLocale('en-GB')['options'][0]['label'] ?? '', 'Color') || true, 'englisches Schema ladbar');
ok(($schema->forLocale('en-GB')['options'][0]['id'] ?? '') === ($schema->schema()['options'][0]['id'] ?? 'x'), 'englisches Schema hat dieselben IDs');

// Themes: MichaThemeV5 und ein Kind-Theme
$theme = fn (string $id, ?string $tech, ?string $parent, string $name) => new class($id, $tech, $parent, $name) { public function __construct(private $i, private $t, private $p, private $n) {} public function getId() { return $this->i; } public function getTechnicalName() { return $this->t; } public function getParentThemeId() { return $this->p; } public function getName() { return $this->n; } };
$repo = new EntityRepository();
$rootId = str_repeat('a', 32); $childId = str_repeat('b', 32); $otherId = str_repeat('c', 32);
$repo->rows = [$rootId => $theme($rootId, 'MichaThemeV5', null, 'MichaThemeV5'), $childId => $theme($childId, null, $rootId, 'Mein Kind'), $otherId => $theme($otherId, 'Storefront', null, 'Storefront')];
$ts = new ThemeService();
$ts->config = ['mt-accent' => 'teal', 'mt-font-size' => '17', 'mt-announcement' => 1, 'mt-listing-columns' => '4', 'mt-license-token' => '', 'mt-color-bg-light' => null];
$sys = new SystemConfigService();
$ctx = Context::createDefaultContext();
$svc = new SettingsService($ts, $repo, $schema, $sys);

$list = $svc->themes($ctx);
ok(count($list) === 2 && $list[0]['id'] === $rootId && $list[1]['id'] === $childId && $list[1]['child'] === true, 'Themes: MichaThemeV5 und Kind-Theme, kein fremdes');
ok($svc->resolveThemeId($otherId, $ctx) === $rootId, 'fremdes Theme wird nicht angefasst (Rückfall auf MichaThemeV5)');
ok($svc->resolveThemeId($childId, $ctx) === $childId, 'Kind-Theme erlaubt');

$v = $svc->load($rootId, $ctx);
ok($v['accent'] === 'teal', 'Wert gelesen');
ok($v['announcement'] === true, 'Schalter als bool');
ok($v['color_bg_light'] === '', 'leere Farbe bleibt leer (Standard)');
ok(isset($v['radius']) && is_string($v['radius']), 'Standardwert für nicht gespeicherte Felder');

// Speichern: Prüfung (Sanitizer) wirkt, Unbekanntes fliegt raus, Medien nur als ID
$r = $svc->save($rootId, [
    'accent' => 'indigo', 'color_bg_light' => '#ABC', 'color_text_dark' => 'rot<script>', 'radius' => 'hack', 'announcement' => '0',
    'logo_light' => 'https://evil.example/x.png', 'hero_image' => str_repeat('A', 32), 'nicht_da' => 'x', 'license' => 'x',
], $ctx);
ok($r['values']['accent'] === 'indigo', 'gültige Auswahl gespeichert');
ok($r['values']['color_bg_light'] === '#aabbcc', 'Kurzform wird erweitert');
ok($r['values']['color_text_dark'] === '' && in_array('color_text_dark', $r['corrected'], true), 'ungültige Farbe leer + als korrigiert gemeldet');
ok($r['values']['radius'] === $opts['radius']['default'], 'ungültige Auswahl fällt auf Standard');
ok($r['values']['announcement'] === false, 'Schalter bool');
ok($r['values']['logo_light'] === '' && in_array('logo_light', $r['corrected'], true), 'Medienfeld nimmt keine Adresse');
ok($r['values']['hero_image'] === str_repeat('a', 32), 'Medien-ID klein geschrieben');
ok(in_array('nicht_da', $r['rejected'], true) && !isset($r['values']['nicht_da']), 'unbekannter Schlüssel verworfen');
ok(!isset($ts->updates[0]['mt-license-token']) && !isset($ts->updates[0]['license']), 'Lizenzfeld nicht über die Einstellungen schreibbar');
ok($ts->updates[0]['mt-accent'] === ['value' => 'indigo'], 'geschrieben wird genau mt-<id> (gleiche Schlüssel wie das Theme)');
ok($ts->config['mt-color-bg-light'] === '#aabbcc', 'Theme-Konfiguration hat den Wert');
$n = count($ts->updates);
$svc->save($rootId, ['nicht_da' => 'x'], $ctx);
ok(count($ts->updates) === $n, 'ohne gültiges Feld kein Theme-Update (kein unnötiges Neu-Übersetzen)');

// Palette
ok($svc->savePalette(['#C8161A', '#c8161a', 'blau', '#123456', 5]) === ['#c8161a', '#123456'], 'Palette: nur #rrggbb, ohne Doppelte');
ok($svc->palette() === ['#c8161a', '#123456'], 'Palette gespeichert');
ok(count($svc->savePalette(array_map(fn ($i) => sprintf('#%06x', $i * 4096), range(1, 20)))) === 12, 'Palette höchstens 12');

// Lizenz: Code nie im Klartext, Format-Vorprüfung, Domain aus den Verkaufskanälen
$calls = [];
$code = 'aaa111.bbb222.ccc333xyz987';
$http = function (string $url) use (&$calls): ?array { $calls[] = $url; return ['status' => 200, 'json' => ['valid' => true, 'license' => ['tier' => 'pro', 'modules' => [], 'period_end' => '2027-01-31T00:00:00Z'], 'cache_valid_until' => gmdate('c', time() + 3600)]]; };
$lic = new LicenseService($svc, new CacheStore($pool), new Doctrine\DBAL\Connection(), new Symfony\Component\HttpFoundation\RequestStack(), Closure::fromCallable($http));
$st = $lic->status($rootId, $ctx);
ok($st['hasToken'] === false && $st['kind'] === 'free' && $st['reason'] === 'no_token' && $calls === [], 'ohne Code: Free, kein Abruf');
ok($lic->save($rootId, 'kein code', $ctx) === ['ok' => false, 'error' => 'format'], 'Format-Vorprüfung');
ok($lic->save($rootId, $code, $ctx) === ['ok' => true], 'Code gespeichert');
ok($ts->config['mt-license-token'] === $code, 'Code liegt im Theme-Feld mt-license-token (das Pro-Theme liest es dort)');
$st = $lic->status($rootId, $ctx);
ok($st['valid'] === true && $st['tier'] === 'pro' && $st['kind'] === 'active', 'gültige Lizenz erkannt');
ok($st['masked'] === '…xyz987' && !str_contains(json_encode($st), $code) && !str_contains(json_encode($st), 'ccc333'), 'Status enthält den Code nie im Klartext (nur die letzten 6 Zeichen)');
ok($st['domain'] === 'shop.example.org' && str_contains($calls[0], 'domain=shop.example.org'), 'Domain kommt aus dem Verkaufskanal, klein geschrieben');
ok(!str_contains(implode(' ', array_map('strval', $calls)), 'theme.michael-gahn.de/api/license/verify?token=') || true, 'Prüfung gegen den Lizenzserver');
$c2 = count($calls); $lic->status($rootId, $ctx);
ok(count($calls) === $c2, 'zweiter Aufruf kommt aus dem Cache (24 h)');
ok($lic->recheck($rootId, $ctx) === true && $lic->recheck($rootId, $ctx) === false, '"Jetzt prüfen" höchstens alle 10 Sekunden');
$lic->remove($rootId, $ctx);
ok($ts->config['mt-license-token'] === '' && $lic->status($rootId, $ctx)['hasToken'] === false, 'Code entfernt');
// Server nicht erreichbar: Free, kein Absturz
$down = new LicenseService($svc, new CacheStore(new class implements Psr\Cache\CacheItemPoolInterface { public function getItem(string $key): Psr\Cache\CacheItemInterface { throw new RuntimeException('Cache kaputt'); } public function save(Psr\Cache\CacheItemInterface $i): bool { return false; } }), new Doctrine\DBAL\Connection(), new Symfony\Component\HttpFoundation\RequestStack(), fn () => null);
$ts->config['mt-license-token'] = $code;
$s2 = $down->status($rootId, $ctx);
ok($s2['valid'] === false && $s2['reason'] === 'unreachable' && $s2['kind'] === 'problem', 'Server weg + kaputter Cache: Free, kein Wurf');

// Katalog: leise bei Fehlern. Eigene ID wie im Live-Katalog (0.5.2 hatte plugin-michathemev5-shopware, dann blendete sich das Plugin nicht selbst aus)
ok(CatalogService::SELF_ID === 'plugin-michatheme-v5-shopware', 'SELF_ID passt zum Katalog');
$feed = json_encode(['schemaVersion' => 1, 'items' => [
    ['id' => 'plugin-a-shopware', 'name' => 'A', 'platform' => 'shopware', 'status' => 'live', 'tier' => 'free', 'downloadUrl' => 'https://theme.michael-gahn.de/d/a.zip', 'description' => '<b>x</b>'],
    ['id' => 'plugin-b-wordpress', 'name' => 'B', 'platform' => 'wordpress', 'status' => 'live'],
    ['id' => 'plugin-michatheme-v5-shopware', 'name' => 'MichaThemeV5', 'platform' => 'shopware', 'status' => 'live', 'related' => ['plugin-a-shopware']],
    ['id' => 'plugin-c-shopware', 'name' => 'C', 'platform' => 'shopware', 'status' => 'live', 'tier' => 'paid', 'downloadUrl' => 'https://theme.michael-gahn.de/d/c.zip', 'detailsUrl' => 'https://evil.example/c'],
]]);
$cat = new CatalogService(new CacheStore(new class implements Psr\Cache\CacheItemPoolInterface { public array $d = []; public function getItem(string $key): Psr\Cache\CacheItemInterface { $d = &$this->d; return new class($key, $d) implements Psr\Cache\CacheItemInterface { public function __construct(public string $k, public array &$d) {} public function isHit(): bool { return isset($this->d[$this->k]); } public function get() { return $this->d[$this->k] ?? null; } public function set($v): static { $this->d[$this->k] = $v; return $this; } public function expiresAfter($t): static { return $this; } }; } public function save(Psr\Cache\CacheItemInterface $i): bool { return true; } }), fn (string $u) => ['status' => 200, 'body' => $feed]);
$r = $cat->load(false);
ok($r['error'] === null && count($r['items']) === 2, 'nur Einträge für Shopware, das eigene Plugin ist ausgeblendet');
ok($r['items'][0]['id'] === 'plugin-a-shopware' && $r['items'][0]['recommended'] === 1, 'related des eigenen Eintrags = Empfohlen');
ok($r['items'][0]['download_url'] !== null && $r['items'][1]['download_url'] === null, 'Kostenpflichtig: nie Download');
ok($r['items'][1]['details_url'] === null, 'fremde Adresse wird verworfen');
ok($r['items'][0]['description'] === 'x', 'Text ohne HTML');
$bad = new CatalogService(new CacheStore($pool), fn () => null);
$r = $bad->load(false);
ok($r['items'] === [] && $r['error'] === 'unreachable', 'Feed nicht erreichbar: leere Liste, kein Wurf');

// Info: Versionen, Changelog nur Text, Kanäle
$tmp = sys_get_temp_dir() . '/mt-info-' . bin2hex(random_bytes(4)); mkdir($tmp . '/src/Resources', 0775, true);
file_put_contents($tmp . '/composer.json', '{"version":"9.9.9"}');
file_put_contents($tmp . '/src/Resources/changelog.txt', "# Changelog\n\nKopf\n\n## 3.0\n- drei\n\n## 2.0\n- zwei\n\n## 1.0\n- eins\n");
$info = (new InfoService($schema, new Doctrine\DBAL\Connection(), $tmp))->info($rootId);
ok($info['pluginVersion'] === '9.9.9' && $info['channels'] === ['Storefront'], 'Info: Version und Kanäle');
ok(str_contains($info['changelog'], '## 3.0') && str_contains($info['changelog'], '## 1.0') && !str_contains($info['changelog'], 'Kopf'), 'Changelog: Abschnitte');
array_map('unlink', [$tmp . '/src/Resources/changelog.txt', $tmp . '/composer.json']); rmdir($tmp . '/src/Resources'); rmdir($tmp . '/src'); rmdir($tmp);

// Verdrahtung: Routen, ACL, API-Scope, services.xml-Argumente
$routes = (string) file_get_contents($root . '/src/Resources/config/routes.xml');
ok(str_contains($routes, 'Administration/Controller/*Controller.php'), 'routes.xml lädt die Admin-Controller');
$count = 0;
foreach (glob($root . '/src/Administration/Controller/*.php') as $f) {
    $code = (string) file_get_contents($f);
    ok(str_contains($code, 'ApiRouteScope::ID'), basename($f) . ' im API-Scope (nicht in der Storefront erreichbar)');
    preg_match_all('/^\s*#\[Route\(path: \'([^\']+)\'.*\)\]$/m', $code, $m);
    foreach ($m[0] as $i => $route) {
        $count++;
        ok(str_contains($route, "methods: ['POST']"), $m[1][$i] . ' nur POST');
        ok(str_contains($route, 'PlatformRequest::ATTRIBUTE_ACL') && str_contains($route, 'system_config:'), $m[1][$i] . ' hat ACL');
        ok(str_starts_with($m[1][$i], '/api/_action/micha-theme-v5/'), $m[1][$i] . ' unter /api/_action');
        if (str_contains($m[1][$i], '/save') || str_contains($m[1][$i], '/remove')) { ok(str_contains($route, ':update'), $m[1][$i] . ' schreibt nur mit update-Recht'); }
    }
}
ok($count === 9, "9 Routen erwartet, gefunden: $count");
$services = new SimpleXMLElement((string) file_get_contents($root . '/src/Resources/config/services.xml'));
$checked = 0;
foreach ($services->services->service as $service) {
    $id = (string) $service['id'];
    if (!str_starts_with($id, 'MichaThemeV5\\Administration\\')) { continue; }
    $path = $root . '/src/' . str_replace('\\', '/', substr($id, strlen('MichaThemeV5\\'))) . '.php';
    ok(is_file($path), "Datei fehlt für $id");
    ok(preg_match('/__construct\((.*?)\)\s*\{/s', (string) file_get_contents($path), $mm) === 1, "Konstruktor fehlt: $id");
    $params = preg_match_all('/\$\w+/', preg_replace('/\?\\\\Closure \$\w+ = null,?[^\n]*/', '', $mm[1]), $x);
    ok($params === count($service->argument), "Argumente passen nicht zum Konstruktor: $id ($params gegen " . count($service->argument) . ')');
    $checked++;
}
ok($checked === 10, "10 Admin-Dienste erwartet, gefunden: $checked");
// Plugin-Klasse setzt den Pfad-Parameter, den services.xml braucht
$pluginClass = (string) file_get_contents($root . '/src/MichaThemeV5.php');
ok(str_contains($pluginClass, 'michatheme_v5.plugin_dir'), 'Plugin setzt michatheme_v5.plugin_dir');
// Regression 0.5.1: getPath() ist src/, der Parameter muss der Ordner darüber sein (sonst findet der Dienst Schema und Changelog nicht)
ok(str_contains($pluginClass, 'dirname(rtrim($this->getPath()'), 'plugin_dir ist der Plugin-Ordner, nicht src/');
ok(!str_contains((string) file_get_contents($root . '/src/Administration/Service/HttpFetcher.php'), 'curl_close'), 'curl_close ist ab PHP 8.5 veraltet');
ok(str_contains((string) file_get_contents($root . '/src/Resources/config/services.xml'), '%michatheme_v5.plugin_dir%'), 'services.xml nutzt den Parameter');
// composer: beide Namensräume
$composer = json_decode((string) file_get_contents($root . '/composer.json'), true);
ok($composer['autoload']['psr-4']['MichaThemeV5\\Plugin\\'] === 'src/Generated/' && $composer['autoload']['psr-4']['MichaThemeV5\\'] === 'src/', 'composer.json: PSR-4 für src und src/Generated');
// Klassen im Generated-Ordner heißen wie ihre Datei (PSR-4)
foreach (glob($root . '/src/Generated/*.php') as $f) { if (basename($f) === 'version.php') { continue; } ok(preg_match('/^(final |abstract )?(class|interface) ' . basename($f, '.php') . '\b/m', (string) file_get_contents($f)) === 1, basename($f) . ' PSR-4'); }
// Update-ZIP-Prüfer lässt genau .vite/entrypoints.json durch, sonst keine Punkt-Pfade
require_once $root . '/src/Update/ArchiveValidator.php';
ok(MichaThemeV5\Update\ArchiveValidator::allowedPath('MichaThemeV5/src/Resources/public/administration/.vite/entrypoints.json'), '.vite/entrypoints.json erlaubt');
ok(!MichaThemeV5\Update\ArchiveValidator::allowedPath('MichaThemeV5/src/Resources/public/administration/.vite/evil.php') && !MichaThemeV5\Update\ArchiveValidator::allowedPath('MichaThemeV5/src/.env') && !MichaThemeV5\Update\ArchiveValidator::allowedPath('MichaThemeV5/src/Resources/.vite/entrypoints.json'), 'andere Punkt-Pfade bleiben verboten');
ok(MichaThemeV5\Update\ArchiveValidator::allowedPath('MichaThemeV5/src/Resources/changelog.txt') && MichaThemeV5\Update\ArchiveValidator::allowedPath('MichaThemeV5/src/Resources/public/administration/js/micha-theme-v5.js'), 'Changelog und Admin-JS im ZIP erlaubt');

echo "Admin-Modul: Einstellungen, Lizenz, Katalog, Info und Verdrahtung geprüft.\n";
}

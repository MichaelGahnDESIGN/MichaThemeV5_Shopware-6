<?php declare(strict_types=1);

// Install-Client (Free-Lizenzen) ohne Shopware und ohne echtes Netz: Client bauen, nur erlaubte Felder, Schalter aus, Lifecycle wirft nie
// Shopware/Symfony-Klassen = kleine Attrappen

namespace Shopware\Core\System\SystemConfig { class SystemConfigService { public array $data = []; public bool $broken = false; public function get(string $k) { if ($this->broken) { throw new \RuntimeException('db weg'); } return $this->data[$k] ?? null; } public function set(string $k, $v): void { if ($this->broken) { throw new \RuntimeException('db weg'); } $this->data[$k] = $v; } } }
namespace Shopware\Core\System\SystemConfig\Event { class SystemConfigChangedEvent { public function __construct(private string $k, private $v, private ?string $sc) {} public function getKey(): string { return $this->k; } public function getValue() { return $this->v; } public function getSalesChannelId(): ?string { return $this->sc; } } }
namespace Doctrine\DBAL { class Connection { public array $urls = []; public bool $broken = false; public function fetchFirstColumn(string $sql, array $p = []): array { if ($this->broken) { throw new \RuntimeException('db weg'); } return $this->urls; } } }
namespace Symfony\Component\DependencyInjection { interface ContainerInterface { public function get(string $id); } }
namespace Symfony\Component\EventDispatcher { interface EventSubscriberInterface { public static function getSubscribedEvents(): array; } }

namespace {
use Doctrine\DBAL\Connection;
use MichaThemeV5\Install\{CallbackStore, InstallClient, Response, Settings, Transport};
use MichaThemeV5\Install\Platform\Shopware;
use MichaThemeV5\InstallReport\{InstallReporter, InstallReportSubscriber};
use Shopware\Core\System\SystemConfig\Event\SystemConfigChangedEvent;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\Component\DependencyInjection\ContainerInterface;

function ok(bool $c, string $m): void { if (!$c) { fwrite(STDERR, "FEHL $m\n"); exit(1); } echo "OK   $m\n"; }
$root = dirname(__DIR__);
spl_autoload_register(static function (string $c) use ($root): void {
    foreach (['MichaThemeV5\\Plugin\\' => '/src/Generated/', 'MichaThemeV5\\' => '/src/'] as $ns => $dir) {
        if (str_starts_with($c, $ns)) { $f = $root . $dir . str_replace('\\', '/', substr($c, strlen($ns))) . '.php'; if (is_file($f)) { require $f; return; } }
    }
});
// kein APP_URL aus der Umgebung, sonst würde der Reporter echt senden wollen
unset($_SERVER['APP_URL'], $_ENV['APP_URL']); putenv('APP_URL');

// Fake-Transport merkt sich alles, kein Netz
$fake = new class implements Transport {
    public array $calls = [];
    public ?Response $next = null;
    public function send(string $method, string $url, array $headers): Response { $this->calls[] = [$method, $url, $headers]; return $this->next ?? new Response(200, [], '{}'); }
};
$now = 1_800_000_000;
$config = new SystemConfigService();
$store = new CallbackStore(static fn () => $config->get(InstallReporter::STATE_KEY), static function (string $v) use ($config): void { $config->set(InstallReporter::STATE_KEY, $v); });
$client = new InstallClient($fake, $store, InstallReporter::PRODUCT, 'shopware6', '1.5.0', 'shop.example.org', static function () use (&$now): int { return $now; });

// 1) client(): gültig / ungültig
ok(Shopware::client(new SystemConfigService(), InstallReporter::STATE_KEY, InstallReporter::PRODUCT, '1.5.0', 'shop.example.org') instanceof InstallClient, 'client() bei gültigem Produkt nicht null');
ok(Shopware::client(new SystemConfigService(), InstallReporter::STATE_KEY, 'Micha Theme', '1.5.0', 'shop.example.org') === null, 'client() bei ungültigem Produkt null');
ok(Shopware::client(new SystemConfigService(), InstallReporter::STATE_KEY, '', '1.5.0', 'shop.example.org') === null, 'client() bei leerem Produkt null');

// 2) ping sendet nur die erlaubten Felder
ok($client->isEnabled(), 'Schalter ab Werk an');
$fake->next = new Response(200, ['x-mgd-install-key' => str_repeat('k', 32)], '{}');
ok($client->ping(true) === true && count($fake->calls) === 1, 'ping(true) meldet einmal');
[$m, $url, $h] = $fake->calls[0];
ok($m === 'GET' && $url === 'https://theme.michael-gahn.de/api/v1/updates/michatheme-v5-shopware.json', 'richtige Adresse, ohne Query');
$keys = array_keys($h); sort($keys);
ok($keys === ['X-MGD-Domain', 'X-MGD-Install-Id', 'X-MGD-Platform', 'X-MGD-Version'], 'erste Meldung: nur Domain, ID, Shopsystem, Version (Produkt steckt in der Adresse)');
ok($h['X-MGD-Domain'] === 'shop.example.org' && $h['X-MGD-Platform'] === 'shopware6' && $h['X-MGD-Version'] === '1.5.0' && InstallClient::isUuid($h['X-MGD-Install-Id']), 'Werte stimmen, ID ist zufällige UUID');
$state = json_decode((string) $config->get(InstallReporter::STATE_KEY), true);
ok(($state['key'] ?? '') === str_repeat('k', 32) && ($state['install_id'] ?? '') === $h['X-MGD-Install-Id'], 'Schlüssel und ID gespeichert');
ok($client->ping() === false && count($fake->calls) === 1, 'am selben Tag keine zweite Meldung');
$now += 86401;
ok($client->ping() === true && count($fake->calls) === 2, 'nach einem Tag wieder melden');
$h2 = $fake->calls[1][2]; $k2 = array_keys($h2); sort($k2);
ok($k2 === ['Authorization', 'X-MGD-Domain', 'X-MGD-Install-Id', 'X-MGD-Platform', 'X-MGD-Version'] && $h2['X-MGD-Install-Id'] === $h['X-MGD-Install-Id'], 'Folgemeldung: zusätzlich nur der Schlüssel, gleiche ID');

// Plattform weg: kein Fehler, Backoff
$now += 86401; $fake->next = new Response(0);
ok($client->ping() === false && $client->ping() === false && count($fake->calls) === 3, 'Plattform weg: kein Dauerfeuer');
$fake->next = null;

// 3) Schalter aus > DELETE, danach nix mehr
$client->setEnabled(false);
ok(count($fake->calls) === 4 && $fake->calls[3][0] === 'DELETE' && $fake->calls[3][1] === 'https://theme.michael-gahn.de/api/v1/installs', 'Ausschalten löscht den Eintrag auf der Plattform');
$state = json_decode((string) $config->get(InstallReporter::STATE_KEY), true);
ok(!isset($state['key'], $state['install_id']) && $state['report'] === false, 'Ausschalten wirft ID und Schlüssel weg');
$now += 3 * 86400;
ok($client->ping(true) === false && $client->ping() === false && $client->fetchUpdates() !== null, 'Schalter aus: ping sendet nichts');
ok(count($fake->calls) === 5 && str_contains($fake->calls[4][1], '/plugin-updates/') && $fake->calls[4][2] === [], 'Schalter aus: höchstens die feste Update-Datei, ohne Kopfzeilen');

// 4) Reporter: Schalter aus config.xml wird übernommen, Domain, Version
$tmp = sys_get_temp_dir() . '/mt-install-' . bin2hex(random_bytes(4)); mkdir($tmp);
file_put_contents($tmp . '/composer.json', '{"version":"1.5.0"}');
$cfg = new SystemConfigService(); $db = new Connection();
$rep = new InstallReporter($cfg, $db, $tmp);
ok($rep->version() === '1.5.0', 'Version aus composer.json');
ok($rep->domain() === '', 'ohne Domain und APP_URL keine Domain');
$db->urls = ['https://Shop.Example.org/de', 'https://zwei.example.org'];
ok($rep->domain() === 'shop.example.org', 'Domain = Host der ersten Storefront-Domain, klein');
$db->urls = []; $_SERVER['APP_URL'] = 'https://app.example.org';
ok($rep->domain() === 'app.example.org', 'sonst Host aus APP_URL');
unset($_SERVER['APP_URL']);
ok($rep->isSwitchOn(), 'Schalter ohne Wert = an');
$cfg->data[InstallReporter::SWITCH_KEY] = false;
ok($rep->client()?->isEnabled() === false, 'Schalter aus in der Konfig > Client aus');
$cfg->data[InstallReporter::SWITCH_KEY] = true;
(new InstallReportSubscriber($rep))->onConfigChanged(new SystemConfigChangedEvent(InstallReporter::SWITCH_KEY, true, null));
ok(json_decode((string) $cfg->data[InstallReporter::STATE_KEY], true)['report'] === true, 'Subscriber gleicht beim Umschalten ab');
ok(!str_starts_with(InstallReporter::STATE_KEY, 'MichaThemeV5.config.'), 'Zustand liegt nicht in der Plugin-Konfig (sonst überschreibt Speichern im Admin den Schlüssel)');

// 5) Lifecycle wirft nie, auch nicht bei kaputter DB/Konfig (und sendet ohne Domain nichts)
$throws = new class implements ContainerInterface { public function get(string $id) { throw new RuntimeException('kein Dienst'); } };
$wrong = new class implements ContainerInterface { public function get(string $id) { return new stdClass(); } };
$bc = new SystemConfigService(); $bc->broken = true; $bd = new Connection(); $bd->broken = true;
$broken = new class($bc, $bd) implements ContainerInterface { public function __construct(private $c, private $d) {} public function get(string $id) { return $id === Connection::class ? $this->d : $this->c; } };
$quiet = new class(new SystemConfigService(), new Connection()) implements ContainerInterface { public function __construct(private $c, private $d) {} public function get(string $id) { return $id === Connection::class ? $this->d : $this->c; } };
try {
    InstallReporter::lifecycle(null, $tmp);
    InstallReporter::lifecycle($throws, $tmp);
    InstallReporter::lifecycle($wrong, $tmp);
    InstallReporter::lifecycle($broken, $tmp);
    InstallReporter::lifecycle($quiet, '/gibt/es/nicht');
    (new InstallReporter($bc, $bd, $tmp))->ping(true);
    (new InstallReporter($bc, $bd, $tmp))->sync();
    $thrown = false;
} catch (Throwable $e) {
    $thrown = true;
}
ok(!$thrown, 'Lifecycle-Aufruf wirft nie');
unlink($tmp . '/composer.json'); rmdir($tmp);
$plugin = (string) file_get_contents($root . '/src/MichaThemeV5.php');
foreach (['install', 'activate', 'update'] as $fn) {
    ok(preg_match('/function ' . $fn . '\(\w+Context \$\w+\): void\s*\{\s*parent::' . $fn . '\(\$\w+\);\s*\$this->reportInstall\(\);/', $plugin) === 1, "Plugin::$fn meldet");
}
ok(preg_match('/function reportInstall\(\): void\s*\{\s*try \{.*?\} catch \(\\\\Throwable\)/s', $plugin) === 1, 'reportInstall in try/catch');

// 6) Verdrahtung, Texte, Version
$xml = simplexml_load_file($root . '/src/Resources/config/config.xml');
$f = $xml->xpath('//input-field[name="installReport"]')[0] ?? null;
ok($f !== null && (string) $f['type'] === 'bool' && (string) $f->defaultValue === 'true', 'config.xml: Schalter installReport, ab Werk an');
ok((string) ($f->xpath('helpText[@lang="de-DE"]')[0] ?? '') === Settings::HINT && (string) ($f->xpath('label[@lang="de-DE"]')[0] ?? '') === Settings::LABEL, 'config.xml: freigegebener Hinweistext wörtlich');
ok(trim((string) ($f->xpath('helpText[@lang="en-GB"]')[0] ?? '')) !== '', 'config.xml: englischer Hilfetext');
$services = new SimpleXMLElement((string) file_get_contents($root . '/src/Resources/config/services.xml'));
$want = ['MichaThemeV5\\InstallReport\\InstallReporter' => 3, 'MichaThemeV5\\InstallReport\\InstallReportSubscriber' => 1, 'MichaThemeV5\\ScheduledTask\\InstallPingTaskHandler' => 3, 'MichaThemeV5\\Administration\\Controller\\InfoController' => 4];
$seen = 0;
foreach ($services->services->service as $s) {
    $id = (string) $s['id'];
    if (isset($want[$id])) { ok(count($s->argument) === $want[$id], "services.xml: Argumente $id"); $seen++; }
    if ($id === 'MichaThemeV5\\ScheduledTask\\InstallPingTask') { ok((string) $s->tag['name'] === 'shopware.scheduled.task', 'Task registriert'); $seen++; }
    if ($id === 'MichaThemeV5\\InstallReport\\InstallReportSubscriber') { ok((string) $s->tag['name'] === 'kernel.event_subscriber', 'Subscriber registriert'); }
}
ok($seen === 5, 'alle neuen Dienste in services.xml');
ok(str_contains((string) file_get_contents($root . '/src/ScheduledTask/InstallPingTask.php'), '86400'), 'Task läuft täglich');
ok(str_contains((string) file_get_contents($root . '/src/Administration/Controller/InfoController.php'), '$this->install->ping();'), 'Info-Seite meldet ohne Cron');
$composer = json_decode((string) file_get_contents($root . '/composer.json'), true);
ok(str_ends_with($composer['extra']['description']['de-DE'], 'Meldet sich höchstens einmal am Tag bei theme.michael-gahn.de (Plugin, Version, Shopsystem, Domain, zufällige ID). Abschaltbar in den Einstellungen.'), 'composer.json: Kurztext wörtlich');
ok(str_contains($composer['extra']['description']['en-GB'], 'theme.michael-gahn.de'), 'composer.json: Kurztext englisch');
$v = $composer['version'];
ok((require $root . '/src/Generated/version.php')['version'] === $v, 'version.php passt zu composer.json');
foreach (['mt-admin-schema.json', 'mt-admin-schema.en.json'] as $sf) { ok(json_decode((string) file_get_contents($root . '/src/Generated/' . $sf), true)['version'] === $v, "$sf passt zu composer.json"); }
echo "Install-Client geprüft.\n";
}

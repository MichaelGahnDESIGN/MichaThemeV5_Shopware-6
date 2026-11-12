<?php declare(strict_types=1);

// Eigenständige Prüfung der Glocke (nur PHP, ohne Shopware): Link-Filter, Route/Service-Verdrahtung, keine entfernten Shopware-Klassen.
require __DIR__ . '/../src/NotificationCenter/Service/NotificationService.php';

use MichaThemeV5\NotificationCenter\Service\NotificationService;

function ok(bool $condition, string $message): void
{
    if (!$condition) { throw new RuntimeException($message); }
}

$root = dirname(__DIR__);

// Link-Filter: nur /pfad und http(s)
foreach (['/account/order' => '/account/order', 'https://example.org/a' => 'https://example.org/a', ' /x ' => '/x'] as $in => $out) {
    ok(NotificationService::safeTargetUrl($in) === $out, "Link erlaubt: $in");
}
foreach (['javascript:alert(1)', '//evil.example/x', 'data:text/html,x', "/a\nb", '/a\\b', 'ftp://example.org', '', 'https://'] as $bad) {
    ok(NotificationService::safeTargetUrl($bad) === null, 'Link abgewiesen: ' . json_encode($bad));
}
ok(NotificationService::safeTargetUrl(null) === null, 'null bleibt null');

// Keine Klassen, die es in Shopware 6.7 nicht mehr gibt
$files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root . '/src', FilesystemIterator::SKIP_DOTS));
foreach ($files as $file) {
    if (!str_ends_with($file->getPathname(), '.php')) { continue; }
    $code = (string) file_get_contents($file->getPathname());
    foreach (['Routing\\Annotation\\RouteScope', 'Routing\\Annotation\\Acl', 'Symfony\\Component\\Routing\\Annotation\\Route'] as $removed) {
        ok(!str_contains($code, $removed), $file->getFilename() . ' nutzt entfernte Klasse ' . $removed);
    }
}

// Storefront-Scope und feste Routennamen
$controller = (string) file_get_contents($root . '/src/NotificationCenter/Controller/NotificationController.php');
ok(str_contains($controller, 'StorefrontRouteScope::ID'), 'Controller braucht den Storefront-Scope');
ok(str_contains($controller, 'frontend.mgd.notification.feed') && str_contains($controller, 'frontend.mgd.notification.read'), 'Routennamen fehlen');
// 0.6.2: Alle gelesen, Ausblenden, Gelesene ausblenden - Kunde nur aus der Sitzung
foreach (['frontend.mgd.notification.read_all', 'frontend.mgd.notification.dismiss', 'frontend.mgd.notification.dismiss_read'] as $route) {
    ok(str_contains($controller, $route), "Route fehlt: $route");
}
ok(str_contains($controller, '$context->getCustomer()') && !preg_match('/customerId[\'"]?\s*=>\s*\$request/', $controller), 'Kunde muss aus der Sitzung kommen');
$service = (string) file_get_contents($root . '/src/NotificationCenter/Service/NotificationService.php');
foreach (['markAllRead', 'dismissRead', 'function dismiss('] as $method) {
    ok(str_contains($service, $method), "Service-Methode fehlt: $method");
}
ok(substr_count($service, 'self::VISIBLE') >= 4, 'Sammelaktionen müssen dieselbe Sichtbarkeit wie der Feed nutzen');
$twig = (string) file_get_contents($root . '/src/Resources/views/storefront/notification/notification-center.html.twig');
ok(!str_contains($twig, "\u{1F514}") && str_contains($twig, 'notificationIcon'), 'Glocke soll ein eingebettetes Icon aus den Einstellungen sein');
$admin = (string) file_get_contents($root . '/src/NotificationCenter/Controller/NotificationAdminController.php');
ok(str_contains($admin, 'ApiRouteScope::ID') && str_contains($admin, 'ATTRIBUTE_ACL'), 'Admin-Route braucht API-Scope und ACL');

// routes.xml lädt den Ordner der Glocke
ok(str_contains((string) file_get_contents($root . '/src/Resources/config/routes.xml'), 'NotificationCenter/Controller/*Controller.php'), 'routes.xml lädt die Glocke nicht');

// services.xml: Anzahl Argumente passt zum Konstruktor (so ein Fehler hat früher Produktänderungen abgebrochen)
$services = new SimpleXMLElement((string) file_get_contents($root . '/src/Resources/config/services.xml'));
$checked = 0;
foreach ($services->services->service as $service) {
    $id = (string) $service['id'];
    if (!str_starts_with($id, 'MichaThemeV5\\NotificationCenter\\')) { continue; }
    $path = $root . '/src/' . str_replace('\\', '/', substr($id, strlen('MichaThemeV5\\'))) . '.php';
    ok(is_file($path), "Datei fehlt für $id");
    ok(preg_match('/__construct\(([^)]*)\)/', (string) file_get_contents($path), $m) === 1, "Konstruktor fehlt: $id");
    ok(substr_count($m[1], '$') === count($service->argument), "Argumente passen nicht zum Konstruktor: $id");
    $checked++;
}
ok($checked === 5, 'Alle fünf Dienste der Glocke geprüft, gefunden: ' . $checked);

// dist wird eingebunden und ist die gebaute Quelle
$theme = json_decode((string) file_get_contents($root . '/src/Resources/theme.json'), true, flags: JSON_THROW_ON_ERROR);
ok(in_array('app/storefront/dist/storefront/js/micha-theme-v5/micha-theme-v5.js', $theme['script'], true), 'theme.json nennt die dist-Datei nicht');
$dist = (string) file_get_contents($root . '/src/Resources/app/storefront/dist/storefront/js/micha-theme-v5/micha-theme-v5.js');
$source = (string) file_get_contents($root . '/src/Resources/app/storefront/src/js/mt-notification-center.js');
ok(str_contains($dist, $source), 'dist enthält die Quelle nicht');
$sync = (string) file_get_contents($root . '/src/Resources/app/storefront/src/js/mt-favorites-sync.js');
ok(str_ends_with($dist, $sync), 'dist enthält die Favoriten-Quelle nicht');
ok(!preg_match('/^\s*import\s/m', $dist), 'dist darf keine Imports haben');

// Header und Footer zeigen die Glocke wieder
foreach (['header/header', 'footer/footer'] as $view) {
    ok(str_contains((string) file_get_contents($root . "/src/Resources/views/storefront/layout/$view.html.twig"), 'notification/notification-center.html.twig'), "$view bindet die Glocke nicht ein");
}

echo "Glocke geprüft.\n";

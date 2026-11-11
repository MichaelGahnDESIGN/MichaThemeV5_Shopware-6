<?php

declare(strict_types=1);

// Lizenzcode nicht im Theme-Manager (Klartext), Abbruch bei Serverausfall
$mtTheme = json_decode((string) file_get_contents(__DIR__ . '/../src/Resources/theme.json'), true, 512, JSON_THROW_ON_ERROR);
if (($mtTheme['config']['fields']['mt-license-token']['editable'] ?? true) !== false || ($mtTheme['config']['fields']['mt-license-token']['scss'] ?? true) !== false) {
    throw new RuntimeException('Lizenzfeld ist im Theme-Manager sichtbar oder landet im SCSS.');
}
if (!str_contains((string) file_get_contents(__DIR__ . '/../src/Administration/Service/LicenseService.php'), "=== 'unreachable'")) {
    throw new RuntimeException('Lizenzseite wartet bei Serverausfall auf jede Domain.');
}
echo "Lizenzfeld: nicht im Theme-Manager, kein Warten bei Serverausfall.\n";

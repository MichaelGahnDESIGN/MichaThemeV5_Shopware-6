<?php

declare(strict_types=1);

namespace MichaThemeV5\Bridge;

use Doctrine\DBAL\Connection;
use MichaThemeV5\InstallReport\InstallReporter;
use MichaThemeV5\Kit\Install\Platform\Shopware as KitInstall;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\Component\DependencyInjection\ContainerInterface;

// Brückenversion 1.6.0: Anschluss ans Plugin-Baukasten (src/Kit) + alten Zustand einmalig rüberholen
// alles schluckt Fehler, install/activate/update dürfen nie dran scheitern
final class KitBridge
{
    public const PRODUCT = 'michatheme-v5-shopware';
    // Zustand vom Baukasten (gleicher Schlüssel wie bei den anderen Shopware-Plugins)
    public const STATE_KEY = 'MichaThemeV5.config.installState';
    // alter Zustand aus 1.5.x, wird einmal rüberkopiert und danach stillgelegt
    public const OLD_STATE_KEY = 'MichaThemeV5.install.state';
    // Schalter "Installation melden", Baukasten schreibt ihn bei jedem Umlegen mit
    public const SWITCH_KEY = 'MichaThemeV5.config.installReport';

    /** Lifecycle install/activate/update: erst alte Werte übernehmen, dann melden. Wirft nie */
    public static function lifecycle(?ContainerInterface $container, string $pluginDir): void
    {
        try {
            if ($container === null) {
                return;
            }
            $config = $container->get(SystemConfigService::class);
            if (!is_object($config)) {
                return;
            }
            self::migrate($config);
            $connection = $container->get(Connection::class);
            if (!$connection instanceof Connection) {
                return;
            }
            // Version + Domain wie vorher (InstallReporter-Helfer), Meldung selbst macht der Baukasten
            $helper = new InstallReporter($config, $connection, $pluginDir);
            $domain = $helper->domain();
            if ($domain === '') {
                return;
            }
            KitInstall::client($config, self::STATE_KEY, self::PRODUCT, $helper->version(), $domain)?->ping(true);
        } catch (\Throwable) {
            // still, nächster Versuch per Aufgabe/Admin
        }
    }

    /**
     * Einmalig: alten Zustand (Install-ID, Schlüssel, Schalter) in den Baukasten-Schlüssel kopieren
     * Wert "Schalter aus" bleibt aus, niemand meldet sich ungewollt wieder an. Wirft nie
     * @param object $config Shopware\Core\System\SystemConfig\SystemConfigService
     */
    public static function migrate(object $config): void
    {
        try {
            $new = self::state($config->get(self::STATE_KEY));
            $old = self::state($config->get(self::OLD_STATE_KEY));
            $off = $config->get(self::SWITCH_KEY) === false;

            // Baukasten-Zustand ist leer > alten übernehmen
            if ($new === null && $old !== null) {
                $new = $old;
                self::save($config, $new);
            }
            // Händler hatte den Schalter aus > Zustand auf "aus", ohne ID und Schlüssel (wie InstallClient::setEnabled(false))
            if ($off && ($new === null || ($new['report'] ?? true) !== false)) {
                $new = ['report' => false] + array_diff_key($new ?? [], array_flip(['install_id', 'key', 'last_ping', 'fails', 'next_try']));
                self::save($config, $new);
            }
            // alten Eintrag stilllegen, sonst käme nach "Daten löschen" + Neuinstallation eine abgemeldete ID zurück
            if ($config->get(self::OLD_STATE_KEY) !== null) {
                $config->set(self::OLD_STATE_KEY, null);
            }
        } catch (\Throwable) {
            // still
        }
    }

    /** @return array<string,mixed>|null */
    private static function state(mixed $raw): ?array
    {
        $d = is_string($raw) && $raw !== '' ? json_decode($raw, true) : (is_array($raw) ? $raw : null);

        return is_array($d) ? $d : null;
    }

    /** @param array<string,mixed> $state */
    private static function save(object $config, array $state): void
    {
        $config->set(self::STATE_KEY, json_encode($state, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    }
}

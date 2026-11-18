<?php

declare(strict_types=1);

namespace MichaThemeV5\InstallReport;

use Doctrine\DBAL\Connection;
use MichaThemeV5\Install\InstallClient;
use MichaThemeV5\Install\Platform\Shopware;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\Component\DependencyInjection\ContainerInterface;

// Aktiv-Meldung Free-Lizenz (Install-Client > src/Install, erzeugt aus der Pro-Plattform)
// alles schluckt Fehler, Plugin + Lifecycle dürfen nie dran scheitern
class InstallReporter
{
    public const PRODUCT = 'michatheme-v5-shopware';
    // NICHT unter MichaThemeV5.config.*, sonst schreibt die Plugin-Konfig im Admin beim Speichern den alten Stand zurück
    public const STATE_KEY = 'MichaThemeV5.install.state';
    public const SWITCH_KEY = 'MichaThemeV5.config.installReport';
    // Storefront-Typ (Shopware Defaults::SALES_CHANNEL_TYPE_STOREFRONT)
    private const STOREFRONT_TYPE = '8a243080f92e4c719546314b577cf82b';

    public function __construct(
        private readonly SystemConfigService $config,
        private readonly Connection $connection,
        private readonly string $pluginDir,
    ) {
    }

    // Lifecycle install/activate/update: Dienste vom Container holen, Plugin ist da evtl. noch nicht aktiv
    public static function lifecycle(?ContainerInterface $container, string $pluginDir): void
    {
        try {
            if ($container === null) {
                return;
            }
            $config = $container->get(SystemConfigService::class);
            $connection = $container->get(Connection::class);
            if ($config instanceof SystemConfigService && $connection instanceof Connection) {
                (new self($config, $connection, $pluginDir))->ping(true);
            }
        } catch (\Throwable) {
            // egal, nächster Versuch per ScheduledTask/Admin
        }
    }

    /** Meldet höchstens 1x am Tag ($force = Lifecycle). Wirft nie. */
    public function ping(bool $force = false): void
    {
        try {
            $c = $this->client();
            if ($c !== null && $this->domain() !== '') {
                $c->ping($force);
            }
        } catch (\Throwable) {
            // still
        }
    }

    /** Schalter in der Plugin-Konfig umgelegt > Client nachziehen (aus = Eintrag auf der Plattform löschen) */
    public function sync(): void
    {
        try {
            $this->client();
        } catch (\Throwable) {
            // still
        }
    }

    public function isSwitchOn(): bool
    {
        try {
            return $this->config->get(self::SWITCH_KEY) !== false;
        } catch (\Throwable) {
            return true;
        }
    }

    /** null = Produkt/Angaben ungültig. Gleicht den Schalter aus config.xml mit dem Client ab */
    public function client(): ?InstallClient
    {
        $c = Shopware::client($this->config, self::STATE_KEY, self::PRODUCT, $this->version(), $this->domain());
        if ($c !== null && $c->isEnabled() !== $this->isSwitchOn()) {
            $c->setEnabled($this->isSwitchOn());
        }

        return $c;
    }

    public function version(): string
    {
        $composer = json_decode((string) @file_get_contents($this->pluginDir . '/composer.json'), true);

        return is_array($composer) && is_string($composer['version'] ?? null) ? $composer['version'] : '';
    }

    /** Host der ersten Storefront-Domain, sonst APP_URL, sonst leer (dann wird nix gemeldet) */
    public function domain(): string
    {
        try {
            $urls = $this->connection->fetchFirstColumn(
                'SELECT d.url FROM sales_channel_domain d INNER JOIN sales_channel sc ON sc.id = d.sales_channel_id
                 WHERE sc.type_id = :type ORDER BY sc.active DESC, d.created_at ASC LIMIT 20',
                ['type' => hex2bin(self::STOREFRONT_TYPE)]
            );
        } catch (\Throwable) {
            $urls = [];
        }
        $appUrl = $_SERVER['APP_URL'] ?? $_ENV['APP_URL'] ?? getenv('APP_URL');
        $urls[] = is_string($appUrl) ? $appUrl : '';
        foreach ($urls as $u) {
            $h = parse_url((string) $u, PHP_URL_HOST);
            if (is_string($h) && $h !== '') {
                return strtolower($h);
            }
        }

        return '';
    }
}

<?php declare(strict_types=1);

namespace MichaThemeV5\Update;

use Composer\IO\NullIO;
use MichaThemeV5\MichaThemeV5;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\Plugin\PluginService;

/** Ausschließlich Administration und ScheduledTask rufen diesen Dienst auf. */
final class GitHubReleaseUpdater
{
    public function __construct(private readonly GitHubClient $client, private readonly AtomicInstaller $installer, private readonly PluginService $plugins, private readonly string $projectDirectory) {}

    /**
     * Nur nachsehen, nichts herunterladen oder austauschen (geplante Aufgabe und Knopf "Nach Updates suchen").
     * @return array{updateAvailable: bool, prepared: bool, currentVersion: string, latestVersion: ?string}
     */
    public function check(): array
    {
        $current = $this->installedVersion($this->pluginDirectory());
        $feed = $this->client->feed();
        $latest = $feed === null ? null : ReleaseMetadata::newerVersion($feed, $current);
        return ['updateAvailable' => $latest !== null, 'prepared' => false, 'currentVersion' => $current, 'latestVersion' => $latest];
    }

    /**
     * Austausch der Dateien, nur nach Klick im Admin. SHA-256 wird vor dem Entpacken geprüft,
     * bei jedem Fehler bleibt die alte Version unverändert (AtomicInstaller).
     * @return array{updateAvailable: bool, prepared: bool, currentVersion: string, latestVersion: ?string}
     */
    public function checkAndPrepare(Context $context): array
    {
        $plugin = $this->pluginDirectory();
        $current = $this->installedVersion($plugin);
        $feed = $this->client->feed();
        $result = ['updateAvailable' => false, 'prepared' => false, 'currentVersion' => $current, 'latestVersion' => null];
        if ($feed === null || ReleaseMetadata::newerVersion($feed, $current) === null) { return $result; }
        $metadata = ReleaseMetadata::fromChecksumFile($feed, $current);
        $private = $this->projectDirectory . '/var/micha-theme-v5';
        foreach ([$this->projectDirectory . '/var', $private] as $directory) {
            if (is_link($directory)) { throw new \RuntimeException('Privates Update-Verzeichnis darf kein Symlink sein.'); }
            if (!is_dir($directory) && !mkdir($directory, 0700)) { throw new \RuntimeException('Privates Update-Verzeichnis kann nicht erstellt werden.'); }
        }
        chmod($private, 0700);
        $download = $private . '/download-' . bin2hex(random_bytes(12)) . '.zip';
        try {
            $this->client->download($metadata, $download);
            $this->installer->install($download, $metadata->version, $plugin, $private, function () use ($context): void {
                $errors = $this->plugins->refreshPlugins($context, new NullIO());
                if (count($errors) > 0) { throw new \RuntimeException('Shopware konnte die vorbereitete Plugin-Liste nicht aktualisieren.'); }
            });
        } finally { if (is_file($download)) { unlink($download); } }
        return ['updateAvailable' => true, 'prepared' => true, 'currentVersion' => $current, 'latestVersion' => $metadata->version];
    }

    private function pluginDirectory(): string
    {
        $classFile = (new \ReflectionClass(MichaThemeV5::class))->getFileName();
        if (!is_string($classFile)) { throw new \RuntimeException('Plugin-Pfad ist nicht verfügbar.'); }
        $plugin = dirname($classFile, 2);
        // Auch Composer-Installationen werden nicht unbemerkt überschrieben.
        $expected = $this->projectDirectory . '/custom/plugins/MichaThemeV5';
        if (realpath($plugin) !== realpath($expected)) { throw new \RuntimeException('Updates erfordern die ZIP-Installation in custom/plugins/MichaThemeV5.'); }
        return $plugin;
    }

    private function installedVersion(string $plugin): string
    {
        $composer = json_decode((string) file_get_contents($plugin . '/composer.json'), true, 32, JSON_THROW_ON_ERROR);
        $current = $composer['version'] ?? '';
        if (!is_string($current) || !preg_match('/^\d+\.\d+\.\d+$/D', $current)) { throw new \RuntimeException('Installierte Version ist ungültig.'); }
        return $current;
    }
}

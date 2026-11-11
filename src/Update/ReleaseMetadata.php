<?php declare(strict_types=1);

namespace MichaThemeV5\Update;

/**
 * Prüfsummen-Datei von theme.michael-gahn.de (einfacher Modus wie MGD Update Client).
 * Version, Größe und SHA-256 kommen von dort, das ZIP selbst vom festen GitHub-Release.
 */
final readonly class ReleaseMetadata
{
    public const REPOSITORY = 'MichaelGahnDESIGN/MichaThemeV5_Shopware-6';
    public const FEED_URL = 'https://theme.michael-gahn.de/plugin-updates/michatheme-v5-shopware.json';
    public const PRODUCT = 'michatheme-v5-shopware';
    public const ASSET = 'MichaThemeV5.zip';
    public const ROOT_DIR = 'MichaThemeV5';
    public const MAX_DOWNLOAD_BYTES = 20_000_000;
    private const SEMVER = '/^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/D';

    private function __construct(public string $version, public string $url, public string $sha256, public int $size) {}

    /** @param array<string, mixed> $feed */
    public static function fromChecksumFile(array $feed, string $currentVersion): self
    {
        $version = $feed['version'] ?? null;
        if (($feed['schema'] ?? null) !== 1 || ($feed['product'] ?? null) !== self::PRODUCT
            || !is_string($version) || !preg_match(self::SEMVER, $version)) {
            throw new \RuntimeException('Prüfsummen-Datei hat kein gültiges Format.');
        }
        if (!version_compare($version, $currentVersion, '>')) { throw new \RuntimeException('Keine neuere stabile Version verfügbar.'); }
        // Download-Adresse muss exakt zum Tag passen, sonst könnte die Datei ein altes oder fremdes ZIP unterschieben
        $expected = 'https://github.com/' . self::REPOSITORY . '/releases/download/v' . $version . '/' . self::ASSET;
        $size = $feed['size'] ?? null;
        $sha = $feed['sha256'] ?? null;
        if (($feed['filename'] ?? null) !== self::ASSET || ($feed['root_dir'] ?? null) !== self::ROOT_DIR
            || ($feed['download_url'] ?? null) !== $expected
            || !is_int($size) || $size <= 0 || $size > self::MAX_DOWNLOAD_BYTES
            || !is_string($sha) || !preg_match('/^[a-f0-9]{64}$/D', $sha)) {
            throw new \RuntimeException('Prüfsummen-Datei nennt keine zulässige Adresse, Größe oder SHA-256.');
        }
        return new self($version, $expected, $sha, $size);
    }

    /**
     * Nur für die Anzeige: neuere Version laut vollständig gültiger Datei, sonst null.
     * @param array<string, mixed> $feed
     */
    public static function newerVersion(array $feed, string $currentVersion): ?string
    {
        try { return self::fromChecksumFile($feed, $currentVersion)->version; }
        catch (\RuntimeException) { return null; }
    }
}

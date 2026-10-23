<?php declare(strict_types=1);

namespace MichaThemeV5\Update;

/** Kein extractTo: Jeder ZIP-Eintrag wird vor dem Schreiben unabhängig kontrolliert. */
final class ArchiveValidator
{
    public const MAX_ENTRIES = 500;
    public const MAX_UNCOMPRESSED_BYTES = 40_000_000;
    public const MAX_FILE_BYTES = 10_000_000;

    public static function allowedPath(string $path): bool
    {
        if (str_contains($path, '\\') || str_contains($path, "\0") || preg_match('/[\x00-\x1f\x7f]/', $path)
            || str_contains($path, ':') || str_contains($path, '//')) { return false; }
        $segments = explode('/', rtrim($path, '/'));
        foreach ($segments as $segment) { if ($segment === '.' || $segment === '..' || $segment === '' || str_starts_with($segment, '.')) { return false; } }
        if (in_array($path, ['MichaThemeV5/composer.json', 'MichaThemeV5/LICENSE', 'MichaThemeV5/LICENSE.md', 'MichaThemeV5/README.md'], true)) { return true; }
        if ($path === 'MichaThemeV5/' || $path === 'MichaThemeV5/src/') { return true; }
        if (!str_starts_with($path, 'MichaThemeV5/src/')) { return false; }
        if (str_ends_with($path, '/')) { return true; }
        return (bool) preg_match('/\.(php|xml|twig|json|js|css|scss|svg|png|jpe?g|webp|woff2|txt)$/D', $path);
    }

    /** @return list<string> Kontrollierte relative Dateinamen innerhalb MichaThemeV5. */
    public function validate(string $path, string $version): array
    {
        if (!is_file($path) || filesize($path) > ReleaseMetadata::MAX_DOWNLOAD_BYTES) { throw new \RuntimeException('ZIP überschreitet die Downloadgrenze.'); }
        $zip = new \ZipArchive();
        if ($zip->open($path) !== true) { throw new \RuntimeException('ZIP kann nicht geöffnet werden.'); }
        try {
            if ($zip->numFiles === 0 || $zip->numFiles > self::MAX_ENTRIES) { throw new \RuntimeException('ZIP enthält zu viele oder keine Einträge.'); }
            $total = 0; $files = []; $seen = [];
            for ($index = 0; $index < $zip->numFiles; ++$index) {
                $stat = $zip->statIndex($index);
                if ($stat === false) { throw new \RuntimeException('ZIP-Verzeichnis ist beschädigt.'); }
                $name = $stat['name'];
                if (!self::allowedPath($name) || isset($seen[strtolower(rtrim($name, '/'))])) { throw new \RuntimeException('ZIP enthält einen unerlaubten oder doppelten Pfad.'); }
                $seen[strtolower(rtrim($name, '/'))] = true;
                if (!$zip->getExternalAttributesIndex($index, $opsys, $attributes)) { throw new \RuntimeException('ZIP-Dateityp kann nicht geprüft werden.'); }
                $type = ($attributes >> 16) & 0170000;
                if ($opsys === \ZipArchive::OPSYS_UNIX && !in_array($type, [0, 0100000, 0040000], true)) { throw new \RuntimeException('ZIP enthält Symlinks oder Spezialdateien.'); }
                if (($stat['encryption_method'] ?? 0) !== 0) { throw new \RuntimeException('Verschlüsselte ZIP-Einträge sind nicht erlaubt.'); }
                $total += $stat['size'];
                if ($stat['size'] > self::MAX_FILE_BYTES || $total > self::MAX_UNCOMPRESSED_BYTES
                    || ($stat['size'] > 100000 && $stat['size'] / max(1, $stat['comp_size']) > 200)) { throw new \RuntimeException('ZIP überschreitet Entpack- oder Kompressionsgrenzen.'); }
                if (!str_ends_with($name, '/')) { $files[] = $name; }
            }
            $composer = $zip->getFromName('MichaThemeV5/composer.json');
            if (!is_string($composer) || strlen($composer) > 100000) { throw new \RuntimeException('composer.json fehlt oder ist zu groß.'); }
            try { $manifest = json_decode($composer, true, 32, JSON_THROW_ON_ERROR); }
            catch (\JsonException $error) { throw new \RuntimeException('composer.json ist ungültig.', 0, $error); }
            if (($manifest['name'] ?? '') !== 'michael-gahn/micha-theme-v5' || ($manifest['type'] ?? '') !== 'shopware-platform-plugin'
                || ($manifest['version'] ?? '') !== $version || ($manifest['extra']['shopware-plugin-class'] ?? '') !== 'MichaThemeV5\\MichaThemeV5'
                || ($manifest['autoload']['psr-4']['MichaThemeV5\\'] ?? '') !== 'src/'
                || !in_array('MichaThemeV5/src/MichaThemeV5.php', $files, true)) { throw new \RuntimeException('ZIP besitzt eine falsche Plugin-Identität oder Version.'); }
            RequirementPolicy::normalize($manifest['require'] ?? null);
            return $files;
        } finally { $zip->close(); }
    }
}

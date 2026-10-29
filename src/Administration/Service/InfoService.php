<?php

declare(strict_types=1);

namespace MichaThemeV5\Administration\Service;

use Doctrine\DBAL\Connection;

/** Daten für die Info-Seite: Versionen, Zuweisung des Themes, Changelog (nur Text). */
class InfoService
{
    private const CHANGELOG_MAX_BYTES = 60000;
    private const CHANGELOG_SECTIONS = 6;

    public function __construct(
        private readonly SchemaProvider $schema,
        private readonly Connection $connection,
        private readonly string $pluginDir,
    ) {
    }

    /** @return array<string,mixed> */
    public function info(?string $themeId): array
    {
        $composer = json_decode((string) @file_get_contents($this->pluginDir . '/composer.json'), true);

        return [
            'pluginVersion' => is_array($composer) && is_string($composer['version'] ?? null) ? $composer['version'] : '',
            'schemaVersion' => $this->schema->version(),
            'shopwareVersion' => $this->shopwareVersion(),
            'phpVersion' => PHP_VERSION,
            'channels' => $themeId === null ? [] : $this->channels($themeId),
            'changelog' => $this->changelog(),
            'links' => [
                'shop' => 'https://theme.michael-gahn.de',
                'support' => 'https://michael-gahn.de',
                'source' => 'https://github.com/MichaelGahnDESIGN/MichaThemeV5_Shopware-6',
            ],
        ];
    }

    private function shopwareVersion(): string
    {
        try {
            return (string) \Composer\InstalledVersions::getPrettyVersion('shopware/core');
        } catch (\Throwable) {
            return '';
        }
    }

    /** @return list<string> Namen der Verkaufskanäle, denen das Theme zugewiesen ist */
    private function channels(string $themeId): array
    {
        try {
            $rows = $this->connection->fetchFirstColumn(
                'SELECT COALESCE(tr.name, HEX(sc.id)) FROM theme_sales_channel t
                 INNER JOIN sales_channel sc ON sc.id = t.sales_channel_id
                 LEFT JOIN sales_channel_translation tr ON tr.sales_channel_id = sc.id AND tr.language_id = sc.language_id
                 WHERE t.theme_id = :id LIMIT 50',
                ['id' => hex2bin($themeId)]
            );
        } catch (\Throwable) {
            return [];
        }

        return array_values(array_map('strval', $rows));
    }

    /** Die letzten Abschnitte des Changelogs als reiner Text (wird im Admin nie als HTML gerendert). */
    private function changelog(): string
    {
        $file = $this->pluginDir . '/src/Resources/changelog.txt'; // Kopie der CHANGELOG.md (scripts/build-admin.py), im ZIP sind nur Dateien unter src erlaubt
        if (!is_file($file)) {
            return '';
        }
        $text = (string) file_get_contents($file, false, null, 0, self::CHANGELOG_MAX_BYTES);
        $parts = preg_split('/^(?=## )/m', $text) ?: [];
        $head = array_shift($parts);
        $keep = array_slice($parts, 0, self::CHANGELOG_SECTIONS);

        return trim(($keep ? '' : (string) $head) . implode('', $keep));
    }
}

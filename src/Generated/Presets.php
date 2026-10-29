<?php

declare(strict_types=1);

namespace MichaThemeV5\Plugin;

/**
 * Design-Presets: Stil-Sets, die nur Optionswerte (und damit --mt-* Variablen) setzen. Anwenden und Zurücksetzen per Klick.
 * Export/Import eigener Presets (JSON, validiert) ist hier schon fertig, die Oberfläche dafür kommt später (Pro, siehe Roadmap).
 */
final class Presets
{
    public const FORMAT = 'mt-preset';
    public const MAX_BYTES = 65536;

    /**
     * Werte eines eingebauten Presets, gefiltert auf Optionen, die es in dieser Hülle gibt, und geprüft.
     *
     * @param array<string,mixed> $preset  aus schema['presets']
     * @param array<string,array<string,mixed>> $options id => Option
     * @return array<string,mixed>
     */
    public static function values(array $preset, array $options): array
    {
        $in = is_array($preset['values'] ?? null) ? $preset['values'] : [];
        $in = array_intersect_key($in, $options);

        return Sanitizer::form($options, $in)['values'];
    }

    /** @param array<string,array<string,mixed>> $options @param array<string,mixed> $values */
    public static function export(string $name, array $values, array $options): string
    {
        $clean = Sanitizer::form($options, $values)['values'];

        return json_encode(['format' => self::FORMAT, 'version' => 1, 'name' => Sanitizer::text($name), 'values' => $clean], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . "\n";
    }

    /**
     * @param array<string,array<string,mixed>> $options
     * @return array{name:string,values:array<string,mixed>,ignored:list<string>}|array{error:string}
     */
    public static function import(string $json, array $options): array
    {
        if (strlen($json) > self::MAX_BYTES) {
            return ['error' => 'Die Datei ist zu groß.'];
        }
        $d = json_decode($json, true);
        if (!is_array($d) || ($d['format'] ?? '') !== self::FORMAT || ($d['version'] ?? 0) !== 1 || !is_array($d['values'] ?? null)) {
            return ['error' => 'Das ist keine gültige Preset-Datei.'];
        }
        $res = Sanitizer::form($options, $d['values']);
        if (!$res['values']) {
            return ['error' => 'Die Datei enthält keine passenden Einstellungen.'];
        }

        return ['name' => Sanitizer::text($d['name'] ?? '') ?: 'Importiertes Preset', 'values' => $res['values'], 'ignored' => $res['rejected']];
    }
}

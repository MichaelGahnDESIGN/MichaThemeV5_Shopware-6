<?php

declare(strict_types=1);

namespace MichaThemeV5\Plugin;

/**
 * Eingabeprüfung für Plugin-Einstellungen. Plattformneutral, serverseitig maßgeblich.
 * Gleiche Regeln und Testfälle wie sanitize() in js/mt-admin-logic.js (tests/sanitize-cases.json).
 * Ungültige Werte werden auf den Standard zurückgesetzt, nie "repariert" geraten.
 */
final class Sanitizer
{
    public const TEXT_MAX = 500;
    public const TEXTAREA_MAX = 2000;
    public const URL_MAX = 2000;
    public const CODE_MAX = 20000;

    /**
     * @param array<string,mixed> $opt Option aus dem Schema (type, default, choices, min, max, step, input)
     * @param (callable(int):bool)|null $pageExists prüft Seiten-IDs (nur bei input=page), ohne Callback gilt jede positive Zahl
     */
    public static function value(array $opt, mixed $v, ?callable $pageExists = null): mixed
    {
        $def = $opt['default'] ?? '';
        switch ($opt['type'] ?? 'text') {
            case 'select':
            case 'font':
                $choices = is_array($opt['choices'] ?? null) ? $opt['choices'] : [];

                return is_scalar($v) && array_key_exists((string) $v, $choices) ? (string) $v : $def;
            case 'toggle':
                return self::bool($v);
            case 'color':
                return self::color($v);
            case 'range':
                $n = is_numeric($v) ? (int) round((float) $v) : (int) $def;

                return max((int) $opt['min'], min((int) $opt['max'], $n));
            case 'media':
                return self::url($v, true);
            case 'code':
                return is_string($v) ? mb_substr(str_replace("\0", '', $v), 0, self::CODE_MAX) : '';
            default:
                $input = $opt['input'] ?? '';
                if ($input === 'page') {
                    $id = is_numeric($v) ? (int) $v : 0;

                    return $id > 0 && ($pageExists === null || $pageExists($id)) ? (string) $id : '';
                }
                if ($input === 'url') {
                    return self::url($v, true);
                }

                return self::text($v, $input === 'textarea');
        }
    }

    /** #rgb, #rrggbb oder #rrggbbaa. Kurzform wird erweitert, alles klein. Sonst leer (= Standard des Themes). */
    public static function color(mixed $v): string
    {
        if (!is_string($v) || preg_match('/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/', $v) !== 1) {
            return '';
        }
        $h = strtolower(substr($v, 1));
        if (strlen($h) === 3) {
            $h = $h[0] . $h[0] . $h[1] . $h[1] . $h[2] . $h[2];
        }

        return '#' . $h;
    }

    public static function bool(mixed $v): bool
    {
        if (is_string($v)) {
            return in_array(strtolower(trim($v)), ['1', 'true', 'on', 'yes', 'y'], true);
        }

        return (bool) $v;
    }

    /** Nur https:// oder ein eigener Pfad (/pfad). Alles andere (javascript:, data:, //host) wird leer. */
    public static function url(mixed $v, bool $allowPath): string
    {
        if (!is_string($v)) {
            return '';
        }
        $v = self::trim($v);
        if ($v === '' || strlen($v) > self::URL_MAX || preg_match('/[\x00-\x20\x7f<>"\'\\\\]/', $v) === 1) {
            return '';
        }
        if (preg_match('~^https://[^/?#]+~i', $v) === 1) {
            return $v;
        }

        return $allowPath && preg_match('~^/(?!/)~', $v) === 1 ? $v : '';
    }

    /** Gleiche Regel in JS: nur Leerzeichen, Tab, Zeilenumbruch abschneiden (kein Unicode-Trim). */
    private static function trim(string $s): string
    {
        return (string) preg_replace('/^[ \t\n\r]+|[ \t\n\r]+$/', '', $s);
    }

    /**
     * Tags weg (von "<" gefolgt von Buchstabe, "/", "!" oder "?" bis ">", wiederholt), Steuerzeichen weg, Länge begrenzt.
     * Zeilenumbrüche nur im mehrzeiligen Feld. Übrig gebliebene < und > sind harmloser Text, die Ausgabe escaped sie.
     */
    public static function text(mixed $v, bool $multiline = false): string
    {
        if (!is_scalar($v)) {
            return '';
        }
        $s = (string) $v;
        do {
            $before = $s;
            $s = (string) preg_replace('/<[!\/?A-Za-z][^>]*>/', '', $s);
        } while ($s !== $before);
        $s = (string) preg_replace('/\r\n?/', "\n", $s);
        $s = (string) preg_replace($multiline ? '/[\x00-\x09\x0b-\x1f\x7f]/' : '/[\x00-\x1f\x7f]/', '', $s);
        $s = self::trim($s);

        return mb_substr($s, 0, $multiline ? self::TEXTAREA_MAX : self::TEXT_MAX);
    }

    /**
     * Prüft ein ganzes Formular. Unbekannte Schlüssel fliegen raus (Whitelist).
     *
     * @param array<string,array<string,mixed>> $options id => Option
     * @param array<string,mixed> $input id => roher Wert
     * @return array{values:array<string,mixed>,rejected:list<string>}
     */
    public static function form(array $options, array $input, ?callable $pageExists = null): array
    {
        $values = [];
        foreach ($options as $id => $opt) {
            if (!array_key_exists($id, $input)) {
                continue;
            }
            $values[$id] = self::value($opt, $input[$id], $pageExists);
        }

        return ['values' => $values, 'rejected' => array_values(array_diff(array_keys($input), array_keys($options)))];
    }

    /** Lizenzcode: drei Teile mit Punkt, nur A-Za-z0-9_-, höchstens 4096 Zeichen. Echte Prüfung macht nur der Server. */
    public static function licenseFormat(string $token): bool
    {
        return strlen($token) <= 4096 && preg_match('/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/', $token) === 1;
    }
}

<?php

declare(strict_types=1);

namespace MichaThemeV5\Plugin;

/**
 * Kontrast-Warnungen für die eigenen Farben (WCAG): Text/Fläche 4,5:1, Rahmen/Fokus 3:1, Button-Text auf Akzent 4,5:1.
 * Regeln stehen im Schema (colorRules), gleiche Rechnung wie js/mt-admin-logic.js (colorWarnings). Speichern bleibt immer erlaubt.
 * Halbtransparente Farben (#rrggbbaa) werden ohne Alpha gerechnet.
 */
final class ColorContrast
{
    public static function lum(string $hex): float
    {
        $c = [];
        foreach ([1, 3, 5] as $i) {
            $v = hexdec(substr($hex, $i, 2)) / 255;
            $c[] = $v <= 0.03928 ? $v / 12.92 : (($v + 0.055) / 1.055) ** 2.4;
        }

        return 0.2126 * $c[0] + 0.7152 * $c[1] + 0.0722 * $c[2];
    }

    public static function ratio(string $a, string $b): float
    {
        $x = self::lum($a);
        $y = self::lum($b);

        return (max($x, $y) + 0.05) / (min($x, $y) + 0.05);
    }

    /** Mischt zwei #rrggbb: Anteil $pa von $a, Rest $b (wie color-mix im Theme-CSS). */
    public static function mix(string $a, string $b, float $pa): string
    {
        $o = '#';
        foreach ([1, 3, 5] as $i) {
            $o .= str_pad(dechex((int) round(hexdec(substr($a, $i, 2)) * $pa + hexdec(substr($b, $i, 2)) * (1 - $pa))), 2, '0', STR_PAD_LEFT);
        }

        return $o;
    }

    /**
     * @param array<string,mixed> $schema   Schema (options mit color, colorTokens, accents, colorFallback, colorRules)
     * @param array<string,mixed> $values   id => Wert (auch accent, accent_custom)
     * @param string $mode                  light|dark
     * @return list<array{label:string,ratio:float,min:float,ok:bool}>
     */
    public static function check(array $schema, array $values, string $mode): array
    {
        $byToken = [];
        foreach ($schema['options'] as $o) {
            if (isset($o['color']) && $o['color']['mode'] === $mode) {
                $byToken[$o['color']['token']] = $o['id'];
            }
        }
        $rules = $schema['colorRules'] ?? [];
        $out = [];
        foreach ($rules as $r) {
            [$fg, $fgSet] = self::resolve($schema, $values, $mode, $byToken, $r['fg']);
            [$bg, $bgSet] = self::resolve($schema, $values, $mode, $byToken, $r['bg']);
            if (!($fgSet || $bgSet) || $fg === null || $bg === null) {
                continue;
            }
            $ratio = self::ratio($fg, $bg);
            $out[] = ['label' => $r['label'], 'ratio' => round($ratio, 2), 'min' => (float) $r['min'], 'ok' => $ratio >= $r['min']];
        }

        return $out;
    }

    public const PREVIEW_TOKENS = ['bg', 'surface', 'surface-2', 'text', 'text-muted', 'border-strong', 'link', 'accent', 'on-accent', 'header-bg', 'footer-bg', 'announce-bg', 'danger', 'success', 'warning', 'info', 'focus'];

    /** Wirksame Farben für die Vorschau (gesetzter Wert oder Standard des Themes). @return array<string,string> */
    public static function effective(array $schema, array $values, string $mode): array
    {
        $byToken = [];
        foreach ($schema['options'] as $o) {
            if (isset($o['color']) && $o['color']['mode'] === $mode) {
                $byToken[$o['color']['token']] = $o['id'];
            }
        }
        $out = [];
        foreach (self::PREVIEW_TOKENS as $t) {
            $out[$t] = self::resolve($schema, $values, $mode, $byToken, $t)[0] ?? '#808080';
        }

        return $out;
    }

    /** @return array{0:?string,1:bool} [#rrggbb, ob vom Händler gesetzt] */
    private static function resolve(array $schema, array $values, string $mode, array $byToken, string $tok, int $depth = 0): array
    {
        $custom = Sanitizer::color($values['accent_custom'] ?? '');
        $custom = $custom !== '' ? substr($custom, 0, 7) : '';
        if (isset($byToken[$tok])) {
            $v = Sanitizer::color($values[$byToken[$tok]] ?? '');
            if ($v !== '') {
                return [substr($v, 0, 7), true];
            }
        }
        if ($custom !== '') {
            if ($tok === 'accent') {
                return [$custom, true];
            }
            if ($tok === 'on-accent') {
                return [self::lum($custom) > 0.179 ? '#000000' : '#ffffff', true];
            }
            if ($tok === 'link') {
                return [$mode === 'light' ? self::mix($custom, '#000000', 0.85) : self::mix($custom, '#ffffff', 0.6), true];
            }
        }
        $acc = $schema['accents'][$values['accent'] ?? 'red'][$mode] ?? ($schema['accents']['red'][$mode] ?? []);
        $map = ['accent' => 'accent', 'on-accent' => 'on-accent', 'link' => 'accent-text'];
        if (isset($map[$tok]) && isset($acc[$map[$tok]])) {
            return [$acc[$map[$tok]], false];
        }
        if (isset($schema['colorFallback'][$tok]) && $depth < 3) {
            [$h, $_] = self::resolve($schema, $values, $mode, $byToken, $schema['colorFallback'][$tok], $depth + 1);

            return [$h, false];
        }

        return [$schema['colorTokens'][$mode][$tok] ?? null, false];
    }
}

<?php

declare(strict_types=1);

namespace MichaThemeV5\Plugin;

/**
 * Baut aus den gesetzten Farben einen CSS-Block mit --mt-* Variablen (Hell und Dunkel getrennt). Leere Werte ändern nichts.
 * Die Selektoren sind spezifischer als die Theme-Tokens, damit sie ohne !important gewinnen und die Reihenfolge egal ist:
 *   Hell:            html:root:root:root
 *   Dunkel (System): @media (prefers-color-scheme: dark) { html:root:not([data-theme="light"]):root:root }
 *   Dunkel (fest):   html:root[data-theme="dark"]:root:root
 * Ausgegeben werden nur geprüfte Farbwerte (#rrggbb / #rrggbbaa), nie fremder Text.
 */
final class ColorOverrides
{
    public const STYLE_ID = 'mt-color-overrides';

    /**
    /** Schrift auf eigenem Akzent: schwarz oder weiß, je nach Helligkeit (gleiche Grenze 0,179 wie js/mt-init.js). */
    public static function autoOnAccent(string $accent): string
    {
        $c = [];
        foreach ([1, 3, 5] as $i) {
            $v = hexdec(substr($accent, $i, 2)) / 255;
            $c[] = $v <= 0.03928 ? $v / 12.92 : (($v + 0.055) / 1.055) ** 2.4;
        }

        return 0.2126 * $c[0] + 0.7152 * $c[1] + 0.0722 * $c[2] > 0.179 ? '#000000' : '#ffffff';
    }

    /**
     * @param list<array{token:string,mode:string,value:mixed}> $entries
     * @param mixed $accentCustom eigene Akzentfarbe: ist sie gesetzt, bekommt jeder Modus ohne eigene "Button-Text"-Farbe die automatische
     */
    public static function css(array $entries, mixed $accentCustom = ''): string
    {
        $by = ['light' => [], 'dark' => []];
        foreach ($entries as $e) {
            $mode = $e['mode'] ?? '';
            $tok = $e['token'] ?? '';
            $v = Sanitizer::color($e['value'] ?? '');
            if (!isset($by[$mode]) || $v === '' || preg_match('/^[a-z][a-z0-9-]{0,30}$/', (string) $tok) !== 1) {
                continue;
            }
            $by[$mode][$tok] = $v;
        }
        $acc = Sanitizer::color($accentCustom);
        if ($acc !== '') {
            foreach (['light', 'dark'] as $m) {
                $by[$m]['on-accent'] ??= self::autoOnAccent(substr($acc, 0, 7));
            }
        }
        $decl = static function (array $m): string {
            $o = '';
            foreach ($m as $t => $v) {
                $o .= "--mt-$t:$v;";
            }

            return $o;
        };
        $css = '';
        if ($by['light']) {
            $css .= 'html:root:root:root{' . $decl($by['light']) . "}\n";
        }
        if ($by['dark']) {
            $css .= '@media (prefers-color-scheme:dark){html:root:not([data-theme="light"]):root:root{' . $decl($by['dark']) . "}}\n";
            $css .= 'html:root[data-theme="dark"]:root:root{' . $decl($by['dark']) . "}\n";
        }

        return $css;
    }
}

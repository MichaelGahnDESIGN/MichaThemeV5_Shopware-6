<?php

declare(strict_types=1);

namespace MichaThemeV5\Plugin;

/**
 * Baut das HTML der Einstellungsseite aus dem Schema (mt-admin-schema.json). Plattformneutral, alles escaped.
 * Das Formular selbst (action, Nonce/Token, Speichern-Knopf) setzt die Plattform über $opts['formOpen'] und $opts['formClose'].
 * Ohne JavaScript bleibt es ein normales Formular: alle Gruppen untereinander, alle Felder sichtbar.
 */
final class FieldRenderer
{
    public static function e(mixed $s): string
    {
        return htmlspecialchars((string) $s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    /**
     * @param array<string,mixed> $schema   Inhalt von mt-admin-schema.json
     * @param array<string,mixed> $values   aktuelle Werte id => Wert
     * @param array<string,mixed> $opts     formOpen, formClose (HTML der Plattform), paletteJson, mediaButtons (bool), hiddenGroups (list)
     */
    public static function settings(array $schema, array $values, array $opts = []): string
    {
        $hidden = (array) ($opts['hiddenGroups'] ?? ['license']);
        $groups = array_values(array_filter($schema['groups'], static fn (array $g): bool => !in_array($g['id'], $hidden, true)));
        $byGroup = [];
        foreach ($schema['options'] as $o) {
            $byGroup[$o['group']][] = $o;
        }
        $h = '<div class="mtadm" data-mtadm data-mtadm-schema-version="' . self::e((string) ($schema['schemaVersion'] ?? 1)) . '">';
        $h .= self::presets($schema, $opts);
        $h .= '<div class="mtadm-toolbar" role="search">'
            . '<div class="mtadm-search"><label for="mtadm-search">Einstellung suchen</label>'
            . '<input type="search" id="mtadm-search" autocomplete="off" placeholder="z. B. Logo, Farbe, Footer" data-mtadm-search></div>'
            . '<fieldset class="mtadm-mode"><legend>Ansicht</legend>'
            . '<label><input type="radio" name="mtadm_mode" value="simple" checked data-mtadm-mode> Einfach</label>'
            . '<label><input type="radio" name="mtadm_mode" value="expert" data-mtadm-mode> Experte</label></fieldset>'
            . '<fieldset class="mtadm-chips"><legend>Filter</legend>'
            . '<label><input type="checkbox" data-mtadm-filter="changed"> Nur geänderte</label>'
            . '<label><input type="checkbox" data-mtadm-filter="law"> Nur Pflichtangaben</label></fieldset>'
            . '<p class="mtadm-count" role="status" aria-live="polite" data-mtadm-count></p></div>';
        $h .= '<div class="mtadm-layout"><nav class="mtadm-nav" aria-label="Einstellungsgruppen"><ul>';
        foreach ($groups as $i => $g) {
            $h .= '<li><a href="#mtadm-g-' . self::e($g['id']) . '" data-mtadm-nav="' . self::e($g['id']) . '"' . ($i === 0 ? ' aria-current="true"' : '') . '>' . self::e($g['label']) . '</a></li>';
        }
        $h .= '</ul></nav><div class="mtadm-main">';
        $h .= (string) ($opts['formOpen'] ?? '<form method="post">');
        foreach ($groups as $g) {
            $h .= '<section class="mtadm-group" id="mtadm-g-' . self::e($g['id']) . '" data-mtadm-group="' . self::e($g['id']) . '" aria-labelledby="mtadm-h-' . self::e($g['id']) . '">'
                . '<h2 id="mtadm-h-' . self::e($g['id']) . '">' . self::e($g['label']) . '</h2>';
            if (($g['help'] ?? '') !== '') {
                $h .= '<p class="mtadm-ghelp">' . self::e($g['help']) . '</p>';
            }
            if ($g['id'] === 'colors_custom') {
                $h .= self::colorPreview($schema, $values);
            }
            $h .= '<div class="mtadm-reset-group"><button type="button" class="mtadm-btn" data-mtadm-reset-group="' . self::e($g['id']) . '">Gruppe zurücksetzen</button></div>';
            foreach ($byGroup[$g['id']] ?? [] as $o) {
                $h .= self::field($o, $values[$o['id']] ?? $o['default'], $opts);
            }
            $h .= '</section>';
        }
        $h .= self::schemaScript($schema);
        $h .= '<p class="mtadm-empty" data-mtadm-empty hidden>Keine Einstellung gefunden.</p>';
        if (($opts['paletteJson'] ?? null) !== null) {
            $h .= '<input type="hidden" id="mtadm-palette" name="mt_palette" value="' . self::e($opts['paletteJson']) . '">';
        }
        $h .= (string) ($opts['formClose'] ?? '</form>');
        $h .= '</div></div></div>';

        return $h;
    }

    /** @param array<string,mixed> $o */
    public static function field(array $o, mixed $val, array $opts = []): string
    {
        $id = 'mtf-' . $o['id'];
        $name = 'mt[' . $o['id'] . ']';
        $help = trim((string) ($o['help'] ?? ''));
        $law = !empty($o['locked_by_law']);
        $helpId = $id . '-help';
        $desc = $help !== '' || $law ? ' aria-describedby="' . $helpId . '"' : '';
        $type = $o['type'];
        $input = (string) ($o['input'] ?? '');
        $search = mb_strtolower($o['label'] . ' ' . $help . ' ' . $o['id']);
        $default = self::plainDefault($o);

        $h = '<div class="mtadm-field" data-mtadm-field="' . self::e($o['id']) . '" data-mode="' . self::e($o['mode']) . '" data-type="' . self::e($type) . '"'
            . ' data-law="' . ($law ? '1' : '0') . '" data-default="' . self::e(is_bool($o['default']) ? ($o['default'] ? '1' : '0') : (string) $o['default']) . '"'
            . ' data-search="' . self::e($search) . '">';
        $h .= '<div class="mtadm-flabel">';
        if ($type === 'toggle') {
            $h .= '<input type="hidden" name="' . self::e($name) . '" value="0">'
                . '<label class="mtadm-check"><input type="checkbox" id="' . self::e($id) . '" name="' . self::e($name) . '" value="1"' . ($val ? ' checked' : '') . $desc . ' data-mtadm-input> '
                . '<span>' . self::e($o['label']) . '</span></label>';
        } else {
            $h .= '<label for="' . self::e($id) . '">' . self::e($o['label']) . '</label>';
        }
        if ($law) {
            $h .= ' <span class="mtadm-badge">Pflichtangabe</span>';
        }
        if (($o['mode'] ?? '') === 'expert') {
            $h .= ' <span class="mtadm-badge mtadm-badge--soft">Experte</span>';
        }
        $h .= '</div>';

        switch ($type) {
            case 'select':
            case 'font':
                $h .= '<select id="' . self::e($id) . '" name="' . self::e($name) . '"' . $desc . ' data-mtadm-input>';
                foreach ($o['choices'] as $k => $lab) {
                    $h .= '<option value="' . self::e($k) . '"' . ((string) $val === (string) $k ? ' selected' : '') . '>' . self::e($lab) . '</option>';
                }
                $h .= '</select>';
                break;
            case 'range':
                $h .= '<div class="mtadm-range"><input type="range" id="' . self::e($id) . '" name="' . self::e($name) . '" min="' . (int) $o['min'] . '" max="' . (int) $o['max'] . '" step="' . (int) ($o['step'] ?? 1) . '" value="' . (int) $val . '"' . $desc . ' data-mtadm-input data-mtadm-range>'
                    . '<output for="' . self::e($id) . '" data-mtadm-out data-unit="' . self::e($o['unit'] ?? '') . '">' . (int) $val . self::e($o['unit'] ?? '') . '</output></div>';
                break;
            case 'color':
                $h .= '<input type="text" id="' . self::e($id) . '" name="' . self::e($name) . '" value="' . self::e((string) $val) . '" maxlength="7" spellcheck="false" autocomplete="off" placeholder="Standard nutzen"' . $desc
                    . ' data-mt-colorpicker data-mt-palette-field="mtadm-palette" data-mtadm-input data-mtadm-color>'
                    . '<button type="button" class="mtadm-btn mtadm-clear" data-mtadm-clear="' . self::e($id) . '">Standard nutzen (Farbe leeren)</button>';
                break;
            case 'code':
                $h .= '<textarea id="' . self::e($id) . '" name="' . self::e($name) . '" rows="6" spellcheck="false"' . $desc . ' data-mtadm-input>' . self::e((string) $val) . '</textarea>';
                break;
            case 'toggle':
                break;
            default:
                if ($input === 'textarea') {
                    $h .= '<textarea id="' . self::e($id) . '" name="' . self::e($name) . '" rows="3" maxlength="' . Sanitizer::TEXTAREA_MAX . '"' . $desc . ' data-mtadm-input>' . self::e((string) $val) . '</textarea>';
                } else {
                    $mode = $type === 'media' || $input === 'url' ? 'url' : 'text';
                    $h .= '<input type="' . $mode . '" id="' . self::e($id) . '" name="' . self::e($name) . '" value="' . self::e((string) $val) . '" maxlength="' . Sanitizer::URL_MAX . '"' . ($input === 'page' ? ' inputmode="numeric"' : '') . $desc . ' data-mtadm-input>';
                    if ($type === 'media' && !empty($opts['mediaButtons'])) {
                        $h .= '<button type="button" class="mtadm-btn" data-mtadm-media="' . self::e($id) . '">Bild aus der Mediathek wählen</button>';
                    }
                }
        }
        if ($help !== '' || $law) {
            $h .= '<p class="mtadm-help" id="' . self::e($helpId) . '">' . self::e($help) . ($law ? ' Pflichtangabe, bitte mit Bedacht ändern.' : '') . '</p>';
        }
        $h .= '<div class="mtadm-foot"><span class="mtadm-hint" data-mtadm-hint></span>'
            . '<button type="button" class="mtadm-btn mtadm-reset" data-mtadm-reset="' . self::e($o['id']) . '" aria-label="' . self::e($o['label']) . ' zurücksetzen auf ' . self::e($default) . '">Zurücksetzen</button></div>';

        return $h . '</div>';
    }

    /** Karte "Design-Presets": ein Klick setzt nur Optionswerte (Variablen). Vorher wird automatisch gesichert. */
    public static function presets(array $schema, array $opts): string
    {
        $list = $schema['presets'] ?? [];
        if (!$list || !isset($opts['presetFormOpen'])) {
            return '';
        }
        $h = '<section class="mtadm-card mtadm-presets" aria-labelledby="mtadm-presets-h"><h2 id="mtadm-presets-h">Design-Presets</h2>'
            . '<p class="mtadm-ghelp">Ein Klick setzt mehrere Einstellungen auf einmal. Vor dem Anwenden wird automatisch gesichert; zurück geht es mit dem Preset „Standard“ oder mit „Einstellungen wiederherstellen“ auf der Info-Seite.</p><ul class="mtadm-preset-list">';
        foreach ($list as $p) {
            $h .= '<li class="mtadm-preset"><h3>' . self::e($p['label']) . '</h3><p class="mtadm-help">' . self::e($p['help']) . '</p>'
                . $opts['presetFormOpen'] . '<input type="hidden" name="mt_preset" value="' . self::e($p['id']) . '">'
                . '<button type="submit" class="mtadm-btn">Anwenden<span class="mtadm-sr">: ' . self::e($p['label']) . '</span></button></form></li>';
        }

        return $h . '</ul></section>';
    }

    /** Kleine Daten für das Skript: nur was Vorschau und Kontrast-Warnung brauchen. */
    private static function schemaScript(array $schema): string
    {
        if (empty($schema['colorRules'])) {
            return '';
        }
        $slim = ['options' => array_values(array_map(static fn (array $o): array => ['id' => $o['id'], 'color' => $o['color']], array_filter($schema['options'], static fn (array $o): bool => isset($o['color'])))),
            'colorTokens' => $schema['colorTokens'], 'accents' => $schema['accents'], 'colorFallback' => $schema['colorFallback'], 'colorRules' => $schema['colorRules']];

        return '<script type="application/json" id="mtadm-schema">' . json_encode($slim, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) . '</script>';
    }

    /** Live-Vorschau Hell und Dunkel plus Kontrast-Hinweise (ohne Skript schon beim Laden gerechnet). */
    public static function colorPreview(array $schema, array $values): string
    {
        if (empty($schema['colorRules'])) {
            return '';
        }
        $h = '<div class="mtadm-previews">';
        foreach (['light' => 'Hell', 'dark' => 'Dunkel'] as $mode => $lab) {
            $eff = ColorContrast::effective($schema, $values, $mode);
            $style = '';
            foreach ($eff as $t => $hex) {
                $style .= '--pv-' . $t . ':' . $hex . ';';
            }
            $h .= '<div class="mtadm-pvwrap"><h3>Vorschau ' . $lab . '</h3>'
                . '<div class="mtadm-pv" data-mtadm-preview="' . $mode . '" aria-hidden="true" style="' . self::e($style) . '">'
                . '<div class="pv-announce">Ankündigung: Gratis Versand</div><div class="pv-header"><strong>Shop</strong><span class="pv-link">Kategorien</span></div>'
                . '<div class="pv-body"><div class="pv-card"><strong>Produktname</strong><p>Normaler Text auf der Karte.</p><p class="pv-muted">Gedämpfter Hinweis</p>'
                . '<span class="pv-link">Ein Link</span> <span class="pv-btn">Kaufen</span> <span class="pv-tags"><i class="pv-danger">Sale</i><i class="pv-success">Ok</i><i class="pv-warning">Achtung</i><i class="pv-info">Info</i></span></div></div>'
                . '<div class="pv-footer">Footer</div></div>'
                . '<div role="status" aria-live="polite"><ul class="mtadm-warn" data-mtadm-warn="' . $mode . '">' . self::warnItems(ColorContrast::check($schema, $values, $mode)) . '</ul></div></div>';
        }

        return $h . '</div>';
    }

    /** @param list<array{label:string,ratio:float,min:float,ok:bool}> $res */
    public static function warnItems(array $res): string
    {
        $h = '';
        $bad = 0;
        foreach ($res as $r) {
            if (!$r['ok']) {
                $bad++;
                $h .= '<li class="is-bad"><span aria-hidden="true">⚠ </span>Achtung: ' . self::e($r['label']) . ': ' . self::e(str_replace('.', ',', (string) $r['ratio'])) . ' zu 1, empfohlen mindestens ' . self::e(str_replace('.', ',', (string) $r['min'])) . ' zu 1. Gespeichert wird trotzdem.</li>';
            }
        }
        if ($res && !$bad) {
            $h = '<li class="is-ok"><span aria-hidden="true">✓ </span>Alle geprüften Kontraste sind in Ordnung.</li>';
        }

        return $h;
    }

    /** Fixierte Speicherleiste. Fokus wird durch scroll-padding-bottom der Seite nicht verdeckt (siehe mt-admin.css). */
    public static function saveBar(string $label = 'Änderungen speichern'): string
    {
        return '<div class="mtadm-savebar"><p class="mtadm-dirty" role="status" aria-live="polite" data-mtadm-dirty></p>'
            . '<button type="submit" class="mtadm-primary">' . self::e($label) . '</button></div>';
    }

    /** Standardwert im Klartext (für den Zurücksetzen-Knopf). */
    private static function plainDefault(array $o): string
    {
        $d = $o['default'];
        if (is_bool($d)) {
            return $d ? 'An' : 'Aus';
        }
        if (in_array($o['type'], ['select', 'font'], true)) {
            return (string) ($o['choices'][$d] ?? $d);
        }
        if ($d === '' || $d === null) {
            return 'leer';
        }

        return (string) $d . ($o['type'] === 'range' ? (string) ($o['unit'] ?? '') : '');
    }
}

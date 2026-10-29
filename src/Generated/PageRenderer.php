<?php

declare(strict_types=1);

namespace MichaThemeV5\Plugin;

/** HTML der Seiten Lizenzen, Plugin-Empfehlungen und Info. Plattformneutral, alles escaped. Formulare (Nonce/Token) liefert die Plattform. */
final class PageRenderer
{
    private static function e(mixed $s): string
    {
        return FieldRenderer::e($s);
    }

    /**
     * @param array{kind:string,title:string,text:string} $desc LicenseTexts::describe()
     * @param array<string,mixed> $o formOpen, formClose (HTML), masked (z. B. "…a1b2c3"), hasToken (bool), shopUrl
     */
    public static function license(array $desc, array $o): string
    {
        $shop = (string) ($o['shopUrl'] ?? LicenseTexts::SHOP_URL);
        $h = '<div class="mtadm mtadm-page"><section class="mtadm-card mtadm-status mtadm-status--' . self::e($desc['kind']) . '" aria-labelledby="mtl-status">'
            . '<h2 id="mtl-status">' . self::e($desc['title']) . '</h2><p>' . self::e($desc['text']) . '</p>';
        if (!empty($o['hasToken'])) {
            $h .= '<p class="mtadm-masked">Gespeicherter Code: <code>' . self::e($o['masked'] ?? '') . '</code></p>';
        }
        $h .= '</section>';
        $h .= '<section class="mtadm-card" aria-labelledby="mtl-code"><h2 id="mtl-code">Lizenzcode</h2>'
            . (string) ($o['formOpen'] ?? '<form method="post">')
            . '<div class="mtadm-field"><div class="mtadm-flabel"><label for="mtl-token">Lizenzcode einfügen</label></div>'
            . '<input type="password" id="mtl-token" name="mt_license_token" autocomplete="off" spellcheck="false" maxlength="4096" aria-describedby="mtl-help" data-mtadm-secret>'
            . '<label class="mtadm-check"><input type="checkbox" data-mtadm-show="mtl-token"> <span>Code anzeigen</span></label>'
            . '<p class="mtadm-help" id="mtl-help">Den Code finden Sie in Ihrem Kundenkonto. Er besteht aus drei Teilen mit Punkt. ' . self::e(LicenseTexts::privacy()) . '</p></div>'
            . '<div class="mtadm-actions">'
            . '<button type="submit" class="mtadm-primary" name="mt_license_action" value="save">Speichern und prüfen</button>'
            . '<button type="submit" class="mtadm-btn" name="mt_license_action" value="check">Jetzt prüfen</button>'
            . (!empty($o['hasToken']) ? '<button type="submit" class="mtadm-btn" name="mt_license_action" value="remove">Lizenzcode entfernen</button>' : '')
            . '</div>' . (string) ($o['formClose'] ?? '</form>') . '</section>';
        $h .= '<section class="mtadm-card" aria-labelledby="mtl-buy"><h2 id="mtl-buy">Lizenzen kaufen oder verwalten</h2>'
            . '<p>Im Kundenkonto kaufen und verwalten Sie Ihre Lizenzen und finden Ihren Lizenzcode.</p>'
            . '<p><a class="mtadm-link" href="' . self::e($shop) . '" target="_blank" rel="noopener noreferrer">Lizenzen kaufen (' . self::e(preg_replace('~^https://~', '', $shop)) . ')<span class="mtadm-sr"> (öffnet in neuem Tab)</span></a></p></section></div>';

        return $h;
    }

    /**
     * @param array{items:list<array<string,mixed>>,stale:bool,error:?string,checked_at:int} $res CatalogFeed::load()
     * @param array<string,mixed> $o formOpen/formClose für "Liste aktualisieren", imageUrl (callable url=>?string, lokale sichere Adresse)
     */
    public static function catalog(array $res, array $o): string
    {
        $h = '<div class="mtadm mtadm-page"><p class="mtadm-intro">Weitere Plugins von Michael Gahn DESIGN. Nichts wird automatisch installiert.</p>';
        if ($res['error'] !== null && $res['error'] !== 'throttled') {
            $h .= '<p class="mtadm-note" role="status">' . ($res['stale']
                ? 'Die Liste ist gerade nicht erreichbar. Sie sehen die zuletzt geladene Liste (Liste nicht aktuell). Ihr Shop läuft normal weiter.'
                : 'Die Liste ist gerade nicht erreichbar. Ihr Shop läuft normal weiter.') . '</p>';
        } elseif ($res['error'] === 'throttled') {
            $h .= '<p class="mtadm-note" role="status">Bitte warten Sie eine Minute, bevor Sie die Liste erneut aktualisieren.</p>';
        }
        if (!$res['items'] && $res['error'] === null) {
            $h .= '<p class="mtadm-note" role="status">Im Moment gibt es keine Empfehlungen für Ihren Shop.</p>';
        }
        $h .= '<h2 class="mtadm-sr">Empfohlene Plugins</h2><ul class="mtadm-cards">';
        $image = $o['imageUrl'] ?? null;
        foreach ($res['items'] as $it) {
            $style = $it['accent'] !== null ? ' style="--mtadm-card-accent:' . self::e($it['accent']) . '"' : '';
            $h .= '<li class="mtadm-pcard"' . $style . '><div class="mtadm-pcard-head">';
            $icon = is_callable($image) && $it['icon_url'] !== null ? $image($it['icon_url']) : null;
            $h .= $icon ? '<img src="' . self::e($icon) . '" alt="" width="48" height="48" loading="lazy">' : '<span class="mtadm-pcard-ico" aria-hidden="true">' . self::e(mb_strtoupper(mb_substr($it['name'], 0, 1))) . '</span>';
            $h .= '<div><h3>' . self::e($it['name']) . '</h3><p class="mtadm-meta">';
            $meta = [];
            if ($it['recommended']) {
                $meta[] = '<strong>Empfohlen</strong>';
            }
            $meta[] = $it['status'] === 'announced' ? 'Demnächst' : ($it['tier'] === 'paid' ? 'Kostenpflichtig' : 'Kostenlos');
            if ($it['version'] !== '') {
                $meta[] = 'Version ' . self::e($it['version']);
            }
            $h .= implode(' · ', array_map(static fn (string $m): string => str_starts_with($m, '<') ? $m : self::e($m), $meta)) . '</p></div></div>';
            $h .= '<p>' . self::e($it['description']) . '</p><p class="mtadm-actions">';
            if ($it['download_url'] !== null) {
                $h .= '<a class="mtadm-primary" href="' . self::e($it['download_url']) . '" target="_blank" rel="noopener noreferrer">Herunterladen<span class="mtadm-sr">: ' . self::e($it['name']) . ' (öffnet in neuem Tab)</span></a>';
            }
            if ($it['details_url'] !== null) {
                $h .= '<a class="mtadm-link" href="' . self::e($it['details_url']) . '" target="_blank" rel="noopener noreferrer">Mehr erfahren<span class="mtadm-sr">: ' . self::e($it['name']) . ' (öffnet in neuem Tab)</span></a>';
            }
            $h .= '</p></li>';
        }
        $h .= '</ul>';
        $h .= (string) ($o['formOpen'] ?? '') . '<p><button type="submit" class="mtadm-btn">Liste aktualisieren</button>'
            . ($res['checked_at'] > 0 ? ' <span class="mtadm-meta">Stand: ' . self::e(gmdate('d.m.Y H:i', $res['checked_at'])) . ' UTC</span>' : '') . '</p>' . (string) ($o['formClose'] ?? '');
        $h .= '<p class="mtadm-meta">Datenschutz: Beim Laden der Liste fragt Ihr Server ' . self::e(LicenseTexts::SHOP_URL) . ' ab. Besucher Ihres Shops sind nicht betroffen.</p></div>';

        return $h;
    }

    /**
     * @param list<array{label:string,value:string,state:string}> $rows state: ok|warn|info
     * @param array<string,mixed> $o changelog (Text), extra (HTML der Plattform, z. B. Karte "Theme einrichten"), links list<array{label,url}>
     */
    public static function info(array $rows, array $o): string
    {
        $h = '<div class="mtadm mtadm-page">' . (string) ($o['extra'] ?? '');
        $h .= '<section class="mtadm-card" aria-labelledby="mti-status"><h2 id="mti-status">Statusprüfung</h2><table class="mtadm-table"><thead><tr><th scope="col">Was</th><th scope="col">Stand</th></tr></thead><tbody>';
        $sym = ['ok' => 'In Ordnung: ', 'warn' => 'Achtung: ', 'info' => ''];
        foreach ($rows as $r) {
            $h .= '<tr class="mtadm-row--' . self::e($r['state']) . '"><th scope="row">' . self::e($r['label']) . '</th><td>' . self::e($sym[$r['state']] ?? '') . self::e($r['value']) . '</td></tr>';
        }
        $h .= '</tbody></table></section>';
        if (!empty($o['links'])) {
            $h .= '<section class="mtadm-card" aria-labelledby="mti-links"><h2 id="mti-links">Hilfe</h2><ul>';
            foreach ($o['links'] as $l) {
                $h .= '<li><a class="mtadm-link" href="' . self::e($l['url']) . '" target="_blank" rel="noopener noreferrer">' . self::e($l['label']) . '<span class="mtadm-sr"> (öffnet in neuem Tab)</span></a></li>';
            }
            $h .= '</ul></section>';
        }
        if (($o['changelog'] ?? '') !== '') {
            $h .= '<section class="mtadm-card" aria-labelledby="mti-log"><h2 id="mti-log">Änderungen (Changelog)</h2><pre class="mtadm-log" tabindex="0">' . self::e($o['changelog']) . '</pre></section>';
        }

        return $h . '</div>';
    }
}

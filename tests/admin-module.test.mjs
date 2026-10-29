// Prüft das Admin-Modul ohne Shopware: Texte de/en, Bausteine, Sicherheit der Quellen, gebautes JS passt zur Quelle
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { strict as assert } from 'node:assert';
import { test } from 'node:test';

const root = new URL('../', import.meta.url).pathname;
const mod = root + 'src/Resources/app/administration/src/module/michatheme-v5/';
const read = (p) => readFileSync(p, 'utf8');
const walk = (d) => readdirSync(d).flatMap((n) => (statSync(d + n).isDirectory() ? walk(d + n + '/') : [d + n]));
const sources = walk(mod).filter((f) => f.endsWith('.js'));
const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? flat(v, p + k + '.') : [[p + k, v]]));

const de = JSON.parse(read(mod + 'snippet/de-DE.json'));
const en = JSON.parse(read(mod + 'snippet/en-GB.json'));

test('Texte: de-DE und en-GB haben genau dieselben Schlüssel, keine leeren Werte', () => {
    const a = flat(de).map(([k]) => k).sort();
    const b = flat(en).map(([k]) => k).sort();
    assert.deepEqual(a, b);
    for (const [k, v] of [...flat(de), ...flat(en)]) assert.ok(String(v).trim() !== '', k + ' ist leer');
    // gleiche Platzhalter in beiden Sprachen
    const ph = (s) => (String(s).match(/\{\w+\}/g) || []).sort().join(',');
    const enMap = Object.fromEntries(flat(en));
    for (const [k, v] of flat(de)) assert.equal(ph(v), ph(enMap[k]), 'Platzhalter in ' + k);
});

test('Texte: jeder benutzte Schlüssel existiert', () => {
    const keys = new Set(flat(de).map(([k]) => k));
    const used = new Set();
    for (const f of sources) {
        for (const m of read(f).matchAll(/michatheme-v5\.[A-Za-z0-9_.]+/g)) used.add(m[0].replace(/\.$/, ''));
    }
    const dynamic = ['michatheme-v5.license.reason', 'michatheme-v5.colors.token', 'michatheme-v5.presets'];
    for (const k of used) {
        if (keys.has(k)) continue;
        assert.ok(dynamic.some((d) => k === d || k.startsWith(d + '.')), 'Text fehlt: ' + k);
    }
    for (const r of ['no_token', 'unreachable', 'token_expired', 'token_revoked', 'domain_mismatch', 'signature_invalid', 'token_malformed', 'unknown_tier', 'other']) assert.ok(keys.has('michatheme-v5.license.reason.' + r), r);
    for (const t of ['bg', 'surface', 'surface_2', 'text', 'text_muted', 'border_strong', 'link', 'on_accent', 'header_bg', 'footer_bg', 'announce_bg', 'danger', 'success', 'warning', 'info', 'focus']) assert.ok(keys.has('michatheme-v5.colors.token.' + t), t);
    for (const p of ['standard', 'glass', 'compact']) assert.ok(keys.has('michatheme-v5.presets.' + p + '.label') && keys.has('michatheme-v5.presets.' + p + '.help'), p);
});

test('Routen: Navigation und Modul-Anmeldung passen zusammen', () => {
    const reg = read(mod + 'register.js');
    const routes = [...reg.matchAll(/^\s{12}(\w+): \{ component: '([\w-]+)', path/gm)].map((m) => [m[1], m[2]]);
    assert.equal(routes.length, 4);
    const nav = read(mod + 'component/mt-sw-nav.js');
    for (const [name, comp] of routes) {
        assert.ok(nav.includes("'michatheme.v5." + name + "'"), 'Nav-Link ' + name);
        assert.ok(sources.some((f) => read(f).includes("Component.register('" + comp + "'")), 'Komponente ' + comp);
    }
    assert.ok(reg.includes("to: 'michatheme.v5.settings'") && reg.includes("group: 'plugins'"), 'Menüpunkt unter Erweiterungen');
    assert.ok(reg.includes("privilege: 'michatheme_v5.viewer'"));
});

test('Sicherheit: kein HTML aus Daten, keine fremden Adressen, kein eval', () => {
    for (const f of sources) {
        const t = read(f);
        assert.ok(!/v-html|innerHTML|insertAdjacentHTML|document\.write|eval\(|new Function/.test(t.replace(/insertAdjacentElement/g, '')) || f.endsWith('mt-colorpicker.js'), f);
        for (const u of t.matchAll(/https?:\/\/[^\s'"`)<]+/g)) {
            assert.ok(/^https:\/\/(theme\.michael-gahn\.de|github\.com\/MichaelGahnDESIGN|michael-gahn\.de|www\.w3\.org)/.test(u[0]) || /^https:\/\/$/.test(u[0]), f + ': ' + u[0]);
        }
        assert.ok(!/googleapis|gstatic|cdn\.|unpkg|jsdelivr|cloudflare/i.test(t), f + ' lädt von einem CDN');
    }
});

test('Rechte: Menü und Routen verlangen viewer, Speichern prüft editor', () => {
    const acl = read(mod + 'acl.js');
    assert.ok(acl.includes("key: 'michatheme_v5'") && acl.includes("'theme:update'") && acl.includes("'system_config:update'"));
    assert.ok(read(mod + 'page/mt-sw-settings.js').includes("'michatheme_v5.editor'"));
    assert.ok(read(mod + 'page/mt-sw-license.js').includes("'michatheme_v5.editor'"));
});

test('Farbwähler-CSS im Admin-JS ist gleich der Kern-Datei', () => {
    const css = read(root + 'src/Resources/public/administration/mt/mt-colorpicker.css').trim();
    const style = read(mod + 'style.js');
    assert.ok(style.includes(JSON.stringify(css).slice(1, -1)), 'mt-colorpicker.css weicht ab (python3 scripts/build-admin.py und style.js neu erzeugen)');
});

test('Gebautes Admin-JS passt zur Quelle und ist gültiges JavaScript', () => {
    execFileSync('python3', [root + 'scripts/build-admin.py', '--check'], { stdio: 'pipe' });
    execFileSync('node', ['--check', root + 'src/Resources/public/administration/js/micha-theme-v5.js'], { stdio: 'pipe' });
    const ep = JSON.parse(read(root + 'src/Resources/public/administration/.vite/entrypoints.json'));
    assert.deepEqual(ep.entryPoints['micha-theme-v5'].js, ['/bundles/michathemev5/administration/js/micha-theme-v5.js']);
});

test('Kern: Logik und Farbwähler sind die Generator-Dateien (nicht von Hand geändert)', () => {
    const logic = read(root + 'src/Resources/public/administration/mt/mt-admin-logic.js');
    assert.ok(logic.includes('colorWarnings') && logic.includes('fg: r.fg'));
    assert.ok(read(root + 'src/Resources/public/administration/mt/mt-colorpicker.js').includes('MTColorPicker'));
});

test('Adapter-CSS 0.5.3: Karten, Glas, Breite nur über --mt-Variablen, Glas mit Rückfall', () => {
    const css = read(root + 'src/Resources/public/mt/mt-shopware.css');
    const tail = css.slice(css.indexOf('Inhaltsbreite (Option container_width)'));
    for (const v of ['narrow', 'wide']) assert.ok(tail.includes('data-mt-container="' + v + '"'));
    for (const v of ['flat', 'elevated']) assert.ok(tail.includes('data-mt-cards="' + v + '"'));
    assert.ok(tail.includes('data-mt-surface="glass"'));
    assert.ok(/@supports \(\(backdrop-filter/.test(tail) && tail.includes('prefers-reduced-transparency: no-preference'), 'Rückfall ohne Transparenz');
    assert.ok(tail.includes('var(--mt-glass-bg)') && tail.includes('var(--mt-glass-blur)'));
    // Karten stehen als class="card product-box" im Shop, beide Schreibweisen abdecken
    assert.ok(tail.includes('.product-box.card'));
    assert.ok(!/#[0-9a-fA-F]{3,8}\b|rgba?\(|!important|transition|animation/.test(tail.replace(/\/\*.*?\*\//gs, '')), 'keine harten Farben, kein !important, keine Animation im Block');
    const twig = read(root + 'src/Resources/views/storefront/layout/mt-config.html.twig');
    for (const a of ['data-mt-cards', 'data-mt-surface', 'data-mt-container']) assert.ok(twig.includes("'" + a + "':"), a);
});

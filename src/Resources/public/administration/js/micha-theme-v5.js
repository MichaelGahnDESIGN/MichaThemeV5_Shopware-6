/* MichaThemeV5 Admin-Modul - AUTOMATISCH GEBAUT (python3 scripts/build-admin.py), nicht von Hand ändern.
 * Quelle: src/Resources/app/administration/src/module/michatheme-v5. Kein Build beim Händler nötig. */
(function () {
'use strict';
/* src/Resources/public/administration/mt/mt-colorpicker.js */
/* MichaThemeV5 – Colorpicker (Backend): Farbfläche, Farbton, HEX mit Kopieren, Palette (max. 12), Kontrastwarnung. Lokal, kein CDN. */
(function (root) {
  'use strict';
  var PALETTE_MAX = 12;

  // HEX Helfer - auch im Node-Test
  function normHex(v) {
    var s = String(v === undefined || v === null ? '' : v).trim();
    if (/^#?[0-9a-fA-F]{3}$/.test(s)) { s = s.replace('#', ''); s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2]; }
    else if (/^#?[0-9a-fA-F]{6}$/.test(s)) { s = s.replace('#', ''); }
    else { return null; }
    return '#' + s.toLowerCase();
  }
  function hexToRgb(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function rgbToHex(r, g, b) { return '#' + [r, g, b].map(function (v) { var x = Math.max(0, Math.min(255, Math.round(v))).toString(16); return x.length < 2 ? '0' + x : x; }).join(''); }
  function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, h = 0;
    if (d) {
      if (mx === r) { h = ((g - b) / d) % 6; } else if (mx === g) { h = (b - r) / d + 2; } else { h = (r - g) / d + 4; }
      h *= 60; if (h < 0) { h += 360; }
    }
    return [h, mx ? d / mx : 0, mx];
  }
  function hsvToRgb(h, s, v) {
    var c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c, r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
    return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
  }
  function lum(hex) {
    var c = hexToRgb(hex).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  // Akzent-Text wird wie in mt-base.css abgeleitet: hell 85 % Akzent + 15 % Schwarz, dunkel 60 % Akzent + 40 % Weiß
  function mix(a, b, pa) { var x = hexToRgb(a), y = hexToRgb(b); return rgbToHex(x[0] * pa + y[0] * (1 - pa), x[1] * pa + y[1] * (1 - pa), x[2] * pa + y[2] * (1 - pa)); }
  function accentTextCheck(hex, bgLight, bgDark) {
    var light = mix(hex, '#000000', 0.85), dark = mix(hex, '#ffffff', 0.6);
    var cl = contrast(light, bgLight || '#ffffff'), cd = contrast(dark, bgDark || '#242529');
    return { light: cl, dark: cd, ok: cl >= 4.5 && cd >= 4.5 };
  }
  function parsePalette(raw) {
    var d = []; try { d = JSON.parse(raw || '[]'); } catch (e) { d = []; }
    if (!Array.isArray(d)) { return []; }
    var out = [];
    d.forEach(function (c) { var h = normHex(c); if (h && out.indexOf(h) < 0 && out.length < PALETTE_MAX) { out.push(h); } });
    return out;
  }
  function addColor(list, hex) { var h = normHex(hex); if (!h || list.indexOf(h) >= 0) { return list.slice(); } return list.concat([h]).slice(-PALETTE_MAX); }
  function removeColor(list, hex) { return list.filter(function (c) { return c !== hex; }); }

  var api = { normHex: normHex, hexToRgb: hexToRgb, rgbToHex: rgbToHex, rgbToHsv: rgbToHsv, hsvToRgb: hsvToRgb, contrast: contrast, accentTextCheck: accentTextCheck, parsePalette: parsePalette, addColor: addColor, removeColor: removeColor, PALETTE_MAX: PALETTE_MAX };
  if (typeof document === 'undefined') { if (typeof module !== 'undefined' && module.exports) { module.exports = api; } return; }

  var uid = 0;
  function el(tag, cls, attrs) { var e = document.createElement(tag); if (cls) { e.className = cls; } Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); }); return e; }

  // Komponente an ein Eingabefeld hängen: input[data-mt-colorpicker]; Palette optional in input[data-mt-palette-field] (Backend speichert)
  function mount(input) {
    if (input.getAttribute('data-mt-cp-ready')) { return; }
    input.setAttribute('data-mt-cp-ready', '1');
    uid += 1;
    var id = 'mt-cp-' + uid;
    var hsv = [0, 0, 1];
    var cur = normHex(input.value) || '';
    if (cur) { hsv = rgbToHsv.apply(null, hexToRgb(cur)); }
    var palField = input.getAttribute('data-mt-palette-field') ? document.getElementById(input.getAttribute('data-mt-palette-field')) : null;
    var palette = parsePalette(palField ? palField.value : (function () { try { return window.localStorage.getItem('mt-cp-palette'); } catch (e) { return null; } })());

    var box = el('div', 'mt-cp');
    var area = el('div', 'mt-cp__area', { role: 'slider', tabindex: '0', 'aria-label': 'Sättigung und Helligkeit', 'aria-valuetext': '' });
    var knob = el('span', 'mt-cp__knob', { 'aria-hidden': 'true' });
    area.appendChild(knob);
    var hue = el('input', 'mt-cp__hue', { type: 'range', min: '0', max: '359', step: '1', 'aria-label': 'Farbton' });
    var row = el('div', 'mt-cp__row');
    var hexIn = el('input', 'mt-cp__hex', { type: 'text', maxlength: '7', spellcheck: 'false', autocomplete: 'off', id: id + '-hex', 'aria-label': 'HEX-Farbwert' });
    var copy = el('button', 'mt-cp__btn', { type: 'button' }); copy.textContent = 'Kopieren';
    var save = el('button', 'mt-cp__btn', { type: 'button' }); save.textContent = 'Aktuelle Farbe speichern';
    var msg = el('p', 'mt-cp__msg', { role: 'status', 'aria-live': 'polite' });
    var pal = el('ul', 'mt-cp__palette', { 'aria-label': 'Gespeicherte Farben' });
    row.appendChild(hexIn); row.appendChild(copy);
    box.appendChild(area); box.appendChild(hue); box.appendChild(row); box.appendChild(save); box.appendChild(msg); box.appendChild(pal);
    input.insertAdjacentElement('afterend', box);

    function hex() { var c = hsvToRgb(hsv[0], hsv[1], hsv[2]); return rgbToHex(c[0], c[1], c[2]); }
    function paint(fromHex) {
      var h = fromHex || hex();
      area.style.background = 'linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,hsl(' + Math.round(hsv[0]) + ',100%,50%))';
      knob.style.left = (hsv[1] * 100) + '%'; knob.style.top = ((1 - hsv[2]) * 100) + '%';
      knob.style.background = h;
      hue.value = String(Math.round(hsv[0]) % 360);
      if (document.activeElement !== hexIn) { hexIn.value = h; }
      area.setAttribute('aria-valuetext', h);
      var chk = accentTextCheck(h);
      msg.textContent = chk.ok ? '' : 'Achtung: Als Akzent unter 4,5:1 Kontrast (Hell ' + chk.light.toFixed(1).replace('.', ',') + ':1, Dunkel ' + chk.dark.toFixed(1).replace('.', ',') + ':1). Links und Texte sind dann schwer lesbar.';
    }
    function commit() { var h = hex(); input.value = h; input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true })); paint(h); }
    function setFromHex(h) { hsv = rgbToHsv.apply(null, hexToRgb(h)); commit(); }
    function pick(e) {
      var r = area.getBoundingClientRect();
      hsv[1] = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      hsv[2] = 1 - Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
      commit();
    }
    var drag = false;
    area.addEventListener('pointerdown', function (e) { drag = true; try { area.setPointerCapture(e.pointerId); } catch (x) { /* egal */ } pick(e); });
    area.addEventListener('pointermove', function (e) { if (drag) { pick(e); } });
    area.addEventListener('pointerup', function () { drag = false; });
    // Tastatur: Pfeile = Sättigung/Helligkeit, Shift = große Schritte
    area.addEventListener('keydown', function (e) {
      var st = e.shiftKey ? 0.1 : 0.01, used = true;
      if (e.key === 'ArrowLeft') { hsv[1] = Math.max(0, hsv[1] - st); } else if (e.key === 'ArrowRight') { hsv[1] = Math.min(1, hsv[1] + st); }
      else if (e.key === 'ArrowUp') { hsv[2] = Math.min(1, hsv[2] + st); } else if (e.key === 'ArrowDown') { hsv[2] = Math.max(0, hsv[2] - st); } else { used = false; }
      if (used) { e.preventDefault(); commit(); }
    });
    hue.addEventListener('input', function () { hsv[0] = parseInt(hue.value, 10) || 0; commit(); });
    hexIn.addEventListener('input', function () {
      var h = normHex(hexIn.value);
      hexIn.setAttribute('aria-invalid', h || hexIn.value === '' ? 'false' : 'true');
      if (h) { setFromHex(h); }
    });
    hexIn.addEventListener('blur', function () { hexIn.value = normHex(hexIn.value) || hex(); hexIn.setAttribute('aria-invalid', 'false'); });
    copy.addEventListener('click', function () {
      var h = hex();
      var done = function () { msg.textContent = 'Kopiert: ' + h; };
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(h).then(done, function () { hexIn.select(); }); } else { hexIn.select(); }
    });
    function savePalette() {
      var raw = JSON.stringify(palette);
      if (palField) { palField.value = raw; palField.dispatchEvent(new Event('change', { bubbles: true })); }
      else { try { window.localStorage.setItem('mt-cp-palette', raw); } catch (e) { /* kein Speicher */ } }
    }
    function drawPalette() {
      pal.textContent = '';
      palette.forEach(function (c) {
        var li = el('li', 'mt-cp__chip');
        var use = el('button', 'mt-cp__swatch', { type: 'button', 'aria-label': 'Farbe übernehmen: ' + c, title: c }); use.style.background = c;
        use.addEventListener('click', function () { setFromHex(c); });
        var del = el('button', 'mt-cp__del', { type: 'button', 'aria-label': 'Gespeicherte Farbe löschen: ' + c }); del.textContent = '×';
        del.addEventListener('click', function () { palette = removeColor(palette, c); savePalette(); drawPalette(); });
        li.appendChild(use); li.appendChild(del); pal.appendChild(li);
      });
    }
    save.addEventListener('click', function () {
      if (palette.length >= PALETTE_MAX && palette.indexOf(hex()) < 0) { msg.textContent = 'Die Palette ist voll (' + PALETTE_MAX + '). Bitte erst eine Farbe löschen.'; return; }
      palette = addColor(palette, hex()); savePalette(); drawPalette(); msg.textContent = 'Gespeichert: ' + hex();
    });
    input.addEventListener('change', function () { var h = normHex(input.value); if (h && h !== hex()) { hsv = rgbToHsv.apply(null, hexToRgb(h)); paint(h); } });
    drawPalette(); paint(cur || undefined);
  }
  function init() { document.querySelectorAll('input[data-mt-colorpicker]').forEach(mount); }
  api.mount = mount; api.init = init;
  root.MTColorPicker = api;
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})(typeof window !== 'undefined' ? window : this);

/* src/Resources/public/administration/mt/mt-admin-logic.js */
/* MichaThemeV5 Plugin-Oberfläche - reine Logik (Suche, Filter, Prüfung), auch im Node-Test. Kein Schutz, nur Sofort-Hinweise. */
(function (root) {
  'use strict';

  // Suche: klein, Umlaute tolerant (ä = a, ß = ss)
  function fold(s) {
    return String(s === undefined || s === null ? '' : s).toLowerCase()
      .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss');
  }
  function matches(haystack, query) {
    var q = fold(query).trim();
    if (!q) { return true; }
    var h = fold(haystack);
    return q.split(/\s+/).every(function (w) { return h.indexOf(w) >= 0; });
  }
  // Wie viele Felder sichtbar sind -> Text für den Screenreader
  function countText(n, searching) {
    if (n === 0) { return 'Keine Einstellung gefunden'; }
    if (!searching) { return ''; }
    return n === 1 ? '1 Treffer' : n + ' Treffer';
  }
  // Sichtbarkeit eines Feldes: f = {mode, law, dirty, search}, st = {query, expert, onlyChanged, onlyLaw}
  function visible(f, st) {
    if (!st.expert && f.mode === 'expert' && !String(st.query || '').trim()) { return false; }
    if (st.onlyChanged && !f.dirty) { return false; }
    if (st.onlyLaw && !f.law) { return false; }
    return matches(f.search, st.query);
  }

  // Prüfregeln: gleich wie Sanitizer.php (Testfälle in tests/sanitize-cases.json)
  function trim(s) { return s.replace(/^[ \t\n\r]+|[ \t\n\r]+$/g, ''); }
  function cut(s, n) { return Array.from(s).slice(0, n).join(''); }
  function isNumeric(v) {
    if (typeof v === 'number') { return isFinite(v); }
    return typeof v === 'string' && /^\s*[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?\s*$/.test(v);
  }
  function roundAway(x) { return x < 0 ? -Math.round(-x) : Math.round(x); }
  function toBool(v) {
    if (typeof v === 'string') { return ['1', 'true', 'on', 'yes', 'y'].indexOf(v.trim().toLowerCase()) >= 0; }
    return !!v;
  }
  function color(v) {
    if (typeof v !== 'string' || !/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(v)) { return ''; }
    var h = v.slice(1).toLowerCase();
    if (h.length === 3) { h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; }
    return '#' + h;
  }
  function url(v, allowPath) {
    if (typeof v !== 'string') { return ''; }
    v = trim(v);
    if (v === '' || v.length > 2000 || /[\x00-\x20\x7f<>"'\\]/.test(v)) { return ''; }
    if (/^https:\/\/[^\/?#]+/i.test(v)) { return v; }
    return allowPath && /^\/(?!\/)/.test(v) ? v : '';
  }
  function text(v, multi) {
    if (v === null || v === undefined || typeof v === 'object') { return ''; }
    var s = String(v), before;
    do { before = s; s = s.replace(/<[!\/?A-Za-z][^>]*>/g, ''); } while (s !== before);
    s = s.replace(/\r\n?/g, '\n');
    s = s.replace(multi ? /[\x00-\x09\x0b-\x1f\x7f]/g : /[\x00-\x1f\x7f]/g, '');
    return cut(trim(s), multi ? 2000 : 500);
  }
  function sanitize(opt, v) {
    var def = opt.default === undefined ? '' : opt.default;
    switch (opt.type) {
      case 'select': case 'font': {
        var ch = opt.choices || {};
        return (typeof v === 'string' || typeof v === 'number') && Object.prototype.hasOwnProperty.call(ch, String(v)) ? String(v) : def;
      }
      case 'toggle': return toBool(v);
      case 'color': return color(v);
      case 'range': {
        var n = isNumeric(v) ? roundAway(Number(v)) : Math.trunc(Number(def));
        return Math.max(opt.min, Math.min(opt.max, n));
      }
      case 'media': return url(v, true);
      case 'code': return typeof v === 'string' ? cut(v.replace(/\0/g, ''), 20000) : '';
      default:
        if (opt.input === 'page') { var id = isNumeric(v) ? Math.trunc(Number(v)) : 0; return id > 0 ? String(id) : ''; }
        if (opt.input === 'url') { return url(v, true); }
        return text(v, opt.input === 'textarea');
    }
  }
  // Hinweis zu einem Wert (nur Anzeige). Gibt Text oder ''
  function hint(opt, raw) {
    if (opt.type === 'color' && String(raw).trim() !== '' && sanitize(opt, String(raw).trim()) === '') { return 'Bitte eine Farbe wie #c8161a eingeben.'; }
    if ((opt.type === 'media' || opt.input === 'url') && String(raw).trim() !== '' && sanitize(opt, raw) === '') { return 'Bitte eine Adresse mit https:// oder einen Pfad mit / am Anfang eingeben.'; }
    return '';
  }

  // Kontrast (WCAG) - gleiche Rechnung wie ColorContrast.php
  function lum(hex) {
    var c = [1, 3, 5].map(function (i) { var v = parseInt(hex.substr(i, 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function ratio(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function pad(n) { var h = Math.round(n).toString(16); return h.length < 2 ? '0' + h : h; }
  function mix(a, b, pa) { var o = '#'; [1, 3, 5].forEach(function (i) { o += pad(parseInt(a.substr(i, 2), 16) * pa + parseInt(b.substr(i, 2), 16) * (1 - pa)); }); return o; }
  function resolveToken(schema, values, mode, byToken, tok, depth) {
    var cust = color(values.accent_custom || ''); cust = cust ? cust.slice(0, 7) : '';
    if (byToken[tok]) { var v = color(values[byToken[tok]] || ''); if (v) { return [v.slice(0, 7), true]; } }
    if (cust) {
      if (tok === 'accent') { return [cust, true]; }
      if (tok === 'on-accent') { return [lum(cust) > 0.179 ? '#000000' : '#ffffff', true]; }
      if (tok === 'link') { return [mode === 'light' ? mix(cust, '#000000', 0.85) : mix(cust, '#ffffff', 0.6), true]; }
    }
    var accs = schema.accents || {};
    var acc = (accs[values.accent || 'red'] || accs.red || {})[mode] || {};
    var map = { 'accent': 'accent', 'on-accent': 'on-accent', 'link': 'accent-text' };
    if (map[tok] && acc[map[tok]]) { return [acc[map[tok]], false]; }
    var fb = schema.colorFallback || {};
    if (fb[tok] && depth < 3) { return [resolveToken(schema, values, mode, byToken, fb[tok], depth + 1)[0], false]; }
    var t = ((schema.colorTokens || {})[mode] || {})[tok];
    return [t === undefined ? null : t, false];
  }
  // Warnungen für Hell oder Dunkel: nur Regeln, bei denen der Händler mindestens eine Farbe gesetzt hat
  function colorWarnings(schema, values, mode) {
    var byToken = {};
    (schema.options || []).forEach(function (o) { if (o.color && o.color.mode === mode) { byToken[o.color.token] = o.id; } });
    var out = [];
    (schema.colorRules || []).forEach(function (r) {
      var f = resolveToken(schema, values, mode, byToken, r.fg, 0), b = resolveToken(schema, values, mode, byToken, r.bg, 0);
      if (!(f[1] || b[1]) || f[0] === null || b[0] === null) { return; }
      var q = ratio(f[0], b[0]);
      out.push({ label: r.label, fg: r.fg, bg: r.bg, ratio: Math.round(q * 100) / 100, min: r.min, ok: q >= r.min });
    });
    return out;
  }

  var PREVIEW = ['bg', 'surface', 'surface-2', 'text', 'text-muted', 'border-strong', 'link', 'accent', 'on-accent', 'header-bg', 'footer-bg', 'announce-bg', 'danger', 'success', 'warning', 'info', 'focus'];
  function effective(schema, values, mode) {
    var byToken = {}, out = {};
    (schema.options || []).forEach(function (o) { if (o.color && o.color.mode === mode) { byToken[o.color.token] = o.id; } });
    PREVIEW.forEach(function (t) { out[t] = resolveToken(schema, values, mode, byToken, t, 0)[0] || '#808080'; });
    return out;
  }

  var api = { effective: effective, colorWarnings: colorWarnings, contrastRatio: ratio, fold: fold, matches: matches, countText: countText, visible: visible, sanitize: sanitize, hint: hint };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  root.MTAdminLogic = api;
})(typeof window !== 'undefined' ? window : this);

/* src/Resources/app/administration/src/module/michatheme-v5/core.js */
// MichaThemeV5 Admin - gemeinsame Helfer (läuft nur im Shopware-Admin)
(function () {
    'use strict';

    if (typeof Shopware === 'undefined') {
        return;
    }

    var NS = window.MichaThemeV5Admin = window.MichaThemeV5Admin || {};

    // POST an die Admin-API, Token wie bei den Shopware-Aktionen. Fehler kommen als { error } zurück, nie als Wurf
    NS.post = function (loginService, path, body) {
        var client = Shopware.Application.getContainer('init').httpClient;

        return client.post('/_action/micha-theme-v5/' + path, body || {}, {
            headers: { Authorization: 'Bearer ' + loginService.getToken(), 'Content-Type': 'application/json' }
        }).then(function (response) {
            return response && response.data ? response.data : {};
        }).catch(function (error) {
            var data = error && error.response && error.response.data ? error.response.data : {};
            return Object.assign({}, typeof data === 'object' ? data : {}, { error: data.error || 'failed', httpStatus: error && error.response ? error.response.status : 0 });
        });
    };

    // Sprache für Optionstexte (Schema de/en)
    NS.lang = function () {
        var l = '';
        try {
            l = String(Shopware.State.get('session').currentLocale || '');
        } catch (e) {
            l = '';
        }

        return l.indexOf('en') === 0 ? 'en' : 'de';
    };

    // Datum aus dem Lizenzserver (ISO) lokal anzeigen
    NS.date = function (iso) {
        var d = new Date(iso);
        if (isNaN(d.getTime())) {
            return '';
        }
        var locale = 'de-DE';
        try {
            locale = Shopware.State.get('session').currentLocale || locale;
        } catch (e) {
            locale = 'de-DE';
        }

        return d.toLocaleDateString(locale);
    };

    // Rechte: ohne ACL-Dienst (z. B. Test) gilt erlaubt, der Server prüft sowieso
    NS.can = function (acl, privilege) {
        try {
            return acl && typeof acl.can === 'function' ? !!acl.can(privilege) : true;
        } catch (e) {
            return true;
        }
    };

    // Übersetzung mit Rückfall (z. B. neue Farbnamen)
    NS.tr = function (vm, key, fallback) {
        try {
            return typeof vm.$te === 'function' && vm.$te(key) ? vm.$tc(key) : fallback;
        } catch (e) {
            return fallback;
        }
    };
})();

/* src/Resources/app/administration/src/module/michatheme-v5/style.js */
// Stile der MichaThemeV5-Seiten (als Text, damit kein zweites Laden nötig ist)
// Farbwähler-CSS aus mt-colorpicker.css eingebettet (Test prüft, dass es gleich bleibt)
(function () {
    'use strict';

    var STYLE_ID = 'micha-theme-v5-admin-style';
    var CSS = "/* MichaThemeV5 Colorpicker - dunkles Anthrazit, nur Backend. Farben im Picker selbst sind Daten, der Rahmen nutzt eigene Variablen */\n.mt-cp { --cp-bg: #1c1d20; --cp-surface: #2d2f34; --cp-border: #80858d; --cp-text: #ececee; --cp-focus: #ffffff; display: grid; gap: .75rem; max-width: 18rem; padding: .75rem; background: var(--cp-bg); color: var(--cp-text); border: 1px solid var(--cp-border); border-radius: 12px; font: inherit; }\n.mt-cp__area { position: relative; height: 9rem; border-radius: 8px; cursor: crosshair; touch-action: none; }\n.mt-cp__knob { position: absolute; width: 20px; height: 20px; margin: -10px 0 0 -10px; border: 3px solid #fff; border-radius: 50%; box-shadow: 0 0 0 1px #000, 0 1px 4px rgba(0,0,0,.5); pointer-events: none; }\n.mt-cp__hue { width: 100%; height: 1.25rem; margin: 0; accent-color: var(--cp-text); background: linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00); border-radius: 999px; appearance: none; -webkit-appearance: none; }\n.mt-cp__hue::-webkit-slider-thumb { -webkit-appearance: none; width: 24px; height: 24px; border-radius: 50%; background: #fff; border: 2px solid #000; }\n.mt-cp__hue::-moz-range-thumb { width: 20px; height: 20px; border-radius: 50%; background: #fff; border: 2px solid #000; }\n.mt-cp__row { display: flex; gap: .5rem; }\n.mt-cp__hex { flex: 1; min-width: 0; min-height: 44px; padding: 0 .75rem; background: var(--cp-surface); color: var(--cp-text); border: 1px solid var(--cp-border); border-radius: 8px; font: inherit; font-family: ui-monospace, Menlo, Consolas, monospace; }\n.mt-cp__hex[aria-invalid=\"true\"] { border-width: 2px; border-style: dashed; }\n.mt-cp__btn { min-height: 44px; padding: 0 .9rem; background: var(--cp-surface); color: var(--cp-text); border: 1px solid var(--cp-border); border-radius: 8px; font: inherit; cursor: pointer; }\n.mt-cp__btn:hover { background: #3b3d43; }\n.mt-cp__msg { margin: 0; min-height: 1.25rem; font-size: .875rem; color: var(--cp-text); }\n.mt-cp__palette { display: flex; flex-wrap: wrap; gap: .5rem; list-style: none; margin: 0; padding: 0; }\n.mt-cp__chip { position: relative; display: flex; }\n.mt-cp__swatch { width: 44px; height: 44px; border: 2px solid var(--cp-border); border-radius: 8px; cursor: pointer; padding: 0; }\n.mt-cp__del { position: absolute; top: -.4rem; right: -.4rem; width: 24px; height: 24px; padding: 0; border: 1px solid var(--cp-border); border-radius: 50%; background: var(--cp-bg); color: var(--cp-text); line-height: 1; cursor: pointer; }\n.mt-cp :focus-visible { outline: 2px solid var(--cp-focus); outline-offset: 2px; }\n/* Seiten von MichaThemeV5 im Shopware-Admin */\n.mt-sw-page { --mt-sw-text: #1f2933; --mt-sw-muted: #52606d; --mt-sw-line: #6b7785; --mt-sw-soft: #c9d1d9; --mt-sw-focus: #0b5cad; --mt-sw-ok: #0f6b3a; --mt-sw-bad: #a4262c; --mt-sw-bg: #f4f6f8; color: var(--mt-sw-text); }\n.mt-sw-page *:focus-visible { outline: 3px solid var(--mt-sw-focus); outline-offset: 2px; }\n.mt-sw-page h3 { margin: 0 0 8px; font-size: 16px; }\n.mt-sw-page p { margin: 0 0 8px; }\n.mt-sw-muted { color: var(--mt-sw-muted); }\n.mt-sw-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }\n.mt-sw-nav ul { display: flex; flex-wrap: wrap; gap: 4px; margin: 0 0 16px; padding: 0; list-style: none; border-bottom: 1px solid var(--mt-sw-soft); }\n.mt-sw-nav a { display: inline-flex; align-items: center; min-height: 44px; padding: 0 16px; color: var(--mt-sw-text); text-decoration: none; border-bottom: 3px solid transparent; }\n.mt-sw-nav a:hover { background: var(--mt-sw-bg); }\n.mt-sw-nav a[aria-current=\"page\"] { font-weight: 700; border-bottom-color: var(--mt-sw-focus); }\n.mt-sw-note { padding: 10px 14px; margin: 0 0 16px; border: 1px solid var(--mt-sw-line); border-left-width: 5px; border-radius: 4px; background: #fff; }\n.mt-sw-note--ok { border-left-color: var(--mt-sw-ok); }\n.mt-sw-note--bad { border-left-color: var(--mt-sw-bad); }\n.mt-sw-note--info { border-left-color: var(--mt-sw-focus); }\n.mt-sw-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 24px; margin-bottom: 12px; }\n.mt-sw-btn { min-height: 44px; padding: 0 16px; border: 1px solid var(--mt-sw-line); border-radius: 4px; background: #fff; color: var(--mt-sw-text); font: inherit; cursor: pointer; }\n.mt-sw-btn:hover:not(:disabled) { background: var(--mt-sw-bg); }\n.mt-sw-btn:disabled { opacity: .55; cursor: not-allowed; }\n.mt-sw-btn--primary { background: #0b5cad; border-color: #0b5cad; color: #fff; }\n.mt-sw-btn--primary:hover:not(:disabled) { background: #084a8c; }\n.mt-sw-btn--quiet { border-color: transparent; background: transparent; text-decoration: underline; }\n.mt-sw-input, .mt-sw-select, .mt-sw-textarea { box-sizing: border-box; width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--mt-sw-line); border-radius: 4px; background: #fff; color: var(--mt-sw-text); font: inherit; }\n.mt-sw-textarea { min-height: 96px; resize: vertical; }\n.mt-sw-input[aria-invalid=\"true\"] { border: 2px dashed var(--mt-sw-bad); }\n.mt-sw-presets { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; margin: 0; padding: 0; list-style: none; }\n.mt-sw-preset { display: flex; flex-direction: column; gap: 8px; padding: 14px; border: 1px solid var(--mt-sw-soft); border-radius: 6px; background: #fff; }\n.mt-sw-preset h3 { margin: 0; font-size: 15px; }\n.mt-sw-preset p { flex: 1; }\n.mt-sw-chips { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 20px; }\n.mt-sw-seg { display: inline-flex; border: 1px solid var(--mt-sw-line); border-radius: 4px; overflow: hidden; }\n.mt-sw-seg label { display: inline-flex; align-items: center; min-height: 42px; padding: 0 16px; cursor: pointer; }\n.mt-sw-seg input { position: absolute; opacity: 0; width: 1px; height: 1px; }\n.mt-sw-seg input:checked + span { font-weight: 700; }\n.mt-sw-seg label:has(input:checked) { background: #0b5cad; color: #fff; }\n.mt-sw-seg label:has(input:focus-visible) { outline: 3px solid var(--mt-sw-focus); outline-offset: -3px; }\n.mt-sw-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px 28px; }\n.mt-sw-field { display: flex; flex-direction: column; gap: 4px; min-width: 0; }\n.mt-sw-field--wide { grid-column: 1 / -1; }\n.mt-sw-field > label, .mt-sw-field > .mt-sw-label { font-weight: 600; }\n.mt-sw-help { margin: 0; font-size: 13px; color: var(--mt-sw-muted); }\n.mt-sw-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 12px; font-size: 13px; color: var(--mt-sw-muted); }\n.mt-sw-tag { display: inline-block; padding: 1px 8px; border: 1px solid var(--mt-sw-line); border-radius: 10px; font-size: 12px; color: var(--mt-sw-text); }\n.mt-sw-check { display: flex; align-items: center; gap: 10px; min-height: 44px; }\n.mt-sw-check input { width: 24px; height: 24px; margin: 0; }\n.mt-sw-unit { display: flex; align-items: center; gap: 8px; }\n.mt-sw-unit .mt-sw-input { max-width: 10rem; }\n.mt-sw-color { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }\n.mt-sw-color__swatch { flex: none; width: 32px; height: 32px; border: 2px solid var(--mt-sw-line); border-radius: 6px; background: repeating-conic-gradient(#d9dee3 0 25%, #fff 0 50%) 0 0 / 12px 12px; }\n.mt-sw-color__hex { width: auto; flex: 1 1 6rem; min-width: 6rem; max-width: 9rem; font-family: ui-monospace, Menlo, Consolas, monospace; }\n.mt-sw-color__panel { flex-basis: 100%; }\n.mt-sw-table { width: 100%; border-collapse: collapse; }\n.mt-sw-table th, .mt-sw-table td { padding: 8px 10px; text-align: left; vertical-align: middle; border-bottom: 1px solid var(--mt-sw-soft); }\n.mt-sw-table thead th { font-weight: 700; }\n.mt-sw-warn { margin: 0; padding: 0; list-style: none; }\n.mt-sw-warn li { padding: 4px 0; }\n.mt-sw-warn .mt-sw-bad { color: var(--mt-sw-bad); font-weight: 700; }\n.mt-sw-warn .mt-sw-good { color: var(--mt-sw-ok); }\n.mt-sw-previews { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; margin-top: 12px; }\n.mt-sw-pv { padding: 14px; border: 1px solid; border-radius: 6px; }\n.mt-sw-pv__card { display: flex; flex-direction: column; gap: 8px; padding: 12px; border: 1px solid; border-radius: 6px; }\n.mt-sw-pv__bar { display: block; height: 8px; width: 80%; border-radius: 4px; }\n.mt-sw-pv__bar--short { width: 50%; }\n.mt-sw-pv__bar--link { width: 30%; height: 4px; }\n.mt-sw-pv__btn { display: inline-flex; align-items: center; justify-content: center; width: 40%; height: 28px; border: 1px solid transparent; border-radius: 6px; }\n.mt-sw-pv__bar--btn { width: 50%; height: 6px; }\n.mt-sw-status { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 12px; }\n.mt-sw-status h3 { margin: 0; font-size: 18px; }\n.mt-sw-dl { display: grid; grid-template-columns: max-content 1fr; gap: 6px 20px; margin: 0; }\n.mt-sw-dl dt { font-weight: 600; }\n.mt-sw-dl dd { margin: 0; }\n.mt-sw-pre { max-height: 360px; overflow: auto; margin: 0; padding: 12px; border: 1px solid var(--mt-sw-soft); border-radius: 4px; background: var(--mt-sw-bg); white-space: pre-wrap; font: 13px/1.5 ui-monospace, Menlo, Consolas, monospace; }\n.mt-sw-links { display: flex; flex-wrap: wrap; gap: 8px 20px; margin: 0; padding: 0; list-style: none; }\n.mt-sw-cat { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }\n.mt-sw-cat__item { --mt-sw-accent: #6b7785; display: flex; flex-direction: column; gap: 8px; padding: 16px; border: 1px solid var(--mt-sw-soft); border-left: 4px solid var(--mt-sw-accent); border-radius: 6px; background: #fff; }\n.mt-sw-cat__head { display: flex; align-items: center; gap: 10px; }\n.mt-sw-cat__head h3 { margin: 0; }\n.mt-sw-cat__icon { flex: none; width: 36px; height: 36px; border-radius: 6px; object-fit: cover; }\n.mt-sw-cat__icon--fallback { display: flex; align-items: center; justify-content: center; background: #eef2f6; font-weight: 700; }\n.mt-sw-cat__image { display: block; width: 100%; max-height: 160px; object-fit: cover; border-radius: 4px; }\n.mt-sw-cat__badges { display: flex; flex-wrap: wrap; gap: 6px; margin: 0; padding: 0; list-style: none; }\n.mt-sw-cat__text { flex: 1; margin: 0; }\n.mt-sw-cat__links { display: flex; flex-wrap: wrap; gap: 6px 14px; margin: 0; }\n.mt-sw-page a { color: #0b5cad; }\n@media (prefers-reduced-motion: reduce) { .mt-sw-page * { transition: none !important; animation: none !important; } }\n";

    window.MichaThemeV5Admin = window.MichaThemeV5Admin || {};
    window.MichaThemeV5Admin.addStyle = function () {
        if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) {
            return;
        }
        var el = document.createElement('style');
        el.id = STYLE_ID;
        el.textContent = CSS;
        document.head.appendChild(el);
    };
})();

var deDE = {"michatheme-v5": {"menuTitle": "MichaThemeV5", "description": "Einstellungen, Lizenz und Plugin-Empfehlungen für das Theme", "nav": {"label": "Bereiche von MichaThemeV5", "settings": "Einstellungen", "license": "Lizenzen", "catalog": "Plugin-Empfehlungen", "info": "Info"}, "common": {"loading": "Wird geladen ...", "loadFailed": "Die Daten konnten nicht geladen werden. Bitte die Seite neu laden oder später noch einmal versuchen.", "readOnly": "Sie haben nur Leserechte. Ändern ist nicht möglich.", "noTheme": "Das Theme MichaThemeV5 wurde nicht gefunden. Bitte unter Erweiterungen prüfen, ob das Plugin installiert und aktiv ist.", "newTab": "(öffnet in neuem Tab)", "themeSelect": "Theme-Variante", "themeChild": "Kind-Theme", "dismiss": "Schließen"}, "settings": {"title": "Einstellungen", "save": "Speichern", "saving": "Wird gespeichert. Das Theme wird neu übersetzt, das kann bis zu einer Minute dauern.", "saved": "Gespeichert. Die Änderungen sind im Shop sichtbar, sobald das Theme übersetzt ist.", "savedCorrected": "Gespeichert. 1 ungültige Angabe wurde nicht übernommen und steht wieder auf Standard. | Gespeichert. {count} ungültige Angaben wurden nicht übernommen und stehen wieder auf Standard.", "saveFailed": "Speichern hat nicht geklappt. Bitte noch einmal versuchen. Details stehen im Shopware-Log.", "unsaved": "Keine Änderung | 1 Änderung nicht gespeichert | {count} Änderungen nicht gespeichert", "leave": "Es gibt ungespeicherte Änderungen. Seite wirklich verlassen?", "intro": "Alle Werte liegen in der normalen Theme-Konfiguration (Inhalte, Themes). Beide Wege ändern dasselbe."}, "presets": {"title": "Design-Presets", "intro": "Ein Preset setzt mehrere Einstellungen auf einmal. Es wirkt erst nach „Speichern“ und lässt sich vorher noch ändern.", "apply": "Preset anwenden", "applyNamed": "Preset „{name}“ anwenden", "applied": "Preset „{name}“ angewendet: 1 Einstellung geändert. Noch nicht gespeichert. | Preset „{name}“ angewendet: {count} Einstellungen geändert. Noch nicht gespeichert.", "appliedNone": "Preset „{name}“ angewendet. Es war nichts zu ändern.", "missing": "Auf Shopware nicht enthalten: {list}.", "sets": "Setzt:", "standard": {"label": "Standard", "help": "Die Grundeinstellung: Akzent Rot, weiche Ecken, normale Abstände, weiche Schatten, gefüllte Buttons. Eigene Farben werden geleert."}, "glass": {"label": "Glas", "help": "Runde Ecken und weiche Schatten. Der Glas-Effekt für Flächen kommt mit einem späteren Update des Shopware-Themes."}, "compact": {"label": "Kompakt", "help": "Weniger Abstand und eckigere Ecken: mehr Produkte auf einen Blick. Die breitere Inhaltsbreite kommt mit einem späteren Update."}}, "filter": {"title": "Suchen und filtern", "search": "Einstellung suchen", "placeholder": "z. B. Akzentfarbe, Schrift, Header", "mode": "Umfang", "simple": "Einfach", "expert": "Experte", "onlyChanged": "Nur geänderte", "results": "Keine Einstellung gefunden | 1 Treffer | {count} Treffer", "simpleHint": "Im Modus „Einfach“ sehen Sie die wichtigsten Einstellungen. „Experte“ zeigt alle."}, "field": {"reset": "Zurücksetzen", "resetNamed": "{name} auf Standard zurücksetzen", "default": "Standard: {value}", "defaultEmpty": "leer", "law": "Pflichtangabe, bitte mit Bedacht ändern.", "changed": "geändert", "on": "an", "off": "aus", "mediaId": "Medien-ID", "mediaHelp": "Wählen Sie ein Bild aus der Medienverwaltung.", "mediaFallback": "Medien-ID (aus Inhalte, Medien)", "invalidColor": "Bitte eine Farbe wie #c8161a eingeben."}, "colors": {"title": "Eigene Farben", "intro": "Leer lassen heißt: Standardfarbe des Themes. Hell und Dunkel sind getrennt einstellbar. Die Prüfung unten zeigt, ob Texte lesbar bleiben.", "color": "Farbe", "light": "Hell", "dark": "Dunkel", "open": "Farbwähler öffnen", "close": "Farbwähler schließen", "clear": "Leeren", "hexLabel": "{name} ({mode}), Farbwert als HEX", "warnings": "Kontrast-Prüfung", "warningsHint": "Geprüft werden nur Paare, bei denen Sie eine Farbe gesetzt haben (Ziel: mindestens 4,5 zu 1 für Text).", "warnOk": "in Ordnung", "warnLow": "zu niedrig", "warnNone": "Keine eigenen Farben gesetzt, nichts zu prüfen.", "warnMode": "{mode}: {label}, Kontrast {ratio} zu 1 (nötig {min}), {state}", "preview": "Vorschau", "previewMode": "Vorschau {mode}", "palette": "Palette", "paletteHint": "Der Farbwähler speichert bis zu 12 Farben für den ganzen Shop. Sie erscheinen in jedem Farbwähler.", "paletteSaved": "Palette gespeichert.", "paletteFailed": "Die Palette konnte nicht gespeichert werden.", "accentCheck": "Akzentfarbe: Kontrast Hell {light} zu 1, Dunkel {dark} zu 1 ({state}).", "token": {"bg": "Seitenhintergrund", "surface": "Fläche", "surface_2": "Fläche 2", "text": "Text", "text_muted": "Text gedämpft", "border_strong": "Rahmen", "link": "Link", "on_accent": "Button-Text", "header_bg": "Kopfzeile", "footer_bg": "Fußzeile", "announce_bg": "Ankündigungsleiste", "danger": "Sale/Fehler", "success": "Erfolg", "warning": "Warnung", "info": "Info", "focus": "Fokusrahmen"}}, "license": {"title": "Lizenzen", "statusTitle": "Lizenzstatus", "status": {"free": "Free aktiv", "active": "Pro aktiv", "problem": "Lizenz nicht aktiv"}, "tier": "Stufe: {tier}", "validUntil": "Gültig bis {date}.", "modules": "Gebuchte Module: {list}.", "grace": "Der Lizenzserver war nicht erreichbar, es gilt der zuletzt geprüfte Stand.", "domain": "Geprüft für die Domain {domain}. Die Lizenz gilt für die Domain, die in der Lizenz hinterlegt ist.", "reason": {"no_token": "Kein Lizenzcode eingetragen. Das Theme läuft mit allen Free-Funktionen.", "unreachable": "Der Lizenzserver ist gerade nicht erreichbar. Free-Funktionen bleiben aktiv, Ihr Shop läuft normal weiter.", "token_expired": "Die Lizenz ist abgelaufen. Free-Funktionen bleiben aktiv.", "token_revoked": "Die Lizenz wurde widerrufen oder gekündigt. Free-Funktionen bleiben aktiv.", "domain_mismatch": "Dieser Lizenzcode gilt nicht für diese Domain. Free-Funktionen bleiben aktiv.", "signature_invalid": "Der Lizenzcode ist nicht gültig. Bitte prüfen, ob er vollständig kopiert wurde.", "token_malformed": "Der Lizenzcode sieht nicht richtig aus. Bitte vollständig aus dem Kundenkonto kopieren.", "unknown_tier": "Die Lizenz gehört zu keiner bekannten Stufe. Free-Funktionen bleiben aktiv.", "other": "Die Lizenz ist ungültig. Free-Funktionen bleiben aktiv."}, "codeTitle": "Lizenzcode", "codeLabel": "Lizenzcode einfügen", "codeHelp": "Den Code finden Sie im Kundenkonto auf theme.michael-gahn.de. Nach dem Speichern wird er nie mehr im Klartext angezeigt.", "show": "Eingabe anzeigen", "stored": "Eingetragener Code: {masked}", "storedNone": "Es ist noch kein Lizenzcode eingetragen.", "saveCheck": "Speichern und prüfen", "recheck": "Jetzt prüfen", "remove": "Lizenzcode entfernen", "removeConfirm": "Lizenzcode wirklich entfernen? Pro-Funktionen sind danach aus.", "saved": "Lizenzcode gespeichert und geprüft.", "removed": "Lizenzcode entfernt.", "rechecked": "Lizenz neu geprüft.", "throttled": "Bitte kurz warten und noch einmal prüfen.", "errorFormat": "Der Code sieht nicht richtig aus. Er besteht aus drei Teilen mit Punkten. Bitte vollständig kopieren.", "errorFailed": "Das hat nicht geklappt. Bitte später noch einmal versuchen.", "saving": "Wird gespeichert. Das Theme wird neu übersetzt, das kann bis zu einer Minute dauern.", "buyTitle": "Lizenz kaufen oder verwalten", "buyText": "Pro-Funktionen und Updates gibt es auf der Website. Im Kundenkonto finden Sie danach den Lizenzcode.", "buyLink": "Zu theme.michael-gahn.de", "privacy": "Zur Prüfung gehen nur Lizenzcode und Domain an theme.michael-gahn.de. Besucher Ihres Shops sind nicht betroffen."}, "catalog": {"title": "Plugin-Empfehlungen", "intro": "Weitere Plugins von Michael Gahn DESIGN. Es wird nichts automatisch installiert. Zum Installieren laden Sie das ZIP herunter und laden es unter Erweiterungen, Meine Erweiterungen hoch.", "refresh": "Liste aktualisieren", "loading": "Liste wird geladen ...", "unavailable": "Die Liste ist gerade nicht erreichbar. Ihr Shop läuft ganz normal weiter. Bitte später noch einmal versuchen.", "stale": "Achtung: Die Liste konnte nicht neu geladen werden. Sie sehen den letzten bekannten Stand.", "throttled": "Bitte kurz warten, die Liste wurde gerade erst aktualisiert.", "empty": "Im Moment gibt es keine weiteren Plugins für Shopware 6.", "recommended": "Empfohlen", "free": "Kostenlos", "paid": "Kostenpflichtig", "announced": "Demnächst", "version": "Version", "download": "ZIP herunterladen", "details": "Mehr erfahren", "source": "Quelltext auf GitHub", "updatedAt": "Stand:", "privacy": "Hinweis: Zum Anzeigen der Bilder lädt Ihr Browser Dateien von theme.michael-gahn.de. Dabei sieht der Server Ihre IP-Adresse."}, "info": {"title": "Info", "versions": "Versionen", "plugin": "Plugin und Theme (eine Einheit)", "shopware": "Shopware", "php": "PHP", "schema": "Einstellungs-Schema", "status": "Zustand", "channels": "Verkaufskanäle mit diesem Theme", "channelsNone": "Dem Theme ist noch kein Verkaufskanal zugewiesen. Das Zuweisen ist ein bewusster Klick unter Inhalte, Themes.", "channelsOpen": "Theme-Manager öffnen (Inhalte, Themes)", "changelog": "Was ist neu", "changelogNone": "Kein Changelog gefunden.", "links": "Links", "linkShop": "Website und Kundenkonto", "linkSupport": "Support", "linkSource": "Quelltext auf GitHub", "ok": "in Ordnung", "themeFound": "Theme gefunden und aktiv im System", "assigned": "Theme ist Verkaufskanälen zugewiesen", "licenseKnown": "Lizenzstatus: {state}"}}};

var enGB = {"michatheme-v5": {"menuTitle": "MichaThemeV5", "description": "Settings, license and plugin recommendations for the theme", "nav": {"label": "MichaThemeV5 sections", "settings": "Settings", "license": "Licenses", "catalog": "Plugin recommendations", "info": "Info"}, "common": {"loading": "Loading ...", "loadFailed": "The data could not be loaded. Please reload the page or try again later.", "readOnly": "You have read-only access. Changing is not possible.", "noTheme": "The MichaThemeV5 theme was not found. Please check under Extensions that the plugin is installed and active.", "newTab": "(opens in a new tab)", "themeSelect": "Theme variant", "themeChild": "child theme", "dismiss": "Close"}, "settings": {"title": "Settings", "save": "Save", "saving": "Saving. The theme is being recompiled, this can take up to a minute.", "saved": "Saved. The changes show in the shop as soon as the theme is compiled.", "savedCorrected": "Saved. 1 invalid entry was not accepted and is back to default. | Saved. {count} invalid entries were not accepted and are back to default.", "saveFailed": "Saving did not work. Please try again. Details are in the Shopware log.", "unsaved": "No changes | 1 change not saved | {count} changes not saved", "leave": "There are unsaved changes. Really leave this page?", "intro": "All values are stored in the normal theme configuration (Content, Themes). Both ways change the same thing."}, "presets": {"title": "Design presets", "intro": "A preset sets several settings at once. It only takes effect after “Save” and can still be changed before.", "apply": "Apply preset", "applyNamed": "Apply preset “{name}”", "applied": "Preset “{name}” applied: 1 setting changed. Not saved yet. | Preset “{name}” applied: {count} settings changed. Not saved yet.", "appliedNone": "Preset “{name}” applied. Nothing needed to change.", "missing": "Not available on Shopware: {list}.", "sets": "Sets:", "standard": {"label": "Default", "help": "The default: red accent, soft corners, normal spacing, soft shadows, solid buttons. Custom colors are cleared."}, "glass": {"label": "Glass", "help": "Round corners and soft shadows. The glass effect for surfaces comes with a later update of the Shopware theme."}, "compact": {"label": "Compact", "help": "Less spacing and sharper corners: more products at a glance. The wider content width comes with a later update."}}, "filter": {"title": "Search and filter", "search": "Search settings", "placeholder": "e.g. accent color, font, header", "mode": "Scope", "simple": "Simple", "expert": "Expert", "onlyChanged": "Changed only", "results": "No setting found | 1 match | {count} matches", "simpleHint": "“Simple” shows the most important settings. “Expert” shows all of them."}, "field": {"reset": "Reset", "resetNamed": "Reset {name} to default", "default": "Default: {value}", "defaultEmpty": "empty", "law": "Legally required, please change with care.", "changed": "changed", "on": "on", "off": "off", "mediaId": "Media ID", "mediaHelp": "Choose an image from the media library.", "mediaFallback": "Media ID (from Content, Media)", "invalidColor": "Please enter a color like #c8161a."}, "colors": {"title": "Custom colors", "intro": "Leave empty to keep the theme default. Light and dark are set separately. The check below shows whether text stays readable.", "color": "Color", "light": "Light", "dark": "Dark", "open": "Open color picker", "close": "Close color picker", "clear": "Clear", "hexLabel": "{name} ({mode}), color value as HEX", "warnings": "Contrast check", "warningsHint": "Only pairs where you set a color are checked (goal: at least 4.5 to 1 for text).", "warnOk": "OK", "warnLow": "too low", "warnNone": "No custom colors set, nothing to check.", "warnMode": "{mode}: {label}, contrast {ratio} to 1 (needed {min}), {state}", "preview": "Preview", "previewMode": "Preview {mode}", "palette": "Palette", "paletteHint": "The color picker stores up to 12 colors for the whole shop. They appear in every color picker.", "paletteSaved": "Palette saved.", "paletteFailed": "The palette could not be saved.", "accentCheck": "Accent color: contrast light {light} to 1, dark {dark} to 1 ({state}).", "token": {"bg": "Page background", "surface": "Surface", "surface_2": "Surface 2", "text": "Text", "text_muted": "Muted text", "border_strong": "Border", "link": "Link", "on_accent": "Button text", "header_bg": "Header", "footer_bg": "Footer", "announce_bg": "Announcement bar", "danger": "Sale/error", "success": "Success", "warning": "Warning", "info": "Info", "focus": "Focus ring"}}, "license": {"title": "Licenses", "statusTitle": "License status", "status": {"free": "Free active", "active": "Pro active", "problem": "License not active"}, "tier": "Tier: {tier}", "validUntil": "Valid until {date}.", "modules": "Booked modules: {list}.", "grace": "The license server was not reachable, the last checked state applies.", "domain": "Checked for the domain {domain}. The license applies to the domain stored in the license.", "reason": {"no_token": "No license code entered. The theme runs with all free features.", "unreachable": "The license server is not reachable right now. Free features stay active, your shop keeps running.", "token_expired": "The license has expired. Free features stay active.", "token_revoked": "The license was revoked or cancelled. Free features stay active.", "domain_mismatch": "This license code is not valid for this domain. Free features stay active.", "signature_invalid": "The license code is not valid. Please check that it was copied completely.", "token_malformed": "The license code does not look right. Please copy it completely from your customer account.", "unknown_tier": "The license belongs to no known tier. Free features stay active.", "other": "The license is invalid. Free features stay active."}, "codeTitle": "License code", "codeLabel": "Paste license code", "codeHelp": "You find the code in your customer account on theme.michael-gahn.de. After saving it is never shown in plain text again.", "show": "Show input", "stored": "Stored code: {masked}", "storedNone": "No license code stored yet.", "saveCheck": "Save and check", "recheck": "Check now", "remove": "Remove license code", "removeConfirm": "Really remove the license code? Pro features are off afterwards.", "saved": "License code saved and checked.", "removed": "License code removed.", "rechecked": "License checked again.", "throttled": "Please wait a moment and check again.", "errorFormat": "The code does not look right. It has three parts separated by dots. Please copy it completely.", "errorFailed": "That did not work. Please try again later.", "saving": "Saving. The theme is being recompiled, this can take up to a minute.", "buyTitle": "Buy or manage a license", "buyText": "Pro features and updates are available on the website. Afterwards you find the license code in your customer account.", "buyLink": "Go to theme.michael-gahn.de", "privacy": "Only the license code and the domain are sent to theme.michael-gahn.de for checking. Visitors of your shop are not affected."}, "catalog": {"title": "Plugin recommendations", "intro": "More plugins by Michael Gahn DESIGN. Nothing is installed automatically. To install, download the ZIP and upload it under Extensions, My extensions.", "refresh": "Refresh list", "loading": "Loading list ...", "unavailable": "The list is not reachable right now. Your shop keeps running normally. Please try again later.", "stale": "Note: The list could not be refreshed. You see the last known state.", "throttled": "Please wait a moment, the list was just refreshed.", "empty": "There are no further plugins for Shopware 6 at the moment.", "recommended": "Recommended", "free": "Free", "paid": "Paid", "announced": "Coming soon", "version": "Version", "download": "Download ZIP", "details": "Learn more", "source": "Source code on GitHub", "updatedAt": "As of:", "privacy": "Note: To show the images your browser loads files from theme.michael-gahn.de. The server sees your IP address."}, "info": {"title": "Info", "versions": "Versions", "plugin": "Plugin and theme (one unit)", "shopware": "Shopware", "php": "PHP", "schema": "Settings schema", "status": "Status", "channels": "Sales channels using this theme", "channelsNone": "No sales channel is assigned to the theme yet. Assigning is a deliberate click under Content, Themes.", "channelsOpen": "Open theme manager (Content, Themes)", "changelog": "What is new", "changelogNone": "No changelog found.", "links": "Links", "linkShop": "Website and customer account", "linkSupport": "Support", "linkSource": "Source code on GitHub", "ok": "OK", "themeFound": "Theme found and active in the system", "assigned": "Theme is assigned to sales channels", "licenseKnown": "License status: {state}"}}};

/* src/Resources/app/administration/src/module/michatheme-v5/locale.js */
// Texte de-DE und en-GB (Schlüssel gleich, Test prüft das)

(function () {
    'use strict';

    if (typeof Shopware === 'undefined') {
        return;
    }

    Shopware.Locale.extend('de-DE', deDE);
    Shopware.Locale.extend('en-GB', enGB);
})();

/* src/Resources/app/administration/src/module/michatheme-v5/acl.js */
// Rechte-Gruppe "MichaThemeV5" in der Rollenverwaltung (Einstellungen, Benutzer & Berechtigungen)
(function () {
    'use strict';

    if (typeof Shopware === 'undefined' || !Shopware.Service || !Shopware.Service('privileges')) {
        return;
    }

    Shopware.Service('privileges').addPrivilegeMappingEntry({
        category: 'additional_permissions',
        parent: null,
        key: 'michatheme_v5',
        roles: {
            viewer: {
                privileges: ['theme:read', 'theme_sales_channel:read', 'sales_channel:read', 'sales_channel_domain:read', 'media:read', 'system_config:read'],
                dependencies: []
            },
            editor: {
                privileges: ['theme:update', 'system_config:update', 'system_config:create'],
                dependencies: ['michatheme_v5.viewer']
            }
        }
    });
})();

/* src/Resources/app/administration/src/module/michatheme-v5/component/mt-sw-nav.js */
// Reiter-Navigation der vier Seiten (echte Links, aktuelle Seite per aria-current)
(function () {
    'use strict';

    if (typeof Shopware === 'undefined') {
        return;
    }

    Shopware.Component.register('mt-sw-nav', {
        template: `
<nav class="mt-sw-nav" :aria-label="$tc('michatheme-v5.nav.label')">
    <ul>
        <li v-for="item in items" :key="item.name">
            <router-link :to="{ name: item.name }">{{ $tc(item.label) }}</router-link>
        </li>
    </ul>
</nav>`,

        data: function () {
            return {
                items: [
                    { name: 'michatheme.v5.settings', label: 'michatheme-v5.nav.settings' },
                    { name: 'michatheme.v5.license', label: 'michatheme-v5.nav.license' },
                    { name: 'michatheme.v5.catalog', label: 'michatheme-v5.nav.catalog' },
                    { name: 'michatheme.v5.info', label: 'michatheme-v5.nav.info' }
                ]
            };
        }
    });
})();

/* src/Resources/app/administration/src/module/michatheme-v5/component/mt-sw-color.js */
// Farbfeld: Farbfeld-Vorschau + HEX + Farbwähler aus dem Kern (MTColorPicker.mount), Palette gemeinsam im ganzen Shop
(function () {
    'use strict';

    if (typeof Shopware === 'undefined') {
        return;
    }

    var uid = 0;

    Shopware.Component.register('mt-sw-color', {
        template: `
<div class="mt-sw-color">
    <span class="mt-sw-color__swatch" :style="swatchStyle" aria-hidden="true"></span>
    <input class="mt-sw-input mt-sw-color__hex" type="text" :id="inputId" :value="text" maxlength="9"
           spellcheck="false" autocomplete="off" :disabled="disabled"
           :aria-label="label" :aria-invalid="invalid ? 'true' : 'false'"
           @input="onType($event.target.value)" @blur="onBlur">
    <button type="button" class="mt-sw-btn" :disabled="disabled" :aria-expanded="open ? 'true' : 'false'" :aria-controls="panelId"
            :aria-label="(open ? $tc('michatheme-v5.colors.close') : $tc('michatheme-v5.colors.open')) + ': ' + label" @click="toggle">
        {{ open ? $tc('michatheme-v5.colors.close') : $tc('michatheme-v5.colors.open') }}
    </button>
    <button v-if="value" type="button" class="mt-sw-btn mt-sw-btn--quiet" :disabled="disabled" :aria-label="$tc('michatheme-v5.colors.clear') + ': ' + label" @click="$emit('update', '')">
        {{ $tc('michatheme-v5.colors.clear') }}
    </button>
    <p v-if="invalid" class="mt-sw-help" role="status">{{ $tc('michatheme-v5.field.invalidColor') }}</p>
    <div v-if="open" :id="panelId" class="mt-sw-color__panel">
        <input ref="cp" type="hidden" data-mt-colorpicker data-mt-palette-field="mt-sw-palette-field" :value="value" @input="onPick($event.target.value)">
    </div>
</div>`,

        props: {
            value: { type: String, default: '' },
            label: { type: String, required: true },
            disabled: { type: Boolean, default: false }
        },

        data: function () {
            uid += 1;

            return { open: false, text: this.value || '', invalid: false, uid: uid };
        },

        computed: {
            inputId: function () { return 'mt-sw-color-' + this.uid; },
            panelId: function () { return 'mt-sw-color-panel-' + this.uid; },
            swatchStyle: function () { return this.value ? { background: this.value } : {}; }
        },

        watch: {
            // Wert von außen (Preset, Zurücksetzen): Feld nachziehen, offenen Farbwähler neu aufbauen
            value: function (v) {
                if (document.activeElement !== this.$el.querySelector('.mt-sw-color__hex')) {
                    this.text = v || '';
                    this.invalid = false;
                }
                if (this.open && this.$refs.cp && this.$refs.cp.value !== v) {
                    this.$refs.cp.value = v || '';
                    this.$refs.cp.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        },

        methods: {
            // HEX tippen: #rgb, #rrggbb oder #rrggbbaa, gleiche Prüfung wie auf dem Server
            onType: function (raw) {
                this.text = raw;
                var t = String(raw).trim();
                if (t === '') {
                    this.invalid = false;
                    this.$emit('update', '');

                    return;
                }
                var clean = window.MTAdminLogic ? window.MTAdminLogic.sanitize({ type: 'color' }, t.charAt(0) === '#' ? t : '#' + t) : '';
                this.invalid = clean === '';
                if (clean !== '') {
                    this.$emit('update', clean);
                }
            },

            onBlur: function () {
                this.text = this.value || '';
                this.invalid = false;
            },

            onPick: function (v) {
                this.text = v;
                this.invalid = false;
                this.$emit('update', v);
            },

            toggle: function () {
                var vm = this;
                vm.open = !vm.open;
                if (vm.open) {
                    vm.$nextTick(function () {
                        if (vm.$refs.cp && window.MTColorPicker) {
                            window.MTColorPicker.mount(vm.$refs.cp);
                        }
                    });
                }
            }
        }
    });
})();

/* src/Resources/app/administration/src/module/michatheme-v5/component/mt-sw-field.js */
// Ein Einstellungsfeld nach Typ aus dem Schema (select, font, toggle, text, range, media, color). Native Bedienelemente, beschriftet.
(function () {
    'use strict';

    if (typeof Shopware === 'undefined') {
        return;
    }

    Shopware.Component.register('mt-sw-field', {
        template: `
<div class="mt-sw-field" :class="{ 'mt-sw-field--wide': wide }">
    <template v-if="option.type === 'toggle'">
        <div class="mt-sw-check">
            <input type="checkbox" :id="fid" :checked="!!value" :disabled="disabled" :aria-describedby="describedBy" @change="$emit('update', $event.target.checked)">
            <label :for="fid">{{ option.label }}</label>
        </div>
    </template>
    <template v-else>
        <label :for="fid">{{ option.label }}</label>
        <select v-if="option.type === 'select' || option.type === 'font'" class="mt-sw-select" :id="fid" :value="value" :disabled="disabled" :aria-describedby="describedBy" @change="$emit('update', $event.target.value)">
            <option v-for="(label, key) in option.choices" :key="key" :value="key" :selected="String(value) === String(key)">{{ label }}</option>
        </select>
        <div v-else-if="option.type === 'range'" class="mt-sw-unit">
            <input class="mt-sw-input" type="number" :id="fid" :min="option.min" :max="option.max" :step="option.step || 1" :value="value" :disabled="disabled" :aria-describedby="describedBy"
                   @input="onNumber($event.target.value)">
            <span v-if="option.unit">{{ option.unit }}</span>
        </div>
        <mt-sw-color v-else-if="option.type === 'color'" :value="String(value || '')" :label="option.label" :disabled="disabled" @update="$emit('update', $event)"></mt-sw-color>
        <template v-else-if="option.type === 'media'">
            <sw-media-field v-if="hasMediaField" :value="String(value || '')" :disabled="disabled" @update:value="$emit('update', $event || '')" @media-selection-change="onMedia"></sw-media-field>
            <input v-else class="mt-sw-input" type="text" :id="fid" :value="value" maxlength="32" spellcheck="false" autocomplete="off" :disabled="disabled" :aria-describedby="describedBy" @input="$emit('update', $event.target.value.trim())">
        </template>
        <textarea v-else-if="option.input === 'textarea'" class="mt-sw-textarea" :id="fid" :value="value" maxlength="2000" :disabled="disabled" :aria-describedby="describedBy" @input="$emit('update', $event.target.value)"></textarea>
        <input v-else class="mt-sw-input" type="text" :id="fid" :value="value" maxlength="500" :disabled="disabled" :aria-describedby="describedBy" @input="$emit('update', $event.target.value)">
    </template>
    <p v-if="option.help" :id="fid + '-help'" class="mt-sw-help">{{ option.help }}</p>
    <p v-if="corrected" :id="fid + '-corr'" class="mt-sw-help" role="status"><strong>{{ $tc('michatheme-v5.field.invalidColor') }}</strong></p>
    <div class="mt-sw-meta">
        <span v-if="option.locked_by_law" class="mt-sw-tag">{{ $tc('michatheme-v5.field.law') }}</span>
        <span v-if="dirty" class="mt-sw-tag">{{ $tc('michatheme-v5.field.changed') }}</span>
        <span>{{ $tc('michatheme-v5.field.default', 0, { value: defaultText }) }}</span>
        <button v-if="differsFromDefault" type="button" class="mt-sw-btn mt-sw-btn--quiet" :disabled="disabled"
                :aria-label="$tc('michatheme-v5.field.resetNamed', 0, { name: option.label })" @click="$emit('update', option.default)">
            {{ $tc('michatheme-v5.field.reset') }}
        </button>
    </div>
</div>`,

        props: {
            option: { type: Object, required: true },
            value: { required: false, default: '' },
            dirty: { type: Boolean, default: false },
            corrected: { type: Boolean, default: false },
            disabled: { type: Boolean, default: false }
        },

        computed: {
            fid: function () { return 'mt-f-' + this.option.id; },
            wide: function () { return this.option.input === 'textarea'; },
            describedBy: function () {
                var ids = [];
                if (this.option.help) { ids.push(this.fid + '-help'); }
                if (this.corrected) { ids.push(this.fid + '-corr'); }

                return ids.join(' ') || null;
            },
            hasMediaField: function () {
                try {
                    return !!Shopware.Application.view.getComponent('sw-media-field') || !!Shopware.Component.getComponentRegistry().has('sw-media-field');
                } catch (e) {
                    return false;
                }
            },
            differsFromDefault: function () {
                return JSON.stringify(this.value === undefined ? '' : this.value) !== JSON.stringify(this.option.default === undefined ? '' : this.option.default);
            },
            defaultText: function () {
                var d = this.option.default;
                var o = this.option;
                if (o.type === 'toggle') { return d ? this.$tc('michatheme-v5.field.on') : this.$tc('michatheme-v5.field.off'); }
                if ((o.type === 'select' || o.type === 'font') && o.choices && o.choices[d] !== undefined) { return o.choices[d]; }
                if (d === '' || d === null || d === undefined) { return this.$tc('michatheme-v5.field.defaultEmpty'); }
                var s = String(d);

                return (s.length > 40 ? s.slice(0, 40) + '…' : s) + (o.unit ? ' ' + o.unit : '');
            }
        },

        methods: {
            onNumber: function (raw) {
                var logic = window.MTAdminLogic;
                this.$emit('update', logic ? logic.sanitize(this.option, raw) : Number(raw));
            },
            // Medienfeld gibt das Medienobjekt, wir brauchen nur die ID
            onMedia: function (media) {
                this.$emit('update', media && media.id ? media.id : '');
            }
        }
    });
})();

/* src/Resources/app/administration/src/module/michatheme-v5/page/mt-sw-settings.js */
// Seite "Einstellungen": Presets, Suche/Filter, Felder je Gruppe, eigene Farben mit Prüfung. Speichern über die eigene Admin-API.
(function () {
    'use strict';

    if (typeof Shopware === 'undefined') {
        return;
    }

    var NS = window.MichaThemeV5Admin;
    var COLOR_GROUP = 'colors_custom';
    var MODES = ['light', 'dark'];

    Shopware.Component.register('mt-sw-settings', {
        template: `
<sw-page class="mt-sw-page">
    <template #smart-bar-header><h2>{{ $tc('michatheme-v5.menuTitle') }} · {{ $tc('michatheme-v5.settings.title') }}</h2></template>
    <template #smart-bar-actions>
        <span v-if="dirtyCount" class="mt-sw-muted" role="status">{{ $tc('michatheme-v5.settings.unsaved', dirtyCount, { count: dirtyCount }) }}</span>
        <sw-button variant="primary" :disabled="!dirtyCount || saving || !canEdit" :is-loading="saving" @click="save">{{ $tc('michatheme-v5.settings.save') }}</sw-button>
    </template>
    <template #content>
        <sw-card-view>
            <div class="mt-sw-root">
                <mt-sw-nav></mt-sw-nav>
                <p v-if="loading" role="status">{{ $tc('michatheme-v5.common.loading') }}</p>
                <p v-else-if="!available" class="mt-sw-note mt-sw-note--bad" role="alert">{{ error ? $tc('michatheme-v5.common.loadFailed') : $tc('michatheme-v5.common.noTheme') }}</p>
                <template v-else>
                    <p v-if="!canEdit" class="mt-sw-note mt-sw-note--info">{{ $tc('michatheme-v5.common.readOnly') }}</p>
                    <p v-if="status.text" class="mt-sw-note" :class="'mt-sw-note--' + status.kind" role="status">{{ status.text }}</p>
                    <input id="mt-sw-palette-field" type="hidden" :value="paletteJson" @change="onPaletteChange($event.target.value)">

                    <sw-card :title="$tc('michatheme-v5.presets.title')" position-identifier="michatheme-v5-presets">
                        <p>{{ $tc('michatheme-v5.presets.intro') }}</p>
                        <div v-if="themes.length > 1" class="mt-sw-field">
                            <label for="mt-sw-theme">{{ $tc('michatheme-v5.common.themeSelect') }}</label>
                            <select id="mt-sw-theme" class="mt-sw-select" :value="themeId" @change="switchTheme($event.target.value)">
                                <option v-for="t in themes" :key="t.id" :value="t.id" :selected="t.id === themeId">{{ t.name }}{{ t.child ? ' (' + $tc('michatheme-v5.common.themeChild') + ')' : '' }}</option>
                            </select>
                        </div>
                        <ul class="mt-sw-presets">
                            <li v-for="p in presets" :key="p.id" class="mt-sw-preset">
                                <h3>{{ presetLabel(p) }}</h3>
                                <p>{{ presetHelp(p) }}</p>
                                <p v-if="p.unavailable && p.unavailable.length" class="mt-sw-help">{{ $tc('michatheme-v5.presets.missing', 0, { list: p.unavailable.join(', ') }) }}</p>
                                <button type="button" class="mt-sw-btn" :disabled="!canEdit" :aria-label="$tc('michatheme-v5.presets.applyNamed', 0, { name: presetLabel(p) })" @click="applyPreset(p)">{{ $tc('michatheme-v5.presets.apply') }}</button>
                            </li>
                        </ul>
                    </sw-card>

                    <sw-card :title="$tc('michatheme-v5.filter.title')" position-identifier="michatheme-v5-filter">
                        <div class="mt-sw-bar" role="search">
                            <div class="mt-sw-field" style="flex:1 1 280px">
                                <label for="mt-sw-search">{{ $tc('michatheme-v5.filter.search') }}</label>
                                <input id="mt-sw-search" class="mt-sw-input" type="search" v-model="query" :placeholder="$tc('michatheme-v5.filter.placeholder')" autocomplete="off">
                            </div>
                            <fieldset class="mt-sw-chips" style="border:0;margin:0;padding:0">
                                <legend class="mt-sw-sr">{{ $tc('michatheme-v5.filter.mode') }}</legend>
                                <span class="mt-sw-seg">
                                    <label><input type="radio" name="mt-sw-mode" value="simple" v-model="mode"><span>{{ $tc('michatheme-v5.filter.simple') }}</span></label>
                                    <label><input type="radio" name="mt-sw-mode" value="expert" v-model="mode"><span>{{ $tc('michatheme-v5.filter.expert') }}</span></label>
                                </span>
                                <label class="mt-sw-check"><input type="checkbox" v-model="onlyChanged"><span>{{ $tc('michatheme-v5.filter.onlyChanged') }}</span></label>
                            </fieldset>
                        </div>
                        <p class="mt-sw-help" aria-live="polite">{{ resultText }}</p>
                        <p v-if="mode === 'simple'" class="mt-sw-help">{{ $tc('michatheme-v5.filter.simpleHint') }}</p>
                        <p class="mt-sw-help">{{ $tc('michatheme-v5.settings.intro') }}</p>
                    </sw-card>

                    <sw-card v-for="g in cards" :key="g.id" :title="g.label" :position-identifier="'michatheme-v5-group-' + g.id">
                        <template v-if="g.id === colorGroupId">
                            <p>{{ $tc('michatheme-v5.colors.intro') }}</p>
                            <table class="mt-sw-table">
                                <thead>
                                    <tr><th scope="col">{{ $tc('michatheme-v5.colors.color') }}</th><th scope="col">{{ $tc('michatheme-v5.colors.light') }}</th><th scope="col">{{ $tc('michatheme-v5.colors.dark') }}</th></tr>
                                </thead>
                                <tbody>
                                    <tr v-for="row in g.rows" :key="row.token">
                                        <th scope="row">{{ row.name }}</th>
                                        <td v-for="m in modes" :key="m">
                                            <mt-sw-color v-if="row[m]" :value="String(values[row[m].id] || '')" :label="row.name + ' (' + modeName(m) + ')'" :disabled="!canEdit" @update="setValue(row[m].id, $event)"></mt-sw-color>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <p class="mt-sw-help">{{ $tc('michatheme-v5.colors.paletteHint') }}</p>
                            <h3>{{ $tc('michatheme-v5.colors.warnings') }}</h3>
                            <p class="mt-sw-help">{{ $tc('michatheme-v5.colors.warningsHint') }}</p>
                            <ul class="mt-sw-warn" aria-live="polite">
                                <li v-for="w in warnings" :key="w.key" :class="w.ok ? 'mt-sw-good' : 'mt-sw-bad'">{{ w.ok ? '✔ ' : '✖ ' }}{{ w.text }}</li>
                                <li v-if="!warnings.length" class="mt-sw-muted">{{ $tc('michatheme-v5.colors.warnNone') }}</li>
                            </ul>
                            <div class="mt-sw-previews" aria-hidden="true">
                                <div v-for="m in modes" :key="m" class="mt-sw-pvwrap">
                                    <p class="mt-sw-help">{{ $tc('michatheme-v5.colors.previewMode', 0, { mode: modeName(m) }) }}</p>
                                    <div class="mt-sw-pv" :style="{ background: previews[m].bg, borderColor: previews[m]['border-strong'] }">
                                        <div class="mt-sw-pv__card" :style="{ background: previews[m].surface, borderColor: previews[m]['border-strong'] }">
                                            <span class="mt-sw-pv__bar" :style="{ background: previews[m].text }"></span>
                                            <span class="mt-sw-pv__bar mt-sw-pv__bar--short" :style="{ background: previews[m]['text-muted'] }"></span>
                                            <span class="mt-sw-pv__btn" :style="{ background: previews[m].accent, borderColor: previews[m]['on-accent'] }"><span class="mt-sw-pv__bar mt-sw-pv__bar--btn" :style="{ background: previews[m]['on-accent'] }"></span></span>
                                            <span class="mt-sw-pv__bar mt-sw-pv__bar--link" :style="{ background: previews[m].link }"></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                        <template v-else>
                            <div class="mt-sw-grid">
                                <mt-sw-field v-for="o in g.options" :key="o.id" :option="o" :value="values[o.id]" :dirty="isDirty(o.id)" :corrected="!!corrected[o.id]" :disabled="!canEdit" @update="setValue(o.id, $event)"></mt-sw-field>
                            </div>
                            <p v-if="g.id === 'colors' && accentWarning" class="mt-sw-note" :class="accentWarning.ok ? 'mt-sw-note--ok' : 'mt-sw-note--bad'" role="status">{{ accentWarning.text }}</p>
                        </template>
                    </sw-card>
                </template>
            </div>
        </sw-card-view>
    </template>
</sw-page>`,

        inject: ['loginService', 'acl'],
        mixins: [Shopware.Mixin.getByName('notification')],

        data: function () {
            return {
                loading: true, available: false, error: false, saving: false,
                themeId: '', themes: [], schema: { groups: [], options: [], presets: [] },
                values: {}, original: {}, palette: [], corrected: {},
                query: '', mode: 'simple', onlyChanged: false,
                status: { kind: 'info', text: '' },
                colorGroupId: COLOR_GROUP, modes: MODES
            };
        },

        computed: {
            canEdit: function () { return NS.can(this.acl, 'michatheme_v5.editor'); },
            paletteJson: function () { return JSON.stringify(this.palette); },
            presets: function () { return this.schema.presets || []; },
            dirtyIds: function () {
                var vm = this;

                return Object.keys(vm.values).filter(function (id) { return vm.isDirty(id); });
            },
            dirtyCount: function () { return this.dirtyIds.length; },
            groupLabels: function () {
                var m = {};
                (this.schema.groups || []).forEach(function (g) { m[g.id] = g.label; });

                return m;
            },
            // Felder je Gruppe, nach Suche/Filter; Farbgruppe als Zeilen (ein Farbname, Hell und Dunkel)
            cards: function () {
                var vm = this;
                var logic = window.MTAdminLogic;
                var st = { query: vm.query, expert: vm.mode === 'expert', onlyChanged: vm.onlyChanged, onlyLaw: false };
                var out = [];
                (vm.schema.groups || []).forEach(function (g) {
                    var opts = (vm.schema.options || []).filter(function (o) {
                        return o.group === g.id && logic.visible({
                            mode: o.mode, law: !!o.locked_by_law, dirty: vm.isDirty(o.id),
                            search: [o.label, o.help, g.label, o.id].join(' ')
                        }, st);
                    });
                    if (!opts.length) { return; }
                    if (g.id === COLOR_GROUP) {
                        out.push({ id: g.id, label: g.label, options: opts, rows: vm.colorRows(opts) });
                    } else {
                        out.push({ id: g.id, label: g.label, options: opts });
                    }
                });

                return out;
            },
            resultCount: function () {
                return this.cards.reduce(function (n, g) { return n + g.options.length; }, 0);
            },
            resultText: function () {
                var searching = this.query.trim() !== '' || this.onlyChanged;
                if (this.resultCount === 0) { return this.$tc('michatheme-v5.filter.results', 0, { count: 0 }); }

                return searching ? this.$tc('michatheme-v5.filter.results', this.resultCount, { count: this.resultCount }) : '';
            },
            // Kontrast-Prüfung nur für Paare mit eigener Farbe (Kern: mt-admin-logic.js)
            warnings: function () {
                var vm = this;
                var out = [];
                MODES.forEach(function (m) {
                    window.MTAdminLogic.colorWarnings(vm.schema, vm.values, m).forEach(function (w, i) {
                        var ratio = String(w.ratio).replace('.', ',');
                        var name = vm.warnName(w);
                        out.push({
                            key: m + i, ok: w.ok,
                            text: vm.$tc('michatheme-v5.colors.warnMode', 0, {
                                mode: vm.modeName(m), label: name, ratio: ratio, min: String(w.min).replace('.', ','),
                                state: w.ok ? vm.$tc('michatheme-v5.colors.warnOk') : vm.$tc('michatheme-v5.colors.warnLow')
                            })
                        });
                    });
                });

                return out;
            },
            previews: function () {
                var vm = this;

                return { light: window.MTAdminLogic.effective(vm.schema, vm.values, 'light'), dark: window.MTAdminLogic.effective(vm.schema, vm.values, 'dark') };
            },
            accentWarning: function () {
                var hex = window.MTAdminLogic.sanitize({ type: 'color' }, this.values.accent_custom || '');
                if (!hex) { return null; }
                var c = window.MTColorPicker.accentTextCheck(hex.slice(0, 7), this.previews.light.bg, this.previews.dark.bg);
                var f = function (n) { return n.toFixed(1).replace('.', ','); };

                return {
                    ok: c.ok,
                    text: this.$tc('michatheme-v5.colors.accentCheck', 0, { light: f(c.light), dark: f(c.dark), state: c.ok ? this.$tc('michatheme-v5.colors.warnOk') : this.$tc('michatheme-v5.colors.warnLow') })
                };
            }
        },

        watch: {
            mode: function (m) {
                try { window.localStorage.setItem('micha-theme-v5-mode', m); } catch (e) { /* kein Speicher */ }
            }
        },

        created: function () {
            NS.addStyle();
            try {
                var m = window.localStorage.getItem('micha-theme-v5-mode');
                this.mode = m === 'expert' ? 'expert' : 'simple';
            } catch (e) { /* kein Speicher */ }
            this.load('');
        },

        // Ungespeicherte Änderungen: vor dem Verlassen fragen
        beforeRouteLeave: function (to, from, next) {
            if (this.dirtyCount && !window.confirm(this.$tc('michatheme-v5.settings.leave'))) {
                next(false);

                return;
            }
            next();
        },

        methods: {
            modeName: function (m) { return this.$tc(m === 'light' ? 'michatheme-v5.colors.light' : 'michatheme-v5.colors.dark'); },

            presetLabel: function (p) { return NS.tr(this, 'michatheme-v5.presets.' + p.id + '.label', p.label); },
            presetHelp: function (p) { return NS.tr(this, 'michatheme-v5.presets.' + p.id + '.help', p.help); },

            warnName: function (w) {
                if (this.$i18n && String(this.$i18n.locale || '').indexOf('en') === 0 && w.fg && w.bg) {
                    return this.tokenName(w.fg) + ' / ' + this.tokenName(w.bg);
                }

                return w.label;
            },
            tokenName: function (tok) { return NS.tr(this, 'michatheme-v5.colors.token.' + tok.replace(/-/g, '_'), tok); },

            colorRows: function (opts) {
                var rows = [];
                var by = {};
                var vm = this;
                opts.forEach(function (o) {
                    if (!o.color) { return; }
                    var r = by[o.color.token];
                    if (!r) {
                        r = by[o.color.token] = { token: o.color.token, name: vm.tokenName(o.color.token) };
                        rows.push(r);
                    }
                    r[o.color.mode] = o;
                });

                return rows;
            },

            isDirty: function (id) { return JSON.stringify(this.values[id]) !== JSON.stringify(this.original[id]); },

            setValue: function (id, v) {
                this.values = Object.assign({}, this.values, { [id]: v });
                if (this.corrected[id]) { this.corrected = Object.assign({}, this.corrected, { [id]: false }); }
                this.status = { kind: 'info', text: '' };
            },

            say: function (kind, text) { this.status = { kind: kind, text: text }; },

            load: function (themeId) {
                var vm = this;
                vm.loading = true;

                return NS.post(vm.loginService, 'settings/load', { themeId: themeId, locale: NS.lang() }).then(function (d) {
                    vm.error = !!d.error;
                    vm.available = d.available === true;
                    if (vm.available) {
                        vm.schema = d.schema;
                        vm.themes = d.themes || [];
                        vm.themeId = d.themeId;
                        vm.values = Object.assign({}, d.values);
                        vm.original = Object.assign({}, d.values);
                        vm.palette = d.palette || [];
                        vm.corrected = {};
                    }
                    vm.loading = false;
                });
            },

            switchTheme: function (id) {
                if (this.dirtyCount && !window.confirm(this.$tc('michatheme-v5.settings.leave'))) {
                    this.$forceUpdate();

                    return;
                }
                this.load(id);
            },

            applyPreset: function (p) {
                var vm = this;
                var count = 0;
                var next = Object.assign({}, vm.values);
                Object.keys(p.values).forEach(function (id) {
                    if (Object.prototype.hasOwnProperty.call(next, id) && JSON.stringify(next[id]) !== JSON.stringify(p.values[id])) {
                        next[id] = p.values[id];
                        count += 1;
                    }
                });
                vm.values = next;
                var name = vm.presetLabel(p);
                vm.say('info', count ? vm.$tc('michatheme-v5.presets.applied', count, { name: name, count: count }) : vm.$tc('michatheme-v5.presets.appliedNone', 0, { name: name }));
            },

            save: function () {
                var vm = this;
                if (!vm.dirtyCount || vm.saving) { return Promise.resolve(); }
                var payload = {};
                vm.dirtyIds.forEach(function (id) { payload[id] = vm.values[id]; });
                vm.saving = true;
                vm.say('info', vm.$tc('michatheme-v5.settings.saving'));

                return NS.post(vm.loginService, 'settings/save', { themeId: vm.themeId, values: payload }).then(function (d) {
                    vm.saving = false;
                    if (d.success !== true) {
                        vm.say('bad', vm.$tc('michatheme-v5.settings.saveFailed'));
                        vm.createNotificationError({ message: vm.$tc('michatheme-v5.settings.saveFailed') });

                        return;
                    }
                    // Server-Stand übernehmen (bereinigte Werte)
                    vm.values = Object.assign({}, vm.values, d.values);
                    vm.original = Object.assign({}, vm.original, d.values);
                    var bad = {};
                    (d.corrected || []).forEach(function (id) { bad[id] = true; });
                    vm.corrected = bad;
                    var n = (d.corrected || []).length;
                    var msg = n ? vm.$tc('michatheme-v5.settings.savedCorrected', n, { count: n }) : vm.$tc('michatheme-v5.settings.saved');
                    vm.say(n ? 'bad' : 'ok', msg);
                    vm.createNotificationSuccess({ message: msg });
                });
            },

            // Palette: der Farbwähler schreibt in das versteckte Feld, wir speichern sie sofort
            onPaletteChange: function (raw) {
                var vm = this;
                var list = [];
                try { list = JSON.parse(raw || '[]'); } catch (e) { list = []; }
                if (!Array.isArray(list)) { return; }
                vm.palette = list;

                return NS.post(vm.loginService, 'palette/save', { palette: list }).then(function (d) {
                    if (d.success !== true) { vm.say('bad', vm.$tc('michatheme-v5.colors.paletteFailed')); }
                });
            }
        }
    });
})();

/* src/Resources/app/administration/src/module/michatheme-v5/page/mt-sw-license.js */
// Seite "Lizenzen": Status, Code einfügen (nie im Klartext zurück), Link zum Kauf
(function () {
    'use strict';

    if (typeof Shopware === 'undefined') {
        return;
    }

    var NS = window.MichaThemeV5Admin;
    var KNOWN = ['no_token', 'unreachable', 'token_expired', 'token_revoked', 'domain_mismatch', 'signature_invalid', 'token_malformed', 'unknown_tier'];
    var TIERS = { plus: 'Plus', pro: 'Pro', agency: 'Agentur', free: 'Free' };

    Shopware.Component.register('mt-sw-license', {
        template: `
<sw-page class="mt-sw-page">
    <template #smart-bar-header><h2>{{ $tc('michatheme-v5.menuTitle') }} · {{ $tc('michatheme-v5.license.title') }}</h2></template>
    <template #content>
        <sw-card-view>
            <div class="mt-sw-root">
                <mt-sw-nav></mt-sw-nav>
                <p v-if="loading" role="status">{{ $tc('michatheme-v5.common.loading') }}</p>
                <p v-else-if="!available" class="mt-sw-note mt-sw-note--bad" role="alert">{{ failed ? $tc('michatheme-v5.common.loadFailed') : $tc('michatheme-v5.common.noTheme') }}</p>
                <template v-else>
                    <p v-if="!canEdit" class="mt-sw-note mt-sw-note--info">{{ $tc('michatheme-v5.common.readOnly') }}</p>
                    <p v-if="message.text" class="mt-sw-note" :class="'mt-sw-note--' + message.kind" role="status">{{ message.text }}</p>

                    <sw-card :title="$tc('michatheme-v5.license.statusTitle')" position-identifier="michatheme-v5-license-status">
                        <div class="mt-sw-status">
                            <h3>{{ statusTitle }}</h3>
                            <span class="mt-sw-tag">{{ $tc('michatheme-v5.license.tier', 0, { tier: tierName }) }}</span>
                        </div>
                        <p>{{ reasonText }}</p>
                        <p v-if="state.valid && state.periodEnd">{{ $tc('michatheme-v5.license.validUntil', 0, { date: dateText }) }}</p>
                        <p v-if="state.valid && state.modules.length">{{ $tc('michatheme-v5.license.modules', 0, { list: state.modules.join(', ') }) }}</p>
                        <p v-if="state.valid && state.source === 'grace'" class="mt-sw-help">{{ $tc('michatheme-v5.license.grace') }}</p>
                        <p v-if="state.domain" class="mt-sw-help">{{ $tc('michatheme-v5.license.domain', 0, { domain: state.domain }) }}</p>
                        <button type="button" class="mt-sw-btn" :disabled="busy || !state.hasToken" @click="recheck">{{ $tc('michatheme-v5.license.recheck') }}</button>
                    </sw-card>

                    <sw-card :title="$tc('michatheme-v5.license.codeTitle')" position-identifier="michatheme-v5-license-code">
                        <p>{{ state.hasToken ? $tc('michatheme-v5.license.stored', 0, { masked: state.masked }) : $tc('michatheme-v5.license.storedNone') }}</p>
                        <div class="mt-sw-field">
                            <label for="mt-sw-license-code">{{ $tc('michatheme-v5.license.codeLabel') }}</label>
                            <input id="mt-sw-license-code" class="mt-sw-input" :type="reveal ? 'text' : 'password'" v-model="code" autocomplete="off" spellcheck="false" maxlength="4096"
                                   :disabled="busy || !canEdit" aria-describedby="mt-sw-license-help" :aria-invalid="formatError ? 'true' : 'false'">
                            <p id="mt-sw-license-help" class="mt-sw-help">{{ $tc('michatheme-v5.license.codeHelp') }}</p>
                            <label class="mt-sw-check"><input type="checkbox" v-model="reveal"><span>{{ $tc('michatheme-v5.license.show') }}</span></label>
                            <p v-if="formatError" class="mt-sw-note mt-sw-note--bad" role="alert">{{ $tc('michatheme-v5.license.errorFormat') }}</p>
                        </div>
                        <div class="mt-sw-bar">
                            <button type="button" class="mt-sw-btn mt-sw-btn--primary" :disabled="busy || !canEdit || !code.trim()" @click="save">{{ $tc('michatheme-v5.license.saveCheck') }}</button>
                            <button v-if="state.hasToken" type="button" class="mt-sw-btn" :disabled="busy || !canEdit" @click="remove">{{ $tc('michatheme-v5.license.remove') }}</button>
                        </div>
                        <p class="mt-sw-help">{{ $tc('michatheme-v5.license.privacy') }}</p>
                    </sw-card>

                    <sw-card :title="$tc('michatheme-v5.license.buyTitle')" position-identifier="michatheme-v5-license-buy">
                        <p>{{ $tc('michatheme-v5.license.buyText') }}</p>
                        <p><a :href="shopUrl" target="_blank" rel="noopener noreferrer">{{ $tc('michatheme-v5.license.buyLink') }}<span class="mt-sw-sr"> {{ $tc('michatheme-v5.common.newTab') }}</span></a></p>
                    </sw-card>
                </template>
            </div>
        </sw-card-view>
    </template>
</sw-page>`,

        inject: ['loginService', 'acl'],

        data: function () {
            return {
                loading: true, available: false, failed: false, busy: false,
                themeId: '', code: '', reveal: false, formatError: false,
                message: { kind: 'info', text: '' },
                state: { hasToken: false, masked: '', valid: false, tier: 'free', reason: 'no_token', source: 'none', modules: [], periodEnd: null, domain: '' }
            };
        },

        computed: {
            canEdit: function () { return NS.can(this.acl, 'michatheme_v5.editor'); },
            shopUrl: function () { return 'https://theme.michael-gahn.de'; },
            tierName: function () { return TIERS[this.state.tier] || 'Free'; },
            statusTitle: function () {
                if (this.state.valid) { return this.$tc('michatheme-v5.license.status.active'); }

                return this.$tc(this.state.reason === 'no_token' ? 'michatheme-v5.license.status.free' : 'michatheme-v5.license.status.problem');
            },
            reasonText: function () {
                if (this.state.valid) { return ''; }
                var r = KNOWN.indexOf(this.state.reason) >= 0 ? this.state.reason : 'other';

                return this.$tc('michatheme-v5.license.reason.' + r);
            },
            dateText: function () { return NS.date(this.state.periodEnd); }
        },

        created: function () {
            NS.addStyle();
            this.apply(this.call('license/status'));
        },

        methods: {
            say: function (kind, text) { this.message = { kind: kind, text: text }; },

            call: function (path, extra) {
                return NS.post(this.loginService, path, Object.assign({ themeId: this.themeId }, extra || {}));
            },

            apply: function (promise) {
                var vm = this;

                return promise.then(function (d) {
                    // Nur beim ersten Laden entscheidet ein Fehler über die ganze Seite, danach nur über eine Meldung
                    if (vm.loading) {
                        vm.failed = d.error === 'failed' || d.httpStatus >= 500;
                        vm.available = d.available === true && !vm.failed;
                    }
                    vm.loading = false;
                    if (d.themeId) { vm.themeId = d.themeId; }
                    if (typeof d.hasToken === 'boolean') {
                        vm.state = {
                            hasToken: d.hasToken, masked: d.masked || '', valid: !!d.valid, tier: d.tier || 'free', reason: d.reason || 'no_token',
                            source: d.source || 'none', modules: d.modules || [], periodEnd: d.periodEnd || null, domain: d.domain || ''
                        };
                    }

                    return d;
                });
            },

            save: function () {
                var vm = this;
                vm.busy = true;
                vm.formatError = false;
                vm.say('info', vm.$tc('michatheme-v5.license.saving'));

                return vm.apply(vm.call('license/save', { token: vm.code.trim() })).then(function (d) {
                    vm.busy = false;
                    if (d.saved === true) {
                        vm.code = '';
                        vm.say('ok', vm.$tc('michatheme-v5.license.saved'));
                    } else if (d.error === 'format') {
                        vm.formatError = true;
                        vm.say('bad', '');
                    } else {
                        vm.say('bad', vm.$tc('michatheme-v5.license.errorFailed'));
                    }
                });
            },

            remove: function () {
                var vm = this;
                if (!window.confirm(vm.$tc('michatheme-v5.license.removeConfirm'))) { return Promise.resolve(); }
                vm.busy = true;
                vm.say('info', vm.$tc('michatheme-v5.license.saving'));

                return vm.apply(vm.call('license/remove')).then(function (d) {
                    vm.busy = false;
                    vm.say(d.removed ? 'ok' : 'bad', d.removed ? vm.$tc('michatheme-v5.license.removed') : vm.$tc('michatheme-v5.license.errorFailed'));
                });
            },

            recheck: function () {
                var vm = this;
                vm.busy = true;

                return vm.apply(vm.call('license/check')).then(function (d) {
                    vm.busy = false;
                    vm.say(d.throttled ? 'info' : 'ok', d.throttled ? vm.$tc('michatheme-v5.license.throttled') : vm.$tc('michatheme-v5.license.rechecked'));
                });
            }
        }
    });
})();

/* src/Resources/app/administration/src/module/michatheme-v5/page/mt-sw-catalog.js */
// Seite "Plugin-Empfehlungen": Daten vom eigenen Controller (Feed von theme.michael-gahn.de, Cache, leise bei Fehlern)
(function () {
    'use strict';

    if (typeof Shopware === 'undefined') {
        return;
    }

    var NS = window.MichaThemeV5Admin;
    // Links und Bilder nur von diesen Adressen (zweite Sperre, der Server prüft auch)
    var LINK_PREFIXES = ['https://theme.michael-gahn.de/', 'https://github.com/MichaelGahnDESIGN/'];
    var IMAGE_PREFIX = 'https://theme.michael-gahn.de/';

    Shopware.Component.register('mt-sw-catalog', {
        template: `
<sw-page class="mt-sw-page">
    <template #smart-bar-header><h2>{{ $tc('michatheme-v5.menuTitle') }} · {{ $tc('michatheme-v5.catalog.title') }}</h2></template>
    <template #smart-bar-actions>
        <sw-button :disabled="loading" @click="load(true)">{{ $tc('michatheme-v5.catalog.refresh') }}</sw-button>
    </template>
    <template #content>
        <sw-card-view>
            <div class="mt-sw-root">
                <mt-sw-nav></mt-sw-nav>
                <sw-card :title="$tc('michatheme-v5.catalog.title')" position-identifier="michatheme-v5-catalog">
                    <p>{{ $tc('michatheme-v5.catalog.intro') }}</p>
                    <p v-if="loading" role="status">{{ $tc('michatheme-v5.catalog.loading') }}</p>
                    <p v-else-if="notice" class="mt-sw-note" :class="'mt-sw-note--' + notice.kind" role="status">{{ notice.text }}</p>
                    <template v-if="!loading">
                        <p v-if="items.length === 0 && !notice" class="mt-sw-note mt-sw-note--info">{{ $tc('michatheme-v5.catalog.empty') }}</p>
                        <div v-if="items.length" class="mt-sw-cat">
                            <article v-for="item in items" :key="item.id" class="mt-sw-cat__item" :style="accentStyle(item)">
                                <img v-if="isImage(item.image_url)" class="mt-sw-cat__image" :src="item.image_url" :alt="item.image_alt || ''" loading="lazy" referrerpolicy="no-referrer">
                                <div class="mt-sw-cat__head">
                                    <img v-if="isImage(item.icon_url)" class="mt-sw-cat__icon" :src="item.icon_url" alt="" width="36" height="36" loading="lazy" referrerpolicy="no-referrer">
                                    <span v-else class="mt-sw-cat__icon mt-sw-cat__icon--fallback" aria-hidden="true">{{ item.name.charAt(0) }}</span>
                                    <h3>{{ item.name }}</h3>
                                </div>
                                <ul class="mt-sw-cat__badges">
                                    <li v-if="item.recommended" class="mt-sw-tag">{{ $tc('michatheme-v5.catalog.recommended') }}</li>
                                    <li class="mt-sw-tag">{{ item.tier === 'free' ? $tc('michatheme-v5.catalog.free') : $tc('michatheme-v5.catalog.paid') }}</li>
                                    <li v-if="item.status === 'announced'" class="mt-sw-tag">{{ $tc('michatheme-v5.catalog.announced') }}</li>
                                    <li v-if="item.version" class="mt-sw-tag">{{ $tc('michatheme-v5.catalog.version') }} {{ item.version }}</li>
                                </ul>
                                <p class="mt-sw-cat__text">{{ item.description }}</p>
                                <p class="mt-sw-cat__links">
                                    <a v-if="isLink(item.download_url)" :href="item.download_url" target="_blank" rel="noopener noreferrer">{{ $tc('michatheme-v5.catalog.download') }}<span class="mt-sw-sr"> {{ $tc('michatheme-v5.common.newTab') }}</span></a>
                                    <a v-if="isLink(item.details_url)" :href="item.details_url" target="_blank" rel="noopener noreferrer">{{ $tc('michatheme-v5.catalog.details') }}<span class="mt-sw-sr"> {{ $tc('michatheme-v5.common.newTab') }}</span></a>
                                    <a v-if="isLink(item.repository_url)" :href="item.repository_url" target="_blank" rel="noopener noreferrer">{{ $tc('michatheme-v5.catalog.source') }}<span class="mt-sw-sr"> {{ $tc('michatheme-v5.common.newTab') }}</span></a>
                                </p>
                            </article>
                        </div>
                        <p v-if="updatedText" class="mt-sw-help">{{ $tc('michatheme-v5.catalog.updatedAt') }} {{ updatedText }}</p>
                    </template>
                    <p class="mt-sw-help">{{ $tc('michatheme-v5.catalog.privacy') }}</p>
                </sw-card>
            </div>
        </sw-card-view>
    </template>
</sw-page>`,

        inject: ['loginService'],

        data: function () {
            return { loading: true, items: [], error: null, stale: false, checkedAt: 0 };
        },

        computed: {
            notice: function () {
                if (this.error === 'throttled') { return { kind: 'info', text: this.$tc('michatheme-v5.catalog.throttled') }; }
                if (this.error && this.items.length && this.stale) { return { kind: 'bad', text: this.$tc('michatheme-v5.catalog.stale') }; }
                if (this.error && !this.items.length) { return { kind: 'info', text: this.$tc('michatheme-v5.catalog.unavailable') }; }

                return null;
            },
            updatedText: function () {
                if (!this.checkedAt) { return ''; }
                var locale = 'de-DE';
                try { locale = Shopware.State.get('session').currentLocale || locale; } catch (e) { locale = 'de-DE'; }

                return new Date(this.checkedAt * 1000).toLocaleString(locale);
            }
        },

        created: function () {
            NS.addStyle();
            this.load(false);
        },

        methods: {
            load: function (refresh) {
                var vm = this;
                vm.loading = true;

                return NS.post(vm.loginService, 'catalog', { refresh: refresh === true }).then(function (d) {
                    vm.items = Array.isArray(d.items) ? d.items : [];
                    vm.error = d.error ? String(d.error) : null;
                    vm.stale = d.stale === true;
                    vm.checkedAt = typeof d.checked_at === 'number' ? d.checked_at : 0;
                    vm.loading = false;
                });
            },
            isLink: function (u) {
                return typeof u === 'string' && LINK_PREFIXES.some(function (p) { return u.indexOf(p) === 0; });
            },
            isImage: function (u) {
                return typeof u === 'string' && u.indexOf(IMAGE_PREFIX) === 0;
            },
            // Farbe nur als Rand und nur wenn genau #rrggbb
            accentStyle: function (item) {
                return typeof item.accent === 'string' && /^#[0-9a-f]{6}$/.test(item.accent) ? { '--mt-sw-accent': item.accent } : null;
            }
        }
    });
})();

/* src/Resources/app/administration/src/module/michatheme-v5/page/mt-sw-info.js */
// Seite "Info": Versionen, Zuweisung des Themes, Changelog (reiner Text)
(function () {
    'use strict';

    if (typeof Shopware === 'undefined') {
        return;
    }

    var NS = window.MichaThemeV5Admin;

    Shopware.Component.register('mt-sw-info', {
        template: `
<sw-page class="mt-sw-page">
    <template #smart-bar-header><h2>{{ $tc('michatheme-v5.menuTitle') }} · {{ $tc('michatheme-v5.info.title') }}</h2></template>
    <template #content>
        <sw-card-view>
            <div class="mt-sw-root">
                <mt-sw-nav></mt-sw-nav>
                <p v-if="loading" role="status">{{ $tc('michatheme-v5.common.loading') }}</p>
                <p v-else-if="failed" class="mt-sw-note mt-sw-note--bad" role="alert">{{ $tc('michatheme-v5.common.loadFailed') }}</p>
                <template v-else>
                    <sw-card :title="$tc('michatheme-v5.info.versions')" position-identifier="michatheme-v5-info-versions">
                        <dl class="mt-sw-dl">
                            <dt>{{ $tc('michatheme-v5.info.plugin') }}</dt><dd>{{ info.pluginVersion || '-' }}</dd>
                            <dt>{{ $tc('michatheme-v5.info.schema') }}</dt><dd>{{ info.schemaVersion || '-' }}</dd>
                            <dt>{{ $tc('michatheme-v5.info.shopware') }}</dt><dd>{{ info.shopwareVersion || '-' }}</dd>
                            <dt>{{ $tc('michatheme-v5.info.php') }}</dt><dd>{{ info.phpVersion || '-' }}</dd>
                        </dl>
                    </sw-card>
                    <sw-card :title="$tc('michatheme-v5.info.channels')" position-identifier="michatheme-v5-info-channels">
                        <ul v-if="info.channels && info.channels.length"><li v-for="c in info.channels" :key="c">{{ c }}</li></ul>
                        <p v-else>{{ $tc('michatheme-v5.info.channelsNone') }}</p>
                        <p><router-link :to="{ name: 'sw.theme.manager.index' }">{{ $tc('michatheme-v5.info.channelsOpen') }}</router-link></p>
                    </sw-card>
                    <sw-card :title="$tc('michatheme-v5.info.changelog')" position-identifier="michatheme-v5-info-changelog">
                        <pre v-if="info.changelog" class="mt-sw-pre" tabindex="0">{{ info.changelog }}</pre>
                        <p v-else>{{ $tc('michatheme-v5.info.changelogNone') }}</p>
                    </sw-card>
                    <sw-card :title="$tc('michatheme-v5.info.links')" position-identifier="michatheme-v5-info-links">
                        <ul class="mt-sw-links">
                            <li v-for="l in links" :key="l.key"><a :href="l.url" target="_blank" rel="noopener noreferrer">{{ l.text }}<span class="mt-sw-sr"> {{ $tc('michatheme-v5.common.newTab') }}</span></a></li>
                        </ul>
                    </sw-card>
                </template>
            </div>
        </sw-card-view>
    </template>
</sw-page>`,

        inject: ['loginService'],

        data: function () {
            return { loading: true, failed: false, info: {} };
        },

        computed: {
            links: function () {
                var l = this.info.links || {};
                var out = [];
                [['shop', 'michatheme-v5.info.linkShop'], ['support', 'michatheme-v5.info.linkSupport'], ['source', 'michatheme-v5.info.linkSource']].forEach(function (p) {
                    if (typeof l[p[0]] === 'string' && l[p[0]].indexOf('https://') === 0) { out.push({ key: p[0], url: l[p[0]], text: p[1] }); }
                });

                return out.map(function (x) { return { key: x.key, url: x.url, text: this.$tc(x.text) }; }, this);
            }
        },

        created: function () {
            var vm = this;
            NS.addStyle();
            NS.post(vm.loginService, 'info', {}).then(function (d) {
                vm.failed = !!d.error;
                vm.info = d;
                vm.loading = false;
            });
        }
    });
})();

/* src/Resources/app/administration/src/module/michatheme-v5/register.js */
// Modul anmelden: Menüpunkt unter Einstellungen > Erweiterungen, vier Seiten, Rechte
(function () {
    'use strict';

    if (typeof Shopware === 'undefined') {
        return;
    }

    var meta = { parentPath: 'sw.settings.index.plugins', privilege: 'michatheme_v5.viewer' };

    Shopware.Module.register('michatheme-v5', {
        type: 'plugin',
        name: 'michatheme-v5',
        title: 'michatheme-v5.menuTitle',
        description: 'michatheme-v5.description',
        color: '#c8161a',
        icon: 'regular-cog',

        routes: {
            settings: { component: 'mt-sw-settings', path: 'settings', meta: meta },
            license: { component: 'mt-sw-license', path: 'license', meta: meta },
            catalog: { component: 'mt-sw-catalog', path: 'catalog', meta: meta },
            info: { component: 'mt-sw-info', path: 'info', meta: meta }
        },

        // Einstellungen > Erweiterungen
        settingsItem: [{
            name: 'michatheme-v5',
            to: 'michatheme.v5.settings',
            label: 'michatheme-v5.menuTitle',
            group: 'plugins',
            icon: 'regular-cog',
            privilege: 'michatheme_v5.viewer'
        }]
    });
})();

/* src/Resources/app/administration/src/module/michatheme-v5/index.js */
// MichaThemeV5 Admin-Modul. Kern-Skripte (Logik, Farbwähler) kommen aus dem Generator (public/administration/mt)
})();

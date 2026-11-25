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

var deDE = {"michatheme-v5": {"menuTitle": "MichaThemeV5", "description": "Einstellungen, Lizenz und Plugin-Empfehlungen für das Theme", "nav": {"label": "Bereiche von MichaThemeV5", "settings": "Einstellungen", "license": "Lizenzen", "catalog": "Plugin-Empfehlungen", "info": "Info"}, "common": {"loading": "Wird geladen ...", "loadFailed": "Die Daten konnten nicht geladen werden. Bitte die Seite neu laden oder später noch einmal versuchen.", "readOnly": "Sie haben nur Leserechte. Ändern ist nicht möglich.", "noTheme": "Das Theme MichaThemeV5 wurde nicht gefunden. Bitte unter Erweiterungen prüfen, ob das Plugin installiert und aktiv ist.", "newTab": "(öffnet in neuem Tab)", "themeSelect": "Theme-Variante", "themeChild": "Kind-Theme", "dismiss": "Schließen"}, "settings": {"title": "Einstellungen", "save": "Speichern", "saving": "Wird gespeichert. Das Theme wird neu übersetzt, das kann bis zu einer Minute dauern.", "saved": "Gespeichert. Die Änderungen sind im Shop sichtbar, sobald das Theme übersetzt ist.", "savedCorrected": "Gespeichert. 1 ungültige Angabe wurde nicht übernommen und steht wieder auf Standard. | Gespeichert. {count} ungültige Angaben wurden nicht übernommen und stehen wieder auf Standard.", "saveFailed": "Speichern hat nicht geklappt. Bitte noch einmal versuchen. Details stehen im Shopware-Log.", "unsaved": "Keine Änderung | 1 Änderung nicht gespeichert | {count} Änderungen nicht gespeichert", "leave": "Es gibt ungespeicherte Änderungen. Seite wirklich verlassen?", "intro": "Alle Werte liegen in der normalen Theme-Konfiguration (Inhalte, Themes). Beide Wege ändern dasselbe."}, "presets": {"title": "Design-Presets", "intro": "Ein Preset setzt mehrere Einstellungen auf einmal. Es wirkt erst nach „Speichern“ und lässt sich vorher noch ändern.", "apply": "Preset anwenden", "applyNamed": "Preset „{name}“ anwenden", "applied": "Preset „{name}“ angewendet: 1 Einstellung geändert. Noch nicht gespeichert. | Preset „{name}“ angewendet: {count} Einstellungen geändert. Noch nicht gespeichert.", "appliedNone": "Preset „{name}“ angewendet. Es war nichts zu ändern.", "missing": "Auf Shopware nicht enthalten: {list}.", "sets": "Setzt:", "standard": {"label": "Standard", "help": "Die Grundeinstellung: Akzent Rot, weiche Ecken, normale Abstände, weiche Schatten, gefüllte Buttons. Eigene Farben werden geleert."}, "glass": {"label": "Glas", "help": "Glas-Flächen mit feinem Rand, runde Ecken und weiche Schatten. Bei alten Browsern und bei „Transparenz reduzieren“ bleiben die Flächen einfarbig."}, "compact": {"label": "Kompakt", "help": "Weniger Abstand, eckigere Ecken und breiterer Inhalt: mehr Produkte auf einen Blick."}}, "filter": {"title": "Suchen und filtern", "search": "Einstellung suchen", "placeholder": "z. B. Akzentfarbe, Schrift, Header", "mode": "Umfang", "simple": "Einfach", "expert": "Experte", "onlyChanged": "Nur geänderte", "results": "Keine Einstellung gefunden | 1 Treffer | {count} Treffer", "simpleHint": "Im Modus „Einfach“ sehen Sie die wichtigsten Einstellungen. „Experte“ zeigt alle."}, "field": {"reset": "Zurücksetzen", "resetNamed": "{name} auf Standard zurücksetzen", "default": "Standard: {value}", "defaultEmpty": "leer", "law": "Pflichtangabe, bitte mit Bedacht ändern.", "changed": "geändert", "on": "an", "off": "aus", "mediaId": "Medien-ID", "mediaHelp": "Wählen Sie ein Bild aus der Medienverwaltung.", "mediaFallback": "Medien-ID (aus Inhalte, Medien)", "invalidColor": "Bitte eine Farbe wie #c8161a eingeben."}, "colors": {"title": "Eigene Farben", "intro": "Leer lassen heißt: Standardfarbe des Themes. Hell und Dunkel sind getrennt einstellbar. Die Prüfung unten zeigt, ob Texte lesbar bleiben.", "color": "Farbe", "light": "Hell", "dark": "Dunkel", "open": "Farbwähler öffnen", "close": "Farbwähler schließen", "clear": "Leeren", "hexLabel": "{name} ({mode}), Farbwert als HEX", "warnings": "Kontrast-Prüfung", "warningsHint": "Geprüft werden nur Paare, bei denen Sie eine Farbe gesetzt haben (Ziel: mindestens 4,5 zu 1 für Text).", "warnOk": "in Ordnung", "warnLow": "zu niedrig", "warnNone": "Keine eigenen Farben gesetzt, nichts zu prüfen.", "warnMode": "{mode}: {label}, Kontrast {ratio} zu 1 (nötig {min}), {state}", "preview": "Vorschau", "previewMode": "Vorschau {mode}", "palette": "Palette", "paletteHint": "Der Farbwähler speichert bis zu 12 Farben für den ganzen Shop. Sie erscheinen in jedem Farbwähler.", "paletteSaved": "Palette gespeichert.", "paletteFailed": "Die Palette konnte nicht gespeichert werden.", "accentCheck": "Akzentfarbe: Kontrast Hell {light} zu 1, Dunkel {dark} zu 1 ({state}).", "token": {"bg": "Seitenhintergrund", "surface": "Fläche", "surface_2": "Fläche 2", "text": "Text", "text_muted": "Text gedämpft", "border_strong": "Rahmen", "link": "Link", "on_accent": "Button-Text", "header_bg": "Kopfzeile", "footer_bg": "Fußzeile", "announce_bg": "Ankündigungsleiste", "danger": "Sale/Fehler", "success": "Erfolg", "warning": "Warnung", "info": "Info", "focus": "Fokusrahmen"}}, "license": {"title": "Lizenzen", "statusTitle": "Lizenzstatus", "status": {"free": "Free aktiv", "active": "Pro aktiv", "problem": "Lizenz nicht aktiv"}, "tier": "Stufe: {tier}", "validUntil": "Gültig bis {date}.", "modules": "Gebuchte Module: {list}.", "grace": "Der Lizenzserver war nicht erreichbar, es gilt der zuletzt geprüfte Stand.", "domain": "Geprüft für die Domain {domain}. Die Lizenz gilt für die Domain, die in der Lizenz hinterlegt ist.", "reason": {"no_token": "Kein Lizenzcode eingetragen. Das Theme läuft mit allen Free-Funktionen.", "unreachable": "Der Lizenzserver ist gerade nicht erreichbar. Free-Funktionen bleiben aktiv, Ihr Shop läuft normal weiter.", "token_expired": "Die Lizenz ist abgelaufen. Free-Funktionen bleiben aktiv.", "token_revoked": "Die Lizenz wurde widerrufen oder gekündigt. Free-Funktionen bleiben aktiv.", "domain_mismatch": "Dieser Lizenzcode gilt nicht für diese Domain. Free-Funktionen bleiben aktiv.", "signature_invalid": "Der Lizenzcode ist nicht gültig. Bitte prüfen, ob er vollständig kopiert wurde.", "token_malformed": "Der Lizenzcode sieht nicht richtig aus. Bitte vollständig aus dem Kundenkonto kopieren.", "unknown_tier": "Die Lizenz gehört zu keiner bekannten Stufe. Free-Funktionen bleiben aktiv.", "other": "Die Lizenz ist ungültig. Free-Funktionen bleiben aktiv."}, "codeTitle": "Lizenzcode", "codeLabel": "Lizenzcode einfügen", "codeHelp": "Den Code finden Sie im Kundenkonto auf theme.michael-gahn.de. Nach dem Speichern wird er nie mehr im Klartext angezeigt.", "show": "Eingabe anzeigen", "stored": "Eingetragener Code: {masked}", "storedNone": "Es ist noch kein Lizenzcode eingetragen.", "saveCheck": "Speichern und prüfen", "recheck": "Jetzt prüfen", "remove": "Lizenzcode entfernen", "removeConfirm": "Lizenzcode wirklich entfernen? Pro-Funktionen sind danach aus.", "saved": "Lizenzcode gespeichert und geprüft.", "removed": "Lizenzcode entfernt.", "rechecked": "Lizenz neu geprüft.", "throttled": "Bitte kurz warten und noch einmal prüfen.", "errorFormat": "Der Code sieht nicht richtig aus. Er besteht aus drei Teilen mit Punkten. Bitte vollständig kopieren.", "errorFailed": "Das hat nicht geklappt. Bitte später noch einmal versuchen.", "saving": "Wird gespeichert. Das Theme wird neu übersetzt, das kann bis zu einer Minute dauern.", "buyTitle": "Lizenz kaufen oder verwalten", "buyText": "Pro-Funktionen und Updates gibt es auf der Website. Im Kundenkonto finden Sie danach den Lizenzcode.", "buyLink": "Zu theme.michael-gahn.de", "privacy": "Zur Prüfung gehen nur Lizenzcode und Domain an theme.michael-gahn.de. Besucher Ihres Shops sind nicht betroffen."}, "catalog": {"title": "Plugin-Empfehlungen", "intro": "Weitere Plugins von Michael Gahn DESIGN. Es wird nichts automatisch installiert. Zum Installieren laden Sie das ZIP herunter und laden es unter Erweiterungen, Meine Erweiterungen hoch.", "refresh": "Liste aktualisieren", "loading": "Liste wird geladen ...", "unavailable": "Die Liste ist gerade nicht erreichbar. Ihr Shop läuft ganz normal weiter. Bitte später noch einmal versuchen.", "stale": "Achtung: Die Liste konnte nicht neu geladen werden. Sie sehen den letzten bekannten Stand.", "throttled": "Bitte kurz warten, die Liste wurde gerade erst aktualisiert.", "empty": "Im Moment gibt es keine weiteren Plugins für Shopware 6.", "recommended": "Empfohlen", "free": "Kostenlos", "paid": "Kostenpflichtig", "announced": "Demnächst", "version": "Version", "download": "ZIP herunterladen", "details": "Mehr erfahren", "source": "Quelltext auf GitHub", "updatedAt": "Stand:", "privacy": "Hinweis: Zum Anzeigen der Bilder lädt Ihr Browser Dateien von theme.michael-gahn.de. Dabei sieht der Server Ihre IP-Adresse."}, "info": {"title": "Info", "versions": "Versionen", "plugin": "Plugin und Theme (eine Einheit)", "shopware": "Shopware", "php": "PHP", "schema": "Einstellungs-Schema", "status": "Zustand", "channels": "Verkaufskanäle mit diesem Theme", "channelsNone": "Dem Theme ist noch kein Verkaufskanal zugewiesen. Das Zuweisen ist ein bewusster Klick unter Inhalte, Themes.", "channelsOpen": "Theme-Manager öffnen (Inhalte, Themes)", "changelog": "Was ist neu", "changelogNone": "Kein Changelog gefunden.", "links": "Links", "linkShop": "Website und Kundenkonto", "linkSupport": "Support", "linkSource": "Quelltext auf GitHub", "ok": "in Ordnung", "themeFound": "Theme gefunden und aktiv im System", "assigned": "Theme ist Verkaufskanälen zugewiesen", "licenseKnown": "Lizenzstatus: {state}"}, "update": {"title": "Updates", "intro": "Hier sehen Sie, ob es eine neue Version gibt. Es wird nur nach Ihrem Klick nachgesehen. Nichts wird automatisch installiert.", "hint": "Die stündliche Prüfung hat Version {version} gefunden.", "check": "Nach Updates suchen", "available": "Version {version} ist verfügbar.", "none": "Sie haben die aktuelle Version.", "failed": "Die Update-Prüfung ist gerade nicht möglich. Bitte später erneut versuchen.", "install": "Version {version} einspielen", "confirm": "Version {version} jetzt einspielen? Vorher bitte ein Backup machen. Die Prüfsumme wird kontrolliert. Geht etwas schief, bleibt die bisherige Version erhalten.", "installing": "Update wird geladen und geprüft …", "installFailed": "Das Update konnte nicht eingespielt werden. Die bisherige Version ist unverändert.", "installed": "Version {version} ist vorbereitet. Letzter Schritt: unter Erweiterungen, Meine Erweiterungen bei MichaThemeV5 auf „Aktualisieren“ klicken."}}};

var enGB = {"michatheme-v5": {"menuTitle": "MichaThemeV5", "description": "Settings, license and plugin recommendations for the theme", "nav": {"label": "MichaThemeV5 sections", "settings": "Settings", "license": "Licenses", "catalog": "Plugin recommendations", "info": "Info"}, "common": {"loading": "Loading ...", "loadFailed": "The data could not be loaded. Please reload the page or try again later.", "readOnly": "You have read-only access. Changing is not possible.", "noTheme": "The MichaThemeV5 theme was not found. Please check under Extensions that the plugin is installed and active.", "newTab": "(opens in a new tab)", "themeSelect": "Theme variant", "themeChild": "child theme", "dismiss": "Close"}, "settings": {"title": "Settings", "save": "Save", "saving": "Saving. The theme is being recompiled, this can take up to a minute.", "saved": "Saved. The changes show in the shop as soon as the theme is compiled.", "savedCorrected": "Saved. 1 invalid entry was not accepted and is back to default. | Saved. {count} invalid entries were not accepted and are back to default.", "saveFailed": "Saving did not work. Please try again. Details are in the Shopware log.", "unsaved": "No changes | 1 change not saved | {count} changes not saved", "leave": "There are unsaved changes. Really leave this page?", "intro": "All values are stored in the normal theme configuration (Content, Themes). Both ways change the same thing."}, "presets": {"title": "Design presets", "intro": "A preset sets several settings at once. It only takes effect after “Save” and can still be changed before.", "apply": "Apply preset", "applyNamed": "Apply preset “{name}”", "applied": "Preset “{name}” applied: 1 setting changed. Not saved yet. | Preset “{name}” applied: {count} settings changed. Not saved yet.", "appliedNone": "Preset “{name}” applied. Nothing needed to change.", "missing": "Not available on Shopware: {list}.", "sets": "Sets:", "standard": {"label": "Default", "help": "The default: red accent, soft corners, normal spacing, soft shadows, solid buttons. Custom colors are cleared."}, "glass": {"label": "Glass", "help": "Glass surfaces with a fine border, round corners and soft shadows. Old browsers and “reduce transparency” keep plain surfaces."}, "compact": {"label": "Compact", "help": "Less spacing, sharper corners and wider content: more products at a glance."}}, "filter": {"title": "Search and filter", "search": "Search settings", "placeholder": "e.g. accent color, font, header", "mode": "Scope", "simple": "Simple", "expert": "Expert", "onlyChanged": "Changed only", "results": "No setting found | 1 match | {count} matches", "simpleHint": "“Simple” shows the most important settings. “Expert” shows all of them."}, "field": {"reset": "Reset", "resetNamed": "Reset {name} to default", "default": "Default: {value}", "defaultEmpty": "empty", "law": "Legally required, please change with care.", "changed": "changed", "on": "on", "off": "off", "mediaId": "Media ID", "mediaHelp": "Choose an image from the media library.", "mediaFallback": "Media ID (from Content, Media)", "invalidColor": "Please enter a color like #c8161a."}, "colors": {"title": "Custom colors", "intro": "Leave empty to keep the theme default. Light and dark are set separately. The check below shows whether text stays readable.", "color": "Color", "light": "Light", "dark": "Dark", "open": "Open color picker", "close": "Close color picker", "clear": "Clear", "hexLabel": "{name} ({mode}), color value as HEX", "warnings": "Contrast check", "warningsHint": "Only pairs where you set a color are checked (goal: at least 4.5 to 1 for text).", "warnOk": "OK", "warnLow": "too low", "warnNone": "No custom colors set, nothing to check.", "warnMode": "{mode}: {label}, contrast {ratio} to 1 (needed {min}), {state}", "preview": "Preview", "previewMode": "Preview {mode}", "palette": "Palette", "paletteHint": "The color picker stores up to 12 colors for the whole shop. They appear in every color picker.", "paletteSaved": "Palette saved.", "paletteFailed": "The palette could not be saved.", "accentCheck": "Accent color: contrast light {light} to 1, dark {dark} to 1 ({state}).", "token": {"bg": "Page background", "surface": "Surface", "surface_2": "Surface 2", "text": "Text", "text_muted": "Muted text", "border_strong": "Border", "link": "Link", "on_accent": "Button text", "header_bg": "Header", "footer_bg": "Footer", "announce_bg": "Announcement bar", "danger": "Sale/error", "success": "Success", "warning": "Warning", "info": "Info", "focus": "Focus ring"}}, "license": {"title": "Licenses", "statusTitle": "License status", "status": {"free": "Free active", "active": "Pro active", "problem": "License not active"}, "tier": "Tier: {tier}", "validUntil": "Valid until {date}.", "modules": "Booked modules: {list}.", "grace": "The license server was not reachable, the last checked state applies.", "domain": "Checked for the domain {domain}. The license applies to the domain stored in the license.", "reason": {"no_token": "No license code entered. The theme runs with all free features.", "unreachable": "The license server is not reachable right now. Free features stay active, your shop keeps running.", "token_expired": "The license has expired. Free features stay active.", "token_revoked": "The license was revoked or cancelled. Free features stay active.", "domain_mismatch": "This license code is not valid for this domain. Free features stay active.", "signature_invalid": "The license code is not valid. Please check that it was copied completely.", "token_malformed": "The license code does not look right. Please copy it completely from your customer account.", "unknown_tier": "The license belongs to no known tier. Free features stay active.", "other": "The license is invalid. Free features stay active."}, "codeTitle": "License code", "codeLabel": "Paste license code", "codeHelp": "You find the code in your customer account on theme.michael-gahn.de. After saving it is never shown in plain text again.", "show": "Show input", "stored": "Stored code: {masked}", "storedNone": "No license code stored yet.", "saveCheck": "Save and check", "recheck": "Check now", "remove": "Remove license code", "removeConfirm": "Really remove the license code? Pro features are off afterwards.", "saved": "License code saved and checked.", "removed": "License code removed.", "rechecked": "License checked again.", "throttled": "Please wait a moment and check again.", "errorFormat": "The code does not look right. It has three parts separated by dots. Please copy it completely.", "errorFailed": "That did not work. Please try again later.", "saving": "Saving. The theme is being recompiled, this can take up to a minute.", "buyTitle": "Buy or manage a license", "buyText": "Pro features and updates are available on the website. Afterwards you find the license code in your customer account.", "buyLink": "Go to theme.michael-gahn.de", "privacy": "Only the license code and the domain are sent to theme.michael-gahn.de for checking. Visitors of your shop are not affected."}, "catalog": {"title": "Plugin recommendations", "intro": "More plugins by Michael Gahn DESIGN. Nothing is installed automatically. To install, download the ZIP and upload it under Extensions, My extensions.", "refresh": "Refresh list", "loading": "Loading list ...", "unavailable": "The list is not reachable right now. Your shop keeps running normally. Please try again later.", "stale": "Note: The list could not be refreshed. You see the last known state.", "throttled": "Please wait a moment, the list was just refreshed.", "empty": "There are no further plugins for Shopware 6 at the moment.", "recommended": "Recommended", "free": "Free", "paid": "Paid", "announced": "Coming soon", "version": "Version", "download": "Download ZIP", "details": "Learn more", "source": "Source code on GitHub", "updatedAt": "As of:", "privacy": "Note: To show the images your browser loads files from theme.michael-gahn.de. The server sees your IP address."}, "info": {"title": "Info", "versions": "Versions", "plugin": "Plugin and theme (one unit)", "shopware": "Shopware", "php": "PHP", "schema": "Settings schema", "status": "Status", "channels": "Sales channels using this theme", "channelsNone": "No sales channel is assigned to the theme yet. Assigning is a deliberate click under Content, Themes.", "channelsOpen": "Open theme manager (Content, Themes)", "changelog": "What is new", "changelogNone": "No changelog found.", "links": "Links", "linkShop": "Website and customer account", "linkSupport": "Support", "linkSource": "Source code on GitHub", "ok": "OK", "themeFound": "Theme found and active in the system", "assigned": "Theme is assigned to sales channels", "licenseKnown": "License status: {state}"}, "update": {"title": "Updates", "intro": "See here whether a new version is available. It is only checked after your click. Nothing is installed automatically.", "hint": "The hourly check found version {version}.", "check": "Check for updates", "available": "Version {version} is available.", "none": "You have the latest version.", "failed": "The update check is not possible right now. Please try again later.", "install": "Install version {version}", "confirm": "Install version {version} now? Please make a backup first. The checksum is verified. If anything fails, the current version stays in place.", "installing": "Downloading and verifying the update …", "installFailed": "The update could not be installed. The current version is unchanged.", "installed": "Version {version} is prepared. Last step: go to Extensions, My extensions and click “Update” for MichaThemeV5."}}};

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
// Reiter-Navigation der Seiten (echte Links, aktuelle Seite per aria-current)
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
                    // alte Plugin-Empfehlungen nicht mehr verlinkt, Updates + Weitere Plugins = Baukasten-Seite
                    { name: 'mgd.kit.michatheme.v5.shopware.index', label: 'michatheme-v5.update.title' },
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

        inject: ['loginService', 'acl'],

        data: function () {
            return { loading: true, failed: false, info: {}, upd: { busy: false, latest: '', text: '', kind: 'info' } };
        },

        computed: {
            canUpdate: function () { return NS.can(this.acl, 'system_config.editor'); },
            // Hinweis nur, wenn die gemerkte Version wirklich neuer ist
            hintNewer: function () {
                var a = String(this.info.updateHint || '').split('.').map(Number);
                var b = String(this.info.pluginVersion || '').split('.').map(Number);
                if (a.length !== 3 || b.length !== 3) { return false; }
                for (var i = 0; i < 3; i++) { if (a[i] !== b[i]) { return a[i] > b[i]; } }
                return false;
            },
            links: function () {
                var l = this.info.links || {};
                var out = [];
                [['shop', 'michatheme-v5.info.linkShop'], ['support', 'michatheme-v5.info.linkSupport'], ['source', 'michatheme-v5.info.linkSource']].forEach(function (p) {
                    if (typeof l[p[0]] === 'string' && l[p[0]].indexOf('https://') === 0) { out.push({ key: p[0], url: l[p[0]], text: p[1] }); }
                });

                return out.map(function (x) { return { key: x.key, url: x.url, text: this.$tc(x.text) }; }, this);
            }
        },

        methods: {
            // alt, abgeschaltet (Routen gibts nicht mehr): Nach Updates suchen
            checkUpdate: function () {
                var vm = this;
                vm.upd = { busy: true, latest: '', text: vm.$tc('michatheme-v5.common.loading'), kind: 'info' };
                NS.post(vm.loginService, 'update/status', {}).then(function (d) {
                    if (d.error) {
                        vm.upd = { busy: false, latest: '', text: vm.$tc('michatheme-v5.update.failed'), kind: 'bad' };
                    } else if (d.updateAvailable && typeof d.latestVersion === 'string') {
                        vm.upd = { busy: false, latest: d.latestVersion, text: vm.$tc('michatheme-v5.update.available', 0, { version: d.latestVersion }), kind: 'info' };
                    } else {
                        vm.upd = { busy: false, latest: '', text: vm.$tc('michatheme-v5.update.none'), kind: 'good' };
                    }
                });
            },
            // alt, abgeschaltet: Update einspielen
            installUpdate: function () {
                var vm = this;
                if (!window.confirm(vm.$tc('michatheme-v5.update.confirm', 0, { version: vm.upd.latest }))) { return; }
                vm.upd = Object.assign({}, vm.upd, { busy: true, text: vm.$tc('michatheme-v5.update.installing'), kind: 'info' });
                NS.post(vm.loginService, 'update/install', {}).then(function (d) {
                    if (d.error || !d.prepared) {
                        vm.upd = { busy: false, latest: vm.upd.latest, text: vm.$tc('michatheme-v5.update.installFailed'), kind: 'bad' };
                    } else {
                        vm.upd = { busy: false, latest: '', text: vm.$tc('michatheme-v5.update.installed', 0, { version: d.latestVersion }), kind: 'good' };
                    }
                });
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

/* src/Kit/Platform/Shopware/administration/mgd-kit.js */
// MGD Plugin-Baukasten - Admin-Seite "MichaThemeV5" fertig geschrieben, kein Build nötig
// Daten aus /api/_action/mgd-kit/michatheme-v5-shopware/... , keine fremden Bilder/Schriften (Bilder als data:-URI über /media)
(function (root) {
    'use strict';

    var PRODUCT = 'michatheme-v5-shopware';
    var MODULE = 'mgd-kit-' + PRODUCT;
    var API = '/_action/mgd-kit/' + PRODUCT;
    var STYLE_ID = MODULE + '-style';
    // Links nur auf diese Adressen (Server prüft auch)
    var LINK_PREFIXES = ['https://theme.michael-gahn.de/', 'https://github.com/MichaelGahnDESIGN/'];
    var PLUGIN_PRIVS = ['system.plugin_maintain', 'system.plugin_upload'];
    var FILE_RE = /^[a-f0-9]{32}\.webp$/;
    var DATA_RE = /^data:image\/webp;base64,[A-Za-z0-9+\/]+={0,2}$/;
    var ACCENT_RE = /^#[0-9a-fA-F]{6}$/;
    // Katalog-CSS (Catalog/assets/kit-catalog.css), setzt der Baukasten beim Kopieren ein
    var CATALOG_CSS = "/* Weitere Plugins JTL + Shopware - Kopie aus Platform/WordPress/assets/kit-catalog.css, gleiche Klassen  */\n/* hell, keine fremden Schriften/Bilder. Shopware kriegt die Datei beim Bauen in mgd-kit.js reinkopiert */\n.mgd-kit-catalog {\n  --ink: #172d2a;\n  --muted: #4d5d59;\n  --line: #d9e1dc;\n  --paper: #f5f6f2;\n  --accent: #b51f2a;\n  --focus: #a51d29;\n  container-type: inline-size;\n  color: var(--ink);\n  max-width: 1500px;\n  margin: 0;\n  font-size: 14px;\n  line-height: 1.6;\n  overflow-wrap: anywhere;\n}\n.mgd-kit-catalog *,\n.mgd-kit-catalog *::before,\n.mgd-kit-catalog *::after {\n  box-sizing: border-box;\n}\n.mgd-kit-catalog [hidden] {\n  display: none !important;\n}\n/* nur für Screenreader, gibts in JTL/Shopware nicht wie in WP */\n.mgd-kit-catalog .mgd-kit-catalog__sr {\n  position: absolute !important;\n  width: 1px;\n  height: 1px;\n  padding: 0;\n  margin: -1px;\n  overflow: hidden;\n  clip: rect(0, 0, 0, 0);\n  white-space: nowrap;\n  border: 0;\n}\n.mgd-kit-catalog .mgd-kit-catalog__stale {\n  color: var(--muted);\n  font-size: 13px;\n}\n.mgd-kit-catalog a,\n.mgd-kit-catalog button {\n  text-decoration: none !important;\n}\n/* Reset gegen kit-jtl.css (.mgd-kit-jtl button / label / h3) */\n.mgd-kit-catalog button,\n.mgd-kit-catalog .mgd-kit-catalog__button {\n  margin: 0;\n  font-family: inherit;\n}\n.mgd-kit-catalog label {\n  min-height: 0;\n}\n.mgd-kit-catalog h2,\n.mgd-kit-catalog h3,\n.mgd-kit-catalog h4 {\n  font-family: inherit;\n}\n.mgd-kit-catalog p {\n  font-size: inherit;\n}\n/* Fokus immer sichtbar */\n.mgd-kit-catalog a:focus-visible,\n.mgd-kit-catalog button:focus-visible,\n.mgd-kit-catalog input:focus-visible,\n.mgd-kit-catalog select:focus-visible {\n  outline: 3px solid var(--focus) !important;\n  outline-offset: 3px;\n  box-shadow: none !important;\n}\n/*Hero Kopfbereich */\n.mgd-kit-catalog .mgd-kit-catalog__hero {\n  position: relative;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  overflow: hidden;\n  background: #172d2a;\n  color: #fff;\n  border-radius: 20px;\n  padding: 32px 40px;\n  min-height: 260px;\n}\n.mgd-kit-catalog__hero-copy {\n  position: relative;\n  z-index: 1;\n  min-width: 0;\n}\n.mgd-kit-catalog .mgd-kit-catalog__eyebrow {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 12px;\n  letter-spacing: 0.16em;\n  font-size: 11px;\n  font-weight: 700;\n  color: #d6e4db;\n  margin: 0 0 16px;\n}\n.mgd-kit-catalog__brand {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  background: #c3202d;\n  color: #fff;\n  border-radius: 5px;\n  width: 44px;\n  height: 32px;\n  letter-spacing: -1px;\n  font-size: 16px;\n}\n.mgd-kit-catalog .mgd-kit-catalog__hero h3 {\n  font-size: 38px;\n  line-height: 1.12;\n  font-weight: 700;\n  letter-spacing: -1.3px;\n  color: #fff;\n  margin: 0 0 17px;\n  padding: 0;\n}\n.mgd-kit-catalog .mgd-kit-catalog__hero h3 em {\n  font-style: normal;\n  color: #e5c58e;\n}\n.mgd-kit-catalog .mgd-kit-catalog__hero-copy \u003E p:last-child {\n  color: #d3ded7;\n  margin: 0;\n  line-height: 1.6;\n  font-size: 14px;\n}\n.mgd-kit-catalog__hero-art {\n  position: relative;\n  flex: 0 0 34%;\n  height: 215px;\n  margin-left: 20px;\n}\n.mgd-kit-catalog__orbit {\n  position: absolute;\n  width: 270px;\n  height: 270px;\n  border: 1px solid #ffffff24;\n  border-radius: 50%;\n  top: -35px;\n  left: 50%;\n  transform: translateX(-50%);\n}\n.mgd-kit-catalog__orbit::after {\n  content: \"\";\n  position: absolute;\n  inset: 28px;\n  border: 1px solid #ffffff15;\n  border-radius: 50%;\n}\n.mgd-kit-catalog__hero-icon {\n  position: absolute;\n  border-radius: 21px;\n  box-shadow: 0 18px 32px #0004;\n}\n.mgd-kit-catalog__hero-icon--0 { left: 4%; top: 55px; transform: rotate(-13deg); }\n.mgd-kit-catalog__hero-icon--1 { left: 37%; top: 20px; transform: rotate(8deg); z-index: 1; }\n.mgd-kit-catalog__hero-icon--2 { left: 67%; top: 76px; transform: rotate(17deg); }\n.mgd-kit-catalog__art-caption {\n  position: absolute;\n  bottom: 0;\n  left: 0;\n  right: 0;\n  text-align: center;\n  color: #c7d4cb;\n  font-size: 9px;\n  letter-spacing: 0.16em;\n  font-weight: 600;\n}\n/* Leiste mit Anzahl */\n.mgd-kit-catalog__collection-bar {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 19px 2px 25px;\n  gap: 16px;\n}\n.mgd-kit-catalog .mgd-kit-catalog__collection-bar p {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 20px;\n  margin: 0;\n  color: var(--muted);\n  font-size: 12px;\n}\n.mgd-kit-catalog__collection-bar strong {\n  color: var(--ink);\n}\n.mgd-kit-catalog .mgd-kit-catalog__notice {\n  border-left: 4px solid var(--accent);\n  background: #fff;\n  padding: 14px 18px;\n  border-radius: 4px;\n  color: var(--ink);\n}\n/* Suche + Filter */\n.mgd-kit-catalog__toolbar {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 12px;\n  align-items: center;\n  background: #fff;\n  padding: 14px;\n  border: 1px solid var(--line);\n  border-radius: 12px;\n}\n.mgd-kit-catalog__search {\n  flex: 1 1 260px;\n  position: relative;\n  min-width: 0;\n}\n.mgd-kit-catalog__search label {\n  position: absolute;\n  left: 15px;\n  top: 7px;\n  font-size: 25px;\n  line-height: 1.3;\n  color: #566a62;\n}\n.mgd-kit-catalog .mgd-kit-catalog__search input {\n  width: 100%;\n  max-width: none;\n  height: 46px;\n  min-height: 46px;\n  border: 1px solid #8a9a93;\n  border-radius: 7px;\n  background: var(--paper);\n  padding: 0 14px 0 44px;\n  font-size: 14px;\n  color: var(--ink);\n}\n.mgd-kit-catalog .mgd-kit-catalog__select {\n  display: flex;\n  align-items: center;\n  gap: 9px;\n  min-height: 46px;\n  font-size: 12px;\n  color: var(--muted);\n  white-space: nowrap;\n}\n.mgd-kit-catalog .mgd-kit-catalog__select select {\n  border: 1px solid #8a9a93;\n  border-radius: 7px;\n  height: 46px;\n  min-height: 46px;\n  max-width: 190px;\n  padding-left: 12px;\n  font-size: 12px;\n  color: var(--ink);\n  background-color: #fff;\n}\n.mgd-kit-catalog__browse-heading {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n  margin: 22px 0 18px;\n}\n.mgd-kit-catalog__categories {\n  display: flex;\n  gap: 6px;\n  flex-wrap: wrap;\n}\n.mgd-kit-catalog .mgd-kit-catalog__categories button {\n  display: inline-flex;\n  align-items: center;\n  background: none;\n  border: 1px solid transparent;\n  border-radius: 6px;\n  font-size: 12px;\n  min-height: 44px;\n  min-width: 44px;\n  padding: 8px 12px;\n  cursor: pointer;\n  color: var(--muted);\n  font-weight: 600;\n}\n.mgd-kit-catalog .mgd-kit-catalog__categories button[aria-pressed=\"true\"] {\n  background: var(--ink);\n  color: #fff;\n}\n.mgd-kit-catalog .mgd-kit-catalog__categories button:hover {\n  border-color: var(--ink);\n}\n.mgd-kit-catalog .mgd-kit-catalog__count {\n  white-space: nowrap;\n  font-size: 12px;\n  color: var(--muted);\n  margin: 0;\n}\n/* Karten Grid - passt sich der Breite an, 390px ohne Querscrollen */\n.mgd-kit-catalog__grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));\n  gap: 20px;\n}\n.mgd-kit-catalog__card {\n  --mgd-kit-cat-accent: #7c9a88;\n  --wash: color-mix(in srgb, var(--mgd-kit-cat-accent) 22%, #fff);\n  display: flex;\n  flex-direction: column;\n  min-width: 0;\n  background: #fff;\n  border: 1px solid #dce2dc;\n  border-radius: 13px;\n  overflow: hidden;\n  box-shadow: 0 3px 9px #192c2410;\n  transition: box-shadow 0.18s, border-color 0.18s;\n}\n.mgd-kit-catalog__card:hover {\n  box-shadow: 0 10px 24px #192c2415;\n  border-color: #a3b3a7;\n}\n/* ohne Bild nur Farbfläche aus accent */\n.mgd-kit-catalog__card-art {\n  position: relative;\n  background: #e4ece5;\n  background: linear-gradient(135deg, var(--wash), color-mix(in srgb, var(--mgd-kit-cat-accent) 45%, #fff));\n  height: 149px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  overflow: hidden;\n}\n.mgd-kit-catalog__card-background {\n  position: absolute;\n  inset: 0;\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n  object-position: center;\n}\n.mgd-kit-catalog__card-icon {\n  position: relative;\n  z-index: 1;\n  border-radius: 17px;\n  box-shadow: 0 0 0 4px #ffffffb3, 0 10px 24px #14251e40;\n}\n/* deckende Schilder, Text bleibt auf jedem Bild lesbar */\n.mgd-kit-catalog__category,\n.mgd-kit-catalog__version {\n  z-index: 2;\n  background: #fff;\n  border: 1px solid #e5e8e3;\n  border-radius: 5px;\n  padding: 4px 7px;\n  line-height: 1.4;\n  color: var(--ink);\n}\n.mgd-kit-catalog__category {\n  position: absolute;\n  top: 13px;\n  left: 17px;\n  font-size: 10px;\n  font-weight: 700;\n  letter-spacing: 0.07em;\n  text-transform: uppercase;\n}\n.mgd-kit-catalog__version {\n  position: absolute;\n  bottom: 9px;\n  right: 13px;\n  font-size: 10px;\n}\n.mgd-kit-catalog__card-body {\n  padding: 21px;\n  display: flex;\n  flex-direction: column;\n  flex: 1;\n}\n.mgd-kit-catalog__card-heading {\n  display: flex;\n  flex-direction: column;\n  align-items: flex-start;\n  gap: 5px;\n}\n.mgd-kit-catalog .mgd-kit-catalog__card h4 {\n  font-size: 20px;\n  letter-spacing: -0.45px;\n  line-height: 1.25;\n  color: var(--ink);\n  margin: 0;\n}\n.mgd-kit-catalog__price {\n  color: var(--muted);\n  font-size: 11px;\n}\n.mgd-kit-catalog .mgd-kit-catalog__description {\n  color: var(--muted);\n  font-size: 13px;\n  line-height: 1.65;\n  margin: 13px 0 16px;\n  min-height: 64px;\n}\n/* Häkchen Punkte */\n.mgd-kit-catalog__features {\n  margin: 0 0 20px;\n  padding: 0;\n  list-style: none;\n  font-size: 12px;\n}\n.mgd-kit-catalog__features li {\n  padding-left: 19px;\n  position: relative;\n  margin: 5px 0;\n  line-height: 1.5;\n}\n.mgd-kit-catalog__features li::before {\n  content: \"✓\";\n  position: absolute;\n  left: 0;\n  font-weight: bold;\n  color: #2c5a45;\n}\n.mgd-kit-catalog__card-status {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 8px;\n  justify-content: space-between;\n  align-items: center;\n  font-size: 11px;\n  color: var(--muted);\n  margin-top: auto;\n  margin-bottom: 16px;\n}\n.mgd-kit-catalog__status {\n  font-size: 11px;\n  font-weight: 600;\n  line-height: 1.5;\n  color: #3f5446;\n  background: #eef2ee;\n  padding: 4px 8px;\n  border-radius: 4px;\n}\n.mgd-kit-catalog__status--installed { background: #e7f1e8; color: #24543a; }\n.mgd-kit-catalog__status--update { background: #fff1cb; color: #5e4200; }\n.mgd-kit-catalog__actions {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n  border-top: 1px solid #e5e9e4;\n  padding-top: 15px;\n}\n.mgd-kit-catalog__actions form {\n  margin: 0;\n}\n.mgd-kit-catalog .mgd-kit-catalog__details {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  color: var(--ink);\n  font-size: 12px;\n  font-weight: 600;\n  min-height: 44px;\n}\n.mgd-kit-catalog .mgd-kit-catalog__details:hover {\n  color: var(--accent);\n}\n/* Basic_BTN Ansehen / Mehr erfahren */\n.mgd-kit-catalog .mgd-kit-catalog__button {\n  display: inline-flex;\n  justify-content: center;\n  align-items: center;\n  gap: 15px;\n  min-height: 44px;\n  min-width: 44px;\n  padding: 9px 15px;\n  border: 1px solid var(--ink);\n  border-radius: 6px;\n  background: var(--ink);\n  color: #fff !important;\n  font-size: 12px;\n  font-weight: 600;\n  line-height: 1.5;\n  cursor: pointer;\n  max-width: 100%;\n  text-align: center;\n}\n.mgd-kit-catalog .mgd-kit-catalog__button:hover {\n  background: #29473d;\n}\n.mgd-kit-catalog .mgd-kit-catalog__button--quiet {\n  color: var(--ink) !important;\n  background: #f5f7f3;\n  border-color: #b9c6b9;\n}\n.mgd-kit-catalog .mgd-kit-catalog__button--quiet:hover {\n  background: #e7ede7;\n}\n.mgd-kit-catalog .mgd-kit-catalog__button:disabled {\n  opacity: 0.65;\n  cursor: wait;\n}\n.mgd-kit-catalog__unavailable {\n  font-size: 12px;\n  color: var(--muted);\n}\n/* Leerzustand */\n.mgd-kit-catalog__empty {\n  text-align: center;\n  padding: 60px 20px;\n  background: #fff;\n  border: 1px dashed #a7b7a8;\n  border-radius: 12px;\n}\n.mgd-kit-catalog__empty \u003E span {\n  font-size: 40px;\n}\n.mgd-kit-catalog .mgd-kit-catalog__empty h4 {\n  font-size: 22px;\n  color: var(--ink);\n  margin: 8px 0;\n}\n.mgd-kit-catalog .mgd-kit-catalog__empty p {\n  color: var(--muted);\n}\n.mgd-kit-catalog__footer {\n  display: flex;\n  justify-content: space-between;\n  gap: 24px;\n  border-top: 1px solid var(--line);\n  margin-top: 30px;\n  padding: 18px 2px 4px;\n  font-size: 12px;\n  color: var(--muted);\n}\n.mgd-kit-catalog .mgd-kit-catalog__footer p {\n  margin: 0;\n  color: var(--muted);\n  font-size: 12px;\n}\n.mgd-kit-catalog .mgd-kit-catalog__footer p:first-child {\n  display: flex;\n  flex-direction: column;\n}\n.mgd-kit-catalog__footer strong {\n  color: var(--ink);\n}\n.mgd-kit-catalog .mgd-kit-catalog__footer p:last-child {\n  text-align: right;\n}\n/* WTF Modal Effekt - Details Dialog */\n.mgd-kit-catalog__dialog {\n  border: 0;\n  border-radius: 16px;\n  padding: 30px;\n  width: min(560px, calc(100vw - 32px));\n  max-height: 85vh;\n  overflow: auto;\n  color: var(--ink);\n  background: #fff;\n  box-shadow: 0 30px 100px #0004;\n}\n.mgd-kit-catalog__dialog::backdrop {\n  background: #0d1e23a8;\n}\n.mgd-kit-catalog__dialog-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n}\n.mgd-kit-catalog .mgd-kit-catalog__dialog-header p {\n  font-size: 11px;\n  letter-spacing: 0.14em;\n  color: var(--muted);\n}\n.mgd-kit-catalog .mgd-kit-catalog__dialog-header button {\n  width: 44px;\n  height: 44px;\n  justify-content: center;\n  background: #eef2ed;\n  border: 0;\n  border-radius: 50%;\n  font-size: 28px;\n  line-height: 1;\n  cursor: pointer;\n  color: var(--ink);\n}\n.mgd-kit-catalog .mgd-kit-catalog__dialog h2 {\n  font-size: 28px;\n  line-height: 1.2;\n  margin: 15px 0;\n  color: var(--ink);\n}\n.mgd-kit-catalog__dialog li {\n  margin-bottom: 9px;\n}\n.mgd-kit-catalog__dialog ul {\n  padding-left: 20px;\n  list-style: disc;\n}\n.mgd-kit-catalog__dialog .mgd-kit-catalog__button {\n  margin-top: 12px;\n}\n/* schmal (Container, nicht Fenster - steckt ja im Dashboard) */\n@container (max-width: 900px) {\n  .mgd-kit-catalog .mgd-kit-catalog__hero { padding: 28px; }\n  .mgd-kit-catalog__hero-icon { width: 78px; height: 78px; }\n  .mgd-kit-catalog__search { flex-basis: 100%; }\n  .mgd-kit-catalog .mgd-kit-catalog__select { flex: 1 1 160px; }\n  .mgd-kit-catalog .mgd-kit-catalog__select select { max-width: none; width: 100%; }\n}\n@container (max-width: 650px) {\n  .mgd-kit-catalog .mgd-kit-catalog__hero { padding: 22px; min-height: 0; border-radius: 13px; }\n  .mgd-kit-catalog .mgd-kit-catalog__hero h3 { font-size: 28px; letter-spacing: -0.8px; }\n  .mgd-kit-catalog__hero-art { display: none; }\n  .mgd-kit-catalog .mgd-kit-catalog__eyebrow { font-size: 10px; letter-spacing: 0.08em; }\n  .mgd-kit-catalog__collection-bar { align-items: flex-start; flex-direction: column; padding-bottom: 16px; gap: 3px; }\n  .mgd-kit-catalog .mgd-kit-catalog__collection-bar p { gap: 10px; }\n  .mgd-kit-catalog .mgd-kit-catalog__select { min-width: 100%; }\n  .mgd-kit-catalog .mgd-kit-catalog__select select { flex: 1; }\n  .mgd-kit-catalog__browse-heading { align-items: flex-start; flex-direction: column; }\n  .mgd-kit-catalog__categories { gap: 3px; }\n  .mgd-kit-catalog .mgd-kit-catalog__categories button { padding: 8px; }\n  .mgd-kit-catalog__card-body { padding: 16px; }\n  .mgd-kit-catalog__footer { flex-direction: column; gap: 12px; }\n  .mgd-kit-catalog .mgd-kit-catalog__footer p:last-child { text-align: left; }\n  .mgd-kit-catalog .mgd-kit-catalog__description { min-height: 0; }\n  .mgd-kit-catalog__dialog { padding: 20px; }\n}\n@media (prefers-reduced-motion: reduce) {\n  .mgd-kit-catalog__card { transition: none; }\n}\n/* Kontrast-Modus Windows */\n@media (forced-colors: active) {\n  .mgd-kit-catalog__card-background { display: none; }\n  .mgd-kit-catalog .mgd-kit-catalog__button,\n  .mgd-kit-catalog .mgd-kit-catalog__categories button { border: 1px solid ButtonText; }\n  .mgd-kit-catalog .mgd-kit-catalog__categories button[aria-pressed=\"true\"] { border: 3px solid Highlight; }\n  .mgd-kit-catalog .mgd-kit-catalog__hero,\n  .mgd-kit-catalog__card-art,\n  .mgd-kit-catalog__card { border: 1px solid CanvasText; }\n  .mgd-kit-catalog a:focus-visible,\n  .mgd-kit-catalog button:focus-visible,\n  .mgd-kit-catalog input:focus-visible,\n  .mgd-kit-catalog select:focus-visible { outline-color: Highlight !important; }\n}\n\n/* Tag-Chips (mehrere wählbar) */\n.mgd-kit-catalog__tags{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:0 0 14px}\n.mgd-kit-catalog__tags-title{font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;opacity:.75;margin-right:4px}\n.mgd-kit-catalog__tags button{min-height:30px;padding:0 12px;border:1px solid currentColor;border-radius:999px;background:transparent;color:inherit;font:inherit;font-size:13px;cursor:pointer;opacity:.85}\n.mgd-kit-catalog__tags button[aria-pressed=\"true\"]{background:var(--mgd-kit-cat-accent,#1e2c2c);border-color:var(--mgd-kit-cat-accent,#1e2c2c);color:#fff;opacity:1}\n.mgd-kit-catalog__tags button:focus-visible{outline:3px solid #2271b1;outline-offset:2px}\n.mgd-kit-catalog__tags .mgd-kit-catalog__tags-reset{border-style:dashed}\n";
    // Texte mit eigenem Schlüssel, Wortlaut setzt die Plattform nach Freigabe ein
    var TEXTS = {
        finishMissing: 'Die neuen Dateien sind eingespielt. Bitte klicke unter Erweiterungen bei diesem Plugin auf Aktualisieren.'
    };

    var STYLE = [
        '.mgd-kit-sw p{margin:0 0 10px;line-height:1.5}',
        '.mgd-kit-sw .mgd-kit-note{padding:12px;border-left:4px solid #b45309;background:#fffbeb;color:#1f2d3d}',
        '.mgd-kit-sw .mgd-kit-error{padding:12px;border-left:4px solid #b91c1c;background:#fef2f2;color:#1f2d3d}',
        '.mgd-kit-sw .mgd-kit-ok{padding:12px;border-left:4px solid #15803d;background:#f0fdf4;color:#1f2d3d}',
        '.mgd-kit-sw ol{margin:0 0 10px 20px}',
        '.mgd-kit-sw .mgd-kit-small{font-size:13px;color:#3d4c5c}',
        '.mgd-kit-sw label{display:block;margin:0 0 6px;font-weight:600}',
        '.mgd-kit-sw input[type=password]{width:100%;max-width:420px;min-height:44px;padding:8px;border:1px solid #6b7c8d;border-radius:4px}',
        // Vue 2 kann kein template mit key > Wrapper-span trägt die Hero-Position
        '.mgd-kit-sw span.mgd-kit-catalog__hero-icon{display:block;width:94px;height:94px;overflow:hidden}',
        '.mgd-kit-sw span.mgd-kit-catalog__hero-icon>*{display:block;width:100%;height:100%}',
        '.mgd-kit-sw a:focus-visible,.mgd-kit-sw input:focus-visible{outline:3px solid #1d4ed8;outline-offset:2px}'
    ].join('');

    var TEMPLATE = [
        '<sw-page class="mgd-kit-sw">',
        '  <template #smart-bar-header><h2>{{ title }}</h2></template>',
        '  <template #content>',
        '    <sw-card-view>',
        '      <p v-if="isLoading" role="status">Wird geladen …</p>',
        '      <p v-else-if="loadError" class="mgd-kit-error" role="alert">Die Seite konnte gerade nicht geladen werden. Bitte lade sie neu.</p>',
        '      <template v-else>',
        '        <sw-card title="Info">',
        '          <p>Plugin: {{ status.name }}</p>',
        '          <p>Version: {{ updates.installed || "unbekannt" }}</p>',
        '        </sw-card>',
        '        <sw-card title="Updates">',
        '          <p v-if="!updates.available">Die Update-Prüfung hat gerade nicht geklappt. Versuche es später noch einmal.</p>',
        '          <p v-else-if="!updates.newer">Du hast die aktuelle Version.</p>',
        '          <template v-else>',
        '            <p>Version {{ updates.newest }} ist verfügbar.</p>',
        '            <p v-if="updates.changelog" class="mgd-kit-small">{{ updates.changelog }}</p>',
        '            <sw-button v-if="status.canUpdate && !fallback" variant="primary" :disabled="isUpdating" :isLoading="isUpdating" @click="runUpdate">Jetzt aktualisieren</sw-button>',
        '            <p v-if="!status.canUpdate && !fallback" class="mgd-kit-small">Den Knopf „Jetzt aktualisieren“ sehen nur Admins mit dem Recht, Erweiterungen hochzuladen und zu verwalten.</p>',
        '          </template>',
        '          <p v-if="updates.notice" class="mgd-kit-note">{{ updates.notice.text }} <a v-if="isLink(updates.notice.url)" :href="updates.notice.url" target="_blank" rel="noopener noreferrer">Zur aktuellen Version</a></p>',
        '          <p v-if="message" :class="messageKey === \'finishMissing\' ? \'mgd-kit-note\' : (messageOk ? \'mgd-kit-ok\' : \'mgd-kit-error\')" role="status">{{ message }}</p>',
        '          <template v-if="fallback || (updates.newer && !status.canUpdate)">',
        '            <p>So aktualisierst du von Hand:</p>',
        '            <ol><li v-for="(step, i) in steps" :key="i">{{ step }}</li></ol>',
        '            <p v-if="isLink(downloadLink)"><a :href="downloadLink" target="_blank" rel="noopener noreferrer">ZIP-Datei herunterladen</a></p>',
        '          </template>',
        '        </sw-card>',
        '        <sw-card title="Weitere Plugins">',
        '          <div class="mgd-kit-catalog">',
        '            <header class="mgd-kit-catalog__hero"><div class="mgd-kit-catalog__hero-copy"><p class="mgd-kit-catalog__eyebrow"><span class="mgd-kit-catalog__brand">MGD</span> SHOPWARE · PLUGIN-KOLLEKTION</p>',
        '              <h3>Mehr aus deinem<br><em>Shop machen.</em></h3><p>Durchdachte Erweiterungen von Michael Gahn DESIGN.<br>Entdecke die passenden Werkzeuge für dein Shopware.</p></div>',
        '              <div class="mgd-kit-catalog__hero-art" aria-hidden="true"><span class="mgd-kit-catalog__orbit"></span>',
        '                <span v-for="(item, i) in heroItems" :key="item.slug" :class="\'mgd-kit-catalog__hero-icon mgd-kit-catalog__hero-icon--\' + i"><img v-if="mediaSrc(item.icon)" :src="mediaSrc(item.icon)" width="94" height="94" alt=""><svg v-else viewBox="0 0 128 128" width="94" height="94" aria-hidden="true" focusable="false"><rect width="128" height="128" rx="27" fill="#263b37"/><g fill="none" stroke="#e5c58e" stroke-width="5"><rect x="28" y="28" width="27" height="27" rx="5"/><rect x="28" y="73" width="27" height="27" rx="5"/><rect x="73" y="73" width="27" height="27" rx="5"/></g><path d="M86 27v28M72 41h28" stroke="#e6eee7" stroke-width="5" stroke-linecap="round"/></svg></span>',
        '                <span class="mgd-kit-catalog__art-caption">GEMACHT FÜR DEIN SHOPWARE</span></div></header>',
        '            <div class="mgd-kit-catalog__collection-bar"><p><strong>{{ recommendations.length }} Erweiterungen</strong><span>Installation nur von Hand</span></p></div>',
        '            <p v-if="recStale" class="mgd-kit-catalog__stale">Die Liste konnte gerade nicht aktualisiert werden. Du siehst den letzten bekannten Stand.</p>',
        '            <section class="mgd-kit-catalog__browser" aria-label="Plugins entdecken">',
        '              <div v-if="recommendations.length" class="mgd-kit-catalog__toolbar">',
        '                <div class="mgd-kit-catalog__search"><label :for="uid + \'-search\'"><span aria-hidden="true">⌕</span><span class="mgd-kit-catalog__sr">Plugins durchsuchen</span></label><input :id="uid + \'-search\'" v-model="search" type="search" placeholder="Was möchtest du verbessern?" autocomplete="off"></div>',
        '                <label class="mgd-kit-catalog__select">Preis<select v-model="price"><option value="all">Alle Preise</option><option value="free">Kostenlos</option><option value="paid">Kostenpflichtig</option></select></label>',
        '              </div>',
        '              <div class="mgd-kit-catalog__browse-heading">',
        '                <div v-if="recommendations.length" class="mgd-kit-catalog__categories" role="group" aria-label="Kategorie filtern"><button type="button" :aria-pressed="String(category === \'all\')" @click="category = \'all\'">Alle entdecken</button><button v-for="c in categories" :key="c" type="button" :aria-pressed="String(category === c)" @click="category = c">{{ c }}</button></div>',
        '                <div v-if="allTags.length" class="mgd-kit-catalog__tags" role="group" aria-label="Nach Tag filtern"><span class="mgd-kit-catalog__tags-title">Tags</span><button v-for="t in allTags" :key="t" type="button" :aria-pressed="String(pickedTags.indexOf(t) >= 0)" @click="toggleTag(t)">{{ t }}</button><button v-if="pickedTags.length" type="button" class="mgd-kit-catalog__tags-reset" @click="pickedTags = []">Alle Tags zurücksetzen</button></div>',
        '                <p class="mgd-kit-catalog__count" aria-live="polite" aria-atomic="true">{{ countLabel }}</p>',
        '              </div>',
        '              <div class="mgd-kit-catalog__grid">',
        '                <article v-for="item in filtered" :key="item.slug" class="mgd-kit-catalog__card" :style="accentStyle(item)">',
        '                  <div class="mgd-kit-catalog__card-art">',
        '                    <img v-if="mediaSrc(item.image)" class="mgd-kit-catalog__card-background" :src="mediaSrc(item.image)" width="1080" height="360" :alt="item.imageAlt || \'\'" :aria-hidden="item.imageAlt ? null : \'true\'">',
        '                    <span class="mgd-kit-catalog__category">{{ item.category }}</span>',
        '                    <img v-if="mediaSrc(item.icon)" class="mgd-kit-catalog__card-icon" :src="mediaSrc(item.icon)" width="78" height="78" alt=""><svg v-else class="mgd-kit-catalog__card-icon" viewBox="0 0 128 128" width="78" height="78" aria-hidden="true" focusable="false"><rect width="128" height="128" rx="27" fill="#263b37"/><g fill="none" stroke="#e5c58e" stroke-width="5"><rect x="28" y="28" width="27" height="27" rx="5"/><rect x="28" y="73" width="27" height="27" rx="5"/><rect x="73" y="73" width="27" height="27" rx="5"/></g><path d="M86 27v28M72 41h28" stroke="#e6eee7" stroke-width="5" stroke-linecap="round"/></svg>',
        '                    <span v-if="item.version" class="mgd-kit-catalog__version">v{{ item.version }}</span>',
        '                  </div>',
        '                  <div class="mgd-kit-catalog__card-body">',
        '                    <div class="mgd-kit-catalog__card-heading"><h4>{{ item.name }}</h4><span class="mgd-kit-catalog__price">{{ item.tier === \'free\' ? \'Kostenlos\' : \'Kostenpflichtig\' }}</span></div>',
        '                    <p class="mgd-kit-catalog__description">{{ item.description }}</p>',
        '                    <ul v-if="features(item).length" class="mgd-kit-catalog__features"><li v-for="(f, j) in features(item)" :key="j">{{ f }}</li></ul>',
        '                    <div class="mgd-kit-catalog__card-status"><span :class="\'mgd-kit-catalog__status mgd-kit-catalog__status--\' + stateOf(item)">{{ statusLabel(item) }}</span></div>',
        '                    <div class="mgd-kit-catalog__actions">',
        '                      <a class="mgd-kit-catalog__details" :href="detailsUrl(item)" target="_blank" rel="noopener noreferrer" aria-haspopup="dialog" :aria-label="\'Details zu \' + item.name" @click="openDetails(item, $event)">Details <span aria-hidden="true">↗</span></a>',
        '                      <a class="mgd-kit-catalog__button" :href="detailsUrl(item)" target="_blank" rel="noopener noreferrer" :aria-label="item.name + \' ansehen (neuer Tab)\'">Ansehen</a>',
        '                    </div>',
        '                  </div>',
        '                </article>',
        '              </div>',
        '              <div v-if="filtered.length === 0" class="mgd-kit-catalog__empty"><span aria-hidden="true">⌕</span>',
        '                <h4>{{ recommendations.length ? "Noch nicht das Richtige dabei?" : "Hier ist gerade nichts gelistet." }}</h4>',
        '                <p>{{ recommendations.length ? "Versuche einen anderen Suchbegriff oder setze die Filter zurück." : "Bitte schau später noch einmal vorbei." }}</p>',
        '                <button v-if="recommendations.length" class="mgd-kit-catalog__button" type="button" @click="resetFilters">Filter zurücksetzen</button>',
        '              </div>',
        '            </section>',
        '            <footer class="mgd-kit-catalog__footer"><p><strong>Michael Gahn DESIGN</strong><span>Werkzeuge mit einem klaren Zweck.</span></p>',
        '              <p>{{ recCentral ? "Katalog von theme.michael-gahn.de" : "Ersatzkatalog aktiv · Zentraler Feed derzeit nicht erreichbar" }}<template v-if="recChecked"><br><span>Geprüft: {{ recChecked }} · Zwischenspeicherung bis zu 15 Minuten</span></template></p></footer>',
        '            <dialog ref="dialog" class="mgd-kit-catalog__dialog" :aria-labelledby="uid + \'-dialog-title\'" @close="onDialogClose" @click="onDialogClick">',
        '              <div class="mgd-kit-catalog__dialog-header"><p>MGD PLUGIN-KOLLEKTION</p><button ref="dialogClose" type="button" aria-label="Details schließen" @click="closeDetails">×</button></div>',
        '              <h2 :id="uid + \'-dialog-title\'">{{ dialogItem ? dialogItem.name : "Plugin-Details" }}</h2>',
        '              <div v-if="dialogItem">',
        '                <p>{{ dialogItem.description }}</p>',
        '                <ul v-if="features(dialogItem).length"><li v-for="(f, j) in features(dialogItem)" :key="j">{{ f }}</li></ul>',
        '                <p>{{ dialogItem.tier === "free" ? "Kostenlos erhältlich." : "Kostenpflichtige Erweiterung. Informationen und Konditionen findest du beim Anbieter." }}</p>',
        '                <a class="mgd-kit-catalog__button" :href="detailsUrl(dialogItem)" target="_blank" rel="noopener noreferrer">Mehr erfahren <span class="mgd-kit-catalog__sr">(neuer Tab)</span></a>',
        '              </div>',
        '            </dialog>',
        '          </div>',
        '        </sw-card>',
        '        <sw-card v-if="status.install" title="Installation melden">',
        '          <sw-switch-field :label="status.install.label" :value="status.install.enabled" :disabled="isSaving" @update:value="setInstall" @change="setInstall"></sw-switch-field>',
        '          <p class="mgd-kit-small">{{ status.install.hint }}</p>',
        '          <p class="mgd-kit-small" role="status">{{ status.install.status }}</p>',
        '        </sw-card>',
        '        <sw-card v-if="status.license" title="Lizenz">',
        '          <label :for="licenseId">Lizenzschlüssel</label>',
        '          <input :id="licenseId" v-model="licenseToken" type="password" autocomplete="off" spellcheck="false">',
        '          <p v-if="status.license.hasToken" class="mgd-kit-small">Eingetragen ist ein Schlüssel, der auf {{ status.license.hint }} endet.</p>',
        '          <p role="status">{{ status.license.status }}</p>',
        '          <p v-if="licenseMessage" role="status">{{ licenseMessage }}</p>',
        '          <sw-button variant="primary" :disabled="isSaving" @click="saveLicense(\'save\')">Speichern</sw-button>',
        '          <sw-button v-if="status.license.hasToken" :disabled="isSaving" @click="saveLicense(\'remove\')">Entfernen</sw-button>',
        '          <p class="mgd-kit-small">Zur Prüfung gehen nur der Lizenzschlüssel und die Domain deines Shops an theme.michael-gahn.de.</p>',
        '        </sw-card>',
        '      </template>',
        '    </sw-card-view>',
        '  </template>',
        '</sw-page>'
    ].join('\n');

    function isLink(url) {
        return typeof url === 'string' && url.length < 500 && !/[\s"'<>\\]/.test(url) && LINK_PREFIXES.some(function (p) {
            return url.indexOf(p) === 0;
        });
    }

    function normalize(value) {
        return String(value || '').toLocaleLowerCase('de').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ß/g, 'ss');
    }

    // wie WP: d.m.Y · H:i (UTC)
    function formatDate(ts) {
        var d = new Date(ts * 1000);
        var p = function (n) { return (n < 10 ? '0' : '') + n; };

        return p(d.getUTCDate()) + '.' + p(d.getUTCMonth() + 1) + '.' + d.getUTCFullYear() + ' · ' + p(d.getUTCHours()) + ':' + p(d.getUTCMinutes());
    }

    // Kennung prüfen, Link immer selbst bauen
    function detailsUrl(item) {
        var slug = item && typeof item.slug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug) ? item.slug : '';

        return 'https://theme.michael-gahn.de/plugins/' + slug;
    }

    // nur eigene Dateinamen aus dem Cache, nie URLs
    function mediaName(name) {
        return typeof name === 'string' && FILE_RE.test(name) ? name : '';
    }

    function isDataUri(v) {
        return typeof v === 'string' && v.length < 1000000 && DATA_RE.test(v);
    }

    function addStyle(doc) {
        if (!doc || doc.getElementById(STYLE_ID)) {
            return;
        }
        var el = doc.createElement('style');
        el.id = STYLE_ID;
        el.textContent = STYLE + (CATALOG_CSS.indexOf('{{') === 0 ? '' : CATALOG_CSS);
        doc.head.appendChild(el);
    }

    var component = {
        template: TEMPLATE,
        inject: ['loginService', 'acl'],
        data: function () {
            return {
                isLoading: true, loadError: false, isUpdating: false, isSaving: false,
                status: {}, recommendations: [], recStale: false, recCentral: true, recChecked: '',
                media: {}, search: '', price: 'all', category: 'all', pickedTags: [], dialogItem: null, trigger: null,
                message: '', messageKey: '', messageOk: false, fallback: null,
                licenseToken: '', licenseMessage: ''
            };
        },
        computed: {
            title: function () {
                return 'MichaThemeV5';
            },
            updates: function () {
                return this.status.updates || {};
            },
            steps: function () {
                var s = this.fallback && Array.isArray(this.fallback.steps) ? this.fallback.steps : this.status.fallbackSteps;

                return Array.isArray(s) ? s : [];
            },
            downloadLink: function () {
                return this.fallback && this.fallback.url ? this.fallback.url : this.updates.downloadUrl;
            },
            licenseId: function () {
                return MODULE + '-license';
            },
            uid: function () {
                return MODULE + '-cat';
            },
            heroItems: function () {
                return this.recommendations.slice(0, 3);
            },
            allTags: function () {
                var out = [];
                (this.recommendations || []).forEach(function (it) {
                    (Array.isArray(it.tags) ? it.tags : []).forEach(function (t) {
                        if (typeof t === 'string' && t && out.indexOf(t) < 0) {
                            out.push(t);
                        }
                    });
                });

                return out;
            },
            categories: function () {
                var out = [];
                this.recommendations.forEach(function (it) {
                    if (typeof it.category === 'string' && it.category && out.indexOf(it.category) < 0) {
                        out.push(it.category);
                    }
                });

                return out;
            },
            // Suche wie WP: alle Wörter, ohne Akzente/ß
            filtered: function () {
                var vm = this;
                var terms = normalize(vm.search).trim().split(/\s+/).filter(Boolean);

                return vm.recommendations.filter(function (it) {
                    // Suche findet auch Tags
                    var tags = Array.isArray(it.tags) ? it.tags : [];
                    var hay = normalize([it.name, it.description, it.category].concat(vm.features(it), tags).join(' '));
                    var tagOk = vm.pickedTags.every(function (t) { return tags.indexOf(t) >= 0; });

                    return tagOk && (vm.category === 'all' || it.category === vm.category)
                        && (vm.price === 'all' || it.tier === vm.price)
                        && terms.every(function (t) { return hay.indexOf(t) >= 0; });
                });
            },
            countLabel: function () {
                var n = this.filtered.length;

                return n + ' ' + (n === 1 ? 'Plugin' : 'Plugins');
            }
        },
        created: function () {
            addStyle(root.document);
            this.load();
        },
        methods: {
            isLink: isLink,
            detailsUrl: detailsUrl,
            setRecommendations: function (d) {
                var items = Array.isArray(d.items) ? d.items : [];
                this.recommendations = items.filter(function (it) {
                    return it && typeof it.slug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(it.slug) && typeof it.name === 'string';
                });
                this.recStale = d.source === 'stale' || d.source === 'fallback';
                this.recCentral = d.source === 'fresh' || d.source === 'cache' || d.source === 'stale';
                this.recChecked = typeof d.checkedAt === 'number' && d.checkedAt > 0 ? formatDate(d.checkedAt) : '';
            },
            // Bilder einzeln nacheinander über die Admin-API, als data:-URI
            loadMedia: function () {
                var vm = this;
                var names = [];
                vm.recommendations.forEach(function (it) {
                    [it.icon, it.image].forEach(function (n) {
                        if (mediaName(n) && names.indexOf(n) < 0) {
                            names.push(n);
                        }
                    });
                });

                return names.reduce(function (p, n) {
                    return p.then(function () {
                        return vm.http().get(API + '/media/' + n, vm.opts()).then(function (r) {
                            var data = r && r.data ? r.data.data : '';
                            if (isDataUri(data)) {
                                var next = Object.assign({}, vm.media);
                                next[n] = data;
                                vm.media = next;
                            }
                        }).catch(function () {
                            // kein Bild > Farbfläche + Icon
                        });
                    });
                }, Promise.resolve());
            },
            mediaSrc: function (name) {
                var n = mediaName(name);

                return n && isDataUri(this.media[n]) ? this.media[n] : '';
            },
            features: function (item) {
                return item && Array.isArray(item.features) ? item.features.filter(function (f) { return typeof f === 'string'; }).slice(0, 3) : [];
            },
            accentStyle: function (item) {
                return item && typeof item.accent === 'string' && ACCENT_RE.test(item.accent) ? { '--mgd-kit-cat-accent': item.accent } : {};
            },
            stateOf: function (item) {
                return item && (item.state === 'installed' || item.state === 'update') ? item.state : 'available';
            },
            // aktiv/inaktiv nur wenn der Server es sicher weiß
            statusLabel: function (item) {
                if (item && item.active === true) {
                    return 'Aktiv';
                }

                return item && item.installed === true ? 'Installiert · inaktiv' : 'Für deinen Shop';
            },
            resetFilters: function () {
                this.search = '';
                this.price = 'all';
                this.category = 'all';
                this.pickedTags = [];
            },
            toggleTag: function (t) {
                var i = this.pickedTags.indexOf(t);
                this.pickedTags = i >= 0 ? this.pickedTags.filter(function (x) { return x !== t; }) : this.pickedTags.concat([t]);
            },
            openDetails: function (item, event) {
                var d = this.$refs ? this.$refs.dialog : null;
                if (!d || typeof d.showModal !== 'function') {
                    return;
                }
                if (event) {
                    event.preventDefault();
                    this.trigger = event.currentTarget || null;
                }
                this.dialogItem = item;
                d.showModal();
                if (this.$refs.dialogClose) {
                    this.$refs.dialogClose.focus();
                }
            },
            closeDetails: function () {
                if (this.$refs && this.$refs.dialog) {
                    this.$refs.dialog.close();
                }
            },
            onDialogClick: function (event) {
                if (event && this.$refs && event.target === this.$refs.dialog) {
                    this.closeDetails();
                }
            },
            onDialogClose: function () {
                if (this.trigger && typeof this.trigger.focus === 'function') {
                    this.trigger.focus();
                }
            },
            http: function () {
                return Shopware.Application.getContainer('init').httpClient;
            },
            opts: function () {
                return { headers: { Authorization: 'Bearer ' + this.loginService.getToken(), 'Content-Type': 'application/json' } };
            },
            load: function () {
                var vm = this;
                vm.isLoading = true;

                return vm.http().get(API + '/status', vm.opts()).then(function (r) {
                    vm.status = r && r.data ? r.data : {};
                    vm.loadError = false;

                    return vm.http().get(API + '/recommendations', vm.opts()).then(function (r2) {
                        vm.setRecommendations(r2 && r2.data ? r2.data : {});

                        return vm.loadMedia();
                    }).catch(function () {
                        vm.recommendations = [];
                        vm.recStale = true;
                        vm.recCentral = false;
                    });
                }).catch(function () {
                    vm.loadError = true;
                }).then(function () {
                    vm.isLoading = false;
                });
            },
            // 2 Schritte: einspielen, dann eigener Aufruf fürs Shopware-Update (neuer Code geladen)
            runUpdate: function () {
                var vm = this;
                if (vm.isUpdating || !PLUGIN_PRIVS.every(function (p) { return vm.acl.can(p); })) {
                    return null;
                }
                vm.isUpdating = true;
                vm.message = '';
                vm.fallback = null;

                return vm.http().post(API + '/update', {}, vm.opts()).then(function (r) {
                    var d = r && r.data ? r.data : {};
                    if (d.ok === true && d.step === 'uploaded') {
                        vm.show(d);

                        return vm.http().post(API + '/update/finish', {}, vm.opts()).then(function (r2) {
                            vm.show(r2 && r2.data ? r2.data : {});
                        }).catch(function (e) {
                            // 404 = Schritt 2 nicht erreichbar, Dateien sind aber drin > Hinweis statt Fehler
                            if (e && e.response && e.response.status === 404) {
                                vm.showKey('finishMissing');

                                return null;
                            }
                            throw e;
                        });
                    }
                    vm.show(d);

                    return null;
                }).catch(function (e) {
                    vm.show(e && e.response && e.response.data ? e.response.data : {});
                }).then(function () {
                    vm.isUpdating = false;
                });
            },
            showKey: function (key) {
                this.messageKey = key;
                this.messageOk = false;
                this.message = TEXTS[key] || '';
                this.fallback = null;
            },
            show: function (d) {
                this.messageKey = '';
                this.messageOk = d.ok === true;
                this.message = typeof d.message === 'string' ? d.message : 'Das Update hat nicht geklappt.';
                this.fallback = d.ok === true ? null : (d.fallback || { url: this.updates.downloadUrl, steps: this.status.fallbackSteps });
            },
            // 6.5 schickt change, ab 6.6 update:value > doppelt abfangen
            setInstall: function (on) {
                var vm = this;
                if (typeof on !== 'boolean' || !vm.status.install || on === vm.status.install.enabled || vm.isSaving) {
                    return null;
                }
                vm.isSaving = true;

                return vm.http().post(API + '/install-report', { enabled: on }, vm.opts()).then(function (r) {
                    if (r && r.data && r.data.install) {
                        vm.status.install = r.data.install;
                    }
                }).catch(function () {
                    vm.status.install = Object.assign({}, vm.status.install, { status: 'Das Speichern hat nicht geklappt.' });
                }).then(function () {
                    vm.isSaving = false;
                });
            },
            saveLicense: function (action) {
                var vm = this;
                vm.isSaving = true;

                return vm.http().post(API + '/license', { action: action, token: action === 'save' ? vm.licenseToken : '' }, vm.opts()).then(function (r) {
                    var d = r && r.data ? r.data : {};
                    vm.licenseMessage = d.message || '';
                    if (d.license) {
                        vm.status.license = d.license;
                    }
                }).catch(function (e) {
                    var d = e && e.response && e.response.data ? e.response.data : {};
                    vm.licenseMessage = d.message || 'Das hat nicht geklappt.';
                }).then(function () {
                    vm.licenseToken = '';
                    vm.isSaving = false;
                });
            }
        }
    };

    // MGD Farbwähler (Ui/assets/mgd-color.js + .css), setzt der Baukasten beim Kopieren ein
    /* MGD Farbwähler - eine Komponente für alle Plattformen (WP, Shopware, JTL, Themes), ohne Fremdbibliothek
   Speicher per Adapter: MGDColor.setStore({load, save}), Standard localStorage. Texte per MGDColor.texts */
(function () {
  "use strict";
  if (window.MGDColor) return;

  const T = {
    pick: "Farbe wählen",
    dialog: "Farbwähler",
    area: "Sättigung und Helligkeit",
    areaValue: "Sättigung %s %, Helligkeit %v %",
    hue: "Farbton",
    hex: "HEX",
    copy: "Kopieren",
    copied: "Kopiert",
    quick: "Schnellfarben",
    recent: "Zuletzt benutzt",
    mine: "Meine Farben",
    save: "Farbe speichern",
    remove: "%c entfernen",
    empty: "Noch keine Farben gespeichert.",
    done: "Fertig",
    cancel: "Abbrechen",
    clear: "Leeren",
    invalid: "Bitte eine Farbe wie #1A2B3C eingeben.",
    none: "keine",
  };
  const QUICK = ["#000000", "#FFFFFF", "#1E2C2C", "#D6C49A", "#B73843", "#2271B1", "#00A32A", "#DBA617", "#8C5BD6", "#F0F0F1"];
  const MAX_MINE = 24;
  const MAX_RECENT = 8;
  const HEX_RE = /^#[0-9A-F]{6}$/;

  // Farbmathe
  const norm = (v) => {
    let s = String(v || "").trim().toUpperCase();
    if (!s.startsWith("#")) s = "#" + s;
    if (/^#[0-9A-F]{3}$/.test(s)) s = "#" + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
    return HEX_RE.test(s) ? s : null;
  };
  const toRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const toHex = (r, g, b) => "#" + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("").toUpperCase();
  const toHsv = (hex) => {
    const [r, g, b] = toRgb(hex).map((x) => x / 255);
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0;
    if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return { h: (h * 60 + 360) % 360, s: max ? d / max : 0, v: max };
  };
  const fromHsv = ({ h, s, v }) => {
    const f = (n) => {
      const k = (n + h / 60) % 6;
      return (v - v * s * Math.max(0, Math.min(k, 4 - k, 1))) * 255;
    };
    return toHex(f(5), f(3), f(1));
  };
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const fmt = (t, map) => Object.keys(map).reduce((s, k) => s.split("%" + k).join(map[k]), t);
  const el = (tag, cls, attrs) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    Object.entries(attrs || {}).forEach(([k, v]) => e.setAttribute(k, v));
    return e;
  };
  const clean = (list, max) => (Array.isArray(list) ? list : []).map(norm).filter((c, i, a) => c && a.indexOf(c) === i).slice(0, max);

  // Speicher: Standard nur im Browser, Plattform-Adapter überschreibt
  let store = {
    load: async () => {
      try { return JSON.parse(localStorage.getItem("mgd-color") || "{}"); } catch (e) { return {}; }
    },
    save: async (d) => {
      try { localStorage.setItem("mgd-color", JSON.stringify(d)); } catch (e) { /* privat-Modus */ }
    },
  };
  let data = null;
  const loadData = async () => {
    if (data) return data;
    let d = {};
    try { d = (await store.load()) || {}; } catch (e) { d = {}; }
    data = { mine: clean(d.mine, MAX_MINE), recent: clean(d.recent, MAX_RECENT) };
    return data;
  };
  const saveData = () => { try { store.save({ mine: data.mine, recent: data.recent }); } catch (e) { /* egal */ } };

  // ein Popover für alle Felder
  let pop = null, ui = {}, cur = null, hsv = { h: 0, s: 0, v: 0 }, before = "", trigger = null;

  const build = () => {
    pop = el("div", "mgd-color", { role: "dialog", "aria-label": T.dialog, hidden: "" });
    ui.area = el("div", "mgd-color__area", { role: "slider", tabindex: "0", "aria-label": T.area, "aria-valuemin": "0", "aria-valuemax": "100" });
    ui.thumb = el("span", "mgd-color__thumb", { "aria-hidden": "true" });
    ui.area.append(ui.thumb);
    ui.hue = el("input", "mgd-color__hue", { type: "range", min: "0", max: "360", step: "1", "aria-label": T.hue });
    const row = el("div", "mgd-color__row");
    ui.preview = el("span", "mgd-color__preview", { "aria-hidden": "true" });
    const hexId = "mgd-color-hex-" + Math.random().toString(36).slice(2, 8);
    const lab = el("label", "mgd-color__label", { for: hexId });
    lab.textContent = T.hex;
    ui.hex = el("input", "mgd-color__hex", { id: hexId, type: "text", maxlength: "7", spellcheck: "false", autocomplete: "off", inputmode: "text" });
    ui.copy = el("button", "mgd-color__btn", { type: "button" });
    ui.copy.textContent = T.copy;
    row.append(ui.preview, lab, ui.hex, ui.copy);
    ui.msg = el("p", "mgd-color__msg", { role: "status", "aria-live": "polite" });
    ui.quick = group(T.quick);
    ui.recent = group(T.recent);
    ui.mine = group(T.mine);
    ui.save = el("button", "mgd-color__btn mgd-color__save", { type: "button" });
    ui.save.textContent = T.save;
    ui.mine.box.after(ui.save);
    const foot = el("div", "mgd-color__foot");
    // Leeren = Feld ohne Farbe (Plugin nimmt dann seinen Standard, Befund login)
    ui.clear = el("button", "mgd-color__btn mgd-color__clear", { type: "button" });
    ui.clear.textContent = T.clear;
    ui.cancel = el("button", "mgd-color__btn", { type: "button" });
    ui.cancel.textContent = T.cancel;
    ui.done = el("button", "mgd-color__btn mgd-color__btn--primary", { type: "button" });
    ui.done.textContent = T.done;
    foot.append(ui.clear, ui.cancel, ui.done);
    pop.append(ui.area, ui.hue, row, ui.msg, ui.quick.wrap, ui.recent.wrap, ui.mine.wrap, foot);
    document.body.append(pop);
    events();
  };

  function group(title) {
    const wrap = el("div", "mgd-color__group");
    const h = el("p", "mgd-color__title");
    h.textContent = title;
    const box = el("div", "mgd-color__swatches", { role: "list" });
    wrap.append(h, box);
    return { wrap, box };
  }

  const swatches = (g, list, removable) => {
    g.box.replaceChildren();
    if (!list.length && removable) {
      const p = el("p", "mgd-color__empty");
      p.textContent = T.empty;
      g.box.append(p);
    }
    list.forEach((c) => {
      const item = el("span", "mgd-color__item", { role: "listitem" });
      const b = el("button", "mgd-color__chip", { type: "button", "aria-label": c, title: c, "data-c": c });
      b.style.background = c;
      item.append(b);
      if (removable) {
        const x = el("button", "mgd-color__del", { type: "button", "aria-label": fmt(T.remove, { c }), "data-del": c });
        x.textContent = "×";
        item.append(x);
      }
      g.box.append(item);
    });
    if (!removable && !list.length) g.wrap.hidden = true; else g.wrap.hidden = false;
  };

  // quiet = nur anzeigen, nix ins Feld schreiben (Öffnen eines leeren Felds)
  const render = (from, quiet) => {
    const hex = fromHsv(hsv);
    ui.area.style.setProperty("--mgd-hue", "hsl(" + hsv.h + " 100% 50%)");
    ui.thumb.style.left = hsv.s * 100 + "%";
    ui.thumb.style.top = (1 - hsv.v) * 100 + "%";
    ui.thumb.style.background = hex;
    ui.area.setAttribute("aria-valuenow", String(Math.round(hsv.s * 100)));
    ui.area.setAttribute("aria-valuetext", fmt(T.areaValue, { s: Math.round(hsv.s * 100), v: Math.round(hsv.v * 100) }));
    if (from !== "hue") ui.hue.value = String(Math.round(hsv.h));
    if (from !== "hex") ui.hex.value = hex;
    ui.preview.style.background = hex;
    if (!quiet) apply(hex);
  };

  // Knopf einfärben, leer = Schachbrett
  function paint(btn, hex) {
    btn.classList.toggle("mgd-color__swatch--empty", !hex);
    btn.style.background = hex || "";
    btn.setAttribute("aria-label", T.pick + ": " + (hex || T.none));
  }

  const apply = (hex) => {
    if (!cur) return;
    cur.input.value = hex;
    paint(cur.btn, hex);
    cur.input.dispatchEvent(new Event("input", { bubbles: true }));
  };

  const setHex = (hex, from) => {
    const n = norm(hex);
    if (!n) return false;
    const keepHue = hsv.h;
    hsv = toHsv(n);
    if (hsv.s === 0) hsv.h = keepHue;
    render(from);
    return true;
  };

  const areaPick = (e) => {
    const r = ui.area.getBoundingClientRect();
    hsv.s = clamp((e.clientX - r.left) / r.width, 0, 1);
    hsv.v = 1 - clamp((e.clientY - r.top) / r.height, 0, 1);
    render();
  };

  function events() {
    ui.area.addEventListener("pointerdown", (e) => {
      ui.area.setPointerCapture(e.pointerId);
      areaPick(e);
      ui.area.focus();
    });
    ui.area.addEventListener("pointermove", (e) => { if (ui.area.hasPointerCapture(e.pointerId)) areaPick(e); });
    ui.area.addEventListener("keydown", (e) => {
      const step = e.shiftKey ? 0.1 : 0.01;
      const k = { ArrowLeft: ["s", -step], ArrowRight: ["s", step], ArrowUp: ["v", step], ArrowDown: ["v", -step] }[e.key];
      if (!k) return;
      e.preventDefault();
      hsv[k[0]] = clamp(hsv[k[0]] + k[1], 0, 1);
      render();
    });
    ui.hue.addEventListener("input", () => { hsv.h = Number(ui.hue.value); render("hue"); });
    ui.hex.addEventListener("input", () => {
      const ok = norm(ui.hex.value);
      ui.msg.textContent = ok || ui.hex.value.length < 4 ? "" : T.invalid;
      if (ok) setHex(ok, "hex");
    });
    ui.copy.addEventListener("click", async () => {
      const v = fromHsv(hsv);
      try { await navigator.clipboard.writeText(v); } catch (e) { ui.hex.select(); document.execCommand && document.execCommand("copy"); }
      ui.msg.textContent = T.copied + ": " + v;
    });
    pop.addEventListener("click", (e) => {
      const del = e.target.closest("[data-del]");
      if (del) {
        data.mine = data.mine.filter((c) => c !== del.dataset.del);
        saveData();
        swatches(ui.mine, data.mine, true);
        ui.save.focus();
        return;
      }
      const chip = e.target.closest("[data-c]");
      if (chip) setHex(chip.dataset.c);
    });
    ui.save.addEventListener("click", () => {
      const v = fromHsv(hsv);
      data.mine = clean([v, ...data.mine], MAX_MINE);
      saveData();
      swatches(ui.mine, data.mine, true);
    });
    ui.clear.addEventListener("click", () => { apply(""); before = ""; close(true); });
    ui.cancel.addEventListener("click", () => close(false));
    ui.done.addEventListener("click", () => close(true));
    pop.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { e.preventDefault(); close(false); }
      if (e.key === "Tab") trap(e);
    });
    document.addEventListener("pointerdown", (e) => {
      if (!pop.hidden && !pop.contains(e.target) && (!cur || e.target !== cur.btn)) close(true);
    });
    window.addEventListener("resize", () => { if (!pop.hidden) place(); });
  }

  // Tab bleibt im Fenster
  function trap(e) {
    const f = [...pop.querySelectorAll("button, input, [tabindex='0']")].filter((x) => !x.closest("[hidden]"));
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  // Desktop neben dem Knopf, schmal = unten als Blatt
  const place = () => {
    pop.classList.toggle("mgd-color--sheet", window.innerWidth < 600);
    if (window.innerWidth < 600) { pop.style.left = pop.style.top = ""; return; }
    const r = cur.btn.getBoundingClientRect();
    const w = pop.offsetWidth, h = pop.offsetHeight;
    let left = r.left + window.scrollX, top = r.bottom + window.scrollY + 6;
    if (left + w > window.scrollX + document.documentElement.clientWidth - 8) left = window.scrollX + document.documentElement.clientWidth - w - 8;
    if (r.bottom + h + 6 > window.innerHeight && r.top - h - 6 > 0) top = r.top + window.scrollY - h - 6;
    // passt weder unten noch oben > so weit hoch, dass es ganz zu sehen ist
    else if (r.bottom + h + 6 > window.innerHeight) top = window.scrollY + Math.max(8, window.innerHeight - h - 8);
    pop.style.left = Math.max(8, left) + "px";
    pop.style.top = Math.max(8, top) + "px";
  };

  const open = async (field) => {
    if (!pop) build();
    await loadData();
    cur = field;
    trigger = field.btn;
    before = norm(field.input.value) || "";
    hsv = toHsv(before || "#000000");
    ui.msg.textContent = "";
    swatches(ui.quick, QUICK, false);
    swatches(ui.recent, data.recent, false);
    swatches(ui.mine, data.mine, true);
    pop.hidden = false;
    field.btn.setAttribute("aria-expanded", "true");
    render(undefined, true);
    place();
    ui.area.focus();
  };

  const close = (keep) => {
    if (!cur || pop.hidden) return;
    if (!keep) apply(before);
    else {
      const v = norm(cur.input.value);
      if (v && v !== before) {
        data.recent = clean([v, ...data.recent], MAX_RECENT);
        saveData();
      }
    }
    cur.input.dispatchEvent(new Event("change", { bubbles: true }));
    cur.btn.setAttribute("aria-expanded", "false");
    pop.hidden = true;
    const t = trigger;
    cur = null;
    if (t) t.focus();
  };

  // Feld aufrüsten: input[type=color] / .wp-color-picker / [data-mgd-color] > Textfeld + Farbknopf, name + Wert bleiben
  const attach = (input) => {
    if (!input || input.dataset.mgdColorReady) return;
    input.dataset.mgdColorReady = "1";
    // leer bleibt leer (Befund login): type=color meldet sonst immer #000000 > Attribut lesen
    const raw = input.type === "color" ? input.getAttribute("value") || "" : input.value;
    const start = norm(raw) || "";
    if (input.type === "color") input.type = "text";
    input.value = start;
    input.classList.add("mgd-color__input");
    input.setAttribute("maxlength", "7");
    input.setAttribute("spellcheck", "false");
    const wrap = el("span", "mgd-color__field");
    input.before(wrap);
    const btn = el("button", "mgd-color__swatch", { type: "button", "aria-haspopup": "dialog", "aria-expanded": "false" });
    paint(btn, start);
    wrap.append(btn, input);
    const field = { input, btn };
    btn.addEventListener("click", () => (cur === field && !pop.hidden ? close(true) : open(field)));
    input.addEventListener("input", () => {
      const v = norm(input.value);
      if (v || input.value === "") paint(btn, v || "");
    });
    input.addEventListener("blur", () => { const v = norm(input.value); if (v) input.value = v; });
  };

  // Felder, die ein Framework verwaltet (Shopware-Admin): nix umbauen, nur den vorhandenen Knopf/Vorschau nutzen
  const bind = (input, trigger) => {
    if (!input || !trigger || trigger.dataset.mgdColorReady) return;
    trigger.dataset.mgdColorReady = "1";
    trigger.setAttribute("aria-haspopup", "dialog");
    const field = { input, btn: trigger };
    // Capture: das eigene Fenster vom Framework geht nicht mehr auf
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (cur === field && pop && !pop.hidden) close(true); else open(field);
    }, true);
  };

  // Plattform kann weitere Felder anmelden (JTL: input.colorpicker)
  let selectors = "input[type=color], input.wp-color-picker, input[data-mgd-color]";
  const init = (root) => (root || document).querySelectorAll(selectors).forEach(attach);

  window.MGDColor = {
    texts: T,
    attach,
    bind,
    init,
    addSelector: (sel) => { if (typeof sel === "string" && sel.trim() !== "") selectors += ", " + sel; },
    norm,
    setStore: (s) => { if (s && typeof s.load === "function" && typeof s.save === "function") { store = s; data = null; } },
    setTexts: (t) => Object.assign(T, t || {}),
  };
  init();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => init());
})();

    var COLOR_CSS = "/* MGD Farbwähler - Hell/Dunkel per prefers-color-scheme, ohne externe Schriften */\n.mgd-color {\n  --mgd-c-bg: #ffffff;\n  --mgd-c-fg: #1d2327;\n  --mgd-c-muted: #50575e;\n  --mgd-c-line: #dcdcde;\n  --mgd-c-soft: #f6f7f7;\n  --mgd-c-accent: #1e2c2c;\n  --mgd-c-accent-fg: #ffffff;\n  --mgd-c-focus: #2271b1;\n  position: absolute;\n  z-index: 100100;\n  width: 296px;\n  max-height: calc(100vh - 16px);\n  overflow: auto;\n  box-sizing: border-box;\n  padding: 14px;\n  border: 1px solid var(--mgd-c-line);\n  border-radius: 14px;\n  background: var(--mgd-c-bg);\n  color: var(--mgd-c-fg);\n  box-shadow: 0 12px 32px rgba(0, 0, 0, .18), 0 2px 6px rgba(0, 0, 0, .08);\n  font: 13px/1.4 -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif;\n}\n@media (prefers-color-scheme: dark) {\n  .mgd-color {\n    --mgd-c-bg: #1e2124;\n    --mgd-c-fg: #f0f0f1;\n    --mgd-c-muted: #a7aaad;\n    --mgd-c-line: #3c434a;\n    --mgd-c-soft: #2c3338;\n    --mgd-c-accent: #d6c49a;\n    --mgd-c-accent-fg: #1e2c2c;\n    --mgd-c-focus: #72aee6;\n  }\n  .mgd-color__chip, .mgd-color__preview { box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .28); }\n}\n.mgd-color[hidden] { display: none; }\n.mgd-color *, .mgd-color *::before, .mgd-color *::after { box-sizing: border-box; }\n.mgd-color :focus-visible { outline: 3px solid var(--mgd-c-focus); outline-offset: 2px; }\n\n/* Farbfläche */\n.mgd-color__area {\n  position: relative;\n  height: 160px;\n  border-radius: 10px;\n  background: linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, var(--mgd-hue, red));\n  cursor: crosshair;\n  touch-action: none;\n}\n.mgd-color__thumb {\n  position: absolute;\n  width: 20px;\n  height: 20px;\n  margin: -10px 0 0 -10px;\n  border: 3px solid #fff;\n  border-radius: 50%;\n  box-shadow: 0 0 0 1px rgba(0, 0, 0, .35), 0 2px 4px rgba(0, 0, 0, .3);\n  pointer-events: none;\n}\n\n/* Farbton-Regler */\n.mgd-color__hue {\n  -webkit-appearance: none;\n  appearance: none;\n  display: block;\n  width: 100%;\n  height: 14px;\n  margin: 14px 0 12px;\n  border-radius: 7px;\n  background: linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00);\n  cursor: pointer;\n}\n.mgd-color__hue::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; border: 3px solid #fff; border-radius: 50%; background: transparent; box-shadow: 0 0 0 1px rgba(0, 0, 0, .35); }\n.mgd-color__hue::-moz-range-thumb { width: 14px; height: 14px; border: 3px solid #fff; border-radius: 50%; background: transparent; box-shadow: 0 0 0 1px rgba(0, 0, 0, .35); }\n\n.mgd-color__row { display: flex; align-items: center; gap: 8px; }\n.mgd-color__preview { flex: 0 0 32px; height: 32px; border-radius: 8px; box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .15); }\n.mgd-color__label { font-weight: 600; color: var(--mgd-c-muted); }\n.mgd-color__hex {\n  flex: 1 1 auto;\n  min-width: 0;\n  height: 32px;\n  padding: 0 8px;\n  border: 1px solid var(--mgd-c-line);\n  border-radius: 8px;\n  background: var(--mgd-c-soft);\n  color: var(--mgd-c-fg);\n  font: 600 13px/1 ui-monospace, SFMono-Regular, Menlo, monospace;\n  text-transform: uppercase;\n}\n.mgd-color__btn {\n  min-height: 32px;\n  padding: 0 12px;\n  border: 1px solid var(--mgd-c-line);\n  border-radius: 8px;\n  background: var(--mgd-c-soft);\n  color: var(--mgd-c-fg);\n  font: inherit;\n  font-weight: 600;\n  cursor: pointer;\n}\n.mgd-color__btn:hover { border-color: var(--mgd-c-muted); }\n.mgd-color__btn--primary { border-color: var(--mgd-c-accent); background: var(--mgd-c-accent); color: var(--mgd-c-accent-fg); }\n.mgd-color__msg { min-height: 1.4em; margin: 6px 0 0; color: var(--mgd-c-muted); font-size: 12px; }\n\n.mgd-color__group { margin-top: 8px; }\n.mgd-color__title { margin: 0 0 6px; color: var(--mgd-c-muted); font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }\n.mgd-color__swatches { display: flex; flex-wrap: wrap; gap: 6px; }\n.mgd-color__item { position: relative; display: inline-flex; }\n.mgd-color__chip {\n  width: 28px;\n  height: 28px;\n  padding: 0;\n  border: 0;\n  border-radius: 8px;\n  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .18);\n  cursor: pointer;\n}\n.mgd-color__del {\n  position: absolute;\n  top: -6px;\n  right: -6px;\n  width: 18px;\n  height: 18px;\n  padding: 0;\n  border: 1px solid var(--mgd-c-line);\n  border-radius: 50%;\n  background: var(--mgd-c-bg);\n  color: var(--mgd-c-fg);\n  font-size: 12px;\n  line-height: 14px;\n  cursor: pointer;\n  opacity: 0;\n}\n.mgd-color__item:hover .mgd-color__del, .mgd-color__del:focus-visible { opacity: 1; }\n@media (hover: none) { .mgd-color__del { opacity: 1; } }\n.mgd-color__empty { margin: 0; color: var(--mgd-c-muted); font-size: 12px; }\n.mgd-color__save { width: 100%; margin-top: 8px; }\n.mgd-color__clear { margin-right: auto; }\n.mgd-color__foot { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--mgd-c-line); }\n\n/* schmal: Blatt von unten, große Ziele */\n.mgd-color--sheet {\n  position: fixed;\n  right: 0;\n  bottom: 0;\n  left: 0;\n  width: auto;\n  max-height: 88vh;\n  overflow: auto;\n  border-radius: 16px 16px 0 0;\n}\n.mgd-color--sheet .mgd-color__area { height: 200px; }\n.mgd-color--sheet .mgd-color__chip { width: 36px; height: 36px; }\n.mgd-color--sheet .mgd-color__btn { min-height: 44px; }\n\n/* Feld im Formular */\n.mgd-color__field { display: inline-flex; align-items: center; gap: 6px; vertical-align: middle; }\n.mgd-color__swatch {\n  width: 32px;\n  height: 32px;\n  padding: 0;\n  border: 1px solid rgba(0, 0, 0, .25);\n  border-radius: 8px;\n  box-shadow: inset 0 0 0 2px #fff;\n  cursor: pointer;\n}\n.mgd-color__swatch--empty { background: repeating-conic-gradient(#c3c4c7 0 25%, #fff 0 50%) 0 0 / 10px 10px !important; }\n.mgd-color__input { width: 7.5em; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; text-transform: uppercase; }\n@media (prefers-reduced-motion: no-preference) { .mgd-color { transition: opacity .12s ease; } }\n";
    var TECH = 'MichaThemeV5';
    var THEME_COLORS = 'yes' === 'yes';

    // Meine Farben über die Kit-API (für alle MGD-Plugins gleich), Zuletzt benutzt im Browser
    function colorStore() {
        var http = function () { return Shopware.Application.getContainer('init').httpClient; };
        var opts = function () { return { headers: { Authorization: 'Bearer ' + Shopware.Service('loginService').getToken(), 'Content-Type': 'application/json' } }; };
        var rec = function () { try { return JSON.parse(root.localStorage.getItem('mgd-color-recent') || '[]'); } catch (e) { return []; } };

        return {
            load: function () {
                return http().get(API + '/colors', opts()).then(function (r) {
                    return { mine: (r && r.data && r.data.mine) || [], recent: rec() };
                }).catch(function () { return { mine: [], recent: rec() }; });
            },
            save: function (d) {
                try { root.localStorage.setItem('mgd-color-recent', JSON.stringify(d.recent || [])); } catch (e) { /* privat */ }
                return http().post(API + '/colors', { mine: d.mine || [] }, opts()).catch(function () {});
            }
        };
    }

    // nur Farbfelder aus der eigenen Plugin-Konfig (<Tech>.config.*), fremde und Core bleiben wie sie sind
    function colorBind(vm) {
        try {
            var M = root.MGDColor;
            if (!M || !vm || !vm.$el || !vm.$el.querySelector) {
                return;
            }
            var name = String((vm.$attrs && vm.$attrs.name) || vm.name || '');
            // Theme-Plugins (--theme-colors=yes): auch die Farben im Theme-Manager
            var inTheme = THEME_COLORS && !!(vm.$el.closest && vm.$el.closest('.sw-theme-manager-detail'));
            if (name.indexOf(TECH + '.config.') !== 0 && !inTheme) {
                return;
            }
            if (!document.getElementById('mgd-color-style') && COLOR_CSS.indexOf('{{') !== 0) {
                var st = document.createElement('style');
                st.id = 'mgd-color-style';
                st.textContent = COLOR_CSS;
                document.head.appendChild(st);
            }
            M.setStore(colorStore());
            var input = vm.$el.querySelector('input');
            var trig = vm.$el.querySelector('.sw-colorpicker__previewWrapper, .sw-colorpicker__preview-wrapper, .sw-colorpicker__preview');
            if (input && trig) {
                M.bind(input, trig);
            }
        } catch (e) { /* nie die Admin killen */ }
    }

    function colorInstall() {
        if (!Shopware.Component.override) {
            return;
        }
        Shopware.Component.override('sw-colorpicker', {
            mounted: function () {
                var vm = this;
                vm.$nextTick(function () { colorBind(vm); });
            }
        });
    }

    var api = { PRODUCT: PRODUCT, colorBind: colorBind, MODULE: MODULE, TEXTS: TEXTS, CATALOG_CSS: CATALOG_CSS, isLink: isLink, detailsUrl: detailsUrl, mediaName: mediaName, isDataUri: isDataUri, normalize: normalize, component: component };
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (typeof Shopware === 'undefined') {
        return;
    }

    Shopware.Component.register(MODULE + '-page', component);
    colorInstall();
    // --settings-item=no: Plugin hat schon einen eigenen Eintrag > keinen zweiten (Seite bleibt per Route erreichbar)
    var withItem = 'no' !== 'no';
    Shopware.Module.register(MODULE, {
        type: 'plugin',
        name: MODULE,
        title: 'MichaThemeV5',
        description: 'Updates, weitere Plugins und Einstellungen',
        color: '#1f2d3d',
        icon: 'regular-cog',
        routes: {
            index: { component: MODULE + '-page', path: 'index', meta: { parentPath: 'sw.settings.index.plugins', privilege: 'system_config:read' } }
        },
        // Einstellungen > Erweiterungen
        settingsItem: withItem ? [{
            name: MODULE,
            to: MODULE.replace(/-/g, '.') + '.index',
            label: 'MichaThemeV5',
            group: 'plugins',
            icon: 'regular-cog',
            privilege: 'system_config:read'
        }] : []
    });
})(typeof window !== 'undefined' ? window : this);

/* src/Resources/app/administration/src/module/michatheme-v5/index.js */
// MichaThemeV5 Admin-Modul. Kern-Skripte (Logik, Farbwähler) kommen aus dem Generator (public/administration/mt)
// Plugin-Baukasten aus src/Kit (Updates, Weitere Plugins, Installation melden)
})();

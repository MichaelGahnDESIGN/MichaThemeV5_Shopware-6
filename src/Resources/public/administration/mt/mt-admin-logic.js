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

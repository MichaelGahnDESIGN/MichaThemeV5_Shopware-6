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

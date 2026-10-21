/* MichaThemeV5 – Start-Skript (blockierend im <head>, verhindert Aufblitzen).
   Liest <meta name="mt-config"> (JSON: Attribute und CSS-Variablen aus den Theme-Optionen) und setzt sie auf <html>.
   Speichert nichts, solange der Besucher den Modus nicht selbst umstellt (dann nur localStorage "mt-mode", funktional, ohne Personenbezug). */
(function () {
  var root = document.documentElement;
  var meta = document.querySelector('meta[name="mt-config"]');
  var cfg = {};
  try { cfg = JSON.parse(meta ? meta.getAttribute('content') : '{}') || {}; } catch (e) { cfg = {}; }
  var attrs = cfg.attrs || {};
  Object.keys(attrs).forEach(function (k) {
    if (/^data-mt-[a-z-]+$/.test(k) || k === 'data-accent' || k === 'data-theme') { root.setAttribute(k, String(attrs[k])); }
  });
  var vars = cfg.vars || {};
  Object.keys(vars).forEach(function (k) {
    if (/^--mt-[a-z-]+$/.test(k) && vars[k] !== '') { root.style.setProperty(k, String(vars[k])); }
  });
  var mode = attrs['data-theme'] || 'system';
  try {
    var saved = window.localStorage.getItem('mt-mode');
    if (saved === 'light' || saved === 'dark' || saved === 'system') { mode = saved; }
  } catch (e) { /* kein Speicher verfügbar */ }
  if (mode === 'system') { root.removeAttribute('data-theme'); } else { root.setAttribute('data-theme', mode); }
  var custom = vars['--mt-accent-custom'];
  if (custom && /^#[0-9a-fA-F]{6}$/.test(custom)) {
    var n = parseInt(custom.slice(1), 16);
    var lum = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(function (v) {
      v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    var L = 0.2126 * lum[0] + 0.7152 * lum[1] + 0.0722 * lum[2];
    root.style.setProperty('--mt-accent', custom);
    root.style.setProperty('--mt-accent-hover', custom);
    root.style.setProperty('--mt-accent-text', custom);
    root.style.setProperty('--mt-on-accent', L > 0.4 ? '#000000' : '#ffffff');
  }
})();

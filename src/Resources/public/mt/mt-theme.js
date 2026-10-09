/* MichaThemeV5 – Bedienung: Hell/Dunkel-Umschalter und Textgrößen-Schalter. Keine Drittanbieter, kein Tracking. */
(function () {
  var root = document.documentElement;
  var order = ['system', 'light', 'dark'];
  var labels = { system: 'Wie das Gerät', light: 'Hell', dark: 'Dunkel' };

  function current() {
    var t = root.getAttribute('data-theme');
    return t === 'light' || t === 'dark' ? t : 'system';
  }
  function apply(mode) {
    if (mode === 'system') { root.removeAttribute('data-theme'); } else { root.setAttribute('data-theme', mode); }
    try { window.localStorage.setItem('mt-mode', mode); } catch (e) { /* ignorieren */ }
    document.querySelectorAll('[data-mt-mode-toggle]').forEach(function (b) {
      b.setAttribute('aria-label', 'Farbmodus: ' + labels[mode] + '. Zum Wechseln klicken.');
      b.setAttribute('data-mode', mode);
      var out = b.querySelector('[data-mt-mode-label]');
      if (out) { out.textContent = labels[mode]; }
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-mt-mode-toggle]') : null;
    if (b) { apply(order[(order.indexOf(current()) + 1) % order.length]); }
    var s = e.target.closest ? e.target.closest('[data-mt-size-step]') : null;
    if (s) {
      var sizes = ['small', 'normal', 'large'];
      var i = sizes.indexOf(root.getAttribute('data-mt-size') || 'normal');
      i = Math.max(0, Math.min(2, i + parseInt(s.getAttribute('data-mt-size-step'), 10)));
      root.setAttribute('data-mt-size', sizes[i]);
    }
  });
  apply(current());
  function landmark() {
    var m = document.querySelector('main');
    if (m) { if (!m.id) { m.id = 'mt-main'; } m.setAttribute('tabindex', '-1'); }
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', landmark); } else { landmark(); }
})();

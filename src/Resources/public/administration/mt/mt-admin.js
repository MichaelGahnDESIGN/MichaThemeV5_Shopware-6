/* MichaThemeV5 Plugin-Oberfläche - DOM-Teil: Gruppen, Suche, Filter, Ansicht, Änderungen merken, Zurücksetzen. Ohne JS bleibt es ein normales Formular. */
(function () {
  'use strict';
  var L = window.MTAdminLogic;
  if (!L) { return; }

  function $$(root, sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }
  function valueOf(inp) {
    if (inp.type === 'checkbox') { return inp.checked ? '1' : '0'; }
    return inp.value;
  }
  function setValue(inp, v) {
    if (inp.type === 'checkbox') { inp.checked = v === '1'; } else { inp.value = v; }
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    inp.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function init(root) {
    var fields = $$(root, '[data-mtadm-field]').map(function (el) {
      var inp = el.querySelector('[data-mtadm-input]');
      return { el: el, inp: inp, id: el.getAttribute('data-mtadm-field'), mode: el.getAttribute('data-mode'), law: el.getAttribute('data-law') === '1',
        search: el.getAttribute('data-search') || '', def: el.getAttribute('data-default') || '', initial: inp ? valueOf(inp) : '', dirty: false,
        hintEl: el.querySelector('[data-mtadm-hint]'), group: el.closest('[data-mtadm-group]').getAttribute('data-mtadm-group') };
    });
    var groups = $$(root, '[data-mtadm-group]');
    var navLinks = $$(root, '[data-mtadm-nav]');
    var searchEl = root.querySelector('[data-mtadm-search]');
    var countEl = root.querySelector('[data-mtadm-count]');
    var emptyEl = root.querySelector('[data-mtadm-empty]');
    var dirtyEl = root.querySelector('[data-mtadm-dirty]');
    var form = root.querySelector('form');
    var st = { query: '', expert: false, onlyChanged: false, onlyLaw: false, group: groups.length ? groups[0].getAttribute('data-mtadm-group') : '' };
    var submitting = false;

    try { st.expert = window.localStorage.getItem('mtadm-expert') === '1'; } catch (e) { /* kein Speicher */ }
    $$(root, '[data-mtadm-mode]').forEach(function (r) {
      r.checked = (r.value === 'expert') === st.expert;
      r.addEventListener('change', function () {
        if (!r.checked) { return; }
        st.expert = r.value === 'expert';
        try { window.localStorage.setItem('mtadm-expert', st.expert ? '1' : '0'); } catch (e) { /* egal */ }
        render();
      });
    });
    $$(root, '[data-mtadm-filter]').forEach(function (c) {
      c.addEventListener('change', function () {
        if (c.getAttribute('data-mtadm-filter') === 'changed') { st.onlyChanged = c.checked; } else { st.onlyLaw = c.checked; }
        render();
      });
    });
    if (searchEl) { searchEl.addEventListener('input', function () { st.query = searchEl.value; render(); }); }
    navLinks.forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        st.group = a.getAttribute('data-mtadm-nav');
        if (searchEl && searchEl.value) { searchEl.value = ''; st.query = ''; }
        render();
        var h = document.getElementById('mtadm-h-' + st.group);
        if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: false }); }
      });
    });

    function render() {
      var searching = st.query.trim() !== '' || st.onlyChanged || st.onlyLaw;
      var shown = 0;
      fields.forEach(function (f) {
        var inGroup = searching || f.group === st.group;
        var vis = inGroup && L.visible({ mode: f.mode, law: f.law, dirty: f.dirty, search: f.search }, st);
        f.el.hidden = !vis;
        if (vis) { shown += 1; }
      });
      groups.forEach(function (g) {
        var any = $$(g, '[data-mtadm-field]').some(function (el) { return !el.hidden; });
        // Suche: nur Gruppen mit Treffern, sonst nur die gewählte Gruppe
        g.hidden = searching ? !any : g.getAttribute('data-mtadm-group') !== st.group;
      });
      navLinks.forEach(function (a) {
        var cur = !searching && a.getAttribute('data-mtadm-nav') === st.group;
        if (cur) { a.setAttribute('aria-current', 'true'); } else { a.removeAttribute('aria-current'); }
      });
      if (emptyEl) { emptyEl.hidden = shown !== 0; }
      if (countEl) { countEl.textContent = L.countText(shown, searching); }
    }

    // Farben: Picker einklappen, Vorschau und Kontrast-Warnungen live
    var schema = null;
    try { var sc = document.getElementById('mtadm-schema'); schema = sc ? JSON.parse(sc.textContent) : null; } catch (e) { schema = null; }
    function currentValues() {
      var v = {};
      fields.forEach(function (f) { if (f.inp) { v[f.id] = valueOf(f.inp); } });
      return v;
    }
    function fmt(x) { return String(x).replace('.', ','); }
    function refreshColors() {
      if (!schema) { return; }
      var vals = currentValues();
      ['light', 'dark'].forEach(function (mode) {
        var pv = root.querySelector('[data-mtadm-preview="' + mode + '"]');
        var eff = L.effective(schema, vals, mode);
        if (pv) { Object.keys(eff).forEach(function (t) { pv.style.setProperty('--pv-' + t, eff[t]); }); }
        var ul = root.querySelector('[data-mtadm-warn="' + mode + '"]');
        if (!ul) { return; }
        var res = L.colorWarnings(schema, vals, mode);
        var bad = res.filter(function (r) { return !r.ok; });
        ul.textContent = '';
        bad.forEach(function (r) {
          var li = document.createElement('li'); li.className = 'is-bad';
          li.textContent = '⚠ Achtung: ' + r.label + ': ' + fmt(r.ratio) + ' zu 1, empfohlen mindestens ' + fmt(r.min) + ' zu 1. Gespeichert wird trotzdem.';
          ul.appendChild(li);
        });
        if (res.length && !bad.length) { var ok = document.createElement('li'); ok.className = 'is-ok'; ok.textContent = '✓ Alle geprüften Kontraste sind in Ordnung.'; ul.appendChild(ok); }
      });
    }
    fields.forEach(function (f) {
      if (f.el.getAttribute('data-type') !== 'color' || !f.inp) { return; }
      var cp = f.el.querySelector('.mt-cp');
      if (cp && !cp.closest('details')) {
        var d = document.createElement('details'); d.className = 'mtadm-picker';
        var sm = document.createElement('summary'); sm.textContent = 'Farbwähler öffnen';
        cp.parentNode.insertBefore(d, cp); d.appendChild(sm); d.appendChild(cp);
      }
      var sw = document.createElement('span'); sw.className = 'mtadm-swatch'; sw.setAttribute('aria-hidden', 'true');
      f.inp.insertAdjacentElement('afterend', sw);
      var upd = function () { var c = L.sanitize({ type: 'color' }, f.inp.value); sw.style.background = c || 'transparent'; sw.classList.toggle('is-empty', !c); };
      f.inp.addEventListener('input', upd); f.inp.addEventListener('change', upd); upd();
      f.inp.addEventListener('input', refreshColors); f.inp.addEventListener('change', refreshColors);
    });
    var accSel = document.getElementById('mtf-accent');
    if (accSel) { accSel.addEventListener('change', refreshColors); }

    function updateDirty() {
      var n = fields.filter(function (f) { return f.dirty; }).length;
      if (dirtyEl) { dirtyEl.textContent = n === 0 ? '' : (n === 1 ? '1 Änderung nicht gespeichert' : n + ' Änderungen nicht gespeichert'); }
      return n;
    }

    fields.forEach(function (f) {
      if (!f.inp) { return; }
      var out = f.el.querySelector('[data-mtadm-out]');
      var opt = optionOf(f);
      var onChange = function () {
        f.dirty = valueOf(f.inp) !== f.initial;
        f.el.classList.toggle('is-dirty', f.dirty);
        if (out) { out.textContent = f.inp.value + (out.getAttribute('data-unit') || ''); }
        var msg = L.hint(opt, f.inp.value);
        if (!msg && opt.type === 'color' && window.MTColorPicker && window.MTColorPicker.normHex(f.inp.value) && f.id.indexOf('accent') === 0) {
          var c = window.MTColorPicker.accentTextCheck(window.MTColorPicker.normHex(f.inp.value));
          var fmt = function (x) { return x.toFixed(1).replace('.', ','); };
          msg = 'Kontrast als Akzent: Hell ' + fmt(c.light) + ':1 ' + (c.light >= 4.5 ? 'ok' : 'zu niedrig') + ', Dunkel ' + fmt(c.dark) + ':1 ' + (c.dark >= 4.5 ? 'ok' : 'zu niedrig') + '.';
        }
        if (f.hintEl) { f.hintEl.textContent = msg || (f.dirty ? 'Geändert, noch nicht gespeichert' : ''); }
        f.inp.setAttribute('aria-invalid', L.hint(opt, f.inp.value) ? 'true' : 'false');
        updateDirty();
        if (st.onlyChanged) { render(); }
      };
      f.inp.addEventListener('input', onChange);
      f.inp.addEventListener('change', onChange);
      if (out) { onChange(); f.dirty = false; f.el.classList.remove('is-dirty'); if (f.hintEl) { f.hintEl.textContent = ''; } }
    });

    // Zurücksetzen je Feld und je Gruppe
    $$(root, '[data-mtadm-reset]').forEach(function (b) {
      b.addEventListener('click', function () {
        var f = fields.filter(function (x) { return x.id === b.getAttribute('data-mtadm-reset'); })[0];
        if (f && f.inp) { setValue(f.inp, f.def); f.inp.focus(); }
      });
    });
    $$(root, '[data-mtadm-reset-group]').forEach(function (b) {
      b.addEventListener('click', function () {
        var g = b.getAttribute('data-mtadm-reset-group');
        if (!window.confirm('Alle Einstellungen dieser Gruppe auf den Standard zurücksetzen? Gespeichert wird erst mit dem Speichern-Knopf.')) { return; }
        fields.forEach(function (f) { if (f.group === g && f.inp) { setValue(f.inp, f.def); } });
      });
    });
    $$(root, '[data-mtadm-clear]').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = document.getElementById(b.getAttribute('data-mtadm-clear'));
        if (i) { setValue(i, ''); i.focus(); }
      });
    });
    // Mediathek (WordPress), sonst nur das Feld
    $$(root, '[data-mtadm-media]').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = document.getElementById(b.getAttribute('data-mtadm-media'));
        if (!i) { return; }
        if (window.wp && window.wp.media) {
          var frame = window.wp.media({ title: 'Bild wählen', multiple: false, library: { type: 'image' } });
          frame.on('select', function () { var a = frame.state().get('selection').first().toJSON(); setValue(i, a.url); });
          frame.open();
        } else { i.focus(); }
      });
    });

    // Lizenzcode anzeigen (Passwortfeld)
    $$(document, '[data-mtadm-show]').forEach(function (c) {
      c.addEventListener('change', function () {
        var i = document.getElementById(c.getAttribute('data-mtadm-show'));
        if (i) { i.type = c.checked ? 'text' : 'password'; }
      });
    });

    if (form) {
      form.addEventListener('submit', function () { submitting = true; });
    }
    window.addEventListener('beforeunload', function (e) {
      if (!submitting && updateDirty() > 0) { e.preventDefault(); e.returnValue = ''; }
    });
    // Palette-Änderung gilt auch als Änderung am Formular (wird mit gespeichert)
    render();
  }

  // Option aus den data-Attributen für die Sofort-Hinweise (der Server prüft immer selbst)
  function optionOf(f) {
    var t = f.el.getAttribute('data-type');
    var inp = f.inp;
    var o = { type: t, default: f.def };
    if (t === 'range') { o.min = Number(inp.min); o.max = Number(inp.max); }
    if (t === 'text' && inp && inp.type === 'url') { o.input = 'url'; }
    return o;
  }

  function boot() { $$(document, '[data-mtadm]').forEach(init); }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', boot); } else { boot(); }
})();

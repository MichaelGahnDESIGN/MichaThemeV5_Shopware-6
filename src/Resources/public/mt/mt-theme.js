/* MichaThemeV5 – Bedienung: Hell/Dunkel-Umschalter, Textgrößen-Schalter, Favoriten (Herz-Liste). Keine Drittanbieter, kein Tracking. */
(function () {
  'use strict';

  // Favoriten Helfer - auch im Node-Test
  var FAV_KEY = 'mt-favs';
  var FAV_MAX = 50;

  // Links nur eigene Seite, nie javascript:
  function cleanUrl(url, origin, base) {
    if (typeof url !== 'string' || url === '') { return ''; }
    try {
      var u = new URL(url, base || origin);
      if (u.origin !== origin) { return ''; }
      return u.pathname + u.search;
    } catch (e) { return ''; }
  }
  function cleanFav(item, origin, base) {
    if (!item || typeof item !== 'object') { return null; }
    var id = String(item.id === undefined || item.id === null ? '' : item.id).slice(0, 64);
    var title = String(item.title === undefined || item.title === null ? '' : item.title).replace(/\s+/g, ' ').trim().slice(0, 120);
    var url = cleanUrl(item.url, origin, base);
    if (!/^[A-Za-z0-9_:.\-]+$/.test(id) || title === '' || url === '') { return null; }
    return { id: id, title: title, url: url };
  }
  function parseFavs(raw, origin, base) {
    var list = [];
    var seen = {};
    var data = [];
    try { data = JSON.parse(raw || '[]'); } catch (e) { data = []; }
    if (!Array.isArray(data)) { return list; }
    data.forEach(function (it) {
      var c = cleanFav(it, origin, base);
      if (c && !seen[c.id] && list.length < FAV_MAX) { seen[c.id] = true; list.push(c); }
    });
    return list;
  }
  // neue Liste zurück, Original bleibt
  function toggleFav(list, item) {
    var has = list.some(function (f) { return f.id === item.id; });
    if (has) { return list.filter(function (f) { return f.id !== item.id; }); }
    return list.concat([item]).slice(-FAV_MAX);
  }
  function fillLabel(pattern, value) { return String(pattern).replace('%s', value); }

  if (typeof document === 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      module.exports = { parseFavs: parseFavs, cleanFav: cleanFav, cleanUrl: cleanUrl, toggleFav: toggleFav, fillLabel: fillLabel, FAV_MAX: FAV_MAX };
    }
    return;
  }

  var root = document.documentElement;
  var order = ['system', 'light', 'dark'];
  var labels = { system: 'Wie das Gerät', light: 'Hell', dark: 'Dunkel' };

  function current() {
    var t = root.getAttribute('data-theme');
    return t === 'light' || t === 'dark' ? t : 'system';
  }
  // Speichern nur wenn der Besucher selbst umschaltet (nicht schon beim Laden)
  function apply(mode, save) {
    if (mode === 'system') { root.removeAttribute('data-theme'); } else { root.setAttribute('data-theme', mode); }
    if (save) { try { window.localStorage.setItem('mt-mode', mode); } catch (e) { /* ignorieren */ } }
    document.querySelectorAll('[data-mt-mode-toggle]').forEach(function (b) {
      // Zustand nur als aria-label/Tooltip, im Header kein Text (Übersetzung per data-label-*)
      var name = b.getAttribute('data-label-' + mode) || labels[mode];
      var pattern = b.getAttribute('data-label-pattern') || 'Farbmodus: %s. Zum Wechseln klicken.';
      var text = fillLabel(pattern, name);
      b.setAttribute('aria-label', text);
      b.setAttribute('title', text);
      b.setAttribute('data-mode', mode);
      var out = b.querySelector('[data-mt-mode-label]');
      if (out) { out.textContent = name; }
    });
  }

  // Favoriten im Browser (localStorage mt-favs)
  function readFavs() {
    var raw = null;
    try { raw = window.localStorage.getItem(FAV_KEY); } catch (e) { raw = null; }
    return parseFavs(raw, window.location.origin, window.location.href);
  }
  function writeFavs(list) {
    try { window.localStorage.setItem(FAV_KEY, JSON.stringify(list)); } catch (e) { /* kein Speicher */ }
  }
  function favSync() {
    var list = readFavs();
    var ids = {};
    list.forEach(function (f) { ids[f.id] = true; });
    document.querySelectorAll('[data-mt-fav-toggle]').forEach(function (b) {
      var on = !!ids[b.getAttribute('data-mt-fav-id')];
      var title = b.getAttribute('data-mt-fav-title') || '';
      var pattern = on ? (b.getAttribute('data-label-remove') || 'Aus Favoriten entfernen: %s') : (b.getAttribute('data-label-add') || 'Zu Favoriten hinzufügen: %s');
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.setAttribute('aria-label', fillLabel(pattern, title));
    });
    document.querySelectorAll('[data-mt-fav-item]').forEach(function (wrap) {
      // Icon erst da wenn Einträge drin sind
      wrap.hidden = list.length === 0;
      var open = wrap.querySelector('[data-mt-fav-open]');
      var panel = wrap.querySelector('[data-mt-fav-panel]');
      var ul = wrap.querySelector('[data-mt-fav-list]');
      var count = wrap.querySelector('[data-mt-fav-count]');
      if (count) { count.textContent = list.length > 99 ? '99+' : String(list.length); }
      if (open) {
        var cp = open.getAttribute('data-label-count') || 'Favoriten, %s Einträge';
        open.setAttribute('aria-label', fillLabel(cp, String(list.length)));
      }
      if (ul) {
        ul.textContent = '';
        var rm = (panel && panel.getAttribute('data-label-remove')) || 'Aus Favoriten entfernen: %s';
        list.forEach(function (f) {
          var li = document.createElement('li');
          var a = document.createElement('a');
          a.href = f.url;
          a.textContent = f.title;
          var x = document.createElement('button');
          x.type = 'button';
          x.className = 'mt-fav-remove';
          x.setAttribute('data-mt-fav-remove', f.id);
          x.setAttribute('aria-label', fillLabel(rm, f.title));
          x.textContent = '×';
          li.appendChild(a);
          li.appendChild(x);
          ul.appendChild(li);
        });
      }
      if (list.length === 0 && panel && !panel.hidden) { favClose(wrap, false); }
    });
  }
  function favClose(wrap, focusBack) {
    var open = wrap.querySelector('[data-mt-fav-open]');
    var panel = wrap.querySelector('[data-mt-fav-panel]');
    if (panel) { panel.hidden = true; }
    if (open) { open.setAttribute('aria-expanded', 'false'); if (focusBack) { open.focus(); } }
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) { return; }
    var b = t.closest('[data-mt-mode-toggle]');
    if (b) { apply(order[(order.indexOf(current()) + 1) % order.length], true); }
    var s = t.closest('[data-mt-size-step]');
    if (s) {
      var sizes = ['small', 'normal', 'large'];
      var i = sizes.indexOf(root.getAttribute('data-mt-size') || 'normal');
      i = Math.max(0, Math.min(2, i + parseInt(s.getAttribute('data-mt-size-step'), 10)));
      root.setAttribute('data-mt-size', sizes[i]);
    }
    var heart = t.closest('[data-mt-fav-toggle]');
    if (heart) {
      e.preventDefault();
      var item = cleanFav({
        id: heart.getAttribute('data-mt-fav-id'),
        title: heart.getAttribute('data-mt-fav-title'),
        url: heart.getAttribute('data-mt-fav-url')
      }, window.location.origin, window.location.href);
      if (item) { writeFavs(toggleFav(readFavs(), item)); favSync(); }
    }
    var rem = t.closest('[data-mt-fav-remove]');
    if (rem) {
      var rid = rem.getAttribute('data-mt-fav-remove');
      writeFavs(readFavs().filter(function (f) { return f.id !== rid; }));
      favSync();
    }
    var opener = t.closest('[data-mt-fav-open]');
    document.querySelectorAll('[data-mt-fav-item]').forEach(function (wrap) {
      var o = wrap.querySelector('[data-mt-fav-open]');
      var panel = wrap.querySelector('[data-mt-fav-panel]');
      if (!o || !panel) { return; }
      if (opener === o) {
        var willOpen = panel.hidden;
        panel.hidden = !willOpen;
        o.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      } else if (!wrap.contains(t)) {
        favClose(wrap, false);
      }
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') { return; }
    document.querySelectorAll('[data-mt-fav-item]').forEach(function (wrap) {
      var panel = wrap.querySelector('[data-mt-fav-panel]');
      if (panel && !panel.hidden) { favClose(wrap, true); }
    });
  });
  // andere Tabs
  window.addEventListener('storage', function (e) { if (e.key === FAV_KEY || e.key === null) { favSync(); } });

  // nachgeladene Karten (Ajax) können das selbst anstoßen
  document.addEventListener('mt:favs-sync', favSync);

  apply(current(), false);
  function landmark() {
    var m = document.querySelector('main');
    if (m) { if (!m.id) { m.id = 'mt-main'; } m.setAttribute('tabindex', '-1'); }
  }
  function ready() { landmark(); favSync(); }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', ready); } else { ready(); }
})();

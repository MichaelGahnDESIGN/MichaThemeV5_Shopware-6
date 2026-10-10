/* MichaThemeV5 – Pro-Module im Browser: Popup-Manager, Versandkosten- und Bestands-Balken, Rabattanzeige mit Countdown.
   Liest <meta name="mt-modules"> (nur gebuchte Module mit ihren Einstellungen). Ohne Meta passiert nichts. Keine Drittanbieter, kein Tracking.
   Die Rechenlogik ist rein (ohne Seitenbezug) und wird mit "node --test" geprüft. Alle Texte kommen per textContent in die Seite. */
(function (root, factory) {
  var lib = factory();
  if (typeof module === 'object' && module.exports) { module.exports = lib; } else { root.MTModules = lib; lib.boot(root); }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  var lib = {};

  function num(v) { var n = typeof v === 'string' ? parseFloat(v.replace(',', '.')) : v; return typeof n === 'number' && isFinite(n) ? n : null; }

  /** Fortschritt zum kostenlosen Versand. threshold <= 0 oder ungültig: aus. */
  lib.shipProgress = function (total, threshold) {
    var t = num(total), th = num(threshold);
    if (t === null || th === null || th <= 0 || t < 0) { return { valid: false }; }
    var reached = t >= th;
    return { valid: true, reached: reached, rest: reached ? 0 : Math.round((th - t) * 100) / 100, percent: Math.min(100, Math.floor((t / th) * 100)) };
  };

  /** Bestands-Balken: nur bei echtem Bestand (ganze Zahl >= 1) und höchstens threshold. */
  lib.stockState = function (stock, threshold, max) {
    var s = num(stock), th = num(threshold);
    if (s === null || th === null || s < 1 || Math.floor(s) !== s || s > th) { return { show: false }; }
    var m = num(max);
    return { show: true, count: s, percent: Math.max(4, Math.min(100, Math.round((s / (m && m >= s ? m : th)) * 100))) };
  };

  /**
   * Rabatt: Der Prozentwert bezieht sich auf den niedrigsten Preis der letzten 30 Tage (§ 11 PAngV). Fehlt er oder ist der aktuelle Preis
   * nicht niedriger, gibt es kein Prozent-Siegel. Countdown nur bis zu einem echten, in der Zukunft liegenden Ende.
   */
  /** Schalterwerte der Plattformen: true/1/"1"/"Y" = an, alles andere (auch "N", "0", "") = aus. */
  lib.on = function (v) { return v === true || v === 1 || v === '1' || v === 'Y' || v === 'y' || v === 'true'; };

  lib.discountInfo = function (current, lowest30, untilIso, nowMs) {
    var c = num(current), l = num(lowest30), out = { percent: null, lowest30: l, countdown: null };
    if (c !== null && l !== null && l > 0 && c >= 0 && c < l) {
      var p = Math.floor((1 - c / l) * 100 + 1e-9);
      out.percent = p >= 1 ? p : null;
    }
    var end = typeof untilIso === 'string' && /^\d{4}-\d{2}-\d{2}/.test(untilIso) ? Date.parse(untilIso) : NaN;
    if (!isNaN(end) && end > nowMs) {
      var ms = end - nowMs, s = Math.floor(ms / 1000);
      out.countdown = { ms: ms, days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
    }
    return out;
  };

  /** Datum in deutscher Zeit: {y, m, d, h, wd} (wd: 0 = Sonntag). */
  lib.berlinParts = function (ms) {
    var f = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23', weekday: 'short' });
    var o = {}; f.formatToParts(new Date(ms)).forEach(function (p) { o[p.type] = p.value; });
    return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour, wd: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(o.weekday) };
  };

  /** Feiertagsliste "JJJJ-MM-TT,..." zu einer Menge; ungültige Einträge werden ignoriert. */
  lib.holidaySet = function (text) {
    var set = {};
    String(text || '').split(/[,;\s]+/).forEach(function (t) { if (/^\d{4}-\d{2}-\d{2}$/.test(t)) { set[t] = true; } });
    return set;
  };

  /**
   * Voraussichtliches Lieferfenster (Werktage Mo-Fr ohne Feiertage). Bestellung vor dem Bestellschluss an einem
   * Werktag wird noch am selben Tag bearbeitet, sonst am nächsten Werktag. Ergebnis: Datumsteile {y,m,d} für von/bis oder null.
   */
  lib.deliveryWindow = function (nowMs, cfg) {
    var n = function (v, min, max, dflt) { var x = parseInt(v, 10); return isNaN(x) ? dflt : Math.min(max, Math.max(min, x)); };
    var handling = n(cfg.delivery_handling_days, 0, 10, 1), tmin = n(cfg.delivery_transit_min, 1, 15, 2), tmax = n(cfg.delivery_transit_max, 1, 15, 4);
    var cutoff = n(cfg.delivery_cutoff_hour, 0, 24, 14);
    if (tmax < tmin) { tmax = tmin; }
    var holidays = lib.holidaySet(cfg.delivery_holidays), now = lib.berlinParts(nowMs);
    var day = new Date(Date.UTC(now.y, now.m - 1, now.d));
    var key = function (dt) { return dt.getUTCFullYear() + '-' + lib.pad(dt.getUTCMonth() + 1) + '-' + lib.pad(dt.getUTCDate()); };
    var working = function (dt) { var w = dt.getUTCDay(); return w !== 0 && w !== 6 && !holidays[key(dt)]; };
    var next = function (dt) { var c = new Date(dt.getTime() + 86400000), guard = 0; while (!working(c) && guard++ < 400) { c = new Date(c.getTime() + 86400000); } return c; };
    var add = function (dt, k) { var c = dt; for (var i = 0; i < k; i++) { c = next(c); } return c; };
    var start = (working(day) && now.h < cutoff) ? day : next(day);
    var ship = add(start, handling);
    var out = function (dt) { return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() }; };
    var from = add(ship, tmin), to = add(ship, tmax);
    return from.getUTCFullYear() > 2100 ? null : { from: out(from), to: out(to) };
  };

  /** Soll das Popup jetzt erscheinen? state.closedAt = Zeitpunkt des letzten Schließens (ms) oder null. */
  lib.popupDue = function (cfg, state, path) {
    if (!cfg || !cfg.popup_title) { return false; }
    if (lib.on(cfg.popup_home_only) && path !== '/' && path !== '') { return false; }
    if (state.closedAt) {
      var span = cfg.popup_frequency === 'week' ? 7 * 86400000 : cfg.popup_frequency === 'day' ? 86400000 : Infinity;
      if (span === Infinity || state.now - state.closedAt < span) { return false; }
    }
    return true;
  };

  /** Nur interne Pfade und https-Adressen sind als Ziel erlaubt. */
  lib.safeUrl = function (u) {
    if (typeof u !== 'string' || u === '') { return null; }
    if (u.charAt(0) === '/' && u.charAt(1) !== '/') { return u; }
    return /^https:\/\/[^\s]+$/i.test(u) ? u : null;
  };

  lib.fill = function (tpl, values) {
    return String(tpl || '').replace(/\{(\w+)\}/g, function (m, k) { return Object.prototype.hasOwnProperty.call(values, k) ? values[k] : m; });
  };

  lib.pad = function (n) { return n < 10 ? '0' + n : String(n); };

  /* ---------- Seite ---------- */
  lib.boot = function (win) {
    var doc = win.document;
    if (!doc) { return; }
    var meta = doc.querySelector('meta[name="mt-modules"]');
    var cfg = {};
    try { cfg = JSON.parse(meta ? meta.getAttribute('content') : '{}') || {}; } catch (e) { cfg = {}; }
    var lang = (doc.documentElement.getAttribute('lang') || 'de-DE');
    var money = function (v) { try { return new Intl.NumberFormat(lang, { style: 'currency', currency: doc.documentElement.getAttribute('data-mt-currency') || 'EUR' }).format(v); } catch (e) { return String(v); } };
    var el = function (tag, cls, text) { var n = doc.createElement(tag); if (cls) { n.className = cls; } if (text != null) { n.textContent = text; } return n; };
    var bar = function (percent, label) {
      var wrap = el('div', 'mt-progress'); wrap.setAttribute('role', 'progressbar');
      wrap.setAttribute('aria-valuemin', '0'); wrap.setAttribute('aria-valuemax', '100'); wrap.setAttribute('aria-valuenow', String(percent)); wrap.setAttribute('aria-label', label);
      var fill = el('div', 'mt-progress__fill'); fill.style.width = percent + '%'; wrap.appendChild(fill); return wrap;
    };

    function shipping() {
      var c = cfg['versand-progress']; if (!c) { return; }
      doc.querySelectorAll('[data-mt-ship-progress]:not([data-mt-done])').forEach(function (n) {
        var r = lib.shipProgress(n.getAttribute('data-total'), c.ship_threshold || n.getAttribute('data-threshold'));
        n.setAttribute('data-mt-done', '1'); if (!r.valid) { return; }
        var text = r.reached ? c.ship_done_text : lib.fill(c.ship_text, { rest: money(r.rest) });
        n.replaceChildren(el('p', 'mt-ship__text', text), bar(r.percent, text)); n.classList.add('mt-ship');
      });
    }

    function stock() {
      var c = cfg['stock-progress']; if (!c) { return; }
      doc.querySelectorAll('[data-mt-stock]:not([data-mt-done])').forEach(function (n) {
        var r = lib.stockState(n.getAttribute('data-stock'), c.stock_threshold, n.getAttribute('data-max'));
        n.setAttribute('data-mt-done', '1'); if (!r.show) { return; }
        var text = lib.fill(c.stock_text, { n: String(r.count) });
        n.replaceChildren(el('p', 'mt-stock__text', text), bar(r.percent, text)); n.classList.add('mt-stock');
      });
    }

    function delivery() {
      var c = cfg['lieferanzeige']; if (!c) { return; }
      doc.querySelectorAll('[data-mt-delivery]:not([data-mt-done])').forEach(function (n) {
        n.setAttribute('data-mt-done', '1');
        var w = lib.deliveryWindow(Date.now(), c); if (!w) { return; }
        var fmt = function (p) { try { return new Intl.DateTimeFormat(lang, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(p.y, p.m - 1, p.d))); } catch (e) { return p.d + '.' + p.m + '.'; } };
        n.replaceChildren(el('p', 'mt-delivery__text', lib.fill(c.delivery_text, { 'von': fmt(w.from), 'bis': fmt(w.to) }))); n.classList.add('mt-delivery');
      });
    }

    var timers = [];
    function discount() {
      var c = cfg['rabatt']; if (!c) { return; }
      doc.querySelectorAll('[data-mt-discount]:not([data-mt-done])').forEach(function (n) {
        n.setAttribute('data-mt-done', '1');
        var info = lib.discountInfo(n.getAttribute('data-current'), n.getAttribute('data-lowest30'), n.getAttribute('data-until'), Date.now());
        var kids = [];
        if (lib.on(c.discount_percent) && info.percent !== null) { kids.push(el('span', 'mt-badge mt-badge--sale', '−' + info.percent + ' %')); }
        if (info.lowest30 !== null && (info.percent !== null || info.countdown)) { kids.push(el('span', 'mt-discount__lowest', (c.discount_lowest_label || '') + ': ' + money(info.lowest30))); }
        if (lib.on(c.discount_countdown) && info.countdown) {
          var t = el('span', 'mt-countdown'); var label = el('span', 'mt-visually-hidden', 'Angebot endet in'); var out = el('span', 'mt-countdown__time');
          t.appendChild(label); t.appendChild(out); kids.push(t);
          var tick = function () {
            var i = lib.discountInfo(n.getAttribute('data-current'), n.getAttribute('data-lowest30'), n.getAttribute('data-until'), Date.now());
            if (!i.countdown) { t.remove(); return false; }
            out.textContent = (i.countdown.days ? i.countdown.days + ' T ' : '') + lib.pad(i.countdown.hours) + ':' + lib.pad(i.countdown.minutes) + ':' + lib.pad(i.countdown.seconds);
            return true;
          };
          if (tick()) { timers.push({ run: tick }); }
        }
        if (kids.length) { n.replaceChildren.apply(n, kids); n.classList.add('mt-discount'); }
      });
      if (timers.length && !boot.timer) {
        boot.timer = win.setInterval(function () { timers = timers.filter(function (t) { return t.run(); }); if (!timers.length) { win.clearInterval(boot.timer); boot.timer = null; } }, 1000);
      }
    }
    var boot = {};

    function popup() {
      var c = cfg['popup']; if (!c) { return; }
      var closedAt = null;
      var store = c.popup_frequency === 'session' ? win.sessionStorage : win.localStorage;
      try { closedAt = parseInt(store.getItem('mt-popup-closed'), 10) || null; } catch (e) { closedAt = null; }
      if (!lib.popupDue(c, { closedAt: closedAt, now: Date.now() }, win.location.pathname)) { return; }
      var shown = false;
      function show() {
        if (shown || typeof doc.createElement('dialog').showModal !== 'function') { return; }
        shown = true;
        var d = el('dialog', 'mt-popup'); d.setAttribute('aria-labelledby', 'mt-popup-title');
        var x = el('button', 'mt-popup__close', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Schließen');
        var h = el('h2', null, c.popup_title); h.id = 'mt-popup-title'; d.append(x, h);
        if (c.popup_text) { d.appendChild(el('p', null, c.popup_text)); }
        var url = lib.safeUrl(c.popup_cta_url);
        if (c.popup_cta_label && url) { var a = el('a', 'mt-btn', c.popup_cta_label); a.href = url; d.appendChild(a); }
        var close = function () { try { store.setItem('mt-popup-closed', String(Date.now())); } catch (e) { /* ignorieren */ } d.close(); d.remove(); };
        x.addEventListener('click', close);
        d.addEventListener('cancel', function (ev) { ev.preventDefault(); close(); });
        d.addEventListener('click', function (ev) { if (ev.target === d) { close(); } });
        doc.body.appendChild(d); d.showModal();
      }
      if (c.popup_trigger === 'exit') {
        doc.addEventListener('mouseout', function (ev) { if (!ev.relatedTarget && ev.clientY <= 0) { show(); } });
      } else if (c.popup_trigger === 'scroll') {
        var onScroll = function () { var h = doc.documentElement; if ((win.scrollY + win.innerHeight) / h.scrollHeight > 0.5) { win.removeEventListener('scroll', onScroll); show(); } };
        win.addEventListener('scroll', onScroll, { passive: true });
      } else {
        win.setTimeout(show, Math.max(3, parseInt(c.popup_delay, 10) || 10) * 1000);
      }
    }

    function run() { shipping(); stock(); discount(); delivery(); }
    if (doc.readyState === 'loading') { doc.addEventListener('DOMContentLoaded', function () { run(); popup(); }); } else { run(); popup(); }
    if (win.MutationObserver) { new win.MutationObserver(run).observe(doc.documentElement, { childList: true, subtree: true }); }
  };

  return lib;
});

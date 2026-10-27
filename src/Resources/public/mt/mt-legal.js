/* MichaThemeV5 - Recht: Video 2-Klick und Schnittstelle zu Consent-Managern. Kein Drittanbieter vorab, kein Tracking.
   Video: iframe baut erst dieses Skript nach Klick (youtube-nocookie, Vimeo dnt=1)
   Consent: kein eigenes Banner. Ereignisse mt:consent-ready (Manager ist da) und mt:consent-open (Button geklickt),
   dazu window.mtConsentProvider = true und optional window.mtConsentOpen = function () {} */
(function () {
  'use strict';
  var embeds = {
    youtube: { id: /^[A-Za-z0-9_-]{6,20}$/, url: 'https://www.youtube-nocookie.com/embed/', query: '?autoplay=1&rel=0' },
    vimeo: { id: /^[0-9]{1,15}$/, url: 'https://player.vimeo.com/video/', query: '?autoplay=1&dnt=1' }
  };

  function loadVideo(btn) {
    var box = btn.closest('[data-mt-video]');
    if (!box) { return; }
    var provider = box.getAttribute('data-mt-video-provider');
    var e = embeds[provider];
    var id = box.getAttribute('data-mt-video-id') || '';
    if (!e || !e.id.test(id)) { return; }
    // Consent-Manager darf einhaken und abbrechen (preventDefault)
    var ev = new CustomEvent('mt:video-before-load', { bubbles: true, cancelable: true, detail: { provider: provider, id: id } });
    if (!box.dispatchEvent(ev)) { return; }
    var frame = document.createElement('iframe');
    frame.src = e.url + id + e.query;
    frame.title = box.getAttribute('data-mt-video-title') || (provider === 'vimeo' ? 'Vimeo Video' : 'YouTube Video');
    frame.allow = 'autoplay; fullscreen; picture-in-picture';
    frame.allowFullscreen = true;
    frame.className = 'mt-video__frame';
    box.textContent = '';
    box.appendChild(frame);
    box.classList.add('is-loaded');
    frame.focus();
  }

  function setupConsent() {
    var buttons = document.querySelectorAll('[data-mt-consent-open]');
    if (!buttons.length) { return; }
    var show = function () { document.querySelectorAll('[data-mt-consent-item]').forEach(function (li) { li.hidden = false; }); };
    if (window.mtConsentProvider === true) { show(); }
    document.addEventListener('mt:consent-ready', show);
    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        document.dispatchEvent(new CustomEvent('mt:consent-open'));
        if (typeof window.mtConsentOpen === 'function') { window.mtConsentOpen(); }
      });
    });
  }

  document.addEventListener('click', function (ev) {
    var b = ev.target.closest ? ev.target.closest('[data-mt-video-load]') : null;
    if (b) { loadVideo(b); }
  });
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', setupConsent); } else { setupConsent(); }
})();

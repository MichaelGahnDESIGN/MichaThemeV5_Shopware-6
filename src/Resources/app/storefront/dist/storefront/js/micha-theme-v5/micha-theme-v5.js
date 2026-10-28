/* MichaThemeV5: automatisch erzeugt aus src/Resources/app/storefront/src/js/mt-notification-center.js src/Resources/app/storefront/src/js/mt-favorites-sync.js. Nicht von Hand ändern, sondern: sh scripts/build-storefront.sh */
// Glocke Storefront - laeuft ohne Shopware Plugin-System, alles per textContent (kein HTML aus Meldungen)
(() => {
    'use strict';

    const ROOT = '[data-mt-notification-center]';
    const ZERO_ID = '00000000000000000000000000000000';
    // Header + Footer teilen sich einen Abruf
    let feed = null;
    // Header und Footer Glocke gleichziehen, wenn eine geöffnet wird
    const resets = [];

    // Links: nur /pfad oder http(s), nie javascript:
    const safeHref = (url) => {
        if (typeof url !== 'string' || url === '') return null;
        if (url.startsWith('/')) return url.startsWith('//') ? null : url;
        return /^https?:\/\/\S+$/i.test(url) ? url : null;
    };

    const headers = { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' };

    const loadFeed = (url) => {
        if (!feed) {
            feed = fetch(url, { credentials: 'same-origin', headers })
                .then((r) => (r.ok ? r.json() : { items: [] }))
                .then((d) => (d && Array.isArray(d.items) ? d.items : []))
                .catch(() => []);
        }
        return feed;
    };

    const formatDate = (iso) => {
        const date = new Date(iso);
        if (!iso || Number.isNaN(date.getTime())) return '';
        return new Intl.DateTimeFormat(document.documentElement.lang || undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
    };

    const markRead = (readUrl, id) => {
        fetch(readUrl.replace(ZERO_ID, id), { method: 'POST', credentials: 'same-origin', headers, keepalive: true }).catch(() => {});
    };

    const init = (root) => {
        const button = root.querySelector('.mt-notification-button');
        const panel = root.querySelector('.mt-notification-panel');
        const list = root.querySelector('.mt-notification-list');
        const empty = root.querySelector('.mt-notification-empty');
        const count = root.querySelector('.mt-notification-count');
        const feedUrl = root.getAttribute('data-feed-url');
        const readUrl = root.getAttribute('data-read-url') || '';
        const baseLabel = button ? button.getAttribute('aria-label') : '';
        if (!button || !panel || !list || !count || !feedUrl) return;

        let unreadIds = [];
        const seen = () => { unreadIds = []; };

        const setCount = (n) => {
            count.textContent = String(n);
            count.hidden = n === 0;
            button.setAttribute('aria-label', n > 0 ? baseLabel + ', ' + n + ' ungelesen' : baseLabel);
        };

        const render = (items) => {
            list.textContent = '';
            items.forEach((item) => {
                const li = document.createElement('li');
                li.className = 'mt-notification-item' + (item.read ? '' : ' mt-notification-item--new');
                const title = document.createElement('strong');
                title.textContent = String(item.title || '');
                li.append(title);
                if (item.body) {
                    const text = document.createElement('span');
                    text.textContent = String(item.body);
                    li.append(text);
                }
                const when = formatDate(item.publishedAt);
                if (when) {
                    const time = document.createElement('time');
                    time.dateTime = item.publishedAt;
                    time.textContent = when;
                    li.append(time);
                }
                const href = safeHref(item.targetUrl);
                if (href) {
                    const link = document.createElement('a');
                    link.href = href;
                    link.textContent = 'Ansehen';
                    if (!href.startsWith('/')) link.rel = 'noopener noreferrer';
                    li.append(link);
                }
                list.append(li);
            });
            if (empty) empty.hidden = items.length > 0;
            // Glocke erst sichtbar wenn echte Einträge da sind (Header + Footer)
            root.hidden = items.length === 0;
            // Zaehler nur fuer persoenliche Meldungen (Serverstand, nichts im Browser gespeichert)
            unreadIds = items.filter((item) => item.scope === 'personal' && !item.read).map((item) => item.id);
            setCount(unreadIds.length);
        };

        const close = (returnFocus) => {
            button.setAttribute('aria-expanded', 'false');
            panel.hidden = true;
            if (returnFocus) button.focus();
        };

        const open = () => {
            button.setAttribute('aria-expanded', 'true');
            panel.hidden = false;
            // Beim Oeffnen gelten persoenliche Meldungen als gelesen
            if (unreadIds.length && readUrl) {
                unreadIds.forEach((id) => markRead(readUrl, id));
                resets.forEach((reset) => reset());
            }
        };

        button.addEventListener('click', () => (button.getAttribute('aria-expanded') === 'true' ? close(false) : open()));
        root.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && !panel.hidden) close(true);
        });
        document.addEventListener('click', (event) => {
            if (!panel.hidden && !root.contains(event.target)) close(false);
        });

        resets.push(() => { seen(); setCount(0); });
        loadFeed(feedUrl).then(render);
    };

    const start = () => document.querySelectorAll(ROOT).forEach(init);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})();
// Favoriten Herzen nach Ajax (Filter, Sortierung) neu abgleichen > mt-theme.js hört auf mt:favs-sync
(() => {
    'use strict';

    const start = () => {
        const listing = document.querySelector('.cms-element-product-listing-wrapper');
        if (!listing || typeof MutationObserver === 'undefined') return;
        let queued = false;
        new MutationObserver(() => {
            if (queued) return;
            queued = true;
            // 1x pro Frame, Herz-Attribute lösen kein childList aus
            window.requestAnimationFrame(() => {
                queued = false;
                document.dispatchEvent(new Event('mt:favs-sync'));
            });
        }).observe(listing, { childList: true, subtree: true });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})();

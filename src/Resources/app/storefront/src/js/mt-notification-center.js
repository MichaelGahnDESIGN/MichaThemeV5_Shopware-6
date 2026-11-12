// Glocke Storefront - Panel mit X aktuellen, "Alle anzeigen", Alle gelesen, Ausblenden. Kein fremdes HTML, nur Allowlist
(() => {
    'use strict';

    const ROOT = '[data-mt-notification-center]';
    const ZERO_ID = '00000000000000000000000000000000';
    const headers = { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' };
    // Header + Footer teilen sich Abruf und Zustand
    let feed = null;
    const views = [];
    const hiddenPersonal = new Set();

    // öffentliche: gelesen/ausgeblendet nur im Browser
    const readKey = 'mt-notification-read-v1';
    const hideKey = 'mt-notification-hidden-v1';
    const load = (key) => {
        try { const v = JSON.parse(window.localStorage.getItem(key) || '[]'); return new Set(Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.length < 120).slice(-500) : []); } catch (e) { return new Set(); }
    };
    const save = (key, set) => { try { window.localStorage.setItem(key, JSON.stringify([...set].slice(-500))); return true; } catch (e) { return false; } };
    const publicRead = load(readKey);
    const publicHidden = load(hideKey);

    const keyOf = (item) => (item.scope === 'personal' ? 'p' : 'o') + item.id + ':' + (item.publishedAt || '');
    const isRead = (item) => (item.scope === 'personal' ? !!item.read : publicRead.has(keyOf(item)));
    const isHidden = (item) => (item.scope === 'personal' ? hiddenPersonal.has(item.id) : publicHidden.has(keyOf(item)));
    const refreshAll = () => views.forEach((fn) => fn());

    // Links: nur /pfad oder http(s), nie javascript:
    const safeHref = (url) => {
        if (typeof url !== 'string' || url === '') return null;
        if (url.startsWith('/')) return url.startsWith('//') ? null : url;
        return /^https?:\/\/\S+$/i.test(url) ? url : null;
    };
    // Inhalt mit Links, nur erlaubte Tags (Admin speichert eh nur Text)
    const allowed = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'UL', 'OL', 'LI', 'A']);
    const dropped = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'IFRAME', 'OBJECT', 'EMBED', 'NOSCRIPT', 'SVG', 'MATH', 'TEXTAREA', 'SELECT']);
    const richText = (html) => {
        const out = document.createDocumentFragment ? document.createDocumentFragment() : document.createElement('div');
        if (typeof DOMParser === 'undefined') { out.append(String(html || '').replace(/<[^>]*>/g, '')); return out; }
        const src = new DOMParser().parseFromString('<div>' + String(html || '') + '</div>', 'text/html').body.firstChild;
        const walk = (node, target) => {
            node.childNodes.forEach((child) => {
                if (child.nodeType === 3) { target.append(child.textContent); return; }
                if (child.nodeType !== 1 || dropped.has(child.tagName.toUpperCase())) return;
                if (!allowed.has(child.tagName)) { walk(child, target); return; }
                const el = document.createElement(child.tagName.toLowerCase());
                if (child.tagName === 'A') {
                    const href = safeHref(child.getAttribute('href') || '');
                    if (!href) { walk(child, target); return; }
                    el.href = href;
                    if (!href.startsWith('/')) { el.target = '_blank'; el.rel = 'noopener noreferrer'; }
                }
                walk(child, el); target.append(el);
            });
        };
        if (src) walk(src, out);
        return out;
    };
    const plainText = (html) => String(html || '').replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').replace(/ ([.,;:!?])/g, '$1').trim();
    const formatDate = (iso) => {
        const date = new Date(iso);
        if (!iso || Number.isNaN(date.getTime())) return '';
        return new Intl.DateTimeFormat(document.documentElement.lang || undefined, { dateStyle: 'medium' }).format(date);
    };
    const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
    const esc = (v) => (typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(v) : String(v).replace(/["\\]/g, '\\$&'));

    const loadFeed = (url) => {
        if (!feed) {
            feed = fetch(url, { credentials: 'same-origin', headers })
                .then((r) => (r.ok ? r.json() : { items: [] }))
                .then((d) => ({ items: d && Array.isArray(d.items) ? d.items : [], settings: (d && d.settings) || {} }))
                .catch(() => ({ items: [], settings: {} }));
        }
        return feed;
    };
    const post = (url) => fetch(url, { method: 'POST', credentials: 'same-origin', headers, keepalive: true })
        .then((r) => (r.ok ? r.json() : { success: false }))
        .then((d) => d && d.success === true)
        .catch(() => false);

    const init = (root) => {
        const button = root.querySelector('.mt-notification-button');
        const panel = root.querySelector('.mt-notification-panel');
        const list = root.querySelector('.mt-notification-list');
        const empty = root.querySelector('.mt-notification-empty');
        const count = root.querySelector('.mt-notification-count');
        const readAllBtn = root.querySelector('.mt-notification-read-all');
        const hideReadBtn = root.querySelector('.mt-notification-hide-read');
        const showAll = root.querySelector('.mt-notification-show-all');
        const status = root.querySelector('.mt-notification-status');
        const feedUrl = root.getAttribute('data-feed-url');
        const url = (name, id) => (root.getAttribute(name) || '').replace(ZERO_ID, id || ZERO_ID);
        const baseLabel = button ? button.getAttribute('aria-label') : '';
        if (!button || !panel || !list || !count || !feedUrl) return;
        let items = [];
        let limit = 5;
        let busy = false;
        const say = (text) => { if (status) status.textContent = text; };

        const markRead = (item) => {
            if (isRead(item)) return Promise.resolve(true);
            if (item.scope !== 'personal') { publicRead.add(keyOf(item)); save(readKey, publicRead); refreshAll(); return Promise.resolve(true); }
            return post(url('data-read-url', item.id)).then((ok) => { if (ok) { item.read = true; refreshAll(); } return ok; });
        };
        const hide = (item) => {
            if (item.scope !== 'personal') { publicHidden.add(keyOf(item)); publicRead.add(keyOf(item)); save(hideKey, publicHidden); save(readKey, publicRead); refreshAll(); return Promise.resolve(true); }
            return post(url('data-dismiss-url', item.id)).then((ok) => { if (ok) { hiddenPersonal.add(item.id); refreshAll(); } return ok; });
        };
        const visible = () => items.filter((i) => !isHidden(i));

        // Modal "Alle Benachrichtigungen" (einmal je Glocke)
        const dialog = el('dialog', 'mt-notification-dialog');
        const dId = (panel.id || 'mt-notification') + '-all';
        dialog.setAttribute('aria-labelledby', dId);
        const dHead = el('header');
        const dTitle = el('h2', '', 'Alle Benachrichtigungen'); dTitle.id = dId;
        const dReadAll = el('button', 'mt-notification-tool', 'Alle gelesen'); dReadAll.type = 'button';
        const dHideRead = el('button', 'mt-notification-tool', 'Gelesene ausblenden'); dHideRead.type = 'button';
        const dClose = el('button', 'mt-notification-dialog-close', '×'); dClose.type = 'button'; dClose.setAttribute('aria-label', 'Fenster schließen');
        dHead.append(dTitle, dReadAll, dHideRead, dClose);
        const dBody = el('div', 'mt-notification-dialog-body');
        const dEmpty = el('p', 'mt-notification-empty', 'Keine Benachrichtigungen.');
        const dList = el('div', 'mt-notification-dialog-list');
        dBody.append(dEmpty, dList); dialog.append(dHead, dBody);
        if (document.body) document.body.append(dialog);
        const closeDialog = () => { if (typeof dialog.close === 'function') dialog.close(); else { dialog.open = false; button.focus(); } };
        dClose.addEventListener('click', closeDialog);
        dialog.addEventListener('close', () => button.focus());
        dialog.addEventListener('click', (e) => { if (e.target === dialog) closeDialog(); });
        let dialogKeys = null;

        const meta = (item) => [formatDate(item.publishedAt), isRead(item) ? 'Gelesen' : 'Neu'].filter(Boolean).join(' · ');
        const hideButton = (item, cls, text) => {
            const b = el('button', cls, text); b.type = 'button';
            b.setAttribute('aria-label', 'Meldung ausblenden: ' + String(item.title || ''));
            b.addEventListener('click', (e) => {
                if (e) { e.preventDefault(); e.stopPropagation(); }
                hide(item).then((ok) => { if (!ok) say('Meldung konnte nicht ausgeblendet werden. Bitte erneut versuchen.'); });
            });
            return b;
        };
        const panelItem = (item) => {
            const li = el('li', 'mt-notification-item' + (isRead(item) ? ' is-read' : ' mt-notification-item--new'));
            const title = el('button', 'mt-notification-item-title', String(item.title || '')); title.type = 'button'; title.setAttribute('aria-haspopup', 'dialog');
            title.addEventListener('click', () => { markRead(item); openDialog(item); });
            const text = plainText(item.body);
            const foot = el('div', 'mt-notification-foot');
            foot.append(el('small', '', meta(item)), hideButton(item, 'mt-notification-hide', 'Ausblenden'));
            li.append(title, el('span', 'mt-notification-text', text.length > 140 ? text.slice(0, 140) + ' …' : text), foot);
            return li;
        };
        const dialogItem = (item) => {
            const d = el('details', 'mt-notification-dialog-item' + (isRead(item) ? ' is-read' : ''));
            d.setAttribute('data-key', keyOf(item));
            const s = el('summary'); s.append(el('span', '', String(item.title || '')), el('small', '', meta(item)));
            const c = el('div', 'mt-notification-dialog-content'); c.append(richText(item.body));
            const actions = el('div', 'mt-notification-dialog-actions');
            const href = safeHref(item.targetUrl);
            if (href) { const a = el('a', '', 'Ansehen'); a.href = href; if (!href.startsWith('/')) a.rel = 'noopener noreferrer'; actions.append(a); }
            actions.append(hideButton(item, 'mt-notification-tool', 'Ausblenden'));
            c.append(actions); d.append(s, c);
            d.addEventListener('toggle', () => { if (d.open) markRead(item); });
            return d;
        };
        const openDialog = (focusItem) => {
            render(); close(false);
            if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.open = true;
            const t = focusItem && dList.querySelector ? dList.querySelector('[data-key="' + esc(keyOf(focusItem)) + '"]') : null;
            if (t) { t.open = true; t.querySelector('summary').focus(); } else dClose.focus();
        };

        const render = () => {
            const vis = visible();
            const unread = vis.filter((i) => !isRead(i)).length;
            count.textContent = String(unread);
            count.hidden = unread === 0;
            button.setAttribute('aria-label', unread > 0 ? baseLabel + ', ' + unread + ' ungelesen' : baseLabel);
            if (readAllBtn) readAllBtn.disabled = busy || unread === 0;
            if (hideReadBtn) hideReadBtn.disabled = busy || vis.length === unread;
            dReadAll.disabled = busy || unread === 0;
            dHideRead.disabled = busy || vis.length === unread;
            if (empty) empty.hidden = vis.length > 0;
            list.textContent = '';
            vis.slice(0, limit).forEach((i) => list.append(panelItem(i)));
            if (showAll) { showAll.hidden = vis.length === 0; showAll.textContent = vis.length > limit ? 'Alle anzeigen (' + vis.length + ')' : 'Alle anzeigen'; }
            // Glocke erst sichtbar wenn echte Einträge da sind (Header + Footer)
            root.hidden = items.length === 0;
            // Modal nur neu bauen wenn sich die Liste ändert (Fokus bleibt)
            const keys = vis.map(keyOf).join('|');
            if (keys !== dialogKeys) {
                const active = dialog.contains && document.activeElement && dialog.contains(document.activeElement) ? document.activeElement.closest('details') : null;
                const focusKey = active ? active.getAttribute('data-key') : null;
                dList.textContent = '';
                vis.forEach((i) => dList.append(dialogItem(i)));
                dialogKeys = keys;
                if (focusKey) { const f = dList.querySelector('[data-key="' + esc(focusKey) + '"] summary'); if (f) { f.parentNode.open = true; f.focus(); } }
            } else if (dList.querySelector) {
                vis.forEach((i) => {
                    const d = dList.querySelector('[data-key="' + esc(keyOf(i)) + '"]');
                    if (d) { d.classList.toggle('is-read', isRead(i)); d.querySelector('summary small').textContent = meta(i); }
                });
            }
            dEmpty.hidden = vis.length > 0;
        };

        const onReadAll = () => {
            if (busy) return;
            const vis = visible();
            busy = true; render(); say('Wird als gelesen markiert …');
            vis.filter((i) => i.scope !== 'personal').forEach((i) => publicRead.add(keyOf(i)));
            save(readKey, publicRead);
            const need = vis.some((i) => i.scope === 'personal' && !i.read);
            (need ? post(url('data-read-all-url')) : Promise.resolve(true)).then((ok) => {
                if (ok) vis.forEach((i) => { if (i.scope === 'personal') i.read = true; });
                busy = false; refreshAll();
                say(ok ? 'Alle Meldungen sind gelesen.' : 'Einige Meldungen konnten nicht als gelesen gespeichert werden.');
            });
        };
        const onHideRead = () => {
            if (busy) return;
            const read = visible().filter(isRead);
            busy = true; render();
            read.filter((i) => i.scope !== 'personal').forEach((i) => publicHidden.add(keyOf(i)));
            save(hideKey, publicHidden);
            const need = read.some((i) => i.scope === 'personal');
            (need ? post(url('data-dismiss-read-url')) : Promise.resolve(true)).then((ok) => {
                if (ok) read.forEach((i) => { if (i.scope === 'personal') hiddenPersonal.add(i.id); });
                busy = false; refreshAll();
                say(!ok ? 'Einige Meldungen konnten nicht ausgeblendet werden.' : (read.length === 1 ? '1 gelesene Meldung ausgeblendet.' : read.length + ' gelesene Meldungen ausgeblendet.'));
            });
        };
        if (readAllBtn) readAllBtn.addEventListener('click', onReadAll);
        if (hideReadBtn) hideReadBtn.addEventListener('click', onHideRead);
        dReadAll.addEventListener('click', onReadAll);
        dHideRead.addEventListener('click', onHideRead);
        if (showAll) showAll.addEventListener('click', () => openDialog(null));

        const close = (returnFocus) => {
            button.setAttribute('aria-expanded', 'false');
            panel.hidden = true;
            if (returnFocus) button.focus();
        };
        button.addEventListener('click', () => {
            const open = button.getAttribute('aria-expanded') !== 'true';
            button.setAttribute('aria-expanded', String(open));
            panel.hidden = !open;
        });
        root.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !panel.hidden) close(true); });
        document.addEventListener('click', (event) => {
            const path = event.composedPath ? event.composedPath() : [];
            if (!panel.hidden && path.indexOf(root) === -1 && !root.contains(event.target)) close(false);
        });

        views.push(render);
        loadFeed(feedUrl).then((data) => {
            // gleiche Objekte für Header + Footer, damit gelesen überall gilt
            items = data.items;
            limit = Math.max(1, Math.min(30, Number(data.settings.visibleLimit) || 5));
            render();
        });
    };

    const start = () => document.querySelectorAll(ROOT).forEach(init);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})();

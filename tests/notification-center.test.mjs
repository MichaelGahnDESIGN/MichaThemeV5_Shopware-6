// Prüft das Glocken-Skript mit einem winzigen Fake-DOM (kein Browser, kein npm nötig)
import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const dist = readFileSync(new URL('../src/Resources/app/storefront/dist/storefront/js/micha-theme-v5/micha-theme-v5.js', import.meta.url), 'utf8');

const element = (tag = 'div') => {
    const node = {
        tag, className: '', children: [], attrs: {}, listeners: {}, hidden: false, disabled: false, _text: '',
        set textContent(v) { this._text = v; if (v === '') this.children = []; },
        get textContent() { return this._text; },
        append(...nodes) { this.children.push(...nodes); },
        setAttribute(k, v) { this.attrs[k] = v; },
        getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; },
        addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); },
        focus() {},
        classList: { toggle() {} },
    };
    return node;
};
const click = (node) => (node.listeners.click || []).forEach((fn) => fn({ preventDefault() {}, stopPropagation() {} }));
const flush = () => new Promise((r) => setTimeout(r, 10));
// alle Knoten im Baum, die zu einer Klasse passen
const find = (node, cls, out = []) => {
    if (node && typeof node === 'object') {
        if (String(node.className || '').split(' ').includes(cls)) out.push(node);
        (node.children || []).forEach((c) => find(c, cls, out));
    }
    return out;
};

async function run(payload, ok = true) {
    const calls = [];
    const root = element();
    root.hidden = true;
    root.attrs = {
        'data-feed-url': '/feed',
        'data-read-url': '/mgd-notification-center/00000000000000000000000000000000/read',
        'data-dismiss-url': '/mgd-notification-center/00000000000000000000000000000000/dismiss',
        'data-read-all-url': '/mgd-notification-center/read-all',
        'data-dismiss-read-url': '/mgd-notification-center/dismiss-read',
    };
    const button = element('button'); button.attrs['aria-label'] = 'Benachrichtigungen'; button.attrs['aria-expanded'] = 'false';
    const parts = {
        'mt-notification-button': button,
        'mt-notification-panel': Object.assign(element('section'), { hidden: true, id: 'p' }),
        'mt-notification-list': element('ul'),
        'mt-notification-empty': element('p'),
        'mt-notification-count': Object.assign(element('span'), { hidden: true }),
        'mt-notification-read-all': element('button'),
        'mt-notification-hide-read': element('button'),
        'mt-notification-show-all': Object.assign(element('button'), { hidden: true }),
        'mt-notification-status': element('p'),
    };
    root.querySelector = (sel) => parts[sel.slice(1)] || null;
    root.contains = () => true;
    const body = element('body');
    globalThis.document = {
        readyState: 'complete', documentElement: { lang: 'de' }, body,
        querySelectorAll: () => [root], querySelector: () => null, createElement: element, addEventListener() {},
    };
    globalThis.fetch = (url, options = {}) => {
        calls.push({ url, method: options.method || 'GET', headers: options.headers });
        const data = url === '/feed' ? payload : { success: true, count: 1 };
        return Promise.resolve({ ok, json: () => Promise.resolve(data) });
    };
    new Function(dist)();
    await flush();
    return { parts, calls, button, root, body };
}

const items = [
    { id: 'a'.repeat(32), title: '<b>Bestellung 1</b>', body: 'Text <script>alert(1)</script>', targetUrl: '/account/order', publishedAt: '2026-10-27T10:00:00Z', scope: 'personal', read: false },
    { id: 'b'.repeat(32), title: 'Öffentlich', body: '', targetUrl: 'javascript:alert(1)', publishedAt: '2026-10-27T09:00:00Z', scope: 'public', read: false },
];

// Meldungen, Anzahl aus den Einstellungen, Zähler, XHR-Header
{
    const { parts, calls, button, root } = await run({ items: items.map((i) => ({ ...i })), settings: { visibleLimit: 1 } });
    assert.equal(root.hidden, false);
    assert.equal(parts['mt-notification-list'].children.length, 1, 'nur 1 im Panel (Einstellung)');
    assert.equal(parts['mt-notification-show-all'].hidden, false);
    assert.equal(parts['mt-notification-show-all'].textContent, 'Alle anzeigen (2)');
    assert.equal(parts['mt-notification-count'].textContent, '2');
    assert.match(button.attrs['aria-label'], /2 ungelesen/);
    assert.equal(calls[0].headers['X-Requested-With'], 'XMLHttpRequest');
    // Titel bleibt Text, Skript-Inhalt landet nicht im Vorschautext
    const first = parts['mt-notification-list'].children[0];
    assert.equal(first.children[0].textContent, '<b>Bestellung 1</b>');
    assert.equal(first.children[1].textContent, 'Text', 'Skript-Inhalt verworfen');
    // Öffnen allein markiert nichts mehr
    click(button);
    assert.equal(parts['mt-notification-panel'].hidden, false);
    assert.equal(calls.filter((c) => c.method === 'POST').length, 0);
    // Alle gelesen: ein Aufruf für alle persönlichen
    click(parts['mt-notification-read-all']);
    await flush();
    assert.deepEqual(calls.filter((c) => c.method === 'POST').map((c) => c.url), ['/mgd-notification-center/read-all']);
    assert.equal(parts['mt-notification-count'].hidden, true);
    // Gelesene ausblenden: persönliche über den Server
    click(parts['mt-notification-hide-read']);
    await flush();
    assert.ok(calls.some((c) => c.url === '/mgd-notification-center/dismiss-read' && c.method === 'POST'));
    assert.equal(parts['mt-notification-list'].children.length, 0);
}

// Einzeln ausblenden: persönliche Meldung über die Dismiss-Route
{
    const { parts, calls } = await run({ items: items.map((i) => ({ ...i })), settings: { visibleLimit: 5 } });
    const hideBtn = find(parts['mt-notification-list'], 'mt-notification-hide')[0];
    click(hideBtn);
    await flush();
    assert.ok(calls.some((c) => c.url === `/mgd-notification-center/${'a'.repeat(32)}/dismiss`));
    assert.equal(parts['mt-notification-list'].children.length, 1);
}

// Modal: unsicherer Link wird nicht gerendert, sicherer schon
{
    const { body } = await run({ items: items.map((i) => ({ ...i })), settings: {} });
    const dialogItems = find(body, 'mt-notification-dialog-item');
    assert.equal(dialogItems.length, 2);
    const links = (d) => find(d, 'mt-notification-dialog-actions')[0].children.filter((c) => c.tag === 'a');
    assert.equal(links(dialogItems[0])[0].href, '/account/order');
    assert.equal(links(dialogItems[1]).length, 0);
}

// Fehler beim Abruf: Glocke bleibt versteckt
{
    const { parts, root } = await run({ items: [] }, false);
    assert.equal(root.hidden, true);
    assert.equal(parts['mt-notification-list'].children.length, 0);
    assert.equal(parts['mt-notification-empty'].hidden, false);
    assert.equal(parts['mt-notification-count'].hidden, true);
}

console.log('Glocken-Skript geprüft.');

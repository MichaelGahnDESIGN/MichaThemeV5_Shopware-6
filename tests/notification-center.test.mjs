// Prüft das Glocken-Skript mit einem winzigen Fake-DOM (kein Browser, kein npm nötig)
import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const dist = readFileSync(new URL('../src/Resources/app/storefront/dist/storefront/js/micha-theme-v5/micha-theme-v5.js', import.meta.url), 'utf8');

const element = (tag = 'div') => ({
    tag, className: '', children: [], attrs: {}, listeners: {}, hidden: false, _text: '',
    set textContent(v) { this._text = v; if (v === '') this.children = []; },
    get textContent() { return this._text; },
    append(...nodes) { this.children.push(...nodes); },
    setAttribute(k, v) { this.attrs[k] = v; },
    getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; },
    addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); },
    focus() {},
});

async function run(items, ok = true) {
    const calls = [];
    const root = element();
    root.attrs = { 'data-feed-url': '/feed', 'data-read-url': '/mgd-notification-center/00000000000000000000000000000000/read' };
    const button = element('button'); button.attrs['aria-label'] = 'Benachrichtigungen'; button.attrs['aria-expanded'] = 'false';
    const parts = { 'mt-notification-button': button, 'mt-notification-panel': Object.assign(element('section'), { hidden: true }), 'mt-notification-list': element('ul'), 'mt-notification-empty': element('p'), 'mt-notification-count': Object.assign(element('span'), { hidden: true }) };
    root.querySelector = (sel) => parts[sel.slice(1)] || null;
    root.contains = () => true;
    const doc = {
        readyState: 'complete', documentElement: { lang: 'de' },
        querySelectorAll: () => [root], createElement: element, addEventListener() {},
    };
    globalThis.document = doc;
    globalThis.fetch = (url, options = {}) => { calls.push({ url, method: options.method || 'GET', headers: options.headers }); return Promise.resolve({ ok, json: () => Promise.resolve({ items }) }); };
    new Function(dist)();
    await new Promise((r) => setTimeout(r, 10));
    return { parts, calls, button };
}

// Meldungen, Zähler (nur persönlich ungelesen), XHR-Header
{
    const items = [
        { id: 'a'.repeat(32), title: '<b>Bestellung 1</b>', body: 'Text', targetUrl: '/account/order', publishedAt: '2026-10-27T10:00:00Z', scope: 'personal', read: false },
        { id: 'b'.repeat(32), title: 'Öffentlich', body: '', targetUrl: 'javascript:alert(1)', publishedAt: '2026-10-27T09:00:00Z', scope: 'public', read: true },
    ];
    const { parts, calls, button } = await run(items);
    assert.equal(parts['mt-notification-list'].children.length, 2);
    assert.equal(parts['mt-notification-count'].textContent, '1');
    assert.equal(parts['mt-notification-count'].hidden, false);
    assert.equal(parts['mt-notification-empty'].hidden, true);
    assert.match(button.attrs['aria-label'], /1 ungelesen/);
    assert.equal(calls[0].headers['X-Requested-With'], 'XMLHttpRequest');
    // Titel bleibt Text (kein HTML), unsicherer Link wird nicht gerendert
    const first = parts['mt-notification-list'].children[0];
    assert.equal(first.children[0].textContent, '<b>Bestellung 1</b>');
    assert.ok(first.children.some((c) => c.href === '/account/order'));
    const second = parts['mt-notification-list'].children[1];
    assert.ok(!second.children.some((c) => c.href));
    // Öffnen markiert persönliche Meldungen als gelesen
    button.listeners.click[0]();
    assert.equal(parts['mt-notification-panel'].hidden, false);
    assert.equal(button.attrs['aria-expanded'], 'true');
    const read = calls.find((c) => c.method === 'POST');
    assert.equal(read.url, `/mgd-notification-center/${'a'.repeat(32)}/read`);
    assert.equal(parts['mt-notification-count'].hidden, true);
}

// Fehler beim Abruf: leere Liste, kein Fehler, Hinweistext bleibt sichtbar
{
    const { parts } = await run([], false);
    assert.equal(parts['mt-notification-list'].children.length, 0);
    assert.equal(parts['mt-notification-empty'].hidden, false);
    assert.equal(parts['mt-notification-count'].hidden, true);
}

console.log('Glocken-Skript geprüft.');

import Plugin from 'src/plugin-system/plugin.class';
export default class NotificationCenterPlugin extends Plugin {
    init() { this.button = this.el.querySelector('button'); this.panel = this.el.querySelector('section'); this.list = this.el.querySelector('ul'); this.count = this.el.querySelector('.mt-notification-count'); this.button.addEventListener('click', () => this.toggle()); fetch('/store-api/mgd-notification-center', { credentials: 'same-origin' }).then((r) => r.ok ? r.json() : { items: [] }).then((data) => this.render(data.items || [])); }
    render(items) { const unread = items.filter((item) => !item.readAt).length; this.count.textContent = unread; this.count.hidden = unread === 0; items.forEach((item) => { const li = document.createElement('li'); li.textContent = item.title; this.list.append(li); }); }
    toggle() { const open = this.button.getAttribute('aria-expanded') !== 'true'; this.button.setAttribute('aria-expanded', String(open)); this.panel.hidden = !open; }
}

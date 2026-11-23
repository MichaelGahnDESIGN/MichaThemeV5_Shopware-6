// Reiter-Navigation der Seiten (echte Links, aktuelle Seite per aria-current)
(function () {
    'use strict';

    if (typeof Shopware === 'undefined') {
        return;
    }

    Shopware.Component.register('mt-sw-nav', {
        template: `
<nav class="mt-sw-nav" :aria-label="$tc('michatheme-v5.nav.label')">
    <ul>
        <li v-for="item in items" :key="item.name">
            <router-link :to="{ name: item.name }">{{ $tc(item.label) }}</router-link>
        </li>
    </ul>
</nav>`,

        data: function () {
            return {
                items: [
                    { name: 'michatheme.v5.settings', label: 'michatheme-v5.nav.settings' },
                    { name: 'michatheme.v5.license', label: 'michatheme-v5.nav.license' },
                    // alte Plugin-Empfehlungen nicht mehr verlinkt, Updates + Weitere Plugins = Baukasten-Seite
                    { name: 'mgd.kit.michatheme.v5.shopware.index', label: 'michatheme-v5.update.title' },
                    { name: 'michatheme.v5.info', label: 'michatheme-v5.nav.info' }
                ]
            };
        }
    });
})();

// Reiter-Navigation der vier Seiten (echte Links, aktuelle Seite per aria-current)
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
                    { name: 'michatheme.v5.catalog', label: 'michatheme-v5.nav.catalog' },
                    { name: 'michatheme.v5.info', label: 'michatheme-v5.nav.info' }
                ]
            };
        }
    });
})();

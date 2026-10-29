// Modul anmelden: Menüpunkt unter Einstellungen > Erweiterungen, vier Seiten, Rechte
(function () {
    'use strict';

    if (typeof Shopware === 'undefined') {
        return;
    }

    var meta = { parentPath: 'sw.settings.index.plugins', privilege: 'michatheme_v5.viewer' };

    Shopware.Module.register('michatheme-v5', {
        type: 'plugin',
        name: 'michatheme-v5',
        title: 'michatheme-v5.menuTitle',
        description: 'michatheme-v5.description',
        color: '#c8161a',
        icon: 'regular-cog',

        routes: {
            settings: { component: 'mt-sw-settings', path: 'settings', meta: meta },
            license: { component: 'mt-sw-license', path: 'license', meta: meta },
            catalog: { component: 'mt-sw-catalog', path: 'catalog', meta: meta },
            info: { component: 'mt-sw-info', path: 'info', meta: meta }
        },

        // Einstellungen > Erweiterungen
        settingsItem: [{
            name: 'michatheme-v5',
            to: 'michatheme.v5.settings',
            label: 'michatheme-v5.menuTitle',
            group: 'plugins',
            icon: 'regular-cog',
            privilege: 'michatheme_v5.viewer'
        }]
    });
})();

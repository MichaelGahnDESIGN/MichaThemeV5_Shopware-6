// Rechte-Gruppe "MichaThemeV5" in der Rollenverwaltung (Einstellungen, Benutzer & Berechtigungen)
(function () {
    'use strict';

    if (typeof Shopware === 'undefined' || !Shopware.Service || !Shopware.Service('privileges')) {
        return;
    }

    Shopware.Service('privileges').addPrivilegeMappingEntry({
        category: 'additional_permissions',
        parent: null,
        key: 'michatheme_v5',
        roles: {
            viewer: {
                privileges: ['theme:read', 'theme_sales_channel:read', 'sales_channel:read', 'sales_channel_domain:read', 'media:read', 'system_config:read'],
                dependencies: []
            },
            editor: {
                privileges: ['theme:update', 'system_config:update', 'system_config:create'],
                dependencies: ['michatheme_v5.viewer']
            }
        }
    });
})();

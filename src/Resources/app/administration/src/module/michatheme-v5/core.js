// MichaThemeV5 Admin - gemeinsame Helfer (läuft nur im Shopware-Admin)
(function () {
    'use strict';

    if (typeof Shopware === 'undefined') {
        return;
    }

    var NS = window.MichaThemeV5Admin = window.MichaThemeV5Admin || {};

    // POST an die Admin-API, Token wie bei den Shopware-Aktionen. Fehler kommen als { error } zurück, nie als Wurf
    NS.post = function (loginService, path, body) {
        var client = Shopware.Application.getContainer('init').httpClient;

        return client.post('/_action/micha-theme-v5/' + path, body || {}, {
            headers: { Authorization: 'Bearer ' + loginService.getToken(), 'Content-Type': 'application/json' }
        }).then(function (response) {
            return response && response.data ? response.data : {};
        }).catch(function (error) {
            var data = error && error.response && error.response.data ? error.response.data : {};
            return Object.assign({}, typeof data === 'object' ? data : {}, { error: data.error || 'failed', httpStatus: error && error.response ? error.response.status : 0 });
        });
    };

    // Sprache für Optionstexte (Schema de/en)
    NS.lang = function () {
        var l = '';
        try {
            l = String(Shopware.State.get('session').currentLocale || '');
        } catch (e) {
            l = '';
        }

        return l.indexOf('en') === 0 ? 'en' : 'de';
    };

    // Datum aus dem Lizenzserver (ISO) lokal anzeigen
    NS.date = function (iso) {
        var d = new Date(iso);
        if (isNaN(d.getTime())) {
            return '';
        }
        var locale = 'de-DE';
        try {
            locale = Shopware.State.get('session').currentLocale || locale;
        } catch (e) {
            locale = 'de-DE';
        }

        return d.toLocaleDateString(locale);
    };

    // Rechte: ohne ACL-Dienst (z. B. Test) gilt erlaubt, der Server prüft sowieso
    NS.can = function (acl, privilege) {
        try {
            return acl && typeof acl.can === 'function' ? !!acl.can(privilege) : true;
        } catch (e) {
            return true;
        }
    };

    // Übersetzung mit Rückfall (z. B. neue Farbnamen)
    NS.tr = function (vm, key, fallback) {
        try {
            return typeof vm.$te === 'function' && vm.$te(key) ? vm.$tc(key) : fallback;
        } catch (e) {
            return fallback;
        }
    };
})();

// Texte de-DE und en-GB (Schlüssel gleich, Test prüft das)
import deDE from './snippet/de-DE.json';
import enGB from './snippet/en-GB.json';

(function () {
    'use strict';

    if (typeof Shopware === 'undefined') {
        return;
    }

    Shopware.Locale.extend('de-DE', deDE);
    Shopware.Locale.extend('en-GB', enGB);
})();

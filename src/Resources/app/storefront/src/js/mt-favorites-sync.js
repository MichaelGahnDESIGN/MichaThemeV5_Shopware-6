// Favoriten Herzen nach Ajax (Filter, Sortierung) neu abgleichen > mt-theme.js hört auf mt:favs-sync
(() => {
    'use strict';

    const start = () => {
        const listing = document.querySelector('.cms-element-product-listing-wrapper');
        if (!listing || typeof MutationObserver === 'undefined') return;
        let queued = false;
        new MutationObserver(() => {
            if (queued) return;
            queued = true;
            // 1x pro Frame, Herz-Attribute lösen kein childList aus
            window.requestAnimationFrame(() => {
                queued = false;
                document.dispatchEvent(new Event('mt:favs-sync'));
            });
        }).observe(listing, { childList: true, subtree: true });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})();

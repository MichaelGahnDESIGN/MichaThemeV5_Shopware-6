// Seite "Plugin-Empfehlungen": Daten vom eigenen Controller (Feed von theme.michael-gahn.de, Cache, leise bei Fehlern)
(function () {
    'use strict';

    if (typeof Shopware === 'undefined') {
        return;
    }

    var NS = window.MichaThemeV5Admin;
    // Links und Bilder nur von diesen Adressen (zweite Sperre, der Server prüft auch)
    var LINK_PREFIXES = ['https://theme.michael-gahn.de/', 'https://github.com/MichaelGahnDESIGN/'];
    var IMAGE_PREFIX = 'https://theme.michael-gahn.de/';

    Shopware.Component.register('mt-sw-catalog', {
        template: `
<sw-page class="mt-sw-page">
    <template #smart-bar-header><h2>{{ $tc('michatheme-v5.menuTitle') }} · {{ $tc('michatheme-v5.catalog.title') }}</h2></template>
    <template #smart-bar-actions>
        <sw-button :disabled="loading" @click="load(true)">{{ $tc('michatheme-v5.catalog.refresh') }}</sw-button>
    </template>
    <template #content>
        <sw-card-view>
            <div class="mt-sw-root">
                <mt-sw-nav></mt-sw-nav>
                <sw-card :title="$tc('michatheme-v5.catalog.title')" position-identifier="michatheme-v5-catalog">
                    <p>{{ $tc('michatheme-v5.catalog.intro') }}</p>
                    <p v-if="loading" role="status">{{ $tc('michatheme-v5.catalog.loading') }}</p>
                    <p v-else-if="notice" class="mt-sw-note" :class="'mt-sw-note--' + notice.kind" role="status">{{ notice.text }}</p>
                    <template v-if="!loading">
                        <p v-if="items.length === 0 && !notice" class="mt-sw-note mt-sw-note--info">{{ $tc('michatheme-v5.catalog.empty') }}</p>
                        <div v-if="items.length" class="mt-sw-cat">
                            <article v-for="item in items" :key="item.id" class="mt-sw-cat__item" :style="accentStyle(item)">
                                <img v-if="isImage(item.image_url)" class="mt-sw-cat__image" :src="item.image_url" :alt="item.image_alt || ''" loading="lazy" referrerpolicy="no-referrer">
                                <div class="mt-sw-cat__head">
                                    <img v-if="isImage(item.icon_url)" class="mt-sw-cat__icon" :src="item.icon_url" alt="" width="36" height="36" loading="lazy" referrerpolicy="no-referrer">
                                    <span v-else class="mt-sw-cat__icon mt-sw-cat__icon--fallback" aria-hidden="true">{{ item.name.charAt(0) }}</span>
                                    <h3>{{ item.name }}</h3>
                                </div>
                                <ul class="mt-sw-cat__badges">
                                    <li v-if="item.recommended" class="mt-sw-tag">{{ $tc('michatheme-v5.catalog.recommended') }}</li>
                                    <li class="mt-sw-tag">{{ item.tier === 'free' ? $tc('michatheme-v5.catalog.free') : $tc('michatheme-v5.catalog.paid') }}</li>
                                    <li v-if="item.status === 'announced'" class="mt-sw-tag">{{ $tc('michatheme-v5.catalog.announced') }}</li>
                                    <li v-if="item.version" class="mt-sw-tag">{{ $tc('michatheme-v5.catalog.version') }} {{ item.version }}</li>
                                </ul>
                                <p class="mt-sw-cat__text">{{ item.description }}</p>
                                <p class="mt-sw-cat__links">
                                    <a v-if="isLink(item.download_url)" :href="item.download_url" target="_blank" rel="noopener noreferrer">{{ $tc('michatheme-v5.catalog.download') }}<span class="mt-sw-sr"> {{ $tc('michatheme-v5.common.newTab') }}</span></a>
                                    <a v-if="isLink(item.details_url)" :href="item.details_url" target="_blank" rel="noopener noreferrer">{{ $tc('michatheme-v5.catalog.details') }}<span class="mt-sw-sr"> {{ $tc('michatheme-v5.common.newTab') }}</span></a>
                                    <a v-if="isLink(item.repository_url)" :href="item.repository_url" target="_blank" rel="noopener noreferrer">{{ $tc('michatheme-v5.catalog.source') }}<span class="mt-sw-sr"> {{ $tc('michatheme-v5.common.newTab') }}</span></a>
                                </p>
                            </article>
                        </div>
                        <p v-if="updatedText" class="mt-sw-help">{{ $tc('michatheme-v5.catalog.updatedAt') }} {{ updatedText }}</p>
                    </template>
                    <p class="mt-sw-help">{{ $tc('michatheme-v5.catalog.privacy') }}</p>
                </sw-card>
            </div>
        </sw-card-view>
    </template>
</sw-page>`,

        inject: ['loginService'],

        data: function () {
            return { loading: true, items: [], error: null, stale: false, checkedAt: 0 };
        },

        computed: {
            notice: function () {
                if (this.error === 'throttled') { return { kind: 'info', text: this.$tc('michatheme-v5.catalog.throttled') }; }
                if (this.error && this.items.length && this.stale) { return { kind: 'bad', text: this.$tc('michatheme-v5.catalog.stale') }; }
                if (this.error && !this.items.length) { return { kind: 'info', text: this.$tc('michatheme-v5.catalog.unavailable') }; }

                return null;
            },
            updatedText: function () {
                if (!this.checkedAt) { return ''; }
                var locale = 'de-DE';
                try { locale = Shopware.State.get('session').currentLocale || locale; } catch (e) { locale = 'de-DE'; }

                return new Date(this.checkedAt * 1000).toLocaleString(locale);
            }
        },

        created: function () {
            NS.addStyle();
            this.load(false);
        },

        methods: {
            load: function (refresh) {
                var vm = this;
                vm.loading = true;

                return NS.post(vm.loginService, 'catalog', { refresh: refresh === true }).then(function (d) {
                    vm.items = Array.isArray(d.items) ? d.items : [];
                    vm.error = d.error ? String(d.error) : null;
                    vm.stale = d.stale === true;
                    vm.checkedAt = typeof d.checked_at === 'number' ? d.checked_at : 0;
                    vm.loading = false;
                });
            },
            isLink: function (u) {
                return typeof u === 'string' && LINK_PREFIXES.some(function (p) { return u.indexOf(p) === 0; });
            },
            isImage: function (u) {
                return typeof u === 'string' && u.indexOf(IMAGE_PREFIX) === 0;
            },
            // Farbe nur als Rand und nur wenn genau #rrggbb
            accentStyle: function (item) {
                return typeof item.accent === 'string' && /^#[0-9a-f]{6}$/.test(item.accent) ? { '--mt-sw-accent': item.accent } : null;
            }
        }
    });
})();

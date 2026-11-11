// Seite "Info": Versionen, Zuweisung des Themes, Changelog (reiner Text)
(function () {
    'use strict';

    if (typeof Shopware === 'undefined') {
        return;
    }

    var NS = window.MichaThemeV5Admin;

    Shopware.Component.register('mt-sw-info', {
        template: `
<sw-page class="mt-sw-page">
    <template #smart-bar-header><h2>{{ $tc('michatheme-v5.menuTitle') }} · {{ $tc('michatheme-v5.info.title') }}</h2></template>
    <template #content>
        <sw-card-view>
            <div class="mt-sw-root">
                <mt-sw-nav></mt-sw-nav>
                <p v-if="loading" role="status">{{ $tc('michatheme-v5.common.loading') }}</p>
                <p v-else-if="failed" class="mt-sw-note mt-sw-note--bad" role="alert">{{ $tc('michatheme-v5.common.loadFailed') }}</p>
                <template v-else>
                    <sw-card :title="$tc('michatheme-v5.info.versions')" position-identifier="michatheme-v5-info-versions">
                        <dl class="mt-sw-dl">
                            <dt>{{ $tc('michatheme-v5.info.plugin') }}</dt><dd>{{ info.pluginVersion || '-' }}</dd>
                            <dt>{{ $tc('michatheme-v5.info.schema') }}</dt><dd>{{ info.schemaVersion || '-' }}</dd>
                            <dt>{{ $tc('michatheme-v5.info.shopware') }}</dt><dd>{{ info.shopwareVersion || '-' }}</dd>
                            <dt>{{ $tc('michatheme-v5.info.php') }}</dt><dd>{{ info.phpVersion || '-' }}</dd>
                        </dl>
                    </sw-card>
                    <sw-card :title="$tc('michatheme-v5.update.title')" position-identifier="michatheme-v5-info-updates">
                        <p v-if="hintNewer" class="mt-sw-note mt-sw-note--info" role="status">{{ $tc('michatheme-v5.update.hint', 0, { version: info.updateHint }) }}</p>
                        <p>{{ $tc('michatheme-v5.update.intro') }}</p>
                        <p v-if="upd.text" class="mt-sw-note" :class="'mt-sw-note--' + upd.kind" role="status">{{ upd.text }}</p>
                        <p>
                            <button type="button" class="mt-sw-btn" :disabled="upd.busy" @click="checkUpdate">{{ $tc('michatheme-v5.update.check') }}</button>
                            <button v-if="upd.latest" type="button" class="mt-sw-btn mt-sw-btn--primary" :disabled="upd.busy || !canUpdate" @click="installUpdate">{{ $tc('michatheme-v5.update.install', 0, { version: upd.latest }) }}</button>
                        </p>
                        <p v-if="upd.latest && !canUpdate" class="mt-sw-note mt-sw-note--info">{{ $tc('michatheme-v5.common.readOnly') }}</p>
                    </sw-card>
                    <sw-card :title="$tc('michatheme-v5.info.channels')" position-identifier="michatheme-v5-info-channels">
                        <ul v-if="info.channels && info.channels.length"><li v-for="c in info.channels" :key="c">{{ c }}</li></ul>
                        <p v-else>{{ $tc('michatheme-v5.info.channelsNone') }}</p>
                        <p><router-link :to="{ name: 'sw.theme.manager.index' }">{{ $tc('michatheme-v5.info.channelsOpen') }}</router-link></p>
                    </sw-card>
                    <sw-card :title="$tc('michatheme-v5.info.changelog')" position-identifier="michatheme-v5-info-changelog">
                        <pre v-if="info.changelog" class="mt-sw-pre" tabindex="0">{{ info.changelog }}</pre>
                        <p v-else>{{ $tc('michatheme-v5.info.changelogNone') }}</p>
                    </sw-card>
                    <sw-card :title="$tc('michatheme-v5.info.links')" position-identifier="michatheme-v5-info-links">
                        <ul class="mt-sw-links">
                            <li v-for="l in links" :key="l.key"><a :href="l.url" target="_blank" rel="noopener noreferrer">{{ l.text }}<span class="mt-sw-sr"> {{ $tc('michatheme-v5.common.newTab') }}</span></a></li>
                        </ul>
                    </sw-card>
                </template>
            </div>
        </sw-card-view>
    </template>
</sw-page>`,

        inject: ['loginService', 'acl'],

        data: function () {
            return { loading: true, failed: false, info: {}, upd: { busy: false, latest: '', text: '', kind: 'info' } };
        },

        computed: {
            canUpdate: function () { return NS.can(this.acl, 'system_config.editor'); },
            // Hinweis nur, wenn die gemerkte Version wirklich neuer ist
            hintNewer: function () {
                var a = String(this.info.updateHint || '').split('.').map(Number);
                var b = String(this.info.pluginVersion || '').split('.').map(Number);
                if (a.length !== 3 || b.length !== 3) { return false; }
                for (var i = 0; i < 3; i++) { if (a[i] !== b[i]) { return a[i] > b[i]; } }
                return false;
            },
            links: function () {
                var l = this.info.links || {};
                var out = [];
                [['shop', 'michatheme-v5.info.linkShop'], ['support', 'michatheme-v5.info.linkSupport'], ['source', 'michatheme-v5.info.linkSource']].forEach(function (p) {
                    if (typeof l[p[0]] === 'string' && l[p[0]].indexOf('https://') === 0) { out.push({ key: p[0], url: l[p[0]], text: p[1] }); }
                });

                return out.map(function (x) { return { key: x.key, url: x.url, text: this.$tc(x.text) }; }, this);
            }
        },

        methods: {
            // Nach Updates suchen: nur nachsehen
            checkUpdate: function () {
                var vm = this;
                vm.upd = { busy: true, latest: '', text: vm.$tc('michatheme-v5.common.loading'), kind: 'info' };
                NS.post(vm.loginService, 'update/status', {}).then(function (d) {
                    if (d.error) {
                        vm.upd = { busy: false, latest: '', text: vm.$tc('michatheme-v5.update.failed'), kind: 'bad' };
                    } else if (d.updateAvailable && typeof d.latestVersion === 'string') {
                        vm.upd = { busy: false, latest: d.latestVersion, text: vm.$tc('michatheme-v5.update.available', 0, { version: d.latestVersion }), kind: 'info' };
                    } else {
                        vm.upd = { busy: false, latest: '', text: vm.$tc('michatheme-v5.update.none'), kind: 'good' };
                    }
                });
            },
            // Update einspielen, nur nach Rückfrage
            installUpdate: function () {
                var vm = this;
                if (!window.confirm(vm.$tc('michatheme-v5.update.confirm', 0, { version: vm.upd.latest }))) { return; }
                vm.upd = Object.assign({}, vm.upd, { busy: true, text: vm.$tc('michatheme-v5.update.installing'), kind: 'info' });
                NS.post(vm.loginService, 'update/install', {}).then(function (d) {
                    if (d.error || !d.prepared) {
                        vm.upd = { busy: false, latest: vm.upd.latest, text: vm.$tc('michatheme-v5.update.installFailed'), kind: 'bad' };
                    } else {
                        vm.upd = { busy: false, latest: '', text: vm.$tc('michatheme-v5.update.installed', 0, { version: d.latestVersion }), kind: 'good' };
                    }
                });
            }
        },

        created: function () {
            var vm = this;
            NS.addStyle();
            NS.post(vm.loginService, 'info', {}).then(function (d) {
                vm.failed = !!d.error;
                vm.info = d;
                vm.loading = false;
            });
        }
    });
})();

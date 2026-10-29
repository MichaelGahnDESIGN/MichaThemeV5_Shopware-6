// Seite "Lizenzen": Status, Code einfügen (nie im Klartext zurück), Link zum Kauf
(function () {
    'use strict';

    if (typeof Shopware === 'undefined') {
        return;
    }

    var NS = window.MichaThemeV5Admin;
    var KNOWN = ['no_token', 'unreachable', 'token_expired', 'token_revoked', 'domain_mismatch', 'signature_invalid', 'token_malformed', 'unknown_tier'];
    var TIERS = { plus: 'Plus', pro: 'Pro', agency: 'Agentur', free: 'Free' };

    Shopware.Component.register('mt-sw-license', {
        template: `
<sw-page class="mt-sw-page">
    <template #smart-bar-header><h2>{{ $tc('michatheme-v5.menuTitle') }} · {{ $tc('michatheme-v5.license.title') }}</h2></template>
    <template #content>
        <sw-card-view>
            <div class="mt-sw-root">
                <mt-sw-nav></mt-sw-nav>
                <p v-if="loading" role="status">{{ $tc('michatheme-v5.common.loading') }}</p>
                <p v-else-if="!available" class="mt-sw-note mt-sw-note--bad" role="alert">{{ failed ? $tc('michatheme-v5.common.loadFailed') : $tc('michatheme-v5.common.noTheme') }}</p>
                <template v-else>
                    <p v-if="!canEdit" class="mt-sw-note mt-sw-note--info">{{ $tc('michatheme-v5.common.readOnly') }}</p>
                    <p v-if="message.text" class="mt-sw-note" :class="'mt-sw-note--' + message.kind" role="status">{{ message.text }}</p>

                    <sw-card :title="$tc('michatheme-v5.license.statusTitle')" position-identifier="michatheme-v5-license-status">
                        <div class="mt-sw-status">
                            <h3>{{ statusTitle }}</h3>
                            <span class="mt-sw-tag">{{ $tc('michatheme-v5.license.tier', 0, { tier: tierName }) }}</span>
                        </div>
                        <p>{{ reasonText }}</p>
                        <p v-if="state.valid && state.periodEnd">{{ $tc('michatheme-v5.license.validUntil', 0, { date: dateText }) }}</p>
                        <p v-if="state.valid && state.modules.length">{{ $tc('michatheme-v5.license.modules', 0, { list: state.modules.join(', ') }) }}</p>
                        <p v-if="state.valid && state.source === 'grace'" class="mt-sw-help">{{ $tc('michatheme-v5.license.grace') }}</p>
                        <p v-if="state.domain" class="mt-sw-help">{{ $tc('michatheme-v5.license.domain', 0, { domain: state.domain }) }}</p>
                        <button type="button" class="mt-sw-btn" :disabled="busy || !state.hasToken" @click="recheck">{{ $tc('michatheme-v5.license.recheck') }}</button>
                    </sw-card>

                    <sw-card :title="$tc('michatheme-v5.license.codeTitle')" position-identifier="michatheme-v5-license-code">
                        <p>{{ state.hasToken ? $tc('michatheme-v5.license.stored', 0, { masked: state.masked }) : $tc('michatheme-v5.license.storedNone') }}</p>
                        <div class="mt-sw-field">
                            <label for="mt-sw-license-code">{{ $tc('michatheme-v5.license.codeLabel') }}</label>
                            <input id="mt-sw-license-code" class="mt-sw-input" :type="reveal ? 'text' : 'password'" v-model="code" autocomplete="off" spellcheck="false" maxlength="4096"
                                   :disabled="busy || !canEdit" aria-describedby="mt-sw-license-help" :aria-invalid="formatError ? 'true' : 'false'">
                            <p id="mt-sw-license-help" class="mt-sw-help">{{ $tc('michatheme-v5.license.codeHelp') }}</p>
                            <label class="mt-sw-check"><input type="checkbox" v-model="reveal"><span>{{ $tc('michatheme-v5.license.show') }}</span></label>
                            <p v-if="formatError" class="mt-sw-note mt-sw-note--bad" role="alert">{{ $tc('michatheme-v5.license.errorFormat') }}</p>
                        </div>
                        <div class="mt-sw-bar">
                            <button type="button" class="mt-sw-btn mt-sw-btn--primary" :disabled="busy || !canEdit || !code.trim()" @click="save">{{ $tc('michatheme-v5.license.saveCheck') }}</button>
                            <button v-if="state.hasToken" type="button" class="mt-sw-btn" :disabled="busy || !canEdit" @click="remove">{{ $tc('michatheme-v5.license.remove') }}</button>
                        </div>
                        <p class="mt-sw-help">{{ $tc('michatheme-v5.license.privacy') }}</p>
                    </sw-card>

                    <sw-card :title="$tc('michatheme-v5.license.buyTitle')" position-identifier="michatheme-v5-license-buy">
                        <p>{{ $tc('michatheme-v5.license.buyText') }}</p>
                        <p><a :href="shopUrl" target="_blank" rel="noopener noreferrer">{{ $tc('michatheme-v5.license.buyLink') }}<span class="mt-sw-sr"> {{ $tc('michatheme-v5.common.newTab') }}</span></a></p>
                    </sw-card>
                </template>
            </div>
        </sw-card-view>
    </template>
</sw-page>`,

        inject: ['loginService', 'acl'],

        data: function () {
            return {
                loading: true, available: false, failed: false, busy: false,
                themeId: '', code: '', reveal: false, formatError: false,
                message: { kind: 'info', text: '' },
                state: { hasToken: false, masked: '', valid: false, tier: 'free', reason: 'no_token', source: 'none', modules: [], periodEnd: null, domain: '' }
            };
        },

        computed: {
            canEdit: function () { return NS.can(this.acl, 'michatheme_v5.editor'); },
            shopUrl: function () { return 'https://theme.michael-gahn.de'; },
            tierName: function () { return TIERS[this.state.tier] || 'Free'; },
            statusTitle: function () {
                if (this.state.valid) { return this.$tc('michatheme-v5.license.status.active'); }

                return this.$tc(this.state.reason === 'no_token' ? 'michatheme-v5.license.status.free' : 'michatheme-v5.license.status.problem');
            },
            reasonText: function () {
                if (this.state.valid) { return ''; }
                var r = KNOWN.indexOf(this.state.reason) >= 0 ? this.state.reason : 'other';

                return this.$tc('michatheme-v5.license.reason.' + r);
            },
            dateText: function () { return NS.date(this.state.periodEnd); }
        },

        created: function () {
            NS.addStyle();
            this.apply(this.call('license/status'));
        },

        methods: {
            say: function (kind, text) { this.message = { kind: kind, text: text }; },

            call: function (path, extra) {
                return NS.post(this.loginService, path, Object.assign({ themeId: this.themeId }, extra || {}));
            },

            apply: function (promise) {
                var vm = this;

                return promise.then(function (d) {
                    // Nur beim ersten Laden entscheidet ein Fehler über die ganze Seite, danach nur über eine Meldung
                    if (vm.loading) {
                        vm.failed = d.error === 'failed' || d.httpStatus >= 500;
                        vm.available = d.available === true && !vm.failed;
                    }
                    vm.loading = false;
                    if (d.themeId) { vm.themeId = d.themeId; }
                    if (typeof d.hasToken === 'boolean') {
                        vm.state = {
                            hasToken: d.hasToken, masked: d.masked || '', valid: !!d.valid, tier: d.tier || 'free', reason: d.reason || 'no_token',
                            source: d.source || 'none', modules: d.modules || [], periodEnd: d.periodEnd || null, domain: d.domain || ''
                        };
                    }

                    return d;
                });
            },

            save: function () {
                var vm = this;
                vm.busy = true;
                vm.formatError = false;
                vm.say('info', vm.$tc('michatheme-v5.license.saving'));

                return vm.apply(vm.call('license/save', { token: vm.code.trim() })).then(function (d) {
                    vm.busy = false;
                    if (d.saved === true) {
                        vm.code = '';
                        vm.say('ok', vm.$tc('michatheme-v5.license.saved'));
                    } else if (d.error === 'format') {
                        vm.formatError = true;
                        vm.say('bad', '');
                    } else {
                        vm.say('bad', vm.$tc('michatheme-v5.license.errorFailed'));
                    }
                });
            },

            remove: function () {
                var vm = this;
                if (!window.confirm(vm.$tc('michatheme-v5.license.removeConfirm'))) { return Promise.resolve(); }
                vm.busy = true;
                vm.say('info', vm.$tc('michatheme-v5.license.saving'));

                return vm.apply(vm.call('license/remove')).then(function (d) {
                    vm.busy = false;
                    vm.say(d.removed ? 'ok' : 'bad', d.removed ? vm.$tc('michatheme-v5.license.removed') : vm.$tc('michatheme-v5.license.errorFailed'));
                });
            },

            recheck: function () {
                var vm = this;
                vm.busy = true;

                return vm.apply(vm.call('license/check')).then(function (d) {
                    vm.busy = false;
                    vm.say(d.throttled ? 'info' : 'ok', d.throttled ? vm.$tc('michatheme-v5.license.throttled') : vm.$tc('michatheme-v5.license.rechecked'));
                });
            }
        }
    });
})();

// Seite "Einstellungen": Presets, Suche/Filter, Felder je Gruppe, eigene Farben mit Prüfung. Speichern über die eigene Admin-API.
(function () {
    'use strict';

    if (typeof Shopware === 'undefined') {
        return;
    }

    var NS = window.MichaThemeV5Admin;
    var COLOR_GROUP = 'colors_custom';
    var MODES = ['light', 'dark'];

    Shopware.Component.register('mt-sw-settings', {
        template: `
<sw-page class="mt-sw-page">
    <template #smart-bar-header><h2>{{ $tc('michatheme-v5.menuTitle') }} · {{ $tc('michatheme-v5.settings.title') }}</h2></template>
    <template #smart-bar-actions>
        <span v-if="dirtyCount" class="mt-sw-muted" role="status">{{ $tc('michatheme-v5.settings.unsaved', dirtyCount, { count: dirtyCount }) }}</span>
        <sw-button variant="primary" :disabled="!dirtyCount || saving || !canEdit" :is-loading="saving" @click="save">{{ $tc('michatheme-v5.settings.save') }}</sw-button>
    </template>
    <template #content>
        <sw-card-view>
            <div class="mt-sw-root">
                <mt-sw-nav></mt-sw-nav>
                <p v-if="loading" role="status">{{ $tc('michatheme-v5.common.loading') }}</p>
                <p v-else-if="!available" class="mt-sw-note mt-sw-note--bad" role="alert">{{ error ? $tc('michatheme-v5.common.loadFailed') : $tc('michatheme-v5.common.noTheme') }}</p>
                <template v-else>
                    <p v-if="!canEdit" class="mt-sw-note mt-sw-note--info">{{ $tc('michatheme-v5.common.readOnly') }}</p>
                    <p v-if="status.text" class="mt-sw-note" :class="'mt-sw-note--' + status.kind" role="status">{{ status.text }}</p>
                    <input id="mt-sw-palette-field" type="hidden" :value="paletteJson" @change="onPaletteChange($event.target.value)">

                    <sw-card :title="$tc('michatheme-v5.presets.title')" position-identifier="michatheme-v5-presets">
                        <p>{{ $tc('michatheme-v5.presets.intro') }}</p>
                        <div v-if="themes.length > 1" class="mt-sw-field">
                            <label for="mt-sw-theme">{{ $tc('michatheme-v5.common.themeSelect') }}</label>
                            <select id="mt-sw-theme" class="mt-sw-select" :value="themeId" @change="switchTheme($event.target.value)">
                                <option v-for="t in themes" :key="t.id" :value="t.id" :selected="t.id === themeId">{{ t.name }}{{ t.child ? ' (' + $tc('michatheme-v5.common.themeChild') + ')' : '' }}</option>
                            </select>
                        </div>
                        <ul class="mt-sw-presets">
                            <li v-for="p in presets" :key="p.id" class="mt-sw-preset">
                                <h3>{{ presetLabel(p) }}</h3>
                                <p>{{ presetHelp(p) }}</p>
                                <p v-if="p.unavailable && p.unavailable.length" class="mt-sw-help">{{ $tc('michatheme-v5.presets.missing', 0, { list: p.unavailable.join(', ') }) }}</p>
                                <button type="button" class="mt-sw-btn" :disabled="!canEdit" :aria-label="$tc('michatheme-v5.presets.applyNamed', 0, { name: presetLabel(p) })" @click="applyPreset(p)">{{ $tc('michatheme-v5.presets.apply') }}</button>
                            </li>
                        </ul>
                    </sw-card>

                    <sw-card :title="$tc('michatheme-v5.filter.title')" position-identifier="michatheme-v5-filter">
                        <div class="mt-sw-bar" role="search">
                            <div class="mt-sw-field" style="flex:1 1 280px">
                                <label for="mt-sw-search">{{ $tc('michatheme-v5.filter.search') }}</label>
                                <input id="mt-sw-search" class="mt-sw-input" type="search" v-model="query" :placeholder="$tc('michatheme-v5.filter.placeholder')" autocomplete="off">
                            </div>
                            <fieldset class="mt-sw-chips" style="border:0;margin:0;padding:0">
                                <legend class="mt-sw-sr">{{ $tc('michatheme-v5.filter.mode') }}</legend>
                                <span class="mt-sw-seg">
                                    <label><input type="radio" name="mt-sw-mode" value="simple" v-model="mode"><span>{{ $tc('michatheme-v5.filter.simple') }}</span></label>
                                    <label><input type="radio" name="mt-sw-mode" value="expert" v-model="mode"><span>{{ $tc('michatheme-v5.filter.expert') }}</span></label>
                                </span>
                                <label class="mt-sw-check"><input type="checkbox" v-model="onlyChanged"><span>{{ $tc('michatheme-v5.filter.onlyChanged') }}</span></label>
                            </fieldset>
                        </div>
                        <p class="mt-sw-help" aria-live="polite">{{ resultText }}</p>
                        <p v-if="mode === 'simple'" class="mt-sw-help">{{ $tc('michatheme-v5.filter.simpleHint') }}</p>
                        <p class="mt-sw-help">{{ $tc('michatheme-v5.settings.intro') }}</p>
                    </sw-card>

                    <sw-card v-for="g in cards" :key="g.id" :title="g.label" :position-identifier="'michatheme-v5-group-' + g.id">
                        <template v-if="g.id === colorGroupId">
                            <p>{{ $tc('michatheme-v5.colors.intro') }}</p>
                            <table class="mt-sw-table">
                                <thead>
                                    <tr><th scope="col">{{ $tc('michatheme-v5.colors.color') }}</th><th scope="col">{{ $tc('michatheme-v5.colors.light') }}</th><th scope="col">{{ $tc('michatheme-v5.colors.dark') }}</th></tr>
                                </thead>
                                <tbody>
                                    <tr v-for="row in g.rows" :key="row.token">
                                        <th scope="row">{{ row.name }}</th>
                                        <td v-for="m in modes" :key="m">
                                            <mt-sw-color v-if="row[m]" :value="String(values[row[m].id] || '')" :label="row.name + ' (' + modeName(m) + ')'" :disabled="!canEdit" @update="setValue(row[m].id, $event)"></mt-sw-color>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <p class="mt-sw-help">{{ $tc('michatheme-v5.colors.paletteHint') }}</p>
                            <h3>{{ $tc('michatheme-v5.colors.warnings') }}</h3>
                            <p class="mt-sw-help">{{ $tc('michatheme-v5.colors.warningsHint') }}</p>
                            <ul class="mt-sw-warn" aria-live="polite">
                                <li v-for="w in warnings" :key="w.key" :class="w.ok ? 'mt-sw-good' : 'mt-sw-bad'">{{ w.ok ? '✔ ' : '✖ ' }}{{ w.text }}</li>
                                <li v-if="!warnings.length" class="mt-sw-muted">{{ $tc('michatheme-v5.colors.warnNone') }}</li>
                            </ul>
                            <div class="mt-sw-previews" aria-hidden="true">
                                <div v-for="m in modes" :key="m" class="mt-sw-pvwrap">
                                    <p class="mt-sw-help">{{ $tc('michatheme-v5.colors.previewMode', 0, { mode: modeName(m) }) }}</p>
                                    <div class="mt-sw-pv" :style="{ background: previews[m].bg, borderColor: previews[m]['border-strong'] }">
                                        <div class="mt-sw-pv__card" :style="{ background: previews[m].surface, borderColor: previews[m]['border-strong'] }">
                                            <span class="mt-sw-pv__bar" :style="{ background: previews[m].text }"></span>
                                            <span class="mt-sw-pv__bar mt-sw-pv__bar--short" :style="{ background: previews[m]['text-muted'] }"></span>
                                            <span class="mt-sw-pv__btn" :style="{ background: previews[m].accent, borderColor: previews[m]['on-accent'] }"><span class="mt-sw-pv__bar mt-sw-pv__bar--btn" :style="{ background: previews[m]['on-accent'] }"></span></span>
                                            <span class="mt-sw-pv__bar mt-sw-pv__bar--link" :style="{ background: previews[m].link }"></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                        <template v-else>
                            <div class="mt-sw-grid">
                                <mt-sw-field v-for="o in g.options" :key="o.id" :option="o" :value="values[o.id]" :dirty="isDirty(o.id)" :corrected="!!corrected[o.id]" :disabled="!canEdit" @update="setValue(o.id, $event)"></mt-sw-field>
                            </div>
                            <p v-if="g.id === 'colors' && accentWarning" class="mt-sw-note" :class="accentWarning.ok ? 'mt-sw-note--ok' : 'mt-sw-note--bad'" role="status">{{ accentWarning.text }}</p>
                        </template>
                    </sw-card>
                </template>
            </div>
        </sw-card-view>
    </template>
</sw-page>`,

        inject: ['loginService', 'acl'],
        mixins: [Shopware.Mixin.getByName('notification')],

        data: function () {
            return {
                loading: true, available: false, error: false, saving: false,
                themeId: '', themes: [], schema: { groups: [], options: [], presets: [] },
                values: {}, original: {}, palette: [], corrected: {},
                query: '', mode: 'simple', onlyChanged: false,
                status: { kind: 'info', text: '' },
                colorGroupId: COLOR_GROUP, modes: MODES
            };
        },

        computed: {
            canEdit: function () { return NS.can(this.acl, 'michatheme_v5.editor'); },
            paletteJson: function () { return JSON.stringify(this.palette); },
            presets: function () { return this.schema.presets || []; },
            dirtyIds: function () {
                var vm = this;

                return Object.keys(vm.values).filter(function (id) { return vm.isDirty(id); });
            },
            dirtyCount: function () { return this.dirtyIds.length; },
            groupLabels: function () {
                var m = {};
                (this.schema.groups || []).forEach(function (g) { m[g.id] = g.label; });

                return m;
            },
            // Felder je Gruppe, nach Suche/Filter; Farbgruppe als Zeilen (ein Farbname, Hell und Dunkel)
            cards: function () {
                var vm = this;
                var logic = window.MTAdminLogic;
                var st = { query: vm.query, expert: vm.mode === 'expert', onlyChanged: vm.onlyChanged, onlyLaw: false };
                var out = [];
                (vm.schema.groups || []).forEach(function (g) {
                    var opts = (vm.schema.options || []).filter(function (o) {
                        return o.group === g.id && logic.visible({
                            mode: o.mode, law: !!o.locked_by_law, dirty: vm.isDirty(o.id),
                            search: [o.label, o.help, g.label, o.id].join(' ')
                        }, st);
                    });
                    if (!opts.length) { return; }
                    if (g.id === COLOR_GROUP) {
                        out.push({ id: g.id, label: g.label, options: opts, rows: vm.colorRows(opts) });
                    } else {
                        out.push({ id: g.id, label: g.label, options: opts });
                    }
                });

                return out;
            },
            resultCount: function () {
                return this.cards.reduce(function (n, g) { return n + g.options.length; }, 0);
            },
            resultText: function () {
                var searching = this.query.trim() !== '' || this.onlyChanged;
                if (this.resultCount === 0) { return this.$tc('michatheme-v5.filter.results', 0, { count: 0 }); }

                return searching ? this.$tc('michatheme-v5.filter.results', this.resultCount, { count: this.resultCount }) : '';
            },
            // Kontrast-Prüfung nur für Paare mit eigener Farbe (Kern: mt-admin-logic.js)
            warnings: function () {
                var vm = this;
                var out = [];
                MODES.forEach(function (m) {
                    window.MTAdminLogic.colorWarnings(vm.schema, vm.values, m).forEach(function (w, i) {
                        var ratio = String(w.ratio).replace('.', ',');
                        var name = vm.warnName(w);
                        out.push({
                            key: m + i, ok: w.ok,
                            text: vm.$tc('michatheme-v5.colors.warnMode', 0, {
                                mode: vm.modeName(m), label: name, ratio: ratio, min: String(w.min).replace('.', ','),
                                state: w.ok ? vm.$tc('michatheme-v5.colors.warnOk') : vm.$tc('michatheme-v5.colors.warnLow')
                            })
                        });
                    });
                });

                return out;
            },
            previews: function () {
                var vm = this;

                return { light: window.MTAdminLogic.effective(vm.schema, vm.values, 'light'), dark: window.MTAdminLogic.effective(vm.schema, vm.values, 'dark') };
            },
            accentWarning: function () {
                var hex = window.MTAdminLogic.sanitize({ type: 'color' }, this.values.accent_custom || '');
                if (!hex) { return null; }
                var c = window.MTColorPicker.accentTextCheck(hex.slice(0, 7), this.previews.light.bg, this.previews.dark.bg);
                var f = function (n) { return n.toFixed(1).replace('.', ','); };

                return {
                    ok: c.ok,
                    text: this.$tc('michatheme-v5.colors.accentCheck', 0, { light: f(c.light), dark: f(c.dark), state: c.ok ? this.$tc('michatheme-v5.colors.warnOk') : this.$tc('michatheme-v5.colors.warnLow') })
                };
            }
        },

        watch: {
            mode: function (m) {
                try { window.localStorage.setItem('micha-theme-v5-mode', m); } catch (e) { /* kein Speicher */ }
            }
        },

        created: function () {
            NS.addStyle();
            try {
                var m = window.localStorage.getItem('micha-theme-v5-mode');
                this.mode = m === 'expert' ? 'expert' : 'simple';
            } catch (e) { /* kein Speicher */ }
            this.load('');
        },

        // Ungespeicherte Änderungen: vor dem Verlassen fragen
        beforeRouteLeave: function (to, from, next) {
            if (this.dirtyCount && !window.confirm(this.$tc('michatheme-v5.settings.leave'))) {
                next(false);

                return;
            }
            next();
        },

        methods: {
            modeName: function (m) { return this.$tc(m === 'light' ? 'michatheme-v5.colors.light' : 'michatheme-v5.colors.dark'); },

            presetLabel: function (p) { return NS.tr(this, 'michatheme-v5.presets.' + p.id + '.label', p.label); },
            presetHelp: function (p) { return NS.tr(this, 'michatheme-v5.presets.' + p.id + '.help', p.help); },

            warnName: function (w) {
                if (this.$i18n && String(this.$i18n.locale || '').indexOf('en') === 0 && w.fg && w.bg) {
                    return this.tokenName(w.fg) + ' / ' + this.tokenName(w.bg);
                }

                return w.label;
            },
            tokenName: function (tok) { return NS.tr(this, 'michatheme-v5.colors.token.' + tok.replace(/-/g, '_'), tok); },

            colorRows: function (opts) {
                var rows = [];
                var by = {};
                var vm = this;
                opts.forEach(function (o) {
                    if (!o.color) { return; }
                    var r = by[o.color.token];
                    if (!r) {
                        r = by[o.color.token] = { token: o.color.token, name: vm.tokenName(o.color.token) };
                        rows.push(r);
                    }
                    r[o.color.mode] = o;
                });

                return rows;
            },

            isDirty: function (id) { return JSON.stringify(this.values[id]) !== JSON.stringify(this.original[id]); },

            setValue: function (id, v) {
                this.values = Object.assign({}, this.values, { [id]: v });
                if (this.corrected[id]) { this.corrected = Object.assign({}, this.corrected, { [id]: false }); }
                this.status = { kind: 'info', text: '' };
            },

            say: function (kind, text) { this.status = { kind: kind, text: text }; },

            load: function (themeId) {
                var vm = this;
                vm.loading = true;

                return NS.post(vm.loginService, 'settings/load', { themeId: themeId, locale: NS.lang() }).then(function (d) {
                    vm.error = !!d.error;
                    vm.available = d.available === true;
                    if (vm.available) {
                        vm.schema = d.schema;
                        vm.themes = d.themes || [];
                        vm.themeId = d.themeId;
                        vm.values = Object.assign({}, d.values);
                        vm.original = Object.assign({}, d.values);
                        vm.palette = d.palette || [];
                        vm.corrected = {};
                    }
                    vm.loading = false;
                });
            },

            switchTheme: function (id) {
                if (this.dirtyCount && !window.confirm(this.$tc('michatheme-v5.settings.leave'))) {
                    this.$forceUpdate();

                    return;
                }
                this.load(id);
            },

            applyPreset: function (p) {
                var vm = this;
                var count = 0;
                var next = Object.assign({}, vm.values);
                Object.keys(p.values).forEach(function (id) {
                    if (Object.prototype.hasOwnProperty.call(next, id) && JSON.stringify(next[id]) !== JSON.stringify(p.values[id])) {
                        next[id] = p.values[id];
                        count += 1;
                    }
                });
                vm.values = next;
                var name = vm.presetLabel(p);
                vm.say('info', count ? vm.$tc('michatheme-v5.presets.applied', count, { name: name, count: count }) : vm.$tc('michatheme-v5.presets.appliedNone', 0, { name: name }));
            },

            save: function () {
                var vm = this;
                if (!vm.dirtyCount || vm.saving) { return Promise.resolve(); }
                var payload = {};
                vm.dirtyIds.forEach(function (id) { payload[id] = vm.values[id]; });
                vm.saving = true;
                vm.say('info', vm.$tc('michatheme-v5.settings.saving'));

                return NS.post(vm.loginService, 'settings/save', { themeId: vm.themeId, values: payload }).then(function (d) {
                    vm.saving = false;
                    if (d.success !== true) {
                        vm.say('bad', vm.$tc('michatheme-v5.settings.saveFailed'));
                        vm.createNotificationError({ message: vm.$tc('michatheme-v5.settings.saveFailed') });

                        return;
                    }
                    // Server-Stand übernehmen (bereinigte Werte)
                    vm.values = Object.assign({}, vm.values, d.values);
                    vm.original = Object.assign({}, vm.original, d.values);
                    var bad = {};
                    (d.corrected || []).forEach(function (id) { bad[id] = true; });
                    vm.corrected = bad;
                    var n = (d.corrected || []).length;
                    var msg = n ? vm.$tc('michatheme-v5.settings.savedCorrected', n, { count: n }) : vm.$tc('michatheme-v5.settings.saved');
                    vm.say(n ? 'bad' : 'ok', msg);
                    vm.createNotificationSuccess({ message: msg });
                });
            },

            // Palette: der Farbwähler schreibt in das versteckte Feld, wir speichern sie sofort
            onPaletteChange: function (raw) {
                var vm = this;
                var list = [];
                try { list = JSON.parse(raw || '[]'); } catch (e) { list = []; }
                if (!Array.isArray(list)) { return; }
                vm.palette = list;

                return NS.post(vm.loginService, 'palette/save', { palette: list }).then(function (d) {
                    if (d.success !== true) { vm.say('bad', vm.$tc('michatheme-v5.colors.paletteFailed')); }
                });
            }
        }
    });
})();

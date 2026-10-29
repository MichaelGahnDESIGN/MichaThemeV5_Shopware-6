// Farbfeld: Farbfeld-Vorschau + HEX + Farbwähler aus dem Kern (MTColorPicker.mount), Palette gemeinsam im ganzen Shop
(function () {
    'use strict';

    if (typeof Shopware === 'undefined') {
        return;
    }

    var uid = 0;

    Shopware.Component.register('mt-sw-color', {
        template: `
<div class="mt-sw-color">
    <span class="mt-sw-color__swatch" :style="swatchStyle" aria-hidden="true"></span>
    <input class="mt-sw-input mt-sw-color__hex" type="text" :id="inputId" :value="text" maxlength="9"
           spellcheck="false" autocomplete="off" :disabled="disabled"
           :aria-label="label" :aria-invalid="invalid ? 'true' : 'false'"
           @input="onType($event.target.value)" @blur="onBlur">
    <button type="button" class="mt-sw-btn" :disabled="disabled" :aria-expanded="open ? 'true' : 'false'" :aria-controls="panelId"
            :aria-label="(open ? $tc('michatheme-v5.colors.close') : $tc('michatheme-v5.colors.open')) + ': ' + label" @click="toggle">
        {{ open ? $tc('michatheme-v5.colors.close') : $tc('michatheme-v5.colors.open') }}
    </button>
    <button v-if="value" type="button" class="mt-sw-btn mt-sw-btn--quiet" :disabled="disabled" :aria-label="$tc('michatheme-v5.colors.clear') + ': ' + label" @click="$emit('update', '')">
        {{ $tc('michatheme-v5.colors.clear') }}
    </button>
    <p v-if="invalid" class="mt-sw-help" role="status">{{ $tc('michatheme-v5.field.invalidColor') }}</p>
    <div v-if="open" :id="panelId" class="mt-sw-color__panel">
        <input ref="cp" type="hidden" data-mt-colorpicker data-mt-palette-field="mt-sw-palette-field" :value="value" @input="onPick($event.target.value)">
    </div>
</div>`,

        props: {
            value: { type: String, default: '' },
            label: { type: String, required: true },
            disabled: { type: Boolean, default: false }
        },

        data: function () {
            uid += 1;

            return { open: false, text: this.value || '', invalid: false, uid: uid };
        },

        computed: {
            inputId: function () { return 'mt-sw-color-' + this.uid; },
            panelId: function () { return 'mt-sw-color-panel-' + this.uid; },
            swatchStyle: function () { return this.value ? { background: this.value } : {}; }
        },

        watch: {
            // Wert von außen (Preset, Zurücksetzen): Feld nachziehen, offenen Farbwähler neu aufbauen
            value: function (v) {
                if (document.activeElement !== this.$el.querySelector('.mt-sw-color__hex')) {
                    this.text = v || '';
                    this.invalid = false;
                }
                if (this.open && this.$refs.cp && this.$refs.cp.value !== v) {
                    this.$refs.cp.value = v || '';
                    this.$refs.cp.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        },

        methods: {
            // HEX tippen: #rgb, #rrggbb oder #rrggbbaa, gleiche Prüfung wie auf dem Server
            onType: function (raw) {
                this.text = raw;
                var t = String(raw).trim();
                if (t === '') {
                    this.invalid = false;
                    this.$emit('update', '');

                    return;
                }
                var clean = window.MTAdminLogic ? window.MTAdminLogic.sanitize({ type: 'color' }, t.charAt(0) === '#' ? t : '#' + t) : '';
                this.invalid = clean === '';
                if (clean !== '') {
                    this.$emit('update', clean);
                }
            },

            onBlur: function () {
                this.text = this.value || '';
                this.invalid = false;
            },

            onPick: function (v) {
                this.text = v;
                this.invalid = false;
                this.$emit('update', v);
            },

            toggle: function () {
                var vm = this;
                vm.open = !vm.open;
                if (vm.open) {
                    vm.$nextTick(function () {
                        if (vm.$refs.cp && window.MTColorPicker) {
                            window.MTColorPicker.mount(vm.$refs.cp);
                        }
                    });
                }
            }
        }
    });
})();

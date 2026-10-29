// Ein Einstellungsfeld nach Typ aus dem Schema (select, font, toggle, text, range, media, color). Native Bedienelemente, beschriftet.
(function () {
    'use strict';

    if (typeof Shopware === 'undefined') {
        return;
    }

    Shopware.Component.register('mt-sw-field', {
        template: `
<div class="mt-sw-field" :class="{ 'mt-sw-field--wide': wide }">
    <template v-if="option.type === 'toggle'">
        <div class="mt-sw-check">
            <input type="checkbox" :id="fid" :checked="!!value" :disabled="disabled" :aria-describedby="describedBy" @change="$emit('update', $event.target.checked)">
            <label :for="fid">{{ option.label }}</label>
        </div>
    </template>
    <template v-else>
        <label :for="fid">{{ option.label }}</label>
        <select v-if="option.type === 'select' || option.type === 'font'" class="mt-sw-select" :id="fid" :value="value" :disabled="disabled" :aria-describedby="describedBy" @change="$emit('update', $event.target.value)">
            <option v-for="(label, key) in option.choices" :key="key" :value="key" :selected="String(value) === String(key)">{{ label }}</option>
        </select>
        <div v-else-if="option.type === 'range'" class="mt-sw-unit">
            <input class="mt-sw-input" type="number" :id="fid" :min="option.min" :max="option.max" :step="option.step || 1" :value="value" :disabled="disabled" :aria-describedby="describedBy"
                   @input="onNumber($event.target.value)">
            <span v-if="option.unit">{{ option.unit }}</span>
        </div>
        <mt-sw-color v-else-if="option.type === 'color'" :value="String(value || '')" :label="option.label" :disabled="disabled" @update="$emit('update', $event)"></mt-sw-color>
        <template v-else-if="option.type === 'media'">
            <sw-media-field v-if="hasMediaField" :value="String(value || '')" :disabled="disabled" @update:value="$emit('update', $event || '')" @media-selection-change="onMedia"></sw-media-field>
            <input v-else class="mt-sw-input" type="text" :id="fid" :value="value" maxlength="32" spellcheck="false" autocomplete="off" :disabled="disabled" :aria-describedby="describedBy" @input="$emit('update', $event.target.value.trim())">
        </template>
        <textarea v-else-if="option.input === 'textarea'" class="mt-sw-textarea" :id="fid" :value="value" maxlength="2000" :disabled="disabled" :aria-describedby="describedBy" @input="$emit('update', $event.target.value)"></textarea>
        <input v-else class="mt-sw-input" type="text" :id="fid" :value="value" maxlength="500" :disabled="disabled" :aria-describedby="describedBy" @input="$emit('update', $event.target.value)">
    </template>
    <p v-if="option.help" :id="fid + '-help'" class="mt-sw-help">{{ option.help }}</p>
    <p v-if="corrected" :id="fid + '-corr'" class="mt-sw-help" role="status"><strong>{{ $tc('michatheme-v5.field.invalidColor') }}</strong></p>
    <div class="mt-sw-meta">
        <span v-if="option.locked_by_law" class="mt-sw-tag">{{ $tc('michatheme-v5.field.law') }}</span>
        <span v-if="dirty" class="mt-sw-tag">{{ $tc('michatheme-v5.field.changed') }}</span>
        <span>{{ $tc('michatheme-v5.field.default', 0, { value: defaultText }) }}</span>
        <button v-if="differsFromDefault" type="button" class="mt-sw-btn mt-sw-btn--quiet" :disabled="disabled"
                :aria-label="$tc('michatheme-v5.field.resetNamed', 0, { name: option.label })" @click="$emit('update', option.default)">
            {{ $tc('michatheme-v5.field.reset') }}
        </button>
    </div>
</div>`,

        props: {
            option: { type: Object, required: true },
            value: { required: false, default: '' },
            dirty: { type: Boolean, default: false },
            corrected: { type: Boolean, default: false },
            disabled: { type: Boolean, default: false }
        },

        computed: {
            fid: function () { return 'mt-f-' + this.option.id; },
            wide: function () { return this.option.input === 'textarea'; },
            describedBy: function () {
                var ids = [];
                if (this.option.help) { ids.push(this.fid + '-help'); }
                if (this.corrected) { ids.push(this.fid + '-corr'); }

                return ids.join(' ') || null;
            },
            hasMediaField: function () {
                try {
                    return !!Shopware.Application.view.getComponent('sw-media-field') || !!Shopware.Component.getComponentRegistry().has('sw-media-field');
                } catch (e) {
                    return false;
                }
            },
            differsFromDefault: function () {
                return JSON.stringify(this.value === undefined ? '' : this.value) !== JSON.stringify(this.option.default === undefined ? '' : this.option.default);
            },
            defaultText: function () {
                var d = this.option.default;
                var o = this.option;
                if (o.type === 'toggle') { return d ? this.$tc('michatheme-v5.field.on') : this.$tc('michatheme-v5.field.off'); }
                if ((o.type === 'select' || o.type === 'font') && o.choices && o.choices[d] !== undefined) { return o.choices[d]; }
                if (d === '' || d === null || d === undefined) { return this.$tc('michatheme-v5.field.defaultEmpty'); }
                var s = String(d);

                return (s.length > 40 ? s.slice(0, 40) + '…' : s) + (o.unit ? ' ' + o.unit : '');
            }
        },

        methods: {
            onNumber: function (raw) {
                var logic = window.MTAdminLogic;
                this.$emit('update', logic ? logic.sanitize(this.option, raw) : Number(raw));
            },
            // Medienfeld gibt das Medienobjekt, wir brauchen nur die ID
            onMedia: function (media) {
                this.$emit('update', media && media.id ? media.id : '');
            }
        }
    });
})();

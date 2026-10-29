<?php

declare(strict_types=1);

namespace MichaThemeV5\Administration\Service;

use MichaThemeV5\Plugin\Sanitizer;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Shopware\Storefront\Theme\ThemeService;

/**
 * Liest und schreibt die Theme-Konfiguration (Schlüssel mt-*, genau wie im Theme-Manager). Kein zweiter Speicher.
 * Geschrieben wird nur über ThemeService::updateTheme (Shopware prüft die Felder, leert Caches und übersetzt das Theme neu).
 */
class SettingsService
{
    public const THEME_NAME = 'MichaThemeV5';
    public const PALETTE_KEY = 'MichaThemeV5.config.colorPalette';
    public const LICENSE_KEY = 'mt-license-token';
    private const PALETTE_MAX = 12;

    /** @param EntityRepository<\Shopware\Storefront\Theme\ThemeCollection> $themeRepository */
    public function __construct(
        private readonly ThemeService $themes,
        private readonly EntityRepository $themeRepository,
        private readonly SchemaProvider $schema,
        private readonly SystemConfigService $systemConfig,
    ) {
    }

    /** @return list<array{id:string,name:string,child:bool}> MichaThemeV5 zuerst, dann Kind-Themes davon */
    public function themes(Context $context): array
    {
        $criteria = new Criteria();
        $criteria->setLimit(200);
        $all = [];
        foreach ($this->themeRepository->search($criteria, $context)->getEntities() as $t) {
            $all[$t->getId()] = $t;
        }
        $root = null;
        foreach ($all as $t) {
            if ($t->getTechnicalName() === self::THEME_NAME) {
                $root = $t->getId();
            }
        }
        if ($root === null) {
            return [];
        }
        $out = [['id' => $root, 'name' => (string) ($all[$root]->getName() ?? self::THEME_NAME), 'child' => false]];
        foreach ($all as $id => $t) {
            // Kind-Theme: Parent-Kette führt zu MichaThemeV5 (höchstens 5 Stufen)
            $p = $t->getParentThemeId();
            for ($i = 0; $i < 5 && $p !== null && $p !== $root; ++$i) {
                $p = isset($all[$p]) ? $all[$p]->getParentThemeId() : null;
            }
            if ($id !== $root && $p === $root) {
                $out[] = ['id' => $id, 'name' => (string) ($t->getName() ?? $id), 'child' => true];
            }
        }

        return $out;
    }

    /** Nur Themes aus der Liste sind erlaubt (kein fremdes Theme per ID anfassen). */
    public function resolveThemeId(?string $wanted, Context $context): ?string
    {
        $list = $this->themes($context);
        foreach ($list as $t) {
            if ($t['id'] === $wanted) {
                return $wanted;
            }
        }

        return $list[0]['id'] ?? null;
    }

    /** @return array<string,mixed> id => aktueller Wert (Typ wie im Schema) */
    public function load(string $themeId, Context $context): array
    {
        $fields = $this->fields($themeId, $context);
        $values = [];
        foreach ($this->schema->options() as $id => $o) {
            $values[$id] = $this->typed($o, array_key_exists($o['key'], $fields) ? ($fields[$o['key']]['value'] ?? null) : null);
        }

        return $values;
    }

    /**
     * @param array<string,mixed> $input id => neuer Wert (nur geänderte Felder)
     * @return array{values:array<string,mixed>,corrected:list<string>,rejected:list<string>,saved:int}
     */
    public function save(string $themeId, array $input, Context $context): array
    {
        $options = $this->schema->options();
        $clean = [];
        $corrected = [];
        $forForm = [];
        foreach ($input as $id => $raw) {
            $id = (string) $id;
            if (!isset($options[$id])) {
                continue;
            }
            if (($options[$id]['type'] ?? '') === 'media') {
                // Shopware speichert bei Medienfeldern die Medien-ID, nicht die Adresse
                $clean[$id] = is_string($raw) && preg_match('/^[0-9a-fA-F]{32}$/', $raw) === 1 ? strtolower($raw) : '';
            } else {
                $forForm[$id] = $raw;
            }
        }
        $res = Sanitizer::form($options, $forForm);
        $clean += $res['values'];
        foreach ($clean as $id => $v) {
            $type = $options[$id]['type'] ?? '';
            if (in_array($type, ['color', 'media'], true) && $v === '' && is_string($input[$id] ?? null) && trim((string) $input[$id]) !== '') {
                $corrected[] = $id;
            }
        }
        $config = [];
        foreach ($clean as $id => $v) {
            $config[$options[$id]['key']] = ['value' => $v];
        }
        if ($config) {
            $this->themes->updateTheme($themeId, $config, null, $context);
        }

        return ['values' => $clean, 'corrected' => $corrected, 'rejected' => array_values(array_diff(array_map('strval', array_keys($input)), array_keys($options))), 'saved' => count($config)];
    }

    /** Roher Wert eines einzelnen Theme-Feldes (z. B. Lizenzcode). Nie an den Browser weitergeben. */
    public function rawField(string $themeId, string $key, Context $context): string
    {
        $v = $this->fields($themeId, $context)[$key]['value'] ?? '';

        return is_string($v) ? $v : '';
    }

    public function writeField(string $themeId, string $key, string $value, Context $context): void
    {
        $this->themes->updateTheme($themeId, [$key => ['value' => $value]], null, $context);
    }

    /** @return list<string> */
    public function palette(): array
    {
        $raw = $this->systemConfig->get(self::PALETTE_KEY);

        return $this->cleanPalette(is_string($raw) ? (json_decode($raw, true) ?: []) : []);
    }

    /** @param mixed $colors @return list<string> */
    public function savePalette(mixed $colors): array
    {
        $clean = $this->cleanPalette($colors);
        $this->systemConfig->set(self::PALETTE_KEY, json_encode($clean, JSON_THROW_ON_ERROR));

        return $clean;
    }

    /** @return list<string> nur #rrggbb, ohne Doppelte, höchstens 12 */
    private function cleanPalette(mixed $colors): array
    {
        $out = [];
        foreach (is_array($colors) ? $colors : [] as $c) {
            $h = Sanitizer::color($c);
            if (strlen($h) === 7 && !in_array($h, $out, true) && count($out) < self::PALETTE_MAX) {
                $out[] = $h;
            }
        }

        return $out;
    }

    /** @return array<string,array<string,mixed>> */
    private function fields(string $themeId, Context $context): array
    {
        // 6.6 und älteres 6.7 kennen nur getThemeConfiguration, neueres 6.7 getPlainThemeConfiguration
        $cfg = method_exists($this->themes, 'getPlainThemeConfiguration')
            ? $this->themes->getPlainThemeConfiguration($themeId, $context)
            : $this->themes->getThemeConfiguration($themeId, false, $context);

        return is_array($cfg['fields'] ?? null) ? $cfg['fields'] : [];
    }

    /** @param array<string,mixed> $o */
    private function typed(array $o, mixed $v): mixed
    {
        $def = $o['default'] ?? '';
        if ($v === null) {
            return $def;
        }

        return match ($o['type'] ?? 'text') {
            'toggle' => filter_var($v, FILTER_VALIDATE_BOOLEAN),
            'range' => is_numeric($v) ? (int) $v : (int) $def,
            default => is_scalar($v) ? (string) $v : $def,
        };
    }
}

<?php

declare(strict_types=1);

namespace MichaThemeV5\Administration\Service;

/** Liest das erzeugte Schema (src/Generated/mt-admin-schema.json). Ein Katalog, mehrere Oberflächen. */
final class SchemaProvider
{
    /** @var array<string,mixed>|null */
    private ?array $schema = null;

    public function __construct(private readonly string $file)
    {
    }

    /**
     * Englische Fassung (mt-admin-schema.en.json) nur für die Anzeige; Prüfung und Speichern nutzen immer das deutsche Schema (gleiche IDs und Schlüssel).
     *
     * @return array<string,mixed>
     */
    public function forLocale(string $locale): array
    {
        if (!str_starts_with($locale, 'en')) {
            return $this->schema();
        }
        $file = preg_replace('/\.json$/', '.en.json', $this->file) ?? $this->file;
        $json = is_file($file) ? json_decode((string) file_get_contents($file), true) : null;

        return is_array($json) && is_array($json['options'] ?? null) ? $json : $this->schema();
    }

    /** @return array<string,mixed> */
    public function schema(): array
    {
        if ($this->schema === null) {
            $json = is_file($this->file) ? json_decode((string) file_get_contents($this->file), true) : null;
            $this->schema = is_array($json) && is_array($json['options'] ?? null) ? $json : ['version' => '', 'groups' => [], 'options' => [], 'presets' => []];
        }

        return $this->schema;
    }

    /** @return array<string,array<string,mixed>> id => Option */
    public function options(): array
    {
        $out = [];
        foreach ($this->schema()['options'] as $o) {
            if (is_array($o) && is_string($o['id'] ?? null)) {
                $out[$o['id']] = $o;
            }
        }

        return $out;
    }

    public function version(): string
    {
        return (string) ($this->schema()['version'] ?? '');
    }
}

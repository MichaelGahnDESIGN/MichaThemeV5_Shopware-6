<?php

declare(strict_types=1);

namespace MichaThemeV5\Plugin;

/**
 * Platzhalter für die spätere Pro-Auslieferung (Phase 3). Lädt in 0.5.0 NIE Code.
 * Ein Modul wird nur dann geladen, wenn (1) die Lizenz es erlaubt UND (2) ein Lader von der Plattform registriert wurde.
 * Ohne gültige Lizenz oder bei jedem Fehler passiert nichts, der Shop läuft als Free weiter.
 */
final class ModuleLoader
{
    /** @var array<string,callable> */
    private array $loaders = [];

    public function __construct(private readonly BridgeInterface $bridge)
    {
    }

    /** Phase 3 registriert hier den Lader (signiertes Paket holen, prüfen, einbinden). */
    public function register(string $module, callable $loader): void
    {
        $this->loaders[$module] = $loader;
    }

    /** @return bool true = Modul wurde geladen */
    public function load(string $module): bool
    {
        try {
            if (!isset($this->loaders[$module]) || !$this->bridge->licenseAllows($module)) {
                return false;
            }
            $this->loaders[$module]();

            return true;
        } catch (\Throwable) {
            return false;
        }
    }
}

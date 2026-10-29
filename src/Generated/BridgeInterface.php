<?php

declare(strict_types=1);

namespace MichaThemeV5\Plugin;

/**
 * Laufzeit-Schnittstelle zwischen Plugin und Theme (Bridge).
 * Das Plugin stellt sie bereit, das Theme ruft sie nur auf, wenn es sie gibt (class_exists), sonst gilt der alte Weg.
 * Genau diese fünf Aufrufe, mehr nicht. Beschreibung: docs/PLUGIN-BRIDGE.md
 */
interface BridgeInterface
{
    public const API_VERSION = 1;

    /** Wert einer Option (id ohne Präfix, z. B. "accent"). null = Plugin kennt die Option nicht, Theme nimmt seinen eigenen Weg. */
    public function option(string $id): mixed;

    /** @return array{valid:bool,tier:string,modules:list<string>,source:string,reason:string} wie LicenseClient::state() */
    public function licenseState(): array;

    /** Ist das Modul per Lizenz freigeschaltet? Bei jedem Fehler false (Free). */
    public function licenseAllows(string $module): bool;

    public function pluginVersion(): string;

    /** Kurzer Hinweistext zu einem Schlüssel (z. B. "plugin_missing"), null = nichts anzeigen. */
    public function notice(string $key): ?string;
}

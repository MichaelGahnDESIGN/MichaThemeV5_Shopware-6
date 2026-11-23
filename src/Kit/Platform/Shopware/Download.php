<?php

declare(strict_types=1);

namespace MichaThemeV5\Kit\Platform\Shopware;

// ZIP-Download ohne Weiterleitung, Weiterleitungen macht der PluginUpdater selbst (jeder Hop gegen die Host-Liste)
interface Download
{
    /**
     * Schreibt den Body nach $file, bricht ab über $maxBytes
     * @return array{status:int,location:string}
     */
    public function get(string $url, string $file, int $maxBytes): array;
}

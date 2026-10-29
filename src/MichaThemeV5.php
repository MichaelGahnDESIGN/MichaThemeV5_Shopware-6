<?php

declare(strict_types=1);

namespace MichaThemeV5;

use Shopware\Core\Framework\Plugin;
use Shopware\Storefront\Framework\ThemeInterface;
use Symfony\Component\DependencyInjection\ContainerBuilder;

class MichaThemeV5 extends Plugin implements ThemeInterface
{
    public function getThemeConfigPath(): string
    {
        return 'theme.json';
    }

    public function build(ContainerBuilder $container): void
    {
        parent::build($container);
        // Pfad fürs Admin-Modul (Schema, Changelog). getPath() zeigt auf src/, gebraucht wird der Plugin-Ordner darüber
        $container->setParameter('michatheme_v5.plugin_dir', \dirname(rtrim($this->getPath(), '/')));
    }
}

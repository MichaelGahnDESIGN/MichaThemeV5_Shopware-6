<?php

declare(strict_types=1);

namespace MichaThemeV5;

use MichaThemeV5\InstallReport\InstallReporter;
use Shopware\Core\Framework\Plugin;
use Shopware\Core\Framework\Plugin\Context\ActivateContext;
use Shopware\Core\Framework\Plugin\Context\InstallContext;
use Shopware\Core\Framework\Plugin\Context\UpdateContext;
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

    public function install(InstallContext $installContext): void
    {
        parent::install($installContext);
        $this->reportInstall();
    }

    public function activate(ActivateContext $activateContext): void
    {
        parent::activate($activateContext);
        $this->reportInstall();
    }

    public function update(UpdateContext $updateContext): void
    {
        parent::update($updateContext);
        $this->reportInstall();
    }

    // Aktiv-Meldung Free-Lizenz, darf install/activate/update nie kaputt machen
    private function reportInstall(): void
    {
        try {
            InstallReporter::lifecycle($this->container ?? null, \dirname(rtrim($this->getPath(), '/')));
        } catch (\Throwable) {
            // still
        }
    }
}

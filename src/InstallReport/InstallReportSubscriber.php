<?php

declare(strict_types=1);

namespace MichaThemeV5\InstallReport;

use Shopware\Core\System\SystemConfig\Event\SystemConfigChangedEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

// Schalter "Installation melden" umgelegt > sofort abgleichen, aus = Eintrag auf der Plattform weg
final class InstallReportSubscriber implements EventSubscriberInterface
{
    public function __construct(private readonly InstallReporter $reporter)
    {
    }

    public static function getSubscribedEvents(): array
    {
        return [SystemConfigChangedEvent::class => 'onConfigChanged'];
    }

    public function onConfigChanged(SystemConfigChangedEvent $event): void
    {
        // nur der globale Schalter, Sales-Channel-Werte zählen nicht
        if ($event->getKey() !== InstallReporter::SWITCH_KEY || $event->getSalesChannelId() !== null) {
            return;
        }
        $this->reporter->sync();
    }
}

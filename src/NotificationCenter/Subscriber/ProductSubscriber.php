<?php
declare(strict_types=1);

namespace MichaThemeV5\NotificationCenter\Subscriber;

use MichaThemeV5\NotificationCenter\Service\NotificationService;
use Psr\Log\LoggerInterface;
use Shopware\Core\Content\Product\ProductEvents;
use Shopware\Core\Framework\DataAbstractionLayer\Event\EntityWrittenEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

/**
 * Erzeugt für Produktänderungen nur öffentliche Einträge, höchstens einen pro Produkt und Tag.
 * Standardmäßig aus (config.xml), weil Shopware Produkte auch bei Lagerbestand und Preisen laufend schreibt.
 */
final class ProductSubscriber implements EventSubscriberInterface
{
    public function __construct(private readonly NotificationService $notifications, private readonly LoggerInterface $logger) {}

    public static function getSubscribedEvents(): array
    {
        return [ProductEvents::PRODUCT_WRITTEN_EVENT => 'onWritten'];
    }

    public function onWritten(EntityWrittenEvent $event): void
    {
        if (!$this->notifications->isProductEventsEnabled()) {
            return;
        }
        // Eine Meldung darf nie das Speichern eines Produkts kaputt machen
        try {
            $day = (new \DateTimeImmutable('now', new \DateTimeZone('UTC')))->format('Y-m-d');
            foreach ($event->getIds() as $id) {
                $this->notifications->createOnce(['scope' => 'public', 'eventType' => 'product_updated', 'sourceKey' => 'product:' . $id . ':updated:' . $day, 'title' => 'Produkt aktualisiert', 'body' => 'Ein Produkt wurde aktualisiert.']);
            }
        } catch (\Throwable $error) {
            $this->logger->warning('MichaThemeV5: Produktmeldung konnte nicht gespeichert werden.', ['exceptionType' => $error::class]);
        }
    }
}

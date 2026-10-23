<?php
declare(strict_types=1);

namespace MichaThemeV5\NotificationCenter\Subscriber;

use MichaThemeV5\NotificationCenter\Service\NotificationService;
use Shopware\Core\Content\Product\ProductEvents;
use Shopware\Core\Framework\DataAbstractionLayer\Event\EntityWrittenEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

/** Erzeugt für Produktänderungen nur idempotente öffentliche Einträge. Redaktionelle Nachbearbeitung bleibt im Backend möglich. */
final class ProductSubscriber implements EventSubscriberInterface
{
    public function __construct(private readonly NotificationService $notifications) {}
    public static function getSubscribedEvents(): array { return [ProductEvents::PRODUCT_WRITTEN_EVENT => 'onWritten']; }
    public function onWritten(EntityWrittenEvent $event): void
    {
        foreach ($event->getIds() as $id) $this->notifications->createOnce(['scope' => 'public', 'eventType' => 'product_updated', 'sourceKey' => 'product:' . $id . ':updated:' . $event->getContext()->getVersionId(), 'title' => 'Produkt aktualisiert', 'body' => 'Ein Produkt wurde aktualisiert.']);
    }
}

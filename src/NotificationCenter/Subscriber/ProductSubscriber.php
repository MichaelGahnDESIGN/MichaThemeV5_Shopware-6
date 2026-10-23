<?php
declare(strict_types=1);

namespace MichaThemeV5\NotificationCenter\Subscriber;

use Doctrine\DBAL\Connection;
use MichaThemeV5\NotificationCenter\Service\NotificationService;
use Shopware\Core\Content\Product\ProductEvents;
use Shopware\Core\Framework\DataAbstractionLayer\Event\EntityWrittenEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

/** Erzeugt für Produktänderungen nur idempotente öffentliche Einträge. Redaktionelle Nachbearbeitung bleibt im Backend möglich. */
final class ProductSubscriber implements EventSubscriberInterface
{
    public function __construct(private readonly NotificationService $notifications, private readonly Connection $connection) {}
    public static function getSubscribedEvents(): array { return [ProductEvents::PRODUCT_WRITTEN_EVENT => 'onWritten']; }
    public function onWritten(EntityWrittenEvent $event): void
    {
        foreach ($event->getIds() as $id) {
            /* Die persistierte Zeit ist stabil für Webhook-Wiederholungen und ändert sich bei jeder echten Produktänderung. */
            $row = $this->connection->fetchAssociative('SELECT LOWER(HEX(id)) AS id, updated_at AS updatedAt FROM product WHERE id = :id', ['id' => hex2bin($id)]);
            if (!$row || !$row['updatedAt']) continue;
            $this->notifications->createOnce(['scope' => 'public', 'eventType' => 'product_updated', 'sourceKey' => 'product:' . $row['id'] . ':updated:' . $row['updatedAt'], 'title' => 'Produkt aktualisiert', 'body' => 'Ein Produkt wurde aktualisiert.']);
        }
    }
}

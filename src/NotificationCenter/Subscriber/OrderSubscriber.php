<?php
declare(strict_types=1);
namespace MichaThemeV5\NotificationCenter\Subscriber;
use Doctrine\DBAL\Connection;
use MichaThemeV5\NotificationCenter\Service\NotificationService;
use Shopware\Core\Checkout\Order\OrderEvents;
use Shopware\Core\Framework\DataAbstractionLayer\Event\EntityWrittenEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
/** Die Quell-ID enthält den Status. Wiederholte Schreibereignisse bleiben damit wirkungslos. */
final class OrderSubscriber implements EventSubscriberInterface {
    public function __construct(private readonly NotificationService $notifications, private readonly Connection $connection) {}
    public static function getSubscribedEvents(): array { return [OrderEvents::ORDER_WRITTEN_EVENT => 'onWritten']; }
    public function onWritten(EntityWrittenEvent $event): void {
        foreach ($event->getIds() as $id) {
            $row = $this->connection->fetchAssociative('SELECT LOWER(HEX(o.id)) AS id, LOWER(HEX(oc.customer_id)) AS customerId, o.order_number AS orderNumber, LOWER(HEX(o.state_id)) AS stateId FROM `order` o INNER JOIN order_customer oc ON oc.order_id = o.id WHERE o.id = :id', ['id' => hex2bin($id)]);
            if (!$row || !$row['customerId']) continue;
            $this->notifications->createOnce(['scope' => 'personal', 'eventType' => 'order_status', 'sourceKey' => 'order:' . $row['id'] . ':status:' . $row['stateId'], 'title' => 'Bestellung ' . $row['orderNumber'], 'body' => 'Der Status deiner Bestellung wurde aktualisiert.', 'targetUrl' => '/account/order'], $row['customerId']);
        }
    }
}

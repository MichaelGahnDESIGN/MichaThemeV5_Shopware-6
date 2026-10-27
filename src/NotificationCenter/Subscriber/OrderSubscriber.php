<?php
declare(strict_types=1);

namespace MichaThemeV5\NotificationCenter\Subscriber;

use Doctrine\DBAL\Connection;
use MichaThemeV5\NotificationCenter\Service\NotificationService;
use Psr\Log\LoggerInterface;
use Shopware\Core\Checkout\Order\OrderEvents;
use Shopware\Core\Defaults;
use Shopware\Core\Framework\DataAbstractionLayer\Event\EntityWrittenEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

/** Die Quell-ID enthält den Status. Wiederholte Schreibereignisse bleiben damit wirkungslos. */
final class OrderSubscriber implements EventSubscriberInterface
{
    public function __construct(private readonly NotificationService $notifications, private readonly Connection $connection, private readonly LoggerInterface $logger) {}

    public static function getSubscribedEvents(): array
    {
        return [OrderEvents::ORDER_WRITTEN_EVENT => 'onWritten'];
    }

    public function onWritten(EntityWrittenEvent $event): void
    {
        // Nur echte Bestellungen, keine Entwurfs-Versionen
        if (!$this->notifications->isEnabled() || $event->getContext()->getVersionId() !== Defaults::LIVE_VERSION) {
            return;
        }
        // Eine Meldung darf nie eine Bestellung oder Statusänderung kaputt machen
        try {
            foreach ($event->getIds() as $id) {
                $row = $this->connection->fetchAssociative('SELECT LOWER(HEX(o.id)) AS id, LOWER(HEX(oc.customer_id)) AS customerId, o.order_number AS orderNumber, LOWER(HEX(o.state_id)) AS stateId FROM `order` o INNER JOIN order_customer oc ON oc.order_id = o.id AND oc.order_version_id = o.version_id WHERE o.id = :id AND o.version_id = :version', ['id' => hex2bin($id), 'version' => hex2bin(Defaults::LIVE_VERSION)]);
                if (!$row || !$row['customerId']) {
                    continue;
                }
                $this->notifications->createOnce(['scope' => 'personal', 'eventType' => 'order_status', 'sourceKey' => 'order:' . $row['id'] . ':status:' . $row['stateId'], 'title' => 'Bestellung ' . $row['orderNumber'], 'body' => 'Der Status deiner Bestellung wurde aktualisiert.', 'targetUrl' => '/account/order'], $row['customerId']);
            }
        } catch (\Throwable $error) {
            $this->logger->warning('MichaThemeV5: Bestellmeldung konnte nicht gespeichert werden.', ['exceptionType' => $error::class]);
        }
    }
}

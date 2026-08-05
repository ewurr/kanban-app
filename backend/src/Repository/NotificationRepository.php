<?php

namespace App\Repository;

use App\Entity\Notification;
use App\Entity\Task;
use App\Entity\User;
use App\Enum\NotificationType;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Notification>
 */
class NotificationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Notification::class);
    }

    /**
     * @return Notification[]
     */
    public function findByRecipientOrdered(User $recipient): array
    {
        return $this->createQueryBuilder('n')
            ->where('n.recipient = :recipient')
            ->andWhere('n.isDeleted = false')
            ->setParameter('recipient', $recipient)
            ->orderBy('n.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function existsForTaskAndType(Task $task, User $recipient, NotificationType $type): bool
    {
        $result = $this->createQueryBuilder('n')
            ->select('COUNT(n.id)')
            ->where('n.task = :task')
            ->andWhere('n.recipient = :recipient')
            ->andWhere('n.type = :type')
            ->setParameter('task', $task)
            ->setParameter('recipient', $recipient)
            ->setParameter('type', $type)
            ->getQuery()
            ->getSingleScalarResult();

        return $result > 0;
    }
}
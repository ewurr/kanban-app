<?php

namespace App\Repository;

use App\Entity\Task;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Task>
 */
class TaskRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Task::class);
    }

    //    /**
    //     * @return Task[] Returns an array of Task objects
    //     */
    //    public function findByExampleField($value): array
    //    {
    //        return $this->createQueryBuilder('t')
    //            ->andWhere('t.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->orderBy('t.id', 'ASC')
    //            ->setMaxResults(10)
    //            ->getQuery()
    //            ->getResult()
    //        ;
    //    }

    //    public function findOneBySomeField($value): ?Task
    //    {
    //        return $this->createQueryBuilder('t')
    //            ->andWhere('t.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }
    /**
     * @return Task[]
     */
    public function findAllForUser(User $user): array
    {
        return $this->createQueryBuilder('t')
                ->join('t.column', 'c')
                ->join('c.board', 'b')
                ->join('b.project', 'p')
                ->join('p.workspace', 'w')
                ->join('w.workspaceMembers', 'wm')
                ->where('wm.user = :user')
                ->andWhere(
                    '(wm.role = :owner) OR EXISTS (
                        SELECT 1 FROM App\Entity\TaskAssignment ta
                        WHERE ta.task = t AND ta.user = :user
                    )'
                )
                ->setParameter('user', $user)
                ->setParameter('owner', \App\Enum\WorkspaceRole::OWNER)
                ->getQuery()
                ->getResult();
    }

    /**
     * @return Task[]
     */
    public function findAllForUserAndBoard(User $user, int $boardId): array
    {
        return $this->createQueryBuilder('t')
                ->join('t.column', 'c')
                ->join('c.board', 'b')
                ->join('b.project', 'p')
                ->join('p.workspace', 'w')
                ->join('w.workspaceMembers', 'wm')
                ->where('wm.user = :user')
                ->andWhere('b.id = :boardId')
                ->andWhere(
                    '(wm.role = :owner) OR EXISTS (
                        SELECT 1 FROM App\Entity\TaskAssignment ta
                        WHERE ta.task = t AND ta.user = :user
                    )'
                )
                ->setParameter('user', $user)
                ->setParameter('boardId', $boardId)
                ->setParameter('owner', \App\Enum\WorkspaceRole::OWNER)
                ->getQuery()
                ->getResult();
    }
}

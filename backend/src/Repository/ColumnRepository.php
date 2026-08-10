<?php

namespace App\Repository;

use App\Entity\Column;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Column>
 */
class ColumnRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Column::class);
    }

    //    /**
    //     * @return Column[] Returns an array of Column objects
    //     */
    //    public function findByExampleField($value): array
    //    {
    //        return $this->createQueryBuilder('c')
    //            ->andWhere('c.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->orderBy('c.id', 'ASC')
    //            ->setMaxResults(10)
    //            ->getQuery()
    //            ->getResult()
    //        ;
    //    }

    //    public function findOneBySomeField($value): ?Column
    //    {
    //        return $this->createQueryBuilder('c')
    //            ->andWhere('c.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }

    /**
     * @return Column[]
     */
    public function findAllForUser(User $user): array
    {
        return $this->createQueryBuilder('c')
                ->join('c.board', 'b')
                ->join('b.project', 'p')
                ->join('p.workspace', 'w')
                ->join('w.workspaceMembers', 'wm')
                ->where('wm.user = :user')
                ->andWhere(
                    '(wm.role = :owner) OR EXISTS (
                        SELECT 1 FROM App\Entity\TaskAssignment ta
                        JOIN ta.task t
                        WHERE t.column = c AND ta.user = :user
                    )'
                )
                ->setParameter('user', $user)
                ->setParameter('owner', \App\Enum\WorkspaceRole::OWNER)
                ->getQuery()
                ->getResult();
    }

    /**
     * @return Column[]
     */
    public function findAllForUserAndBoard(User $user, int $boardId): array
    {
        return $this->createQueryBuilder('c')
                ->join('c.board', 'b')
                ->join('b.project', 'p')
                ->join('p.workspace', 'w')
                ->join('w.workspaceMembers', 'wm')
                ->where('wm.user = :user')
                ->andWhere('b.id = :boardId')
                ->andWhere(
                    '(wm.role = :owner) OR EXISTS (
                        SELECT 1 FROM App\Entity\TaskAssignment ta
                        JOIN ta.task t
                        WHERE t.column = c AND ta.user = :user
                    )'
                )
                ->setParameter('user', $user)
                ->setParameter('boardId', $boardId)
                ->setParameter('owner', \App\Enum\WorkspaceRole::OWNER)
                ->getQuery()
                ->getResult();
    }
}

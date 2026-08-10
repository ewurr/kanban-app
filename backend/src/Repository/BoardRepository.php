<?php

namespace App\Repository;

use App\Entity\Board;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Board>
 */
class BoardRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Board::class);
    }

    //    /**
    //     * @return Board[] Returns an array of Board objects
    //     */
    //    public function findByExampleField($value): array
    //    {
    //        return $this->createQueryBuilder('b')
    //            ->andWhere('b.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->orderBy('b.id', 'ASC')
    //            ->setMaxResults(10)
    //            ->getQuery()
    //            ->getResult()
    //        ;
    //    }

    //    public function findOneBySomeField($value): ?Board
    //    {
    //        return $this->createQueryBuilder('b')
    //            ->andWhere('b.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }

    /**
     * @return Board[]
     */
    public function findAllForUser(User $user): array
    {
        return $this->createQueryBuilder('b')
                ->join('b.project', 'p')
                ->join('p.workspace', 'w')
                ->join('w.workspaceMembers', 'wm')
                ->where('wm.user = :user')
                ->andWhere(
                    '(wm.role = :owner) OR EXISTS (
                        SELECT 1 FROM App\Entity\TaskAssignment ta
                        JOIN ta.task t
                        JOIN t.column c
                        WHERE c.board = b AND ta.user = :user
                    )'
                )
                ->setParameter('user', $user)
                ->setParameter('owner', \App\Enum\WorkspaceRole::OWNER)
                ->getQuery()
                ->getResult();
    }

    /**
     * @return Board[]
     */
    public function findAllForUserAndProject(User $user, int $projectId): array
    {
        return $this->createQueryBuilder('b')
            ->join('b.project', 'p')
            ->join('p.workspace', 'w')
            ->join('w.workspaceMembers', 'wm')
            ->where('wm.user = :user')
            ->andWhere('p.id = :projectId')
            ->andWhere(
                '(wm.role = :owner) OR EXISTS (
                    SELECT 1 FROM App\Entity\TaskAssignment ta
                    JOIN ta.task t
                    JOIN t.column c
                    WHERE c.board = b AND ta.user = :user
                )'
            )
            ->setParameter('user', $user)
            ->setParameter('projectId', $projectId)
            ->setParameter('owner', \App\Enum\WorkspaceRole::OWNER)
            ->getQuery()
            ->getResult();
    }
}

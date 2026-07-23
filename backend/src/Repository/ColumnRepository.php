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
        ->leftJoin('w.members', 'm')
        ->where('w.owner = :user')
        ->orWhere('m = :user')
        ->setParameter('user', $user)
        ->getQuery()
        ->getResult();
    }
}

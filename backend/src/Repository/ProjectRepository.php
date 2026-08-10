<?php

namespace App\Repository;

use App\Entity\Project;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use App\Entity\User;

/**
 * @extends ServiceEntityRepository<Project>
 */
class ProjectRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Project::class);
    }

    //    /**
    //     * @return Project[] Returns an array of Project objects
    //     */
    //    public function findByExampleField($value): array
    //    {
    //        return $this->createQueryBuilder('p')
    //            ->andWhere('p.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->orderBy('p.id', 'ASC')
    //            ->setMaxResults(10)
    //            ->getQuery()
    //            ->getResult()
    //        ;
    //    }

    //    public function findOneBySomeField($value): ?Project
    //    {
    //        return $this->createQueryBuilder('p')
    //            ->andWhere('p.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }
    /**
     * @return Project[]
     */
    public function findAllForUser(User $user): array
    {
        return $this->createQueryBuilder('p')
            ->join('p.workspace', 'w')
            ->join('w.workspaceMembers', 'wm')
            ->where('wm.user = :user')
            ->andWhere(
                '(wm.role = :owner) OR EXISTS (
                    SELECT 1 FROM App\Entity\TaskAssignment ta
                    JOIN ta.task t
                    JOIN t.column c
                    JOIN c.board b
                    WHERE b.project = p AND ta.user = :user
                )'
            )
            ->setParameter('user', $user)
            ->setParameter('owner', \App\Enum\WorkspaceRole::OWNER)
            ->getQuery()
            ->getResult();
    }

    /**
     * @return Project[]
     */
    public function findAllForUserAndWorkspace(User $user, int $workspaceId): array
    {
        return $this->createQueryBuilder('p')
            ->join('p.workspace', 'w')
            ->join('w.workspaceMembers', 'wm')
            ->where('wm.user = :user')
            ->andWhere('w.id = :workspaceId')
            ->andWhere(
                '(wm.role = :owner) OR EXISTS (
                    SELECT 1 FROM App\Entity\TaskAssignment ta
                    JOIN ta.task t
                    JOIN t.column c
                    JOIN c.board b
                    WHERE b.project = p AND ta.user = :user
                )'
            )
            ->setParameter('user', $user)
            ->setParameter('workspaceId', $workspaceId)
            ->setParameter('owner', \App\Enum\WorkspaceRole::OWNER)
            ->getQuery()
            ->getResult();
    }

}

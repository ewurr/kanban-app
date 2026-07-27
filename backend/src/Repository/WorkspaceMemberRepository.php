<?php

namespace App\Repository;

use App\Entity\User;
use App\Entity\WorkspaceMember;
use App\Entity\Workspace;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;


/**
 * @extends ServiceEntityRepository<WorkspaceMember>
 */
class WorkspaceMemberRepository extends ServiceEntityRepository 
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, WorkspaceMember::class);
    }

    public function findOneByWorkspaceAndUser(Workspace $workspace, User $user): ?WorkspaceMember
    {
        return $this->createQueryBuilder('wm')
        ->where('wm.workspace = :workspace')
        ->andWhere('wm.user = :user')
        ->setParameter('workspace', $workspace)
        ->setParameter('user', $user)
        ->getQuery()
        ->getOneOrNullResult();
    }
}

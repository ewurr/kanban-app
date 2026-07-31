<?php

namespace App\Repository;

use App\Entity\TaskAssignment;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use App\Entity\User;
use App\Entity\Project;


/**
 * @extends ServiceEntityRepository<TaskAssignment>
 */
class TaskAssignmentRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TaskAssignment::class);
    }

    public function userHasAssignmentInProject(User $user, Project $project): bool
{
    $count = $this->createQueryBuilder('ta')
        ->select('COUNT(ta.id)')
        ->join('ta.task', 't')
        ->join('t.column', 'c')
        ->join('c.board', 'b')
        ->where('b.project = :project')
        ->andWhere('ta.user = :user')
        ->setParameter('project', $project)
        ->setParameter('user', $user)
        ->getQuery()
        ->getSingleScalarResult();

    return $count > 0;
}
}
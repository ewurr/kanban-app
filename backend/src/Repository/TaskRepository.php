<?php

namespace App\Repository;

use App\Entity\Task;
use App\Entity\User;
use App\Filter\TaskFilter;
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
    public function findAllForUserAndBoard(User $user, int $boardId, ?TaskFilter $filter = null): array
    {
        $qb = $this->createQueryBuilder('t')
                ->join('t.column', 'c')->addSelect('c')
                ->leftJoin('t.assignments', 'ta_sel')->addSelect('ta_sel')
                ->leftJoin('ta_sel.user', 'u')->addSelect('u')
                ->leftJoin('t.labels', 'l')->addSelect('l')
                ->leftJoin('t.checklistItems', 'ci')->addSelect('ci')
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
                ->setParameter('owner', \App\Enum\WorkspaceRole::OWNER);

        if($filter !== null) {
            $this->applyFilter($qb, $filter);
        }

        return $qb->getQuery()->getResult();
    }

    // TaskFilter içindeki dolu alanları QueryBuilder'a andWhere olarak ekler.
    private function applyFilter(\Doctrine\ORM\QueryBuilder $qb, TaskFilter $filter): void
    {
        if($filter->assignedTo !== null) {
            // bu taska şu user ID sinin atanmış old. bir assignemnt var mı
            $qb->andWhere(
                'EXISTS (
                    SELECT 1 FROM App\Entity\TaskAssignment ta_filter
                    WHERE ta_filter.task = t AND ta_filter.user = :filterAssignedTo                
                )'
            )->setParameter('filterAssignedTo', $filter->assignedTo);
        }

        if($filter->priority !== null) {
            $qb->andWhere('t.priority = :filterPriority')
                ->setParameter('filterPriority', $filter->priority);
        }

        if($filter->search !== null){
            $qb->andWhere('LOWER(t.title) LIKE :filterSearch OR LOWER(t.description) LIKE :filterSearch')
                ->setParameter('filterSearch', '%' . strtolower($filter->search). '%');
        }

    }

    /**
     * @return Task[]
     */
    public function findAllForUserandWorkspace(User $user, int $workspaceId): array
    {
        return $this->createQueryBuilder('t')
            ->join('t.column', 'c')->addSelect('c')
            ->leftJoin('t.assignments', 'ta_sel')->addSelect('ta_sel')
            ->leftJoin('ta_sel.user', 'u')->addSelect('u')
            ->leftJoin('t.labels', 'l')->addSelect('l')
            ->leftJoin('t.checklistItems', 'ci')->addSelect('ci')
            ->join('c.board', 'b')
            ->join('b.project', 'p')
            ->join('p.workspace', 'w')
            ->join('w.workspaceMembers', 'wm')
            ->where('wm.user = :user')
            ->andWhere('w.id = :workspaceId')
            ->andWhere(
                '(wm.role = :owner) OR EXISTS (
                    SELECT 1 FROM APP\Entity\TaskAssignment ta
                    WHERE ta.task = t AND ta.user = :user
                )'
            )
            ->setParameter('user', $user)
            ->setParameter('workspaceId', $workspaceId)
            ->setParameter('owner', \App\Enum\WorkspaceRole::OWNER)
            ->getQuery()
            ->getResult();
    }
}

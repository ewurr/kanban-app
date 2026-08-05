<?php

namespace App\Service;

use App\Entity\ActivityLog;
use App\Entity\Task;
use App\Entity\User;
use App\Enum\ActivityAction;
use Doctrine\ORM\EntityManagerInterface;

class ActivityLogger
{
    public function __construct(
        private EntityManagerInterface $entityManager
    ) {

    }

    public function log(
        Task $task,
        ActivityAction $action,
        User $user,
        ?string $oldValue = null,
        ?string $newValue = null
    ): void {
        $log = new ActivityLog();
        $log->setTask($task);
        $log->setActionType($action);
        $log->setUser($user);
        $log->setOldValue($oldValue);
        $log->setNewValue($newValue);

        $this->entityManager->persist($log);
    }

    public function logTaskDeleted(Task $task, User $user): void
    {
        $log = new ActivityLog();
        $log->setTask(null); 
        $log->setTaskTitleSnapshot($task->getTitle());
        $log->setActionType(ActivityAction::Deleted);
        $log->setUser($user);

        $this->entityManager->persist($log);
    }
} 
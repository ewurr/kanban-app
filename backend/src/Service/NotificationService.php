<?php

namespace App\Service;

use App\Entity\Notification;
use App\Entity\Task;
use App\Entity\User;
use App\Enum\NotificationType;
use App\Repository\NotificationRepository;
use App\Repository\TaskAssignmentRepository;
use Doctrine\ORM\EntityManagerInterface;

class NotificationService
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private NotificationRepository $notificationRepository,
        private TaskAssignmentRepository $taskAssignmentRepository,
    ) {
    }

    public function notifyTaskAssigned(Task $task, User $recipient): void
    {
        $notification = new Notification();
        $notification->setRecipient($recipient);
        $notification->setTask($task);
        $notification->setTaskTitleSnapshot($task->getTitle());
        $notification->setType(NotificationType::TaskAssigned);

        $this->entityManager->persist($notification);
    }

    public function checkDueDatesForUser(User $user): void
    {
        $assignments = $this->taskAssignmentRepository->findByUser($user);

        $now = new \DateTimeImmutable();
        $threshold = $now->modify(sprintf('+%d days', Task::DUE_SOON_THRESHOLD_DAYS));

        $hasNewNotifications = false;

        foreach ($assignments as $assignment) {
            $task = $assignment->getTask();
            $dueDate = $task->getDueDate();

            if ($dueDate === null) {
                continue;
            }

            if ($dueDate < $now) {
                if (!$this->notificationRepository->existsForTaskAndType($task, $user, NotificationType::DueDateOverdue)) {
                    $this->createDueDateNotification($task, $user, NotificationType::DueDateOverdue);
                    $hasNewNotifications = true;
                }
            } elseif ($dueDate <= $threshold) {
                if (!$this->notificationRepository->existsForTaskAndType($task, $user, NotificationType::DueDateApproaching)) {
                    $this->createDueDateNotification($task, $user, NotificationType::DueDateApproaching);
                    $hasNewNotifications = true;
                }
            }
        }
    }

    private function createDueDateNotification(Task $task, User $recipient, NotificationType $type): void
    {
        $notification = new Notification();
        $notification->setRecipient($recipient);
        $notification->setTask($task);
        $notification->setTaskTitleSnapshot($task->getTitle());
        $notification->setType($type);

        $this->entityManager->persist($notification);
    }
}
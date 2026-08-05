<?php

namespace App\Enum;

enum NotificationType: string
{
    case TaskAssigned = 'task_assigned';
    case DueDateApproaching = 'due_date_approaching';
    case DueDateOverdue = 'due_date_overdue';
}
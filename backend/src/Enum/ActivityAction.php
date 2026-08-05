<?php

namespace App\Enum;

enum ActivityAction: string
{
    case Created = 'created';
    case Moved = 'moved';
    case Assigned = 'assigned';
    case Unassigned = 'unassigned';
    case PriorityChanged = 'priority_changed';
    case Deleted = 'deleted';
    case CommentAdded = 'comment_added';
    case CommentDeleted = 'comment_deleted';
}
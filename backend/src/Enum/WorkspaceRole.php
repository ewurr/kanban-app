<?php

namespace App\Enum;

enum WorkspaceRole: string
{
    case OWNER = 'owner';
    case PM = 'pm';
    case WORKER = 'worker';
}

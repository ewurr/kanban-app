<?php

namespace App\Security\Voter;

use App\Entity\Board;
use App\Entity\Column;
use App\Entity\Project;
use App\Entity\Task;
use App\Entity\User;
use App\Entity\Workspace;
use App\Enum\WorkspaceRole;
use App\Repository\TaskAssignmentRepository;
use App\Repository\WorkspaceMemberRepository;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

final class WorkspaceVoter extends Voter
{
    public const WORKSPACE_VIEW = 'WORKSPACE_VIEW';
    public const WORKSPACE_EDIT = 'WORKSPACE_EDIT';
    public const WORKSPACE_DELETE = 'WORKSPACE_DELETE';
    public const WORKSPACE_MANAGE_MEMBERS = 'WORKSPACE_MANAGE_MEMBERS';

    public const PROJECT_CREATE = 'PROJECT_CREATE';
    public const PROJECT_EDIT = 'PROJECT_EDIT';
    public const PROJECT_DELETE = 'PROJECT_DELETE';

    public const BOARD_CREATE = 'BOARD_CREATE';
    public const BOARD_EDIT = 'BOARD_EDIT';
    public const BOARD_DELETE = 'BOARD_DELETE';

    public const COLUMN_CREATE = 'COLUMN_CREATE';
    public const COLUMN_EDIT = 'COLUMN_EDIT';
    public const COLUMN_DELETE = 'COLUMN_DELETE';

    public const TASK_CREATE = 'TASK_CREATE';
    public const TASK_EDIT = 'TASK_EDIT';
    public const TASK_DELETE = 'TASK_DELETE';

    private const ATTRIBUTES = [
        self::WORKSPACE_VIEW, self::WORKSPACE_EDIT, self::WORKSPACE_DELETE, self::WORKSPACE_MANAGE_MEMBERS,
        self::PROJECT_CREATE, self::PROJECT_EDIT, self::PROJECT_DELETE,
        self::BOARD_CREATE, self::BOARD_EDIT, self::BOARD_DELETE,
        self::COLUMN_CREATE, self::COLUMN_EDIT, self::COLUMN_DELETE,
        self::TASK_CREATE, self::TASK_EDIT, self::TASK_DELETE,
    ];

    public function __construct(
        private readonly WorkspaceMemberRepository $workspaceMemberRepository,
        private readonly TaskAssignmentRepository $taskAssignmentRepository,
    ) {
    }

    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, self::ATTRIBUTES, true)
            && (
                $subject instanceof Workspace
                || $subject instanceof Project
                || $subject instanceof Board
                || $subject instanceof Column
                || $subject instanceof Task
            );
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?Vote $vote = null): bool
    {
        $user = $token->getUser();

        if (!$user instanceof User) {
            return false;
        }

        $workspace = $this->resolveWorkspace($subject);
        $membership = $this->workspaceMemberRepository->findOneByWorkspaceAndUser($workspace, $user);

        if ($membership === null) {
            return false;
        }

        $role = $membership->getRole();

        return match ($attribute) {
            self::WORKSPACE_VIEW => $this->canView($subject, $role, $user),

            self::WORKSPACE_EDIT,
            self::WORKSPACE_DELETE,
            self::WORKSPACE_MANAGE_MEMBERS,
            self::PROJECT_CREATE,
            self::PROJECT_EDIT,
            self::PROJECT_DELETE => $role === WorkspaceRole::OWNER,

            self::BOARD_CREATE,
            self::BOARD_EDIT,
            self::BOARD_DELETE,
            self::COLUMN_CREATE,
            self::COLUMN_EDIT,
            self::COLUMN_DELETE => in_array($role, [WorkspaceRole::OWNER, WorkspaceRole::PM], true),

            self::TASK_CREATE,
            self::TASK_EDIT,
            self::TASK_DELETE => true, // üye olan herkes (owner+pm+worker)

            default => false,
        };
    }

    private function canView(mixed $subject, WorkspaceRole $role, User $user): bool
    {
        // Workspace'in kendisi: üye olmak her zaman yeterli
        if ($subject instanceof Workspace) {
            return true;
        }

        // Owner her zaman her şeyi görebilir
        if ($role === WorkspaceRole::OWNER) {
            return true;
        }

        // Owner değilse (PM veya Worker), bu projede en az bir task'a atanmış olmalı
        $project = $this->resolveProject($subject);

        return $this->taskAssignmentRepository->userHasAssignmentInProject($user, $project);
    }

    private function resolveWorkspace(mixed $subject): Workspace
    {
        return match (true) {
            $subject instanceof Workspace => $subject,
            $subject instanceof Project => $subject->getWorkspace(),
            $subject instanceof Board => $subject->getProject()->getWorkspace(),
            $subject instanceof Column => $subject->getBoard()->getProject()->getWorkspace(),
            $subject instanceof Task => $subject->getColumn()->getBoard()->getProject()->getWorkspace(),
        };
    }

    private function resolveProject(mixed $subject): Project
    {
        return match (true) {
            $subject instanceof Project => $subject,
            $subject instanceof Board => $subject->getProject(),
            $subject instanceof Column => $subject->getBoard()->getProject(),
            $subject instanceof Task => $subject->getColumn()->getBoard()->getProject(),
        };
    }
}
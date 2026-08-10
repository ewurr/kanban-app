<?php

namespace App\Security\Voter;

use App\Entity\Comment;
use App\Entity\User;
use App\Enum\WorkspaceRole;
use App\Repository\WorkspaceMemberRepository;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

final class CommentVoter extends Voter
{
    public const COMMENT_EDIT = 'COMMENT_EDIT';
    public const COMMENT_DELETE = 'COMMENT_DELETE';

    private const ATTRIBUTES = [self::COMMENT_EDIT, self::COMMENT_DELETE];

    public function __construct(
        private readonly WorkspaceMemberRepository $workspaceMemberRepository,
    ) {
    }

    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, self::ATTRIBUTES, true) && $subject instanceof Comment;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?Vote $vote = null): bool
    {
        $user = $token->getUser();

        if (!$user instanceof User) {
            return false;
        }

        $isAuthor = $subject->getAuthor() === $user;

        if ($attribute === self::COMMENT_EDIT) {
            return $isAuthor;
        }

        if ($attribute === self::COMMENT_DELETE) {
            if ($isAuthor) {
                return true;
            }

            $workspace = $subject->getWorkspace();
            $membership = $this->workspaceMemberRepository->findOneByWorkspaceAndUser($workspace, $user);

            if ($membership === null) {
                return false;
            }

            return in_array($membership->getRole(), [WorkspaceRole::OWNER, WorkspaceRole::PM], true);
        }

        return false;
    }
}
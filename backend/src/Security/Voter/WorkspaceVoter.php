<?php

namespace App\Security\Voter;

use App\Entity\User;
use App\Entity\Workspace;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;
use Symfony\Component\Security\Core\User\UserInterface;

final class WorkspaceVoter extends Voter
{
    public const EDIT = 'WORKSPACE_EDIT';
    public const VIEW = 'WORKSPACE_VIEW';
    public const DELETE = 'WORKSPACE_DELETE';

    protected function supports(string $attribute, mixed $subject): bool
    {
        
        return in_array($attribute, [self::EDIT, self::VIEW, self::DELETE])
            && $subject instanceof \App\Entity\Workspace;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?Vote $vote = null): bool
    {
        $user = $token->getUser();

        if (!$user instanceof User) {

            return false;
        }

        $workspace = $subject;

        switch ($attribute) {
           
            case self::VIEW:
                return $workspace->getOwner() === $user || $workspace->getMembers()->contains($user);

            case self::EDIT:
                return $workspace->getOwner() === $user;

            case self::DELETE:
                return $workspace->getOwner() === $user;
        }

        return false;
    }
}

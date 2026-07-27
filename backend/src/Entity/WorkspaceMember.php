<?php

namespace App\Entity;

use App\Enum\WorkspaceRole;
use App\Repository\WorkspaceMemberRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: WorkspaceMemberRepository::class)]
#[ORM\UniqueConstraint(name: 'UNIQ_WORKSPACE_USER', columns: ['workspace_id', 'user_id'])]
class WorkspaceMember
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['workspace:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Workspace::class, inversedBy: 'workspaceMembers')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Workspace $workspace = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['workspace:read'])]
    private ?User $user = null;

    #[ORM\Column(enumType: WorkspaceRole::class)]
    #[Groups(['workspace:read'])]
    private ?WorkspaceRole $role = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getWorkspace(): ?Workspace
    {
        return $this->workspace;
    }

    public function setWorkspace(?Workspace $workspace): static
    {
        $this->workspace = $workspace;

        return $this;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;

        return $this;
    }

    public function getRole(): ?WorkspaceRole
    {
        return $this->role;
    }

    public function setRole(WorkspaceRole $role): static
    {
        $this->role = $role;

        return $this;
    }

}
<?php

namespace App\Entity;

use App\Enum\ActivityAction;
use App\Repository\ActivityLogRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: ActivityLogRepository::class)]
class ActivityLog
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['activity:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Task::class)]
    #[ORM\JoinColumn(nullable: true, onDelete: 'CASCADE')]
    private ?Task $task = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['activity:read'])]
    private ?string $taskTitleSnapshot = null;

    #[ORM\Column(enumType: ActivityAction::class)]
    #[Groups(['activity:read'])]
    private ?ActivityAction $actionType = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['activity:read'])]
    private ?User $user = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['activity:read'])]
    private ?string $oldValue = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['activity:read'])]
    private ?string $newValue = null;

    #[ORM\Column]
    #[Groups(['activity:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTask(): ?Task
    {
        return $this->task;
    }

    public function setTask(?Task $task): static
    {
        $this->task = $task;
        return $this;
    }

    public function getTaskTitleSnapshot(): ?string
    {
        return $this->taskTitleSnapshot;
    }

    public function setTaskTitleSnapshot(?string $taskTitleSnapshot): static
    {
        $this->taskTitleSnapshot = $taskTitleSnapshot;
        return $this;
    }

    public function getActionType(): ?ActivityAction
    {
        return $this->actionType;
    }

    public function setActionType(ActivityAction $actionType): static
    {
        $this->actionType = $actionType;
        return $this;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(User $user): static
    {
        $this->user = $user;
        return $this;
    }

    public function getOldValue(): ?string
    {
        return $this->oldValue;
    }

    public function setOldValue(?string $oldValue): static
    {
        $this->oldValue = $oldValue;
        return $this;
    }

    public function getNewValue(): ?string
    {
        return $this->newValue;
    }

    public function setNewValue(?string $newValue): static
    {
        $this->newValue = $newValue;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }
}
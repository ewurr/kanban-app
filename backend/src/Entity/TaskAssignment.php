<?php

namespace App\Entity;

use App\Repository\TaskAssignmentRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: TaskAssignmentRepository::class)]
#[ORM\UniqueConstraint(name: 'UNIQ_TASK_USER', columns: ['task_id', 'user_id'])]
class TaskAssignment
{
    #[ORM\Id]
    #[ORM\GeneratedValue()]
    #[ORM\Column]
    #[Groups(['task:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Task::class, inversedBy: 'assignments')]
    #[ORM\JoinColumn(nullable:false, onDelete:'CASCADE')]
    private ?Task $task = null;

    #[ORM\ManyToOne(targetEntity:User::class)]
    #[ORM\JoinColumn(nullable:false)]
    #[Groups(['task:read'])]
    private ?User $user = null;

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

    public function getUser(): ?User 
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;

        return $this;
    }

}
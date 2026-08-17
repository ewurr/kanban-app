<?php

namespace App\Entity;

use App\Repository\ChecklistItemRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;


#[ORM\Entity(repositoryClass: ChecklistItemRepository::class)]
class ChecklistItem
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['checklist:read', 'task:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Task::class, inversedBy: 'checklistItems')]
    #[ORM\JoinColumn(nullable: false, onDelete:'CASCADE')]
    private ?Task $task = null;

    #[ORM\Column(length: 500)]
    #[Groups(['checklist:read', 'task:read'])]
    #[Assert\NotBlank(message: 'Madde içeriği boş olamaz.')]
    #[Assert\Length(max: 500, maxMessage: 'Madde en fazla 500 karakter olabilir.')]
    private ?string $content = null;

    #[ORM\Column(options: ['default' => false])]
    #[Groups(['checklist:read', 'task:read'])]
    private bool $isCompleted = false;

    #[ORM\Column]
    #[Groups(['checklist:read', 'task:read'])]
    private int $position = 0;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTask(): ?Task
    {
        return $this->task;
    }

    public function setTask(Task $task): static
    {
        $this->task = $task;
        return $this;
    } 

    public function getWorkspace(): Workspace
    {
        return $this->getTask()->getWorkspace();
    }
    

    public function getContent(): ?string
    {
        return $this->content;
    }

    public function setContent(string $content): static
    {
        $this->content = $content;

        return $this;
    }

    public function isCompleted(): bool
    {
        return $this->isCompleted;
    }

    public function setIsCompleted(bool $isCompleted): static
    {
        $this->isCompleted = $isCompleted;

        return $this;
    }

    public function getPosition(): ?int
    {
        return $this->position;
    }

    public function setPosition(int $position): static
    {
        $this->position = $position;

        return $this;
    }
}

<?php

namespace App\Entity;

use App\Repository\TaskRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;
use App\Entity\Column;
use App\Entity\User;
use App\Entity\Project;
use App\Entity\Workspace;
use App\Entity\Label;


#[ORM\Entity(repositoryClass: TaskRepository::class)]
class Task
{

    public const DUE_SOON_THRESHOLD_DAYS = 1;

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['task:read', 'notification:read'])]
    private ?int $id = null;

    public function __construct()
    {
        $this->assignments = new ArrayCollection();
        $this->createdAt = new \DateTimeImmutable();
        $this->labels = new ArrayCollection();
        $this->checklistItems = new ArrayCollection();
    }

    #[ORM\Column(length: 255)]
    #[Groups(['task:read'])]
    #[Assert\NotBlank(message: 'Görev başlığı zorunludur.')]
    #[Assert\Length(min: 2, max: 255, minMessage: 'Başlık en az 2 karakter olmalıdır.')]
    private ?string $title = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['task:read'])]
    private ?string $description = null;

    #[ORM\Column(length: 50)]
    #[Groups(['task:read'])]
    #[Assert\Choice(choices: ['low', 'medium', 'high'], message: 'Öncelik low, medium veya high olmalıdır.')]
    private ?string $priority = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['task:read'])]
    private ?\DateTimeImmutable $dueDate = null;

    #[ORM\Column]
    #[Groups(['task:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column]
    #[Groups(['task:read'])]
    private ?int $position = null;

    #[ORM\ManyToOne(targetEntity: Column::class)]
    #[ORM\JoinColumn(nullable: false, onDelete:'CASCADE')]
    #[Groups(['task:read', 'notification:read'])]
    private ?Column $column = null;

    #[ORM\Column(length: 20)]
    #[Groups(['task:read'])]
    private ?string $color = null;

    /**
     * @var Collection<int, TaskAssignment>
     */
    #[ORM\OneToMany(mappedBy: 'task', targetEntity: TaskAssignment::class)]
    #[Groups(['task:read'])]
    private Collection $assignments;

    /**
     * @var Collection <int, Label>
     */
    #[ORM\ManyToMany(targetEntity: Label::class, inversedBy: 'tasks')]
    #[ORM\JoinTable(name: 'task_label')]
    #[Groups(['task:read'])]
    private Collection $labels;

    /**
     * @var Collection<int, ChecklistItem>
     */
    #[ORM\OneToMany(targetEntity: ChecklistItem::class, mappedBy: 'task', cascade: ['persist', 'remove'])]
    #[ORM\OrderBy(['position' => 'ASC'])]
    #[Groups(['task:read'])]
    private Collection $checklistItems;
    

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function setTitle(string $title): static
    {
        $this->title = $title;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;

        return $this;
    }

    public function getPriority(): ?string
    {
        return $this->priority;
    }

    public function setPriority(string $priority): static
    {
        $this->priority = $priority;

        return $this;
    }

    public function getDueDate(): ?\DateTimeImmutable
    {
        return $this->dueDate;
    }

    public function setDueDate(?\DateTimeImmutable $dueDate): static
    {
        $this->dueDate = $dueDate;

        return $this;
    }

    #[Groups(['task:read'])]
    public function getDueDateStatus(): ?string
    {
        if($this->dueDate === null) {
            return null;
        }

        $now = new \DateTimeImmutable();
        $threshold = $now->modify(sprintf('+%d days', self::DUE_SOON_THRESHOLD_DAYS));
    
        if($this->dueDate < $now){
            return 'overdue';
        }

        if($this->dueDate <= $threshold) {
            return 'soon';
        }

        return null;
        
    }


    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
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

    public function getColumn(): ?Column
    {
        return $this->column;
    }

    public function setColumn(Column $column): static
    {
        $this->column = $column;
        return $this;
    }

    public function getProject(): Project
    {
        return $this->getColumn()->getBoard()->getProject();
    }

    public function getBoard(): Board
    {
        return $this->getColumn()->getBoard();
    }

    public function getWorkspace(): Workspace
    {
        return $this->getProject()->getWorkspace();
    }

    public function getColor(): ?string
    {
        return $this->color;
    }

    public function setColor(string $color): static
    {
        $this->color = $color;
        return $this;
    }

    /**
     * @return Collection<int, TaskAssignment>
     */
    public function getAssignments(): Collection
    {
        return $this->assignments;
    }


    /**
     * @return Collection<int, Label>
     */
    public function getLabels(): Collection
    {
        return $this->labels;
    }

    public function addLabel(Label $label): static
    {
        if (!$this->labels->contains($label)) {
            $this->labels->add($label);
        }
        return $this;
    }

    public function removeLabel(Label $label): static
    {
        $this->labels->removeElement($label);

        return $this;
    }
}
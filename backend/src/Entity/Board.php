<?php

namespace App\Entity;

use App\Repository\BoardRepository;
use Doctrine\ORM\Mapping as ORM;
use App\Entity\Column;
use Doctrine\Common\Collections\Collection;
use Doctrine\Common\Collections\ArrayCollection;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: BoardRepository::class)]
class Board
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['board:read', 'column:read', 'notification:read'])]
    private ?int $id = null;

    public function __construct()
    {
        $this->columns = new ArrayCollection();
    }

    #[ORM\Column(length: 255)]
    #[Groups(['board:read', 'column:read'])]
    #[Assert\NotBlank(message: 'Board adı zorunludur.')]
    #[Assert\Length(min: 2, max: 255, minMessage: 'Board adı en az 2 karakter olmalıdır.')]
    private ?string $name = null;

    #[ORM\ManyToOne(targetEntity: Project::class)]
    #[ORM\JoinColumn(nullable:false, onDelete:'CASCADE')]
    #[Groups(['board:read'])]
    private ?Project $project=null;

    /**
     * @var Collection<int, Column>
     */
    #[ORM\OneToMany(mappedBy: 'board', targetEntity: Column::class)]
    private Collection $columns;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;

        return $this;
    }

    public function getProject(): ?Project
    {
        return $this->project;
    }

    public function setProject(Project $project): static
    {
        $this->project = $project;
        
        return $this;
    }

    public function getWorkspace(): Workspace
    {
        return $this->getProject()->getWorkspace();
    }

    public function getColumns(): Collection
    {
        return $this->columns;
    }
}

<?php

namespace App\Entity;

use App\Repository\ProjectRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use App\Entity\Workspace;
use App\Entity\Board;
use Doctrine\Common\Collections\Collection;
use Doctrine\Common\Collections\ArrayCollection;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;


#[ORM\Entity(repositoryClass: ProjectRepository::class)]
class Project
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['project:read', 'board:read'])]
    private ?int $id = null;

    public function __construct()
    {
        $this->boards = new ArrayCollection();
    }

    #[ORM\Column(length: 255)]
    #[Groups(['project:read', 'board:read'])]
    #[Assert\NotBlank(message: 'Proje adı zorunludur.')]
    #[Assert\Length(min: 2, max: 255, minMessage: 'Proje adı en az 2 karakter olmalıdır.')]
    private ?string $name = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['project:read', 'board:read'])]
    private ?string $description = null;

    #[ORM\ManyToOne(targetEntity: Workspace::class)]
    #[ORM\JoinColumn(nullable:false, onDelete:'CASCADE')]
    #[Groups(['project:read', 'board:read'])]
    private ?Workspace $workspace = null;


    /**
     * @var Collection<int, Board>
     */
    #[ORM\OneToMany(mappedBy: 'project', targetEntity: Board::class)]
    private Collection $boards;


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

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;

        return $this;
    }

    public function getWorkspace(): ?Workspace
    {
        return $this->workspace;
    }

    public function setWorkspace(Workspace $workspace): static
    {
        $this->workspace = $workspace;
        
        return $this;
    }

    public function getBoards(): Collection
    {
        return $this->boards;
    }
    
}

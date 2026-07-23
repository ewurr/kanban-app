<?php

namespace App\Entity;

use App\Repository\ColumnRepository;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\Collection;
use Doctrine\Common\Collections\ArrayCollection;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;


#[ORM\Entity(repositoryClass: ColumnRepository::class)]
#[ORM\Table(name: '`column`')]
class Column
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['column:read', 'task:read'])]
    private ?int $id = null;

    public function __construct()
    {
        $this->tasks = new ArrayCollection();
    }

    #[ORM\Column(length: 255)]
    #[Groups(['column:read', 'task:read'])]
    #[Assert\NotBlank(message: 'Sütun adı zorunludur.')]
    private ?string $name = null;

    #[ORM\Column]
    #[Groups(['column:read', 'task:read'])]
    #[Assert\PositiveOrZero(message: 'Pozisyon negatif olamaz.')]
    private ?int $position = null;

    #[ORM\ManyToOne(targetEntity: Board::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['column:read'])]
    private ?Board $board = null;

    /**
     * @var Collection<int, Task>
     */
    #[ORM\OneToMany(mappedBy: 'column', targetEntity: Task::class)]
    private Collection $tasks;


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

    public function getPosition(): ?int
    {
        return $this->position;
    }

    public function setPosition(int $position): static
    {
        $this->position = $position;

        return $this;
    }

    public function getBoard(): ?Board
    {
        return $this->board;
    }

    public function setBoard(Board $board): static
    {
        $this->board = $board;
        return $this;
    }

    public function getTasks(): Collection
    {
        return $this->tasks;
    }
}

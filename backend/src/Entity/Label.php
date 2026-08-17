<?php

namespace App\Entity;

use App\Repository\LabelRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: LabelRepository::class)]
class Label
{
    public const ALLOWED_COLORS = [
        '#E53935', // kırmızı
        '#FB8C00', // turuncu
        '#FDD835', // sarı
        '#43A047', // yeşil
        '#00ACC1', // camgöbeği
        '#1E88E5', // mavi
        '#8E24AA', // mor
        '#6D4C41', // kahverengi
    ];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['label:read', 'task:read'])]
    private ?int $id = null;

    public function __construct()
    {
        $this->tasks = new ArrayCollection();
    }

    #[ORM\Column(length: 50)]
    #[Groups(['label:read', 'task:read'])]
    #[Assert\NotBlank(message: 'Etiket adı zorunludur.')]
    #[Assert\Length(min: 1, max: 50, minMessage: 'Etiket adı en az 1 karakter olmalıdır.')]
    private ?string $name = null;

    #[ORM\Column(length: 20)]
    #[Groups(['label:read', 'task:read'])]
    #[Assert\Choice(choices: Label::ALLOWED_COLORS, message: 'Geçersiz etiket rengi.')]
    private ?string $color = null;

    #[ORM\ManyToOne(targetEntity: Board::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Groups(['label:read'])]
    private ?Board $board = null;

    /**
     * @var Collection<int, Task>
     */
    #[ORM\ManyToMany(targetEntity: Task::class, mappedBy: 'labels')]
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

    public function getColor(): ?string
    {
        return $this->color;
    }

    public function setColor(string $color): static
    {
        $this->color = $color;

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

    public function getWorkspace(): Workspace
    {
        return $this->getBoard()->getProject()->getWorkspace();
    }
}
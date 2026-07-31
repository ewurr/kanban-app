<?php

namespace App\Entity;

use App\Repository\WorkspaceRepository;
use Doctrine\ORM\Mapping as ORM;
use App\Entity\User;
use App\Entity\WorkspaceMember;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use App\Entity\Project;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: WorkspaceRepository::class)]
class Workspace
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['workspace:read', 'project:read', 'board:read'])]
    private ?int $id = null;

    public function __construct()
    {
        $this->workspaceMembers = new ArrayCollection();
        $this->projects = new ArrayCollection();
    }

    #[ORM\Column(length: 255)]
    #[Groups(['workspace:read', 'project:read', 'board:read'])]
    #[Assert\NotBlank(message: 'İsim alanı zorunludur.')]
    #[Assert\Length(min: 2, max: 255, minMessage: 'İsim en az 2 karakter olmalıdır.')]
    private ?string $name = null;


    /**
     * @var Collection<int, WorkspaceMember>
     */
    #[ORM\OneToMany(mappedBy:'workspace', targetEntity:WorkspaceMember::class)]  
    #[Groups(['workspace:read'])]
    private Collection $workspaceMembers;


    /**
     * @var Collection<int, Project>
     */
    #[ORM\OneToMany(mappedBy: 'workspace', targetEntity: Project::class)]
    private Collection $projects;

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

    /**
     * @return Collection<int, WorkspaceMember>
     */
    public function getWorkspaceMembers(): Collection
    {
        return $this->workspaceMembers;
    }
    

    /**
     * @return Collection<int, Project>
     */
    public function getProjects(): Collection
    {
        return $this->projects;
    }
}

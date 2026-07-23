<?php

namespace App\Entity;

use App\Repository\WorkspaceRepository;
use Doctrine\ORM\Mapping as ORM;
use App\Entity\User;
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
    #[Groups(['workspace:read', 'project:read'])]
    private ?int $id = null;

    public function __construct()
    {
        $this->members = new ArrayCollection();
        $this->projects = new ArrayCollection();
    }

    #[ORM\Column(length: 255)]
    #[Groups(['workspace:read', 'project:read'])]
    #[Assert\NotBlank(message: 'İsim alanı zorunludur.')]
    #[Assert\Length(min: 2, max: 255, minMessage: 'İsim en az 2 karakter olmalıdır.')]
    private ?string $name = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['workspace:read'])]
    private ?User $owner = null;

    #[ORM\ManyToMany(targetEntity: User::class)]
    private Collection $members;

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

    public function getOwner(): ?User 
    {
        return $this->owner;
    }

    public function setOwner(User $owner): static
    {
        $this->owner = $owner;
        return $this;
    }

    /**
     * @return Collection<int, User>
     */
    public function getMembers() :Collection
    {
        return $this->members;
    }

    public function addMember(User $member) : static
    {
        if(!$this->members->contains($member)){
            $this->members->add($member);
        }

        return $this;
    }

    public function removeMember (User $member): static
    {
        $this->members->removeElement($member);

        return $this;
    }


    /**
     * @return Collection<int, Project>
     */
    public function getProjects(): Collection
    {
        return $this->projects;
    }
}

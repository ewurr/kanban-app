<?php

namespace App\Entity;

use App\Repository\PasswordResetTokenRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * Şifre sıfırlama tokeni.
 *
 * Güvenlik notları:
 * - tokenHash: gerçek token'ın SHA-256 hash'i. Emailde giden token
 *   sadece kullanıcıda ve emailde var; DB sızarsa aktif token
 *   yeniden inşa edilemez.
 * - expiresAt: 1 saatlik yaşam süresi.
 * - usedAt: bir kez kullanılınca damgalanır, tekrar kullanılamaz.
 */
#[ORM\Entity(repositoryClass: PasswordResetTokenRepository::class)]
#[ORM\Table(name: 'password_reset_token')]
#[ORM\Index(name: 'idx_token_hash', columns: ['token_hash'])]
class PasswordResetToken
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 64, unique: true)]
    private string $tokenHash;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private User $user;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $expiresAt;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $usedAt = null;

    public function __construct(User $user, string $tokenHash, \DateTimeImmutable $expiresAt)
    {
        $this->user = $user;
        $this->tokenHash = $tokenHash;
        $this->createdAt = new \DateTimeImmutable();
        $this->expiresAt = $expiresAt;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTokenHash(): string
    {
        return $this->tokenHash;
    }

    public function getUser(): User
    {
        return $this->user;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getExpiresAt(): \DateTimeImmutable
    {
        return $this->expiresAt;
    }

    public function getUsedAt(): ?\DateTimeImmutable
    {
        return $this->usedAt;
    }

    /**
     * Token'ı geçerli mi? Hem süresi dolmamış hem de kullanılmamış olmalı.
     */
    public function isValid(): bool
    {
        return $this->usedAt === null && $this->expiresAt > new \DateTimeImmutable();
    }

    /**
     * Token'ı "kullanılmış" olarak damgala. Bir kez kullanılınca tekrar geçmesin.
     */
    public function markAsUsed(): void
    {
        $this->usedAt = new \DateTimeImmutable();
    }
}
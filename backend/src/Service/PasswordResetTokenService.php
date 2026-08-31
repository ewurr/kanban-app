<?php

namespace App\Service;

use App\Entity\PasswordResetToken;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;

class PasswordResetTokenService
{
    private const TOKEN_LIFETIME_SECONDS = 3600;
 
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
    ){}


    /**
     * Bir kullanıcı için yeni token üretir.
     * Plain token'ı (emaile göndermek için) DB'ye HASH'ini kaydettikten sonra döndürür.
     *
     * @return string Plain token — sadece emailde gidecek, asla loglanmamalı.
     */
    public function createTokenForUser(User $user): string
    {
        $plainToken = bin2hex(random_bytes(32));
        
        $tokenHash = hash('sha256', $plainToken);

        $expiresAt = (new \DateTimeImmutable())->modify('+' . self::TOKEN_LIFETIME_SECONDS . 'seconds');

        $token = new PasswordResetToken($user, $tokenHash, $expiresAt);

        $this->entityManager->persist($token);
        $this->entityManager->flush();

        return $plainToken;

    }

    /**
     * Kullanıcının gönderdiği plain token'ı DB'deki geçerli bir token ile eşleştirir.
     * Bulur ve geçerliyse token entity'sini döner; aksi halde null.
     *
     * Not: kullanıldı olarak damgalama BURADA yapılmıyor — çağıran (controller)
     * şifre değişikliği başarılı olduktan sonra markAsUsed() çağırır.
     */
    public function validateToken(string $plainToken): ?PasswordResetToken
    {
        $tokenHash = hash('sha256', $plainToken);

        $token = $this->entityManager->getRepository(PasswordResetToken::class)
            ->findOneBy(['tokenHash' => $tokenHash]);

        if ($token === null || !$token->isValid()) {
            return null;
        }

        return $token;
    } 
}
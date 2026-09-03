<?php

namespace App\Tests\Controller;

use App\Entity\User;
use App\Service\PasswordResetTokenService;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class PasswordResetControllerTest extends WebTestCase
{
    /**
     * Test kullanıcısı oluşturur ve döner. Şifre sabit 'eskiSifre123'.
     */
    private function createTestUser(\Symfony\Bundle\FrameworkBundle\KernelBrowser $client, string $email): User
    {
        $container = static::getContainer();
        $entityManager = $container->get('doctrine')->getManager();
        /** @var UserPasswordHasherInterface $passwordHasher */
        $passwordHasher = $container->get(UserPasswordHasherInterface::class);

        $user = new User();
        $user->setEmail($email);
        $user->setName('Test');
        $user->setSurname('Kullanıcı');
        $user->setPassword($passwordHasher->hashPassword($user, 'eskiSifre123'));

        $entityManager->persist($user);
        $entityManager->flush();

        return $user;
    }

    // ---------- forgot-password ----------

    public function testForgotPasswordWithExistingEmailReturnsGenericMessage(): void
    {
        $client = static::createClient();
        $email = 'forgot-' . uniqid() . '@example.com';
        $this->createTestUser($client, $email);

        $client->request('POST', '/api/forgot-password', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'email' => $email,
        ]));

        $this->assertResponseStatusCodeSame(200);
        $responseData = json_decode($client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('message', $responseData);
    }

    public function testForgotPasswordWithUnknownEmailReturnsSameGenericMessage(): void
    {
        // Güvenlik: var olmayan email de aynı 200 + aynı mesajı dönmeli,
        // yoksa mesaj farkından hangi emaillerin kayıtlı olduğu sızdırılabilir.
        $client = static::createClient();

        $client->request('POST', '/api/forgot-password', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'email' => 'hicbir-zaman-kayitli-olmayan-' . uniqid() . '@example.com',
        ]));

        $this->assertResponseStatusCodeSame(200);
        $responseData = json_decode($client->getResponse()->getContent(), true);
        $this->assertEquals(
            'Eğer bu email kayıtlıysa, sıfırlama linki gönderildi.',
            $responseData['message']
        );
    }

    public function testForgotPasswordWithEmptyEmailReturnsGenericMessage(): void
    {
        $client = static::createClient();

        $client->request('POST', '/api/forgot-password', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'email' => '',
        ]));

        $this->assertResponseStatusCodeSame(200);
    }

    public function testForgotPasswordCreatesTokenInDatabase(): void
    {
        $client = static::createClient();
        $email = 'tokencheck-' . uniqid() . '@example.com';
        $user = $this->createTestUser($client, $email);

        $client->request('POST', '/api/forgot-password', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'email' => $email,
        ]));

        $this->assertResponseStatusCodeSame(200);

        $container = static::getContainer();
        $entityManager = $container->get('doctrine')->getManager();
        $token = $entityManager->getRepository(\App\Entity\PasswordResetToken::class)
            ->findOneBy(['user' => $user]);

        $this->assertNotNull($token);
        $this->assertNull($token->getUsedAt());
        $this->assertTrue($token->isValid());
    }

    // ---------- reset-password ----------

    public function testResetPasswordWithValidTokenSucceeds(): void
    {
        $client = static::createClient();
        $email = 'resetok-' . uniqid() . '@example.com';
        $user = $this->createTestUser($client, $email);

        $container = static::getContainer();
        /** @var PasswordResetTokenService $tokenService */
        $tokenService = $container->get(PasswordResetTokenService::class);
        $plainToken = $tokenService->createTokenForUser($user);

        $client->request('POST', '/api/reset-password', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'token' => $plainToken,
            'password' => 'yeniSifre456',
        ]));

        $this->assertResponseStatusCodeSame(200);

        // Yeni şifreyle login çalışmalı
        $client->request('POST', '/api/login_check', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'email' => $email,
            'password' => 'yeniSifre456',
        ]));
        $this->assertResponseStatusCodeSame(200);
        $loginData = json_decode($client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('token', $loginData);
    }

    public function testResetPasswordMarksTokenAsUsed(): void
    {
        $client = static::createClient();
        $email = 'markused-' . uniqid() . '@example.com';
        $user = $this->createTestUser($client, $email);

        $container = static::getContainer();
        /** @var PasswordResetTokenService $tokenService */
        $tokenService = $container->get(PasswordResetTokenService::class);
        $plainToken = $tokenService->createTokenForUser($user);

        $client->request('POST', '/api/reset-password', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'token' => $plainToken,
            'password' => 'yeniSifre456',
        ]));
        $this->assertResponseStatusCodeSame(200);

        $entityManager = $container->get('doctrine')->getManager();
        $entityManager->clear(); // identity map'i temizle, DB'den taze oku
        $token = $entityManager->getRepository(\App\Entity\PasswordResetToken::class)
            ->findOneBy(['user' => $user]);

        $this->assertNotNull($token->getUsedAt());
        $this->assertFalse($token->isValid());
    }

    public function testResetPasswordWithAlreadyUsedTokenFails(): void
    {
        // Replay saldırısı: aynı token iki kez kullanılmaya çalışılıyor.
        $client = static::createClient();
        $email = 'replay-' . uniqid() . '@example.com';
        $user = $this->createTestUser($client, $email);

        $container = static::getContainer();
        /** @var PasswordResetTokenService $tokenService */
        $tokenService = $container->get(PasswordResetTokenService::class);
        $plainToken = $tokenService->createTokenForUser($user);

        // İlk kullanım — başarılı olmalı
        $client->request('POST', '/api/reset-password', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'token' => $plainToken,
            'password' => 'ilkSifre123',
        ]));
        $this->assertResponseStatusCodeSame(200);

        // İkinci kullanım — aynı token, reddedilmeli
        $client->request('POST', '/api/reset-password', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'token' => $plainToken,
            'password' => 'ikinciSifre456',
        ]));
        $this->assertResponseStatusCodeSame(400);
    }

    public function testResetPasswordWithExpiredTokenFails(): void
    {
        $client = static::createClient();
        $email = 'expired-' . uniqid() . '@example.com';
        $user = $this->createTestUser($client, $email);

        $container = static::getContainer();
        $entityManager = $container->get('doctrine')->getManager();

        // Token'ı doğrudan, süresi zaten dolmuş şekilde oluşturuyoruz
        // (servis üzerinden değil — servis her zaman +1 saat üretir).
        $plainToken = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $plainToken);
        $expiredAt = (new \DateTimeImmutable())->modify('-1 hour');

        $token = new \App\Entity\PasswordResetToken($user, $tokenHash, $expiredAt);
        $entityManager->persist($token);
        $entityManager->flush();

        $client->request('POST', '/api/reset-password', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'token' => $plainToken,
            'password' => 'yeniSifre456',
        ]));

        $this->assertResponseStatusCodeSame(400);
    }

    public function testResetPasswordWithInvalidTokenFails(): void
    {
        $client = static::createClient();

        $client->request('POST', '/api/reset-password', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'token' => 'hicbir-zaman-var-olmamis-bir-token-' . uniqid(),
            'password' => 'yeniSifre456',
        ]));

        $this->assertResponseStatusCodeSame(400);
    }

    public function testResetPasswordWithShortPasswordFails(): void
    {
        $client = static::createClient();
        $email = 'shortpw-' . uniqid() . '@example.com';
        $user = $this->createTestUser($client, $email);

        $container = static::getContainer();
        /** @var PasswordResetTokenService $tokenService */
        $tokenService = $container->get(PasswordResetTokenService::class);
        $plainToken = $tokenService->createTokenForUser($user);

        $client->request('POST', '/api/reset-password', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'token' => $plainToken,
            'password' => '123',
        ]));

        $this->assertResponseStatusCodeSame(400);
    }

    public function testResetPasswordWithShortPasswordDoesNotConsumeToken(): void
    {
        // Kısa şifre yüzünden başarısız olan istek, token'ı yakmamalı —
        // kullanıcı aynı linkle tekrar deneyebilmeli.
        $client = static::createClient();
        $email = 'shortpw-notconsumed-' . uniqid() . '@example.com';
        $user = $this->createTestUser($client, $email);

        $container = static::getContainer();
        /** @var PasswordResetTokenService $tokenService */
        $tokenService = $container->get(PasswordResetTokenService::class);
        $plainToken = $tokenService->createTokenForUser($user);

        $client->request('POST', '/api/reset-password', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'token' => $plainToken,
            'password' => '123',
        ]));
        $this->assertResponseStatusCodeSame(400);

        // Aynı token'la, bu sefer geçerli şifreyle tekrar dene — başarılı olmalı
        $client->request('POST', '/api/reset-password', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'token' => $plainToken,
            'password' => 'gecerliSifre789',
        ]));
        $this->assertResponseStatusCodeSame(200);
    }
}
<?php

namespace App\Tests\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class LoginTest extends WebTestCase
{
    private function registerTestUser(mixed $client, string $email, string $password): void
    {
        $client->request('POST', '/api/register', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'email' => $email,
            'password' => $password,
            'name' => 'Login',
            'surname' => 'Test',
        ]));
    }

    public function testLoginWithValidCredentialsSucceeds(): void
    {
        $client = static::createClient();

        $this->registerTestUser($client, 'logintest1@example.com', 'sifre1234');

        $client->request('POST', '/api/login_check', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'email' => 'logintest1@example.com',
            'password' => 'sifre1234',
        ]));

        $this->assertResponseStatusCodeSame(200);

        $responseData = json_decode($client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('token', $responseData);
    }

    public function testLoginWithWrongPasswordFails(): void
    {
        $client = static::createClient();

        $this->registerTestUser($client, 'logintest2@example.com', 'dogruSifre123');

        $client->request('POST', '/api/login_check', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'email' => 'logintest2@example.com',
            'password' => 'yanlisSifre999',
        ]));

        $this->assertResponseStatusCodeSame(401);
    }

    public function testLoginWithNonExistentEmailFails(): void
    {
        $client = static::createClient();

        $client->request('POST', '/api/login_check', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'email' => 'hicbiryerde-yok@example.com',
            'password' => 'herhangibirsifre',
        ]));

        $this->assertResponseStatusCodeSame(401);
    }
}
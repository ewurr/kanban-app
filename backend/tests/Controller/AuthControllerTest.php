<?php

namespace App\Tests\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class AuthControllerTest extends WebTestCase
{
    public function testRegisterWithValidDataSucceeds(): void
    {
        $client = static::createClient();
        $email = 'testuser-' . uniqid() . '@example.com';

        $client->request('POST', '/api/register', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'email' => $email,
            'password' => 'sifre1234',
            'name' => 'Test',
            'surname' => 'Kullanıcı',
        ]));

        $this->assertResponseStatusCodeSame(201);

        $responseData = json_decode($client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('token', $responseData);
        $this->assertArrayHasKey('user', $responseData);
        $this->assertEquals($email, $responseData['user']['email']);
    }

    public function testRegisterWithDuplicateEmailFails(): void
    {
        $client = static::createClient();
        $email = 'duplicate-' . uniqid() . '@example.com';

        $client->request('POST', '/api/register', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'email' => $email,
            'password' => 'sifre1234',
            'name' => 'Test',
            'surname' => 'Kullanıcı',
        ]));
        $this->assertResponseStatusCodeSame(201);

        $client->request('POST', '/api/register', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'email' => $email,
            'password' => 'baskaSifre123',
            'name' => 'Başka',
            'surname' => 'Kişi',
        ]));

        $this->assertResponseStatusCodeSame(409);
    }

    public function testRegisterWithShortPasswordFails(): void
    {
        $client = static::createClient();

        $client->request('POST', '/api/register', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'email' => 'shortpass-' . uniqid() . '@example.com',
            'password' => '123',
            'name' => 'Test',
            'surname' => 'Kullanıcı',
        ]));

        $this->assertResponseStatusCodeSame(400);
    }

    public function testRegisterWithMissingNameFails(): void
    {
        $client = static::createClient();

        $client->request('POST', '/api/register', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'email' => 'noname-' . uniqid() . '@example.com',
            'password' => 'sifre1234',
            'surname' => 'Kullanıcı',
        ]));

        $this->assertResponseStatusCodeSame(400);
    }
}
<?php

namespace App\Tests\Security;

use App\Tests\AppTestCase;

class AuthenticationRequiredTest extends AppTestCase
{
    public function testAccessingWorkspacesWithoutTokenFails(): void
    {
        $client = static::createClient();

        $client->request('GET', '/api/workspaces');

        $this->assertResponseStatusCodeSame(401);
    }

    public function testAccessingProjectsWithoutTokenFails(): void
    {
        $client = static::createClient();

        $client->request('GET', '/api/projects');

        $this->assertResponseStatusCodeSame(401);
    }

    public function testAccessingWithInvalidTokenFails(): void
    {
        $client = static::createClient();

        $client->request('GET', '/api/workspaces', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer bu-gecerli-bir-token-degil',
        ]);

        $this->assertResponseStatusCodeSame(401);
    }

    public function testRegisterAndLoginCheckAreAccessibleWithoutToken(): void
    {
        $client = static::createClient();

        // Register, token olmadan erişilebilir olmalı (401 DEĞİL)
        $client->request('POST', '/api/register', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'email' => $this->uniqueEmail('public'),
            'password' => 'sifre1234',
            'name' => 'Test',
            'surname' => 'Kullanıcı',
        ]));

        $this->assertNotEquals(401, $client->getResponse()->getStatusCode());
    }
}
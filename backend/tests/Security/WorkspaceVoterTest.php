<?php

namespace App\Tests\Security;

use App\Tests\AppTestCase;

class WorkspaceVoterTest extends AppTestCase
{
    public function testWorkerCannotCreateProject(): void
    {
        $client = static::createClient();

        $ownerEmail = $this->uniqueEmail('owner');
        $workerEmail = $this->uniqueEmail('worker');

        $owner = $this->createUser($ownerEmail);
        $worker = $this->createUser($workerEmail);
        $workspace = $this->createWorkspaceWithOwner($owner);
        $this->addMember($workspace, $worker, \App\Enum\WorkspaceRole::WORKER);

        $workerToken = $this->loginAndGetToken($client, $workerEmail);

        $client->request('POST', '/api/projects', [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $workerToken,
        ], json_encode([
            'workspaceId' => $workspace->getId(),
            'name' => 'Worker\'ın Denemesi',
        ]));

        $this->assertResponseStatusCodeSame(403);
    }

    public function testOwnerCanCreateProject(): void
    {
        $client = static::createClient();

        $ownerEmail = $this->uniqueEmail('owner');
        $owner = $this->createUser($ownerEmail);
        $workspace = $this->createWorkspaceWithOwner($owner);

        $ownerToken = $this->loginAndGetToken($client, $ownerEmail);

        $client->request('POST', '/api/projects', [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $ownerToken,
        ], json_encode([
            'workspaceId' => $workspace->getId(),
            'name' => 'Owner\'ın Projesi',
        ]));

        $this->assertResponseStatusCodeSame(201);
    }

    public function testPmCanCreateBoardButWorkerCannot(): void
    {
        $client = static::createClient();

        $ownerEmail = $this->uniqueEmail('owner');
        $pmEmail = $this->uniqueEmail('pm');
        $workerEmail = $this->uniqueEmail('worker');

        $owner = $this->createUser($ownerEmail);
        $pm = $this->createUser($pmEmail);
        $worker = $this->createUser($workerEmail);

        $workspace = $this->createWorkspaceWithOwner($owner);
        $this->addMember($workspace, $pm, \App\Enum\WorkspaceRole::PM);
        $this->addMember($workspace, $worker, \App\Enum\WorkspaceRole::WORKER);

        // Owner ile bir proje oluşturalım (board'un bağlanacağı proje)
        $ownerToken = $this->loginAndGetToken($client, $ownerEmail);
        $client->request('POST', '/api/projects', [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $ownerToken,
        ], json_encode(['workspaceId' => $workspace->getId(), 'name' => 'Test Projesi']));
        $projectData = json_decode($client->getResponse()->getContent(), true);
        $projectId = $projectData['id'];

        // PM board oluşturmayı dener — başarılı olmalı
        $pmToken = $this->loginAndGetToken($client, $pmEmail);
        $client->request('POST', '/api/boards', [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $pmToken,
        ], json_encode(['projectId' => $projectId, 'name' => 'PM\'in Board\'u']));
        $this->assertResponseStatusCodeSame(201, 'PM board oluşturabilmeli');

        // Worker board oluşturmayı dener — 403 almalı
        $workerToken = $this->loginAndGetToken($client, $workerEmail);
        $client->request('POST', '/api/boards', [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $workerToken,
        ], json_encode(['projectId' => $projectId, 'name' => 'Worker\'ın Denemesi']));
        $this->assertResponseStatusCodeSame(403, 'Worker board oluşturamamalı');
    }
}
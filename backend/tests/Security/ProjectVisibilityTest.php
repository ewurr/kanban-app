<?php

namespace App\Tests\Security;

use App\Tests\AppTestCase;
use App\Enum\WorkspaceRole;

class ProjectVisibilityTest extends AppTestCase
{
    public function testWorkerCannotSeeProjectWithoutTaskAssignment(): void
    {
        $client = static::createClient();

        $ownerEmail = $this->uniqueEmail('owner');
        $workerEmail = $this->uniqueEmail('worker');

        $owner = $this->createUser($ownerEmail);
        $worker = $this->createUser($workerEmail);
        $workspace = $this->createWorkspaceWithOwner($owner);
        $this->addMember($workspace, $worker, WorkspaceRole::WORKER);

        $ownerToken = $this->loginAndGetToken($client, $ownerEmail);

        // Owner bir proje oluşturuyor, worker'a HİÇ task atanmıyor
        $client->request('POST', '/api/projects', [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $ownerToken,
        ], json_encode(['workspaceId' => $workspace->getId(), 'name' => 'Gizli Proje']));
        $projectId = json_decode($client->getResponse()->getContent(), true)['id'];

        // Worker bu projeye erişmeyi dener — 403 almalı
        $workerToken = $this->loginAndGetToken($client, $workerEmail);
        $client->request('GET', "/api/projects/{$projectId}", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $workerToken,
        ]);
        $this->assertResponseStatusCodeSame(403);

        // Worker'ın proje listesinde de bu proje GÖRÜNMEMELİ
        $client->request('GET', '/api/projects', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $workerToken,
        ]);
        $projects = json_decode($client->getResponse()->getContent(), true);
        $projectIds = array_column($projects, 'id');
        $this->assertNotContains($projectId, $projectIds);
    }

    public function testWorkerCanSeeProjectAfterTaskAssignment(): void
    {
        $client = static::createClient();

        $ownerEmail = $this->uniqueEmail('owner');
        $workerEmail = $this->uniqueEmail('worker');

        $owner = $this->createUser($ownerEmail);
        $worker = $this->createUser($workerEmail);
        $workspace = $this->createWorkspaceWithOwner($owner);
        $this->addMember($workspace, $worker, WorkspaceRole::WORKER);

        $ownerToken = $this->loginAndGetToken($client, $ownerEmail);

        // Owner: proje, board, column, task oluştur
        $client->request('POST', '/api/projects', [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $ownerToken,
        ], json_encode(['workspaceId' => $workspace->getId(), 'name' => 'Görünür Proje']));
        $projectId = json_decode($client->getResponse()->getContent(), true)['id'];

        $client->request('POST', '/api/boards', [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $ownerToken,
        ], json_encode(['projectId' => $projectId, 'name' => 'Board']));
        $boardId = json_decode($client->getResponse()->getContent(), true)['id'];

        $client->request('POST', '/api/columns', [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $ownerToken,
        ], json_encode(['boardId' => $boardId, 'name' => 'To Do', 'position' => 0]));
        $columnId = json_decode($client->getResponse()->getContent(), true)['id'];

        $client->request('POST', '/api/tasks', [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $ownerToken,
        ], json_encode(['columnId' => $columnId, 'title' => 'Task', 'priority' => 'medium', 'position' => 0]));
        $taskId = json_decode($client->getResponse()->getContent(), true)['id'];

        // Worker'ı task'a ata
        $client->request('POST', "/api/tasks/{$taskId}/assignees", [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $ownerToken,
        ], json_encode(['userId' => $worker->getId()]));
        $this->assertResponseStatusCodeSame(201);

        // Artık worker bu projeye erişebilmeli
        $workerToken = $this->loginAndGetToken($client, $workerEmail);
        $client->request('GET', "/api/projects/{$projectId}", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $workerToken,
        ]);
        $this->assertResponseStatusCodeSame(200);
    }

    public function testOwnerAlwaysSeesAllProjects(): void
    {
        $client = static::createClient();

        $ownerEmail = $this->uniqueEmail('owner');
        $owner = $this->createUser($ownerEmail);
        $workspace = $this->createWorkspaceWithOwner($owner);
        $token = $this->loginAndGetToken($client, $ownerEmail);

        // Owner, hiç task ataması yapmadan bir proje oluşturuyor
        $client->request('POST', '/api/projects', [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['workspaceId' => $workspace->getId(), 'name' => 'Owner Projesi']));
        $projectId = json_decode($client->getResponse()->getContent(), true)['id'];

        // Owner kendi projesine (hiç task'ı olmasa bile) erişebilmeli
        $client->request('GET', "/api/projects/{$projectId}", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ]);
        $this->assertResponseStatusCodeSame(200);
    }
}
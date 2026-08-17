<?php

namespace App\Tests\Controller;

use App\Tests\AppTestCase;

class TaskWorkspaceScopeTest extends AppTestCase
{
    /**
     * Bir workspace içinde bir proje + board + column oluşturur, board ID'sini döner.
     */
    private function seedBoard(mixed $client, string $token, int $workspaceId): int
    {
        $client->request('POST', '/api/projects', [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['workspaceId' => $workspaceId, 'name' => 'Proje']));
        $projectId = json_decode($client->getResponse()->getContent(), true)['id'];

        $client->request('POST', '/api/boards', [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['projectId' => $projectId, 'name' => 'Board']));
        $boardId = json_decode($client->getResponse()->getContent(), true)['id'];

        $client->request('POST', '/api/columns', [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['boardId' => $boardId, 'name' => 'Col', 'position' => 0]));

        return $boardId;
    }

    private function seedTask(mixed $client, string $token, int $boardId, string $title): int
    {
        $client->request('GET', "/api/columns?boardId={$boardId}", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ]);
        $columns = json_decode($client->getResponse()->getContent(), true);
        $columnId = $columns[0]['id'];

        $client->request('POST', '/api/tasks', [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['columnId' => $columnId, 'title' => $title, 'priority' => 'medium', 'position' => 0]));

        return json_decode($client->getResponse()->getContent(), true)['id'];
    }

    // --- 1. Owner, workspace'teki tüm board'ların task'larını görebiliyor ---
    public function testOwnerSeesAllTasksAcrossBoardsInWorkspace(): void
    {
        $client = static::createClient();
        $ownerEmail = $this->uniqueEmail('owner');
        $owner = $this->createUser($ownerEmail);
        $workspace = $this->createWorkspaceWithOwner($owner);
        $token = $this->loginAndGetToken($client, $ownerEmail);

        $boardAId = $this->seedBoard($client, $token, $workspace->getId());
        $boardBId = $this->seedBoard($client, $token, $workspace->getId());

        $this->seedTask($client, $token, $boardAId, 'Board A Task');
        $this->seedTask($client, $token, $boardBId, 'Board B Task');

        $client->request('GET', "/api/tasks?workspaceId={$workspace->getId()}", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ]);

        $this->assertResponseIsSuccessful();
        $tasks = json_decode($client->getResponse()->getContent(), true);
        $titles = array_column($tasks, 'title');

        $this->assertCount(2, $tasks);
        $this->assertContains('Board A Task', $titles);
        $this->assertContains('Board B Task', $titles);
    }

    // --- 2. Farklı workspace'in task'ları karışmıyor ---
    public function testWorkspaceScopeDoesNotLeakOtherWorkspaces(): void
    {
        $client = static::createClient();
        $ownerEmail = $this->uniqueEmail('owner');
        $owner = $this->createUser($ownerEmail);
        $workspaceA = $this->createWorkspaceWithOwner($owner);
        $workspaceB = $this->createWorkspaceWithOwner($owner);
        $token = $this->loginAndGetToken($client, $ownerEmail);

        $boardInA = $this->seedBoard($client, $token, $workspaceA->getId());
        $boardInB = $this->seedBoard($client, $token, $workspaceB->getId());

        $this->seedTask($client, $token, $boardInA, 'A Task');
        $this->seedTask($client, $token, $boardInB, 'B Task');

        $client->request('GET', "/api/tasks?workspaceId={$workspaceA->getId()}", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ]);

        $tasks = json_decode($client->getResponse()->getContent(), true);
        $titles = array_column($tasks, 'title');

        $this->assertCount(1, $tasks);
        $this->assertContains('A Task', $titles);
        $this->assertNotContains('B Task', $titles);
    }

    // --- 3. Worker sadece kendine atanan task'ları görüyor (workspace scope'unda da) ---
    public function testWorkerOnlySeesAssignedTasksInWorkspaceScope(): void
    {
        $client = static::createClient();
        $ownerEmail = $this->uniqueEmail('owner');
        $workerEmail = $this->uniqueEmail('worker');
        $owner = $this->createUser($ownerEmail);
        $worker = $this->createUser($workerEmail);
        $workspace = $this->createWorkspaceWithOwner($owner);

        $ownerToken = $this->loginAndGetToken($client, $ownerEmail);

        // Worker'ı workspace'e ekle
        $client->request('POST', "/api/workspaces/{$workspace->getId()}/members", [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $ownerToken,
        ], json_encode(['email' => $workerEmail, 'role' => 'worker']));

        $boardId = $this->seedBoard($client, $ownerToken, $workspace->getId());
        $assignedTaskId = $this->seedTask($client, $ownerToken, $boardId, 'Assigned Task');
        $this->seedTask($client, $ownerToken, $boardId, 'Unassigned Task');

        // Worker'ı sadece bir task'a ata
        $client->request('POST', "/api/tasks/{$assignedTaskId}/assignees", [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $ownerToken,
        ], json_encode(['userId' => $worker->getId()]));

        $workerToken = $this->loginAndGetToken($client, $workerEmail);

        $client->request('GET', "/api/tasks?workspaceId={$workspace->getId()}", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $workerToken,
        ]);

        $tasks = json_decode($client->getResponse()->getContent(), true);
        $titles = array_column($tasks, 'title');

        $this->assertCount(1, $tasks);
        $this->assertContains('Assigned Task', $titles);
        $this->assertNotContains('Unassigned Task', $titles);
    }

    // --- 4. Yetkisiz kullanıcı başka workspace'in task'larını çekemiyor ---
    public function testUserWithoutMembershipCannotSeeWorkspaceTasks(): void
    {
        $client = static::createClient();
        $ownerEmail = $this->uniqueEmail('owner');
        $strangerEmail = $this->uniqueEmail('stranger');
        $owner = $this->createUser($ownerEmail);
        $stranger = $this->createUser($strangerEmail);
        $workspace = $this->createWorkspaceWithOwner($owner);

        $ownerToken = $this->loginAndGetToken($client, $ownerEmail);
        $strangerToken = $this->loginAndGetToken($client, $strangerEmail);

        $boardId = $this->seedBoard($client, $ownerToken, $workspace->getId());
        $this->seedTask($client, $ownerToken, $boardId, 'Gizli Task');

        $client->request('GET', "/api/tasks?workspaceId={$workspace->getId()}", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $strangerToken,
        ]);

        $this->assertResponseIsSuccessful(); // endpoint hata vermiyor, sadece boş dönüyor
        $tasks = json_decode($client->getResponse()->getContent(), true);
        $this->assertCount(0, $tasks);
    }
}
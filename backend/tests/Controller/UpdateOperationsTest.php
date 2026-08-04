<?php

namespace App\Tests\Controller;

use App\Tests\AppTestCase;
use App\Enum\WorkspaceRole;

class UpdateOperationsTest extends AppTestCase
{
    private function createFullHierarchy(mixed $client, string $token, int $workspaceId): array
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
        ], json_encode(['boardId' => $boardId, 'name' => 'To Do', 'position' => 0]));
        $columnId = json_decode($client->getResponse()->getContent(), true)['id'];

        $client->request('POST', '/api/tasks', [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['columnId' => $columnId, 'title' => 'Görev', 'priority' => 'low', 'position' => 0]));
        $taskId = json_decode($client->getResponse()->getContent(), true)['id'];

        return compact('projectId', 'boardId', 'columnId', 'taskId');
    }

    public function testUpdatingTaskTitleSucceeds(): void
    {
        $client = static::createClient();
        $ownerEmail = $this->uniqueEmail('owner');
        $owner = $this->createUser($ownerEmail);
        $workspace = $this->createWorkspaceWithOwner($owner);
        $token = $this->loginAndGetToken($client, $ownerEmail);

        $ids = $this->createFullHierarchy($client, $token, $workspace->getId());

        $client->request('PUT', "/api/tasks/{$ids['taskId']}", [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['title' => 'Güncellenmiş Başlık']));

        $this->assertResponseStatusCodeSame(200);
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertEquals('Güncellenmiş Başlık', $data['title']);
    }

    public function testMovingTaskToAnotherColumnSucceeds(): void
    {
        $client = static::createClient();
        $ownerEmail = $this->uniqueEmail('owner');
        $owner = $this->createUser($ownerEmail);
        $workspace = $this->createWorkspaceWithOwner($owner);
        $token = $this->loginAndGetToken($client, $ownerEmail);

        $ids = $this->createFullHierarchy($client, $token, $workspace->getId());

        // İkinci bir column oluştur
        $client->request('POST', '/api/columns', [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['boardId' => $ids['boardId'], 'name' => 'In Progress', 'position' => 1]));
        $secondColumnId = json_decode($client->getResponse()->getContent(), true)['id'];

        // Task'ı ikinci column'a taşı
        $client->request('PUT', "/api/tasks/{$ids['taskId']}", [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['columnId' => $secondColumnId]));

        $this->assertResponseStatusCodeSame(200);
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertEquals($secondColumnId, $data['column']['id']);
    }

    public function testTaskCanHaveMultipleAssignees(): void
    {
        $client = static::createClient();
        $ownerEmail = $this->uniqueEmail('owner');
        $worker1Email = $this->uniqueEmail('worker1');
        $worker2Email = $this->uniqueEmail('worker2');

        $owner = $this->createUser($ownerEmail);
        $worker1 = $this->createUser($worker1Email);
        $worker2 = $this->createUser($worker2Email);

        $workspace = $this->createWorkspaceWithOwner($owner);
        $this->addMember($workspace, $worker1, WorkspaceRole::WORKER);
        $this->addMember($workspace, $worker2, WorkspaceRole::WORKER);

        $token = $this->loginAndGetToken($client, $ownerEmail);
        $ids = $this->createFullHierarchy($client, $token, $workspace->getId());

        // İki farklı kişiyi aynı task'a ata
        $client->request('POST', "/api/tasks/{$ids['taskId']}/assignees", [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['userId' => $worker1->getId()]));
        $this->assertResponseStatusCodeSame(201);

        $client->request('POST', "/api/tasks/{$ids['taskId']}/assignees", [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['userId' => $worker2->getId()]));
        $this->assertResponseStatusCodeSame(201);

        // Task'ı çek, iki assignee'nin de orada olduğunu doğrula
        $client->request('GET', "/api/tasks/{$ids['taskId']}", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ]);
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertCount(2, $data['assignments']);
    }

    public function testWorkerCanEditTaskCreatedByAnotherWorker(): void
    {
        $client = static::createClient();
        $ownerEmail = $this->uniqueEmail('owner');
        $worker1Email = $this->uniqueEmail('worker1');
        $worker2Email = $this->uniqueEmail('worker2');

        $owner = $this->createUser($ownerEmail);
        $worker1 = $this->createUser($worker1Email);
        $worker2 = $this->createUser($worker2Email);

        $workspace = $this->createWorkspaceWithOwner($owner);
        $this->addMember($workspace, $worker1, WorkspaceRole::WORKER);
        $this->addMember($workspace, $worker2, WorkspaceRole::WORKER);

        $ownerToken = $this->loginAndGetToken($client, $ownerEmail);
        $ids = $this->createFullHierarchy($client, $ownerToken, $workspace->getId());

        // worker2'yi task'a atayalım ki görebilsin (izin matrisimize göre task view herkese açık zaten, ama tutarlılık için)
        $worker2Token = $this->loginAndGetToken($client, $worker2Email);

        // worker2, worker1'in oluşturmadığı ama workspace'te paylaşılan bu task'ı düzenlemeyi dener
        $client->request('PUT', "/api/tasks/{$ids['taskId']}", [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $worker2Token,
        ], json_encode(['title' => 'worker2 tarafından düzenlendi']));

        $this->assertResponseStatusCodeSame(200, 'Herhangi bir worker, herhangi bir task\'ı düzenleyebilmeli (izin matrisi kuralı)');
    }
}
<?php

namespace App\Tests\Controller;

use App\Tests\AppTestCase;
use App\Enum\WorkspaceRole;

class DataIntegrityTest extends AppTestCase
{
    public function testCreatingProjectWithBlankNameFails(): void
    {
        $client = static::createClient();

        $ownerEmail = $this->uniqueEmail('owner');
        $owner = $this->createUser($ownerEmail);
        $workspace = $this->createWorkspaceWithOwner($owner);
        $token = $this->loginAndGetToken($client, $ownerEmail);

        $client->request('POST', '/api/projects', [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode([
            'workspaceId' => $workspace->getId(),
            'name' => '',
        ]));

        $this->assertResponseStatusCodeSame(400);
    }

    public function testAssigningSameUserToTaskTwiceFails(): void
    {
        $client = static::createClient();

        $ownerEmail = $this->uniqueEmail('owner');
        $owner = $this->createUser($ownerEmail);
        $workspace = $this->createWorkspaceWithOwner($owner);
        $token = $this->loginAndGetToken($client, $ownerEmail);

        // Proje, board, column oluştur
        $client->request('POST', '/api/projects', [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['workspaceId' => $workspace->getId(), 'name' => 'Proje']));
        $projectId = json_decode($client->getResponse()->getContent(), true)['id'];

        $client->request('POST', '/api/boards', [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['projectId' => $projectId, 'name' => 'Board']));
        $boardId = json_decode($client->getResponse()->getContent(), true)['id'];

        $client->request('POST', '/api/columns', [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['boardId' => $boardId, 'name' => 'To Do', 'position' => 0]));
        $columnId = json_decode($client->getResponse()->getContent(), true)['id'];

        // Task oluştur
        $client->request('POST', '/api/tasks', [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['columnId' => $columnId, 'title' => 'Test Task', 'priority' => 'medium', 'position' => 0]));
        $taskId = json_decode($client->getResponse()->getContent(), true)['id'];

        // Owner'ı task'a ata — başarılı olmalı
        $client->request('POST', "/api/tasks/{$taskId}/assignees", [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['userId' => $owner->getId()]));
        $this->assertResponseStatusCodeSame(201);

        // Aynı kullanıcıyı TEKRAR atamayı dene — 409 almalı
        $client->request('POST', "/api/tasks/{$taskId}/assignees", [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['userId' => $owner->getId()]));
        $this->assertResponseStatusCodeSame(409);
    }

    public function testDeletingWorkspaceCascadesDeleteProject(): void
    {
        $client = static::createClient();

        $ownerEmail = $this->uniqueEmail('owner');
        $owner = $this->createUser($ownerEmail);
        $workspace = $this->createWorkspaceWithOwner($owner);
        $token = $this->loginAndGetToken($client, $ownerEmail);

        // Bir proje oluştur
        $client->request('POST', '/api/projects', [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['workspaceId' => $workspace->getId(), 'name' => 'Silinecek Proje']));
        $this->assertResponseStatusCodeSame(201);
        $projectId = json_decode($client->getResponse()->getContent(), true)['id'];

        // Workspace'i sil
        $client->request('DELETE', "/api/workspaces/{$workspace->getId()}", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ]);
        $this->assertResponseStatusCodeSame(204);

        // Projeye erişmeyi dene — artık bulunamamalı (workspace silindiği için proje de silinmiş olmalı)
        $client->request('GET', "/api/projects/{$projectId}", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ]);
        $this->assertResponseStatusCodeSame(404);
    }

    public function testOwnerCannotBeRemovedFromWorkspace(): void
    {
        $client = static::createClient();

        $ownerEmail = $this->uniqueEmail('owner');
        $owner = $this->createUser($ownerEmail);
        $workspace = $this->createWorkspaceWithOwner($owner);
        $token = $this->loginAndGetToken($client, $ownerEmail);

        // Owner'ın kendi membership id'sini bulmamız lazım
        $client->request('GET', "/api/workspaces/{$workspace->getId()}", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ]);
        $workspaceData = json_decode($client->getResponse()->getContent(), true);
        $ownerMembershipId = $workspaceData['workspaceMembers'][0]['id'];

        // Owner'ı çıkarmayı dene — 403 almalı
        $client->request('DELETE', "/api/workspaces/{$workspace->getId()}/members/{$ownerMembershipId}", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ]);
        $this->assertResponseStatusCodeSame(403);
    }
}
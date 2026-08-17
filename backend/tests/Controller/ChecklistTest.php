<?php

namespace App\Tests\Controller;

use App\Entity\ChecklistItem;
use App\Tests\AppTestCase;
use Doctrine\ORM\EntityManagerInterface;

class ChecklistTest extends AppTestCase
{
    private function seedTaskWithColumn(mixed $client, string $token, int $workspaceId): int
    {
        $client->request('POST', '/api/projects', [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['workspaceId' => $workspaceId, 'name' => 'Proje']));

        $projectData = json_decode($client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('id', $projectData, 'Proje oluşturulamadı: ' . $client->getResponse()->getContent());
        $projectId = $projectData['id'];

        $client->request('POST', '/api/boards', [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['projectId' => $projectId, 'name' => 'Board']));

        $boardData = json_decode($client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('id', $boardData, 'Board oluşturulamadı: ' . $client->getResponse()->getContent());
        $boardId = $boardData['id'];

        $client->request('GET', "/api/columns?boardId={$boardId}", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ]);

        $columns = json_decode($client->getResponse()->getContent(), true);
        $this->assertNotEmpty($columns, 'Column listesi boş geldi');
        $columnId = $columns[0]['id'];

        $client->request('POST', '/api/tasks', [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode([
            'columnId' => $columnId,
            'title' => 'Test Task',
            'priority' => 'medium',
            'position' => 0,
        ]));

        $taskData = json_decode($client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('id', $taskData, 'Task oluşturulamadı: ' . $client->getResponse()->getContent());

        return $taskData['id'];
    }

    private function createChecklistItem(mixed $client, string $token, int $taskId, string $content): int
    {
        $client->request('POST', "/api/tasks/{$taskId}/checklist", [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['content' => $content]));

        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('id', $data, 'Checklist maddesi oluşturulamadı: ' . $client->getResponse()->getContent());

        return $data['id'];
    }

    // --- 1. Madde oluşturma başarılı ---
    public function testCreatingChecklistItemSucceeds(): void
    {
        $client = static::createClient();
        $ownerEmail = $this->uniqueEmail('owner');
        $owner = $this->createUser($ownerEmail);
        $workspace = $this->createWorkspaceWithOwner($owner);
        $token = $this->loginAndGetToken($client, $ownerEmail);

        $taskId = $this->seedTaskWithColumn($client, $token, $workspace->getId());

        $client->request('POST', "/api/tasks/{$taskId}/checklist", [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['content' => 'İlk madde']));

        $this->assertResponseStatusCodeSame(201);

        $response = json_decode($client->getResponse()->getContent(), true);
        $this->assertSame('İlk madde', $response['content']);
        $this->assertFalse($response['isCompleted']);
        $this->assertSame(0, $response['position']);
    }

    // --- 2. Boş içerikle oluşturma başarısız ---
    public function testCreatingChecklistItemWithEmptyContentFails(): void
    {
        $client = static::createClient();
        $ownerEmail = $this->uniqueEmail('owner');
        $owner = $this->createUser($ownerEmail);
        $workspace = $this->createWorkspaceWithOwner($owner);
        $token = $this->loginAndGetToken($client, $ownerEmail);

        $taskId = $this->seedTaskWithColumn($client, $token, $workspace->getId());

        $client->request('POST', "/api/tasks/{$taskId}/checklist", [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['content' => '']));

        $this->assertResponseStatusCodeSame(400);

        $response = json_decode($client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('errors', $response);
    }

    // --- 3. Pozisyon otomatik artıyor ---
    public function testPositionAutoIncrementsOnCreate(): void
    {
        $client = static::createClient();
        $ownerEmail = $this->uniqueEmail('owner');
        $owner = $this->createUser($ownerEmail);
        $workspace = $this->createWorkspaceWithOwner($owner);
        $token = $this->loginAndGetToken($client, $ownerEmail);

        $taskId = $this->seedTaskWithColumn($client, $token, $workspace->getId());

        $this->createChecklistItem($client, $token, $taskId, 'Birinci');

        $client->request('POST', "/api/tasks/{$taskId}/checklist", [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['content' => 'İkinci']));
        $response = json_decode($client->getResponse()->getContent(), true);
        $this->assertSame(1, $response['position']);

        $client->request('POST', "/api/tasks/{$taskId}/checklist", [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['content' => 'Üçüncü']));
        $response = json_decode($client->getResponse()->getContent(), true);
        $this->assertSame(2, $response['position']);
    }

    // --- 4. Maddeyi tamamlandı işaretleme ---
    public function testMarkingItemAsCompletedSucceeds(): void
    {
        $client = static::createClient();
        $ownerEmail = $this->uniqueEmail('owner');
        $owner = $this->createUser($ownerEmail);
        $workspace = $this->createWorkspaceWithOwner($owner);
        $token = $this->loginAndGetToken($client, $ownerEmail);

        $taskId = $this->seedTaskWithColumn($client, $token, $workspace->getId());
        $itemId = $this->createChecklistItem($client, $token, $taskId, 'Yapılacak iş');

        $client->request('PATCH', "/api/tasks/{$taskId}/checklist/{$itemId}", [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['isCompleted' => true]));

        $this->assertResponseIsSuccessful();

        $response = json_decode($client->getResponse()->getContent(), true);
        $this->assertTrue($response['isCompleted']);

        $em = static::getContainer()->get(EntityManagerInterface::class);
        $em->clear();
        $item = $em->getRepository(ChecklistItem::class)->find($itemId);
        $this->assertTrue($item->isCompleted());
    }

    // --- 5. Madde içeriğini düzenleme ---
    public function testEditingItemContentSucceeds(): void
    {
        $client = static::createClient();
        $ownerEmail = $this->uniqueEmail('owner');
        $owner = $this->createUser($ownerEmail);
        $workspace = $this->createWorkspaceWithOwner($owner);
        $token = $this->loginAndGetToken($client, $ownerEmail);

        $taskId = $this->seedTaskWithColumn($client, $token, $workspace->getId());
        $itemId = $this->createChecklistItem($client, $token, $taskId, 'Eski içerik');

        $client->request('PATCH', "/api/tasks/{$taskId}/checklist/{$itemId}", [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['content' => 'Yeni içerik']));

        $this->assertResponseIsSuccessful();

        $response = json_decode($client->getResponse()->getContent(), true);
        $this->assertSame('Yeni içerik', $response['content']);
    }

    // --- 6. Madde silme ---
    public function testDeletingItemSucceeds(): void
    {
        $client = static::createClient();
        $ownerEmail = $this->uniqueEmail('owner');
        $owner = $this->createUser($ownerEmail);
        $workspace = $this->createWorkspaceWithOwner($owner);
        $token = $this->loginAndGetToken($client, $ownerEmail);

        $taskId = $this->seedTaskWithColumn($client, $token, $workspace->getId());
        $itemId = $this->createChecklistItem($client, $token, $taskId, 'Silinecek madde');

        $client->request('DELETE', "/api/tasks/{$taskId}/checklist/{$itemId}", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ]);

        $this->assertResponseStatusCodeSame(204);

        $em = static::getContainer()->get(EntityManagerInterface::class);
        $em->clear();
        $this->assertNull($em->getRepository(ChecklistItem::class)->find($itemId));
    }

    // --- 7. Task silinince checklist maddeleri de siliniyor (CASCADE) ---
    public function testDeletingTaskAlsoDeletesChecklistItems(): void
    {
        $client = static::createClient();
        $ownerEmail = $this->uniqueEmail('owner');
        $owner = $this->createUser($ownerEmail);
        $workspace = $this->createWorkspaceWithOwner($owner);
        $token = $this->loginAndGetToken($client, $ownerEmail);

        $taskId = $this->seedTaskWithColumn($client, $token, $workspace->getId());
        $itemId = $this->createChecklistItem($client, $token, $taskId, 'Madde 1');

        $client->request('DELETE', "/api/tasks/{$taskId}", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ]);
        $this->assertResponseStatusCodeSame(204);

        $em = static::getContainer()->get(EntityManagerInterface::class);
        $em->clear();
        $this->assertNull($em->getRepository(ChecklistItem::class)->find($itemId));
    }

    // --- 8. Yetkisiz kullanıcı madde ekleyemiyor ---
    public function testUnauthorizedUserCannotCreateChecklistItem(): void
    {
        $client = static::createClient();
        $ownerEmail = $this->uniqueEmail('owner');
        $strangerEmail = $this->uniqueEmail('stranger');
        $owner = $this->createUser($ownerEmail);
        $this->createUser($strangerEmail);
        $workspace = $this->createWorkspaceWithOwner($owner);

        $ownerToken = $this->loginAndGetToken($client, $ownerEmail);
        $strangerToken = $this->loginAndGetToken($client, $strangerEmail);

        $taskId = $this->seedTaskWithColumn($client, $ownerToken, $workspace->getId());

        $client->request('POST', "/api/tasks/{$taskId}/checklist", [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $strangerToken,
        ], json_encode(['content' => 'Yetkisiz madde']));

        $status = $client->getResponse()->getStatusCode();
        $this->assertContains($status, [400, 403]);
    }
}
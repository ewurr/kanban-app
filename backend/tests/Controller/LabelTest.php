<?php

namespace App\Tests\Controller;

use App\Entity\Label;
use App\Entity\Task;
use App\Tests\AppTestCase;
use Doctrine\ORM\EntityManagerInterface;

class LabelTest extends AppTestCase
{
    /**
     * Bir workspace + proje + board oluşturur, board ID'sini döner.
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

        return json_decode($client->getResponse()->getContent(), true)['id'];
    }

    /**
     * Bir board'da bir sütun ve o sütunda bir task oluşturur, task ID'sini döner.
     */
    private function seedTask(mixed $client, string $token, int $boardId): int
    {
        $client->request('POST', '/api/columns', [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['boardId' => $boardId, 'name' => 'Col', 'position' => 0]));
        $columnId = json_decode($client->getResponse()->getContent(), true)['id'];

        $client->request('POST', '/api/tasks', [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['columnId' => $columnId, 'title' => 'Test Task', 'priority' => 'medium', 'position' => 0]));

        return json_decode($client->getResponse()->getContent(), true)['id'];
    }

    // --- 1. Etiket oluşturma başarılı ---
    public function testCreatingLabelSucceeds(): void
    {
        $client = static::createClient();
        $ownerEmail = $this->uniqueEmail('owner');
        $owner = $this->createUser($ownerEmail);
        $workspace = $this->createWorkspaceWithOwner($owner);
        $token = $this->loginAndGetToken($client, $ownerEmail);

        $boardId = $this->seedBoard($client, $token, $workspace->getId());

        $client->request('POST', '/api/labels', [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['boardId' => $boardId, 'name' => 'Bug', 'color' => '#E53935']));

        $this->assertResponseStatusCodeSame(201);

        $response = json_decode($client->getResponse()->getContent(), true);
        $this->assertSame('Bug', $response['name']);
        $this->assertSame('#E53935', $response['color']);
        $this->assertSame($boardId, $response['board']['id']);
    }

    // --- 2. Geçersiz renk ile oluşturma ---
    public function testCreatingLabelWithInvalidColorFails(): void
    {
        $client = static::createClient();
        $ownerEmail = $this->uniqueEmail('owner');
        $owner = $this->createUser($ownerEmail);
        $workspace = $this->createWorkspaceWithOwner($owner);
        $token = $this->loginAndGetToken($client, $ownerEmail);

        $boardId = $this->seedBoard($client, $token, $workspace->getId());

        $client->request('POST', '/api/labels', [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['boardId' => $boardId, 'name' => 'Test', 'color' => '#FF00FF']));

        $this->assertResponseStatusCodeSame(400);

        $response = json_decode($client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('errors', $response);
    }

    // --- 3. Board bazlı listeleme ---
    public function testListingLabelsScopedToBoard(): void
    {
        $client = static::createClient();
        $ownerEmail = $this->uniqueEmail('owner');
        $owner = $this->createUser($ownerEmail);
        $workspace = $this->createWorkspaceWithOwner($owner);
        $token = $this->loginAndGetToken($client, $ownerEmail);

        $boardAId = $this->seedBoard($client, $token, $workspace->getId());
        $boardBId = $this->seedBoard($client, $token, $workspace->getId());

        // Board A'ya bir etiket
        $client->request('POST', '/api/labels', [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['boardId' => $boardAId, 'name' => 'A Etiketi', 'color' => '#E53935']));

        // Board B'ye bir etiket
        $client->request('POST', '/api/labels', [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['boardId' => $boardBId, 'name' => 'B Etiketi', 'color' => '#1E88E5']));

        // Sadece Board A'nın etiketlerini iste
        $client->request('GET', "/api/labels?boardId={$boardAId}", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ]);

        $this->assertResponseIsSuccessful();
        $labels = json_decode($client->getResponse()->getContent(), true);

        $this->assertCount(1, $labels);
        $this->assertSame('A Etiketi', $labels[0]['name']);
    }

    // --- 4. Etiket silme ---
    public function testDeletingLabelSucceeds(): void
    {
        $client = static::createClient();
        $ownerEmail = $this->uniqueEmail('owner');
        $owner = $this->createUser($ownerEmail);
        $workspace = $this->createWorkspaceWithOwner($owner);
        $token = $this->loginAndGetToken($client, $ownerEmail);

        $boardId = $this->seedBoard($client, $token, $workspace->getId());

        $client->request('POST', '/api/labels', [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['boardId' => $boardId, 'name' => 'Silinecek', 'color' => '#E53935']));
        $labelId = json_decode($client->getResponse()->getContent(), true)['id'];

        $client->request('DELETE', "/api/labels/{$labelId}", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ]);

        $this->assertResponseStatusCodeSame(204);

        $em = static::getContainer()->get(EntityManagerInterface::class);
        $em->clear();
        $this->assertNull($em->getRepository(Label::class)->find($labelId));
    }

    // --- 5. Task'a etiket ekleme ---
    public function testAddingLabelToTaskSucceeds(): void
    {
        $client = static::createClient();
        $ownerEmail = $this->uniqueEmail('owner');
        $owner = $this->createUser($ownerEmail);
        $workspace = $this->createWorkspaceWithOwner($owner);
        $token = $this->loginAndGetToken($client, $ownerEmail);

        $boardId = $this->seedBoard($client, $token, $workspace->getId());
        $taskId = $this->seedTask($client, $token, $boardId);

        $client->request('POST', '/api/labels', [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['boardId' => $boardId, 'name' => 'Bug', 'color' => '#E53935']));
        $labelId = json_decode($client->getResponse()->getContent(), true)['id'];

        $client->request('POST', "/api/tasks/{$taskId}/labels/{$labelId}", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ]);

        $this->assertResponseIsSuccessful();

        $response = json_decode($client->getResponse()->getContent(), true);
        $this->assertCount(1, $response['labels']);
        $this->assertSame('Bug', $response['labels'][0]['name']);

        // DB'de de gerçekten ilişki kurulmuş mu kontrol et
        $em = static::getContainer()->get(EntityManagerInterface::class);
        $em->clear();
        $task = $em->getRepository(Task::class)->find($taskId);
        $this->assertCount(1, $task->getLabels());
    }

    // --- 6. Task'tan etiket çıkarma ---
    public function testRemovingLabelFromTaskSucceeds(): void
    {
        $client = static::createClient();
        $ownerEmail = $this->uniqueEmail('owner');
        $owner = $this->createUser($ownerEmail);
        $workspace = $this->createWorkspaceWithOwner($owner);
        $token = $this->loginAndGetToken($client, $ownerEmail);

        $boardId = $this->seedBoard($client, $token, $workspace->getId());
        $taskId = $this->seedTask($client, $token, $boardId);

        $client->request('POST', '/api/labels', [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['boardId' => $boardId, 'name' => 'Bug', 'color' => '#E53935']));
        $labelId = json_decode($client->getResponse()->getContent(), true)['id'];

        // Önce ekle
        $client->request('POST', "/api/tasks/{$taskId}/labels/{$labelId}", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ]);

        // Sonra çıkar
        $client->request('DELETE', "/api/tasks/{$taskId}/labels/{$labelId}", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ]);

        $this->assertResponseIsSuccessful();

        $response = json_decode($client->getResponse()->getContent(), true);
        $this->assertCount(0, $response['labels']);
    }

    // --- 7. Farklı board'un etiketini eklemeye çalışma ---
    public function testAddingLabelFromDifferentBoardFails(): void
    {
        $client = static::createClient();
        $ownerEmail = $this->uniqueEmail('owner');
        $owner = $this->createUser($ownerEmail);
        $workspace = $this->createWorkspaceWithOwner($owner);
        $token = $this->loginAndGetToken($client, $ownerEmail);

        $boardAId = $this->seedBoard($client, $token, $workspace->getId());
        $boardBId = $this->seedBoard($client, $token, $workspace->getId());
        $taskInBoardA = $this->seedTask($client, $token, $boardAId);

        // Board B'ye ait bir etiket oluştur
        $client->request('POST', '/api/labels', [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['boardId' => $boardBId, 'name' => 'B Etiketi', 'color' => '#E53935']));
        $labelInBoardB = json_decode($client->getResponse()->getContent(), true)['id'];

        // Board A'daki task'a, Board B'nin etiketini eklemeye çalış
        $client->request('POST', "/api/tasks/{$taskInBoardA}/labels/{$labelInBoardB}", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ]);

        $this->assertResponseStatusCodeSame(400);
    }

    // --- 8. Yetkisiz kullanıcı etiket oluşturamaz ---
    public function testCreatingLabelInForeignWorkspaceFails(): void
    {
        $client = static::createClient();

        $aliceEmail = $this->uniqueEmail('alice');
        $bobEmail = $this->uniqueEmail('bob');
        $alice = $this->createUser($aliceEmail);
        $bob = $this->createUser($bobEmail);
        $bobWorkspace = $this->createWorkspaceWithOwner($bob);

        $aliceToken = $this->loginAndGetToken($client, $aliceEmail);
        $bobToken = $this->loginAndGetToken($client, $bobEmail);

        $bobBoardId = $this->seedBoard($client, $bobToken, $bobWorkspace->getId());

        // Alice, Bob'un board'una etiket eklemeye çalışıyor
        $client->request('POST', '/api/labels', [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $aliceToken,
        ], json_encode(['boardId' => $bobBoardId, 'name' => 'İzinsiz', 'color' => '#E53935']));

        $status = $client->getResponse()->getStatusCode();
        $this->assertContains($status, [400, 403]);
    }
}
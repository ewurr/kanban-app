<?php

namespace App\Tests\Controller;

use App\Tests\AppTestCase;

/**
 * Regression testleri — daha önce düzeltilmiş bug'ların geri gelmemesini garanti eder.
 *
 * Her test bir bug'ı tetikleyen bozuk isteği gönderir ve DÜZGÜN hata cevabı
 * (400 veya 404) beklediğimizi doğrular. Test kırmızıya dönerse, savunma
 * kodumuz (?? '', null check, vb.) yanlışlıkla silinmiş demektir.
 */
class RegressionTest extends AppTestCase
{
    // ==========================================================================
    // Bug #1: TaskController::removeAssignee — status code parametre pozisyonu
    // ==========================================================================

    public function testRemovingUnassignedUserReturns404(): void
    {
        // ARRANGE — bir workspace, bir board, bir task oluştur;
        // task'a HİÇ kimseyi atamıyoruz
        $client = static::createClient();
        $ownerEmail = $this->uniqueEmail('owner');
        $owner = $this->createUser($ownerEmail);
        $workspace = $this->createWorkspaceWithOwner($owner);
        $token = $this->loginAndGetToken($client, $ownerEmail);
        $ids = $this->createFullHierarchy($client, $token, $workspace->getId());

        // ACT — task'a atanmamış bir kullanıcıyı çıkarmayı dene
        // (owner'ın ID'sini kullanıyoruz — task'a assign edilmemiş)
        $client->request('DELETE', "/api/tasks/{$ids['taskId']}/assignees/{$owner->getId()}", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ]);

        // ASSERT — 404 dönmeli, yanlışlıkla 200 değil
        // Eski bug'da JsonResponse(['error' => '...', 404]) yazılmıştı,
        // 404 array elemanı olarak geçiyordu, status default 200 kalıyordu.
        $this->assertResponseStatusCodeSame(404);
    }

    // ==========================================================================
    // Bug #2a: ProjectController::create — workspaceId yoksa PHP warning + 403
    // ==========================================================================

    public function testCreatingProjectWithoutWorkspaceIdReturns404(): void
    {
        $client = static::createClient();
        $ownerEmail = $this->uniqueEmail('owner');
        $owner = $this->createUser($ownerEmail);
        $this->createWorkspaceWithOwner($owner);
        $token = $this->loginAndGetToken($client, $ownerEmail);

        // workspaceId HİÇ göndermeden proje oluşturmayı dene
        $client->request('POST', '/api/projects', [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['name' => 'Yeni Proje']));

        // Eski davranış: PHP warning + null $workspace + voter false + 403 Forbidden
        // Yeni davranış: 404 "Workspace bulunamadı"
        $this->assertResponseStatusCodeSame(404);

        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('error', $data);
    }

    public function testCreatingProjectWithNonexistentWorkspaceIdReturns404(): void
    {
        // Yukarıdakinin varyantı — workspaceId var ama 99999 gibi var olmayan bir ID
        $client = static::createClient();
        $ownerEmail = $this->uniqueEmail('owner');
        $this->createUser($ownerEmail);
        $token = $this->loginAndGetToken($client, $ownerEmail);

        $client->request('POST', '/api/projects', [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['workspaceId' => 99999, 'name' => 'Yeni Proje']));

        $this->assertResponseStatusCodeSame(404);
    }

    // ==========================================================================
    // Bug #2b: TaskController::update — var olmayan columnId TypeError
    // ==========================================================================

    public function testUpdatingTaskWithNonexistentColumnIdReturns404(): void
    {
        $client = static::createClient();
        $ownerEmail = $this->uniqueEmail('owner');
        $owner = $this->createUser($ownerEmail);
        $workspace = $this->createWorkspaceWithOwner($owner);
        $token = $this->loginAndGetToken($client, $ownerEmail);
        $ids = $this->createFullHierarchy($client, $token, $workspace->getId());

        // Task'ı var olmayan bir column'a taşımayı dene
        $client->request('PUT', "/api/tasks/{$ids['taskId']}", [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['columnId' => 99999]));

        // Eski davranış: setColumn(null) → TypeError → 500 Internal Server Error
        // Yeni davranış: 404 "Column bulunamadı"
        $this->assertResponseStatusCodeSame(404);
    }

    // ==========================================================================
    // Bug #3: create endpoint'lerinde zorunlu alan yoksa TypeError → 500
    // Beklenen: 400 Bad Request (validator devraldı)
    // ==========================================================================

    public function testCreatingTaskWithoutTitleReturns400(): void
    {
        $client = static::createClient();
        $ownerEmail = $this->uniqueEmail('owner');
        $owner = $this->createUser($ownerEmail);
        $workspace = $this->createWorkspaceWithOwner($owner);
        $token = $this->loginAndGetToken($client, $ownerEmail);
        $ids = $this->createFullHierarchy($client, $token, $workspace->getId());

        // title HİÇ göndermeden task oluşturmayı dene
        // (position ve priority default'a düşecek, sadece title validator'ı tetikleyecek)
        $client->request('POST', '/api/tasks', [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['columnId' => $ids['columnId']]));

        // Eski davranış: setTitle(null) → TypeError → 500
        // Yeni davranış: setTitle('') → validator NotBlank → 400
        $this->assertResponseStatusCodeSame(400);

        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('errors', $data);
    }

    public function testCreatingBoardWithoutNameReturns400(): void
    {
        $client = static::createClient();
        $ownerEmail = $this->uniqueEmail('owner');
        $owner = $this->createUser($ownerEmail);
        $workspace = $this->createWorkspaceWithOwner($owner);
        $token = $this->loginAndGetToken($client, $ownerEmail);

        // Önce bir proje oluştur (board bir projeye bağlanmalı)
        $client->request('POST', '/api/projects', [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['workspaceId' => $workspace->getId(), 'name' => 'Proje']));
        $projectId = json_decode($client->getResponse()->getContent(), true)['id'];

        // name olmadan board oluşturmayı dene
        $client->request('POST', '/api/boards', [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['projectId' => $projectId]));

        $this->assertResponseStatusCodeSame(400);
    }

    public function testCreatingColumnWithoutNameReturns400(): void
    {
        $client = static::createClient();
        $ownerEmail = $this->uniqueEmail('owner');
        $owner = $this->createUser($ownerEmail);
        $workspace = $this->createWorkspaceWithOwner($owner);
        $token = $this->loginAndGetToken($client, $ownerEmail);
        $ids = $this->createFullHierarchy($client, $token, $workspace->getId());

        // name olmadan column oluşturmayı dene
        $client->request('POST', '/api/columns', [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['boardId' => $ids['boardId'], 'position' => 5]));

        $this->assertResponseStatusCodeSame(400);
    }

    public function testCreatingProjectWithoutNameReturns400(): void
    {
        $client = static::createClient();
        $ownerEmail = $this->uniqueEmail('owner');
        $owner = $this->createUser($ownerEmail);
        $workspace = $this->createWorkspaceWithOwner($owner);
        $token = $this->loginAndGetToken($client, $ownerEmail);

        // name olmadan proje oluşturmayı dene
        $client->request('POST', '/api/projects', [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['workspaceId' => $workspace->getId()]));

        $this->assertResponseStatusCodeSame(400);
    }

    // ==========================================================================
    // Yardımcı: mevcut UpdateOperationsTest'teki gibi tam hiyerarşi kur
    // ==========================================================================

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
}
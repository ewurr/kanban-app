<?php

namespace App\Tests\Controller;

use App\Debug\QueryCounter;
use App\Enum\WorkspaceRole;
use App\Tests\AppTestCase;

/**
 * TaskController::index performansını ölçer — N+1 sorgu probleminin
 * geri gelmemesini garanti eder.
 */
class TaskFetchPerformanceTest extends AppTestCase
{
    public function testFetchingBoardTasksDoesNotCauseNPlusOne(): void
    {
        // ARRANGE — bir board oluştur, 20 task ekle, her birine assignee ve label ata
        $client = static::createClient();
        // disableReboot: her request'ten sonra kernel'ı yeniden başlatmasın.
        // Aksi halde her request'te Doctrine bağlantısı ve QueryCounter yeniden
        // yaratılır, sayaç sıfırlanır. Ölçüm yaparken bu kritik.
        $client->disableReboot();
        $ownerEmail = $this->uniqueEmail('owner');
        $owner = $this->createUser($ownerEmail);
        $workspace = $this->createWorkspaceWithOwner($owner);
        $token = $this->loginAndGetToken($client, $ownerEmail);

        // Hiyerarşiyi kur
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

        // 5 task oluştur, hepsine owner'ı assign et
        for ($i = 1; $i <= 20; $i++) {
            $client->request('POST', '/api/tasks', [], [], [
                'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
            ], json_encode([
                'columnId' => $columnId,
                'title' => "Görev $i",
                'priority' => 'medium',
                'position' => $i,
            ]));
            $taskId = json_decode($client->getResponse()->getContent(), true)['id'];

            $client->request('POST', "/api/tasks/{$taskId}/assignees", [], [], [
                'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
            ], json_encode(['userId' => $owner->getId()]));
        }

        // ACT — sayacı sıfırla ve asıl endpoint'i çağır
        $counter = static::getContainer()->get(QueryCounter::class);
        $counter->reset();

        $client->request('GET', "/api/tasks?boardId={$boardId}", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ]);

        $this->assertResponseStatusCodeSame(200);

        $queryCount = $counter->getCount();

        // Regression: N+1 problemine dönmemek için üst sınır belirle.
        // Ideal: 3 sorgu (auth + voter + task query). Toleransla 8 diyoruz —
        // ilerde bir savunma katmanı eklenirse (mesela cache miss log) marj olsun.
        // Bu sayının 20'yi aşması N+1 sorununun geri döndüğünün işaretidir.
        $this->assertLessThanOrEqual(
            8,
            $queryCount,
            "20 task için sorgu sayısı: $queryCount. addSelect kaldırılmış olabilir, N+1 dönmüş olabilir."
        );
    }

    public function testFetchingWorkspaceTasksDoesNotCauseNPlusOne(): void
    {
        // Aynı hiyerarşi ama bu sefer /tasks?workspaceId=X endpoint'ini test ediyoruz
        // (CalendarPage bu endpoint'i kullanıyor).
        $client = static::createClient();
        $client->disableReboot();
        $ownerEmail = $this->uniqueEmail('owner');
        $owner = $this->createUser($ownerEmail);
        $workspace = $this->createWorkspaceWithOwner($owner);
        $token = $this->loginAndGetToken($client, $ownerEmail);

        // Hiyerarşi kur
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

        // 20 task oluştur
        for ($i = 1; $i <= 20; $i++) {
            $client->request('POST', '/api/tasks', [], [], [
                'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
            ], json_encode([
                'columnId' => $columnId,
                'title' => "Görev $i",
                'priority' => 'medium',
                'position' => $i,
            ]));
            $taskId = json_decode($client->getResponse()->getContent(), true)['id'];

            $client->request('POST', "/api/tasks/{$taskId}/assignees", [], [], [
                'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
            ], json_encode(['userId' => $owner->getId()]));
        }

        // ACT — sayacı sıfırla ve workspace endpoint'ini çağır
        $counter = static::getContainer()->get(QueryCounter::class);
        $counter->reset();

        $client->request('GET', "/api/tasks?workspaceId={$workspace->getId()}", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ]);

        $this->assertResponseStatusCodeSame(200);

        $queryCount = $counter->getCount();

        $this->assertLessThanOrEqual(
            8,
            $queryCount,
            "20 task için workspace sorgusu sayısı: $queryCount"
        );
    }
}
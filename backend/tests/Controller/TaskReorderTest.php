<?php

namespace App\Tests\Controller;

use App\Entity\ActivityLog;
use App\Entity\Task;
use App\Enum\ActivityAction;
use App\Enum\WorkspaceRole;
use App\Tests\AppTestCase;
use Doctrine\ORM\EntityManagerInterface;

class TaskReorderTest extends AppTestCase
{
    /**
     * Bir board altında bir sütun ve o sütunda N task oluşturur.
     * $client ve $token dışarıdan verilir, task ID'lerini sırayla dizi olarak döner.
     *
     * @return array{boardId: int, columnIds: int[], taskIds: int[]}
     */
    private function seedBoardWithTasks(
        mixed $client,
        string $token,
        int $workspaceId,
        int $columnCount = 1,
        int $tasksPerColumn = 3
    ): array {
        // Proje
        $client->request('POST', '/api/projects', [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['workspaceId' => $workspaceId, 'name' => 'Proje']));
        $projectId = json_decode($client->getResponse()->getContent(), true)['id'];

        // Board (varsayılan olarak 3 default column'la oluşturuluyor, biz ekstra column açacaksak onu görmezden geleceğiz)
        $client->request('POST', '/api/boards', [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['projectId' => $projectId, 'name' => 'Board']));
        $boardId = json_decode($client->getResponse()->getContent(), true)['id'];

        // Kendi column'larımızı sıfırdan açalım (default'ları kullanmıyoruz ki senaryo tahmin edilebilir olsun)
        $columnIds = [];
        for ($i = 0; $i < $columnCount; $i++) {
            $client->request('POST', '/api/columns', [], [], [
                'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
            ], json_encode(['boardId' => $boardId, 'name' => 'Col ' . $i, 'position' => 100 + $i]));
            $columnIds[] = json_decode($client->getResponse()->getContent(), true)['id'];
        }

        // Her column'a task'lar
        $taskIds = [];
        foreach ($columnIds as $columnIndex => $columnId) {
            for ($j = 0; $j < $tasksPerColumn; $j++) {
                $client->request('POST', '/api/tasks', [], [], [
                    'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
                ], json_encode([
                    'columnId' => $columnId,
                    'title' => "Task {$columnIndex}-{$j}",
                    'priority' => 'medium',
                    'position' => $j,
                ]));
                $response = json_decode($client->getResponse()->getContent(), true);
                $taskIds[] = $response['id'] ?? null;
            }
        }

        return compact('boardId', 'columnIds', 'taskIds');
    }

    // --- 1. Aynı sütun içi sıralama ---
    public function testReorderingWithinSameColumnUpdatesPositions(): void
    {
        $client = static::createClient();
        $ownerEmail = $this->uniqueEmail('owner');
        $owner = $this->createUser($ownerEmail);
        $workspace = $this->createWorkspaceWithOwner($owner);
        $token = $this->loginAndGetToken($client, $ownerEmail);

        $seed = $this->seedBoardWithTasks($client, $token, $workspace->getId(), 1, 3);
        [$columnId] = $seed['columnIds'];
        [$t0, $t1, $t2] = $seed['taskIds']; // sırayla position 0, 1, 2

        // Sırayı ters çeviriyoruz: [t2, t1, t0]
        $client->request('PATCH', '/api/tasks/reorder', [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode([
            'columns' => [
                ['columnId' => $columnId, 'taskIds' => [$t2, $t1, $t0]],
            ],
        ]));

        $this->assertResponseStatusCodeSame(204);

        $em = static::getContainer()->get(EntityManagerInterface::class);
        $em->clear();

        $task0 = $em->getRepository(Task::class)->find($t0);
        $task1 = $em->getRepository(Task::class)->find($t1);
        $task2 = $em->getRepository(Task::class)->find($t2);

        $this->assertSame(0, $task2->getPosition(), 't2 ilk sırada olmalı');
        $this->assertSame(1, $task1->getPosition(), 't1 orta sırada olmalı');
        $this->assertSame(2, $task0->getPosition(), 't0 son sırada olmalı');

        // ID ile değil, entity referansıyla sorgula
        $logs = $em->getRepository(ActivityLog::class)->findBy([
            'task' => [$task0, $task1, $task2],
            'actionType' => ActivityAction::Moved,
        ]);
        $this->assertCount(0, $logs, 'Aynı sütun içi sıralama bu task\'lar için Moved log\'u üretmemeli');
    }

    // --- 2. Sütunlar arası taşıma + activity log ---
    public function testMovingTaskBetweenColumnsUpdatesColumnAndLogsActivity(): void
    {
        $client = static::createClient();
        $ownerEmail = $this->uniqueEmail('owner');
        $owner = $this->createUser($ownerEmail);
        $workspace = $this->createWorkspaceWithOwner($owner);
        $token = $this->loginAndGetToken($client, $ownerEmail);

        $seed = $this->seedBoardWithTasks($client, $token, $workspace->getId(), 2, 2);
        [$colA, $colB] = $seed['columnIds'];
        [$t0, $t1, $t2, $t3] = $seed['taskIds']; // t0,t1 → colA / t2,t3 → colB

        // t1'i colA'dan colB'ye taşıyoruz. Sonuç:
        // colA: [t0]
        // colB: [t1, t2, t3]
        $client->request('PATCH', '/api/tasks/reorder', [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode([
            'columns' => [
                ['columnId' => $colA, 'taskIds' => [$t0]],
                ['columnId' => $colB, 'taskIds' => [$t1, $t2, $t3]],
            ],
        ]));

        $this->assertResponseStatusCodeSame(204);

        $em = static::getContainer()->get(EntityManagerInterface::class);
        $em->clear();

        $task1 = $em->getRepository(Task::class)->find($t1);
        $this->assertSame($colB, $task1->getColumn()->getId(), 't1 colB\'ye taşınmış olmalı');
        $this->assertSame(0, $task1->getPosition(), 't1 colB\'de position 0 olmalı');

        $task2 = $em->getRepository(Task::class)->find($t2);
        $this->assertSame(1, $task2->getPosition(), 't2 colB\'de position 1 olmalı');

        // Activity log'da t1 için tam 1 tane Moved kaydı olmalı
        $logs = $em->getRepository(ActivityLog::class)->findBy([
            'task' => $t1,
            'actionType' => ActivityAction::Moved,
        ]);
        $this->assertCount(1, $logs, 't1 için tam bir Moved log\'u olmalı');
    }

    // --- 3. Yetkisiz erişim: başka workspace'in task'ı ---
    public function testReorderingTaskFromDifferentWorkspaceFails(): void
    {
        $client = static::createClient();

        // İki ayrı owner, iki ayrı workspace
        $aliceEmail = $this->uniqueEmail('alice');
        $bobEmail = $this->uniqueEmail('bob');
        $alice = $this->createUser($aliceEmail);
        $bob = $this->createUser($bobEmail);
        $aliceWorkspace = $this->createWorkspaceWithOwner($alice);
        $bobWorkspace = $this->createWorkspaceWithOwner($bob);

        $aliceToken = $this->loginAndGetToken($client, $aliceEmail);
        $bobToken = $this->loginAndGetToken($client, $bobEmail);

        // Bob kendi workspace'inde task'lar oluştursun
        $bobSeed = $this->seedBoardWithTasks($client, $bobToken, $bobWorkspace->getId(), 1, 2);
        [$bobColumnId] = $bobSeed['columnIds'];
        [$bobTask0, $bobTask1] = $bobSeed['taskIds'];

        // DB'den orijinal position'ları not alalım (rollback'i doğrulamak için)
        $em = static::getContainer()->get(EntityManagerInterface::class);
        $originalPosition = $em->getRepository(Task::class)->find($bobTask0)->getPosition();

        // Alice, Bob'un task'larını reorder etmeye çalışıyor
        $client->request('PATCH', '/api/tasks/reorder', [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $aliceToken,
        ], json_encode([
            'columns' => [
                ['columnId' => $bobColumnId, 'taskIds' => [$bobTask1, $bobTask0]],
            ],
        ]));

        // 400 veya 403 kabul edilebilir (bkz. controller catch bloğu)
        $status = $client->getResponse()->getStatusCode();
        $this->assertContains($status, [400, 403], 'Yetkisiz erişim 400 veya 403 dönmeli');

        // Rollback doğrulama: pozisyon değişmemiş olmalı
        $em->clear();
        $bobTask0Fresh = $em->getRepository(Task::class)->find($bobTask0);
        $this->assertSame($originalPosition, $bobTask0Fresh->getPosition(), 'Rollback çalışmalı, pozisyon değişmemeli');
    }

    // --- 4. Var olmayan task ID → rollback ---
    public function testReorderingWithNonExistentTaskRollsBack(): void
    {
        $client = static::createClient();
        $ownerEmail = $this->uniqueEmail('owner');
        $owner = $this->createUser($ownerEmail);
        $workspace = $this->createWorkspaceWithOwner($owner);
        $token = $this->loginAndGetToken($client, $ownerEmail);

        $seed = $this->seedBoardWithTasks($client, $token, $workspace->getId(), 1, 2);
        [$columnId] = $seed['columnIds'];
        [$t0, $t1] = $seed['taskIds'];

        $em = static::getContainer()->get(EntityManagerInterface::class);
        $originalT0Pos = $em->getRepository(Task::class)->find($t0)->getPosition();

        // Sırada geçerli task ID'ler ve bir de var olmayan bir ID
        $client->request('PATCH', '/api/tasks/reorder', [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode([
            'columns' => [
                ['columnId' => $columnId, 'taskIds' => [$t1, $t0, 999999]],
            ],
        ]));

        $this->assertResponseStatusCodeSame(400);

        // Rollback doğrulama: t0'ın position'ı değişmemiş olmalı
        $em->clear();
        $t0Fresh = $em->getRepository(Task::class)->find($t0);
        $this->assertSame($originalT0Pos, $t0Fresh->getPosition(), 't0 pozisyonu rollback ile korunmuş olmalı');
    }

    // --- 5. Boş payload ---
    public function testReorderingWithEmptyPayloadReturns400(): void
    {
        $client = static::createClient();
        $ownerEmail = $this->uniqueEmail('owner');
        $owner = $this->createUser($ownerEmail);
        $this->createWorkspaceWithOwner($owner);
        $token = $this->loginAndGetToken($client, $ownerEmail);

        // Tamamen boş
        $client->request('PATCH', '/api/tasks/reorder', [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode([]));
        $this->assertResponseStatusCodeSame(400);

        // "columns" var ama boş
        $client->request('PATCH', '/api/tasks/reorder', [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode(['columns' => []]));
        $this->assertResponseStatusCodeSame(400);
    }
}
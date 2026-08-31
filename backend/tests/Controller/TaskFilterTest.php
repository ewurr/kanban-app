<?php

namespace App\Tests\Controller;

use App\Tests\AppTestCase;

/**
 * TaskController::index endpoint'inin filtreleme davranışını test eder.
 * ?assignedTo, ?priority, ?search query param'larının doğru task'ları
 * döndürdüğünü doğrular.
 */
class TaskFilterTest extends AppTestCase
{
    /**
     * Test setup — bir hiyerarşi ve farklı özelliklerde task'lar oluşturur,
     * her testte tekrarlanacak.
     * Dönüş: ['token' => ..., 'boardId' => ..., 'ownerId' => ..., 'otherId' => ...]
     */
    private function setupBoardWithMixedTasks(): array
    {
        $client = static::createClient();

        // İki user oluştur: owner (workspace sahibi) ve other (misafir gibi)
        $ownerEmail = $this->uniqueEmail('owner');
        $owner = $this->createUser($ownerEmail);

        $otherEmail = $this->uniqueEmail('other');
        $other = $this->createUser($otherEmail);

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

        // 4 farklı task oluştur — her biri farklı özellikler taşıyor
        $tasks = [
            ['title' => 'Deploy backend', 'priority' => 'high',   'assignTo' => $owner->getId()],
            ['title' => 'Fix login bug',  'priority' => 'high',   'assignTo' => null],
            ['title' => 'Update readme',  'priority' => 'low',    'assignTo' => $owner->getId()],
            ['title' => 'Deploy frontend','priority' => 'medium', 'assignTo' => $other->getId()],
        ];

        foreach ($tasks as $i => $t) {
            $client->request('POST', '/api/tasks', [], [], [
                'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
            ], json_encode([
                'columnId' => $columnId,
                'title' => $t['title'],
                'priority' => $t['priority'],
                'position' => $i,
            ]));
            $taskId = json_decode($client->getResponse()->getContent(), true)['id'];

            if ($t['assignTo'] !== null) {
                $client->request('POST', "/api/tasks/{$taskId}/assignees", [], [], [
                    'CONTENT_TYPE' => 'application/json', 'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
                ], json_encode(['userId' => $t['assignTo']]));
            }
        }

        return [
            'client' => $client,
            'token' => $token,
            'boardId' => $boardId,
            'ownerId' => $owner->getId(),
            'otherId' => $other->getId(),
        ];
    }

    // ========================================================================

    public function testWithoutFilterReturnsAllTasks(): void
    {
        $ctx = $this->setupBoardWithMixedTasks();

        $ctx['client']->request('GET', "/api/tasks?boardId={$ctx['boardId']}", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $ctx['token'],
        ]);

        $this->assertResponseStatusCodeSame(200);
        $tasks = json_decode($ctx['client']->getResponse()->getContent(), true);
        $this->assertCount(4, $tasks, 'Filter yokken 4 task dönmeli');
    }

    public function testAssignedToMeReturnsOnlyMyTasks(): void
    {
        $ctx = $this->setupBoardWithMixedTasks();

        // owner giriş yaptı, 'me' = owner
        // Owner'a 2 task atadık ('Deploy backend', 'Update readme')
        $ctx['client']->request('GET', "/api/tasks?boardId={$ctx['boardId']}&assignedTo=me", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $ctx['token'],
        ]);

        $this->assertResponseStatusCodeSame(200);
        $tasks = json_decode($ctx['client']->getResponse()->getContent(), true);
        $this->assertCount(2, $tasks, 'me filtresi 2 task dönmeli');

        $titles = array_column($tasks, 'title');
        $this->assertContains('Deploy backend', $titles);
        $this->assertContains('Update readme', $titles);
    }

    public function testPriorityFilterReturnsOnlyMatchingTasks(): void
    {
        $ctx = $this->setupBoardWithMixedTasks();

        // 2 high priority task var: 'Deploy backend', 'Fix login bug'
        $ctx['client']->request('GET', "/api/tasks?boardId={$ctx['boardId']}&priority=high", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $ctx['token'],
        ]);

        $this->assertResponseStatusCodeSame(200);
        $tasks = json_decode($ctx['client']->getResponse()->getContent(), true);
        $this->assertCount(2, $tasks, 'priority=high 2 task dönmeli');
    }

    public function testSearchMatchesTitle(): void
    {
        $ctx = $this->setupBoardWithMixedTasks();

        // 'Deploy backend' ve 'Deploy frontend' başlığında 'deploy' geçiyor
        $ctx['client']->request('GET', "/api/tasks?boardId={$ctx['boardId']}&search=deploy", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $ctx['token'],
        ]);

        $this->assertResponseStatusCodeSame(200);
        $tasks = json_decode($ctx['client']->getResponse()->getContent(), true);
        $this->assertCount(2, $tasks, 'search=deploy 2 task dönmeli');
    }

    public function testSearchIsCaseInsensitive(): void
    {
        $ctx = $this->setupBoardWithMixedTasks();

        // Büyük harflerle arayınca da bulmalı — LOWER() sayesinde
        $ctx['client']->request('GET', "/api/tasks?boardId={$ctx['boardId']}&search=DEPLOY", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $ctx['token'],
        ]);

        $this->assertResponseStatusCodeSame(200);
        $tasks = json_decode($ctx['client']->getResponse()->getContent(), true);
        $this->assertCount(2, $tasks, 'DEPLOY (büyük harf) da eşleşmeli');
    }

    public function testCombiningFiltersNarrowsResults(): void
    {
        $ctx = $this->setupBoardWithMixedTasks();

        // Filter'ları birleştir: bana atanmış + high priority
        // Sadece 'Deploy backend' eşleşmeli:
        //   - Owner'a atanmış ✓
        //   - priority=high ✓
        $ctx['client']->request('GET', "/api/tasks?boardId={$ctx['boardId']}&assignedTo=me&priority=high", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $ctx['token'],
        ]);

        $this->assertResponseStatusCodeSame(200);
        $tasks = json_decode($ctx['client']->getResponse()->getContent(), true);
        $this->assertCount(1, $tasks, 'Birleşik filtre sadece 1 task dönmeli');
        $this->assertEquals('Deploy backend', $tasks[0]['title']);
    }

    public function testInvalidPriorityIsIgnored(): void
    {
        $ctx = $this->setupBoardWithMixedTasks();

        // Geçersiz priority değeri gönder — controller null'a düşürmeli,
        // filter uygulanmamalı, tüm task'lar dönmeli
        $ctx['client']->request('GET', "/api/tasks?boardId={$ctx['boardId']}&priority=hacker", [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $ctx['token'],
        ]);

        $this->assertResponseStatusCodeSame(200);
        $tasks = json_decode($ctx['client']->getResponse()->getContent(), true);
        $this->assertCount(4, $tasks, 'Geçersiz priority filtre uygulanmamalı');
    }
}
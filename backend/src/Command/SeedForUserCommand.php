<?php

namespace App\Command;

use App\Entity\Board;
use App\Entity\Column;
use App\Entity\Project;
use App\Entity\Task;
use App\Entity\TaskAssignment;
use App\Entity\User;
use App\Entity\Workspace;
use App\Entity\WorkspaceMember;
use App\Enum\WorkspaceRole;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:seed-for-user',
    description: 'Belirli bir kullanıcının workspace\'ine demo proje/board/task ekler',
)]
class SeedForUserCommand extends Command
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addArgument('email', InputArgument::REQUIRED, 'Owner olduğu workspace kullanılacak kullanıcının email\'i');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $email = $input->getArgument('email');

        // 1) Kullanıcıyı bul
        $owner = $this->entityManager->getRepository(User::class)->findOneBy(['email' => $email]);

        if ($owner === null) {
            $io->error("'{$email}' email'ine sahip bir kullanıcı bulunamadı.");
            return Command::FAILURE;
        }

        // 2) Bu kullanıcının owner olduğu bir workspace'i bul
        $ownerMembership = $this->entityManager->getRepository(WorkspaceMember::class)
            ->findOneBy(['user' => $owner, 'role' => WorkspaceRole::OWNER]);

        if ($ownerMembership === null) {
            $io->error("'{$email}' kullanıcısının owner olduğu bir workspace bulunamadı.");
            return Command::FAILURE;
        }

        $workspace = $ownerMembership->getWorkspace();
        $io->text("Workspace bulundu: {$workspace->getName()} (id: {$workspace->getId()})");

        // 3) Sistemdeki tüm kullanıcıları çek
        $allUsers = $this->entityManager->getRepository(User::class)->findAll();

        // 4) Henüz bu workspace'e üye olmayanları worker olarak ekle
        $existingMemberships = $this->entityManager->getRepository(WorkspaceMember::class)
            ->findBy(['workspace' => $workspace]);

        $existingUserIds = array_map(fn (WorkspaceMember $m) => $m->getUser()->getId(), $existingMemberships);

        $addedCount = 0;
        foreach ($allUsers as $user) {
            if (in_array($user->getId(), $existingUserIds, true)) {
                continue;
            }

            $membership = new WorkspaceMember();
            $membership->setWorkspace($workspace);
            $membership->setUser($user);
            $membership->setRole(WorkspaceRole::WORKER);
            $this->entityManager->persist($membership);
            $addedCount++;
        }

        $this->entityManager->flush();
        $io->text("{$addedCount} kullanıcı workspace'e worker olarak eklendi.");

        // 5) Artık workspace'in TÜM üyelerini (task atamak için) tekrar çekelim
        $this->entityManager->clear();
        $workspace = $this->entityManager->getRepository(Workspace::class)->find($workspace->getId());
        $allMemberships = $this->entityManager->getRepository(WorkspaceMember::class)
            ->findBy(['workspace' => $workspace]);
        $allMemberUsers = array_map(fn (WorkspaceMember $m) => $m->getUser(), $allMemberships);

        // 6) Yeni projeler, board'lar, column'lar, task'lar oluştur
        $suffix = time();
        $projectNames = ["Yeni Proje A ({$suffix})", "Yeni Proje B ({$suffix})"];
        $columnNames = ['To Do', 'In Progress', 'Done'];
        $taskPool = [
            ['Görev planlamasını yap', 'medium'],
            ['Kod incelemesini tamamla', 'high'],
            ['Dokümantasyonu güncelle', 'low'],
            ['Hata ayıklama yap', 'high'],
            ['Sunum hazırla', 'medium'],
        ];

        $boardNames = ['Sprint 1', 'Sprint 2', 'Backlog', 'Q3 Hedefleri'];
        $extendedTaskPool = [
            ['Görev planlamasını yap', 'medium'],
            ['Kod incelemesini tamamla', 'high'],
            ['Dokümantasyonu güncelle', 'low'],
            ['Hata ayıklama yap', 'high'],
            ['Sunum hazırla', 'medium'],
            ['Toplantı notlarını paylaş', 'low'],
            ['Müşteri geri bildirimini değerlendir', 'medium'],
            ['Veritabanı optimizasyonu yap', 'high'],
            ['Kullanıcı testleri planla', 'medium'],
            ['Güvenlik taraması yap', 'high'],
            ['UI/UX iyileştirmesi yap', 'low'],
            ['Yedekleme sürecini kontrol et', 'medium'],
        ];

        foreach ($projectNames as $projectName) {
            $project = new Project();
            $project->setName($projectName);
            $project->setDescription('Otomatik oluşturulan demo proje.');
            $project->setWorkspace($workspace);
            $this->entityManager->persist($project);

            $boardCount = random_int(2, 4);
            $shuffledBoardNames = $boardNames;
            shuffle($shuffledBoardNames);

            for ($b = 0; $b < $boardCount; $b++) {
                $board = new Board();
                $board->setName($shuffledBoardNames[$b % count($shuffledBoardNames)]);
                $board->setProject($project);
                $this->entityManager->persist($board);

                $columns = [];
                foreach ($columnNames as $index => $columnName) {
                    $column = new Column();
                    $column->setName($columnName);
                    $column->setPosition($index);
                    $column->setBoard($board);
                    $this->entityManager->persist($column);
                    $columns[] = $column;
                }

                $taskCount = random_int(6, 10);
                for ($t = 0; $t < $taskCount; $t++) {
                    [$title, $priority] = $extendedTaskPool[array_rand($extendedTaskPool)];

                    $task = new Task();
                    $task->setTitle($title);
                    $task->setDescription('Bu görev otomatik oluşturuldu.');
                    $task->setPriority($priority);
                    $task->setPosition($t);
                    $task->setColumn($columns[array_rand($columns)]);
                    $this->entityManager->persist($task);

                    $assigneeCount = min(random_int(1, 2), count($allMemberUsers));
                    $shuffledUsers = $allMemberUsers;
                    shuffle($shuffledUsers);
                    for ($i = 0; $i < $assigneeCount; $i++) {
                        $assignment = new TaskAssignment();
                        $assignment->setTask($task);
                        $assignment->setUser($shuffledUsers[$i]);
                        $this->entityManager->persist($assignment);
                    }
                }
            }
        }

        $this->entityManager->flush();

        $io->success("'{$workspace->getName()}' workspace'ine yeni projeler, board'lar ve task'lar eklendi.");

        return Command::SUCCESS;
    }
}
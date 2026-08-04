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
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(
    name: 'app:seed-demo-data',
    description: 'Projeyi dolu göstermek için sahte demo verisi oluşturur',
)]
class SeedDemoDataCommand extends Command
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly UserPasswordHasherInterface $passwordHasher,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $suffix = time();

        $firstNames = ['Ayşe', 'Mehmet', 'Zeynep', 'Can', 'Elif', 'Burak', 'Selin', 'Emre', 'Ceren', 'Deniz', 'Ece', 'Kerem', 'Aylin', 'Onur', 'Gizem', 'Barış'];
        $lastNames = ['Yılmaz', 'Kaya', 'Demir', 'Öztürk', 'Çelik', 'Şahin', 'Yıldız', 'Aydın', 'Arslan', 'Doğan', 'Kılıç', 'Aslan'];

        $usedNames = [];
        $pickUniqueName = function () use ($firstNames, $lastNames, &$usedNames) {
            do {
                $name = $firstNames[array_rand($firstNames)];
                $surname = $lastNames[array_rand($lastNames)];
                $key = "$name $surname";
            } while (in_array($key, $usedNames, true));

            $usedNames[] = $key;

            return [$name, $surname];
        };

        [$ownerName, $ownerSurname] = $pickUniqueName();
        [$pmName, $pmSurname] = $pickUniqueName();
        [$worker1Name, $worker1Surname] = $pickUniqueName();
        [$worker2Name, $worker2Surname] = $pickUniqueName();

        $owner = $this->createUser("owner+{$suffix}@demo.com", $ownerName, $ownerSurname);
        $pm = $this->createUser("pm+{$suffix}@demo.com", $pmName, $pmSurname);
        $worker1 = $this->createUser("worker1+{$suffix}@demo.com", $worker1Name, $worker1Surname);
        $worker2 = $this->createUser("worker2+{$suffix}@demo.com", $worker2Name, $worker2Surname);

        $this->entityManager->persist($owner);
        $this->entityManager->persist($pm);
        $this->entityManager->persist($worker1);
        $this->entityManager->persist($worker2);

        $workspace = new Workspace();
        $workspace->setName('Demo Şirket');
        $this->entityManager->persist($workspace);

        $this->addMember($workspace, $owner, WorkspaceRole::OWNER);
        $this->addMember($workspace, $pm, WorkspaceRole::PM);
        $this->addMember($workspace, $worker1, WorkspaceRole::WORKER);
        $this->addMember($workspace, $worker2, WorkspaceRole::WORKER);

        $projectNames = ['Website Yenileme', 'Mobil Uygulama', 'Pazarlama Kampanyası'];
        $columnNames = ['To Do', 'In Progress', 'Done'];
        $taskPool = [
            ['SEO ayarlarını kontrol et', 'medium'],
            ['Ana sayfa tasarımını güncelle', 'high'],
            ['Performans testini yap', 'low'],
            ['Kullanıcı geri bildirimlerini incele', 'medium'],
            ['API entegrasyonunu tamamla', 'high'],
            ['Test senaryolarını yaz', 'medium'],
        ];

        $allUsers = [$owner, $pm, $worker1, $worker2];

        foreach ($projectNames as $projectName) {
            $project = new Project();
            $project->setName($projectName);
            $project->setDescription("$projectName için demo proje açıklaması.");
            $project->setWorkspace($workspace);
            $this->entityManager->persist($project);

            $board = new Board();
            $board->setName('Ana Board');
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

            foreach ($taskPool as $index => [$title, $priority]) {
                $task = new Task();
                $task->setTitle($title);
                $task->setDescription('Bu task demo veri oluşturma komutuyla otomatik eklendi.');
                $task->setPriority($priority);
                $task->setPosition($index);
                $task->setColumn($columns[array_rand($columns)]);
                $this->entityManager->persist($task);

                $assigneeCount = random_int(1, 2);
                $shuffledUsers = $allUsers;
                shuffle($shuffledUsers);
                for ($i = 0; $i < $assigneeCount; $i++) {
                    $assignment = new TaskAssignment();
                    $assignment->setTask($task);
                    $assignment->setUser($shuffledUsers[$i]);
                    $this->entityManager->persist($assignment);
                }
            }
        }

        $this->entityManager->flush();

        $io->success('Demo veri başarıyla oluşturuldu.');
        $io->table(
            ['Rol', 'Email', 'Şifre'],
            [
                ['Owner', $owner->getEmail(), 'demo1234'],
                ['PM', $pm->getEmail(), 'demo1234'],
                ['Worker', $worker1->getEmail(), 'demo1234'],
                ['Worker', $worker2->getEmail(), 'demo1234'],
            ]
        );

        return Command::SUCCESS;
    }

    private function createUser(string $email, string $name, string $surname): User
    {
        $user = new User();
        $user->setEmail($email);
        $user->setName($name);
        $user->setSurname($surname);
        $hashedPassword = $this->passwordHasher->hashPassword($user, 'demo1234');
        $user->setPassword($hashedPassword);

        return $user;
    }

    private function addMember(Workspace $workspace, User $user, WorkspaceRole $role): void
    {
        $membership = new WorkspaceMember();
        $membership->setWorkspace($workspace);
        $membership->setUser($user);
        $membership->setRole($role);
        $this->entityManager->persist($membership);
    }
}
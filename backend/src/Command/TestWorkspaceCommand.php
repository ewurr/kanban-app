<?php

namespace App\Command;

use App\Entity\User;
use App\Entity\Workspace;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use App\Entity\Project;

#[AsCommand(
    name: 'app:test-workspace',
    description: 'User + Workspace ilişkisini test eder',
)]
class TestWorkspaceCommand extends Command
{
    public function __construct(private EntityManagerInterface $entityManager)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        // şimdilik argument/option'a ihtiyacımız yok
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        // 1) Bir User oluştur
        $user = new User();
        $uniqueEmail = sprintf('efe+%d@example.com', time());
        $user->setEmail($uniqueEmail);
        $user->setPassword('dummy-hash-simdilik'); // gerçek hash'lemeyi sonra Security'de göreceğiz
        $user->setRoles(['ROLE_USER']);

        // 2) Bir Workspace oluştur, owner olarak bu User'ı ata
        $workspace = new Workspace();
        $workspace->setName('Efe\'nin Workspace\'i');
        $workspace->setOwner($user);

        // 3) User'ı workspace'in üyesi olarak da ekle (owner aynı zamanda member olsun mantıklı)
        $workspace->addMember($user);

        // 4) Doctrine'e "bunları izle" de
        $this->entityManager->persist($user);
        $this->entityManager->persist($workspace);

        // 5) Gerçekten veritabanına yaz
        $this->entityManager->flush();

        $io->success(sprintf(
            'User (id=%d) ve Workspace (id=%d) oluşturuldu, owner ve member ilişkileri kuruldu.',
            $user->getId(),
            $workspace->getId()
        ));

        // 6) Bir Project oluştur, bu workspace'e bağla
        $project = new Project();
        $project->setName('İlk Projem');
        $project->setDescription('Test amaçlı oluşturulan proje');
        $project->setWorkspace($workspace);

        $this->entityManager->persist($project);
        $this->entityManager->flush(); // <-- Project'i de gerçekten veritabanına yaz

        // 7) EntityManager'ın hafızasını temizleyelim ki bir sonraki sorgu gerçekten
        // veritabanına gitsin, PHP'nin önbelleğinden değil
        $this->entityManager->clear();

        // 8) Workspace'i veritabanından TAZE olarak yeniden çek
        $workspaceId = $workspace->getId();
        $freshWorkspace = $this->entityManager->getRepository(Workspace::class)->find($workspaceId);

        $io->section('Workspace\'in projeleri (veritabanından taze sorgu ile):');
        foreach ($freshWorkspace->getProjects() as $p) {
            $io->text(sprintf('- %s (id: %d)', $p->getName(), $p->getId()));
        }

        return Command::SUCCESS;
    }
}
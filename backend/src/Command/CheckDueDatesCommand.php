<?php

namespace App\Command;

use App\Repository\UserRepository;
use App\Service\NotificationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:check-due-dates',
    description: 'Tüm kullanıcılar için due-date bildirimlerini tarar ve oluşturur',
)]
class CheckDueDatesCommand extends Command
{
    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly NotificationService $notificationService,
        private readonly EntityManagerInterface $entityManager,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $users = $this->userRepository->findAll();

        foreach ($users as $user) {
            $this->notificationService->checkDueDatesForUser($user);
        }

        $this->entityManager->flush();

        $io->success(sprintf('%d kullanıcı için due-date taraması tamamlandı.', count($users)));

        return Command::SUCCESS;
    }
}
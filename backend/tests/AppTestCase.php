<?php

namespace App\Tests;

use App\Entity\User;
use App\Entity\Workspace;
use App\Entity\WorkspaceMember;
use App\Enum\WorkspaceRole;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

abstract class AppTestCase extends WebTestCase
{
    protected function createUser(string $email, string $password = 'sifre1234'): User
    {
        $container = static::getContainer();
        $entityManager = $container->get(EntityManagerInterface::class);
        $passwordHasher = $container->get(UserPasswordHasherInterface::class);

        $user = new User();
        $user->setEmail($email);
        $user->setName('Test');
        $user->setSurname('Kullanıcı');
        $user->setPassword($passwordHasher->hashPassword($user, $password));

        $entityManager->persist($user);
        $entityManager->flush();

        return $user;
    }

    protected function createWorkspaceWithOwner(User $owner, string $name = 'Test Workspace'): Workspace
    {
        $container = static::getContainer();
        $entityManager = $container->get(EntityManagerInterface::class);

        $workspace = new Workspace();
        $workspace->setName($name);
        $entityManager->persist($workspace);

        $this->addMember($workspace, $owner, WorkspaceRole::OWNER);

        $entityManager->flush();

        return $workspace;
    }

    protected function addMember(Workspace $workspace, User $user, WorkspaceRole $role): WorkspaceMember
    {
        $container = static::getContainer();
        $entityManager = $container->get(EntityManagerInterface::class);

        $membership = new WorkspaceMember();
        $membership->setWorkspace($workspace);
        $membership->setUser($user);
        $membership->setRole($role);

        $entityManager->persist($membership);
        $entityManager->flush();

        return $membership;
    }

    protected function loginAndGetToken(mixed $client, string $email, string $password = 'sifre1234'): string
    {
        $client->request('POST', '/api/login_check', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'email' => $email,
            'password' => $password,
        ]));

        $data = json_decode($client->getResponse()->getContent(), true);

        return $data['token'];
    }

    protected function uniqueEmail(string $prefix): string
    {
        return $prefix . '-' . uniqid() . '@example.com';
    }
}
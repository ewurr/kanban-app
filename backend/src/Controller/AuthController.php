<?php

namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;


#[Route('/api')]
final class AuthController extends AbstractController
    {
    #[Route('/register', name: 'app_auth_register', methods: ['POST'])]
    public function register(
        Request $request, 
        EntityManagerInterface $entityManager,
        UserPasswordHasherInterface $passwordHasher,
        SerializerInterface $serializer,
        JWTTokenManagerInterface $jwtManager   // <-- eklendi
    ) : JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        // 1. email zaten kayıtlı mı kontrol
        $existingUser = $entityManager->getRepository(User::class)->findOneBy(['email' => $data['email']]);
        if($existingUser !== null){
            return new JsonResponse(['error' => 'Bu email zaten kayıtlı'], 409);
        }

        // 2. yeni user oluştur
        $user = new User();
        $user->setEmail($data['email']);

        // 3. şifreyi hashleyerek kaydet
        $hashedPassword = $passwordHasher->hashPassword($user, $data['password']);
        $user->setPassword($hashedPassword);

        $entityManager->persist($user);
        $entityManager->flush();

        // 4. token üret
        $token = $jwtManager->create($user);

        $json = $serializer->serialize($user, 'json', ['groups' => 'workspace:read']);

        return new JsonResponse([
            'token' => $token,
            'user' => json_decode($json),
        ], 201);
    }
}

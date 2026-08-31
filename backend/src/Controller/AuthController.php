<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\PasswordResetTokenService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Mailer\MailerInterface;

#[Route('/api')]
final class AuthController extends AbstractController
    {
    #[Route('/register', name: 'app_auth_register', methods: ['POST'])]
    public function register(
        Request $request, 
        EntityManagerInterface $entityManager,
        UserPasswordHasherInterface $passwordHasher,
        SerializerInterface $serializer,
        ValidatorInterface $validator,
        JWTTokenManagerInterface $jwtManager
    ) : JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        // 1. email zaten kayıtlı mı kontrol
        $existingUser = $entityManager->getRepository(User::class)->findOneBy(['email' => $data['email'] ?? null]);
        if($existingUser !== null){
            return new JsonResponse(['error' => 'Bu email zaten kayıtlı'], 409);
        }

        // 2. şifre uzunluk kontrolü (hash'lenmeden önce, çünkü hash her zaman uzun olur)
        $plainPassword = $data['password'] ?? '';
        if(strlen($plainPassword) < 8) {
            return new JsonResponse(['error' => 'Şifre en az 8 karakter olmalıdır.'], 400);
        }

        // 3. yeni user oluştur
        $user = new User();
        $user->setEmail($data['email'] ?? '');
        $user->setName($data['name'] ?? '');
        $user->setSurname($data['surname'] ?? '');

        // 4. şifreyi hashleyerek kaydet
        $hashedPassword = $passwordHasher->hashPassword($user, $data['password'] ?? '');
        $user->setPassword($hashedPassword);

        // 5. validasyon
        $errors = $validator->validate($user);

        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[] = $error->getMessage();
            }

            return new JsonResponse(['errors' => $errorMessages], 400);
        }

        $entityManager->persist($user);
        $entityManager->flush();

        // 6. token üret
        $token = $jwtManager->create($user);

        $json = $serializer->serialize($user, 'json', ['groups' => 'workspace:read']);

        return new JsonResponse([
            'token' => $token,
            'user' => json_decode($json),
        ], 201);

    }

        #[Route('/me', name: 'app_auth_me', methods:['GET'])]
        public function me (SerializerInterface $serializer): JsonResponse
        {
            $json = $serializer->serialize($this->getUser(), 'json', ['groups' => 'workspace:read']);

            return JsonResponse::fromJsonString($json);
        }
        
        #[Route('/me', name: 'app_auth_profile', methods:['PUT'])]
        public function updateProfile(
            Request $request,
            EntityManagerInterface $entityManager,
            ValidatorInterface $validator,
            SerializerInterface $serializer
        ): JsonResponse{
            /**@var User $user */
            $user = $this->getUser();

            $data = json_decode($request->getContent(), true);

            if(isset($data['name'])) {
                $user->setName($data['name']);
            }

            if(isset($data['surname'])) {
                $user->setSurname($data['surname']);
            }

            $errors = $validator->validate($user);
            
            if(count($errors) > 0) {
                $errorMessages = [];
                foreach ($errors as $error) {
                    $errorMessages[] = $error->getMessage();
                }

                return new JsonResponse(['errors' => $errorMessages], 400);
            }

            $entityManager->flush();

            $json = $serializer->serialize($user, 'json', ['groups' => 'workspace:read']);

            return JsonResponse::fromJsonString($json);
        }

        #[Route('/me/password', name: 'app_auth_change_password', methods: ['PUT'])]
        public function changePassword(
            Request $request,
            EntityManagerInterface $entityManager,
            UserPasswordHasherInterface $passwordHasher
        ): JsonResponse {
            /**@var User $user */
            $user = $this->getUser();

            $data = json_decode($request->getContent(), true);

            $currentPassword = $data['currentPassword'] ?? '';
            $newPassword = $data['newPassword'] ?? '';

            if(!$passwordHasher->isPasswordValid($user, $currentPassword)) {
                return new JsonResponse(['error' => 'Mevcut şifre yanlış.'], 400);
            }

            if(strlen($newPassword) < 8) {
                return new JsonResponse(['error' => 'Yeni şifre en az 8 karakter olmalıdır.'], 400);
            }

            $hashedPassword = $passwordHasher->hashPassword($user, $newPassword);
            $user->setPassword($hashedPassword);

            $entityManager->flush();

            return new JsonResponse(['message' => 'Şifre başarıyla değiştirildi.'], 200);
        }

        #[Route('/forgot-password', name: 'app_auth_forgot_password', methods: ['POST'])]
        public function forgotPassword(
            Request $request,
            UserRepository $userRepository,
            PasswordResetTokenService $tokenService,
            MailerInterface $mailer,
        ): JsonResponse {
            $data = json_decode($request->getContent(), true);
            $email = trim($data['email'] ?? '');

            // Her senaryoda döneceğimiz cevap — email'in varlığını sızdırmamak için.
            $genericResponse = new JsonResponse([
                'message' => 'Eğer bu email kayıtlıysa, sıfırlama linki gönderildi.'
            ], 200);

            // Boş email → aynı cevap, sessizce çık
            if ($email === '') {
                return $genericResponse;
            }

            $user = $userRepository->findOneBy(['email' => $email]);
            if ($user === null) {
                // Kullanıcı yok → yine aynı cevap dön, hiçbir şey yapma
                return $genericResponse;
            }

            // Kullanıcı var → token üret ve email at
            $plainToken = $tokenService->createTokenForUser($user);
            $resetUrl = "http://localhost:5173/reset-password?token={$plainToken}";

            $emailMessage = (new Email)
                ->from('[email protected]')
                ->to($user->getEmail())
                ->subject('Şifre Sıfırlama')
                ->text(
                    "Merhaba,\n\n" .
                    "Şifrenizi sıfırlamak için aşağıdaki linke tıklayın:\n\n" .
                    "{$resetUrl}\n\n" .
                    "Bu link 1 saat içinde geçerliliğini yitirecektir.\n" .
                    "Eğer bu talebi siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.\n\n" .
                    "Kanban App"
                );

            $mailer->send($emailMessage);

            return $genericResponse;
        }

    }
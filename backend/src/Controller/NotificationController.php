<?php

namespace App\Controller;

use App\Repository\NotificationRepository;
use App\Service\NotificationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/api/notifications')]
final class NotificationController extends AbstractController
{
    #[Route('', name: 'app_notification_index', methods: ['GET'])]
    public function index(
        NotificationRepository $notificationRepository,
        SerializerInterface $serializer,
    ): JsonResponse {
        $user = $this->getUser();

        $notifications = $notificationRepository->findByRecipientOrdered($user);

        $json = $serializer->serialize($notifications, 'json', ['groups' => 'notification:read']);

        return JsonResponse::fromJsonString($json);
    }

    #[Route('/{id}/read', name: 'app_notification_mark_read', methods: ['PATCH'])]
    public function markAsRead(
        int $id,
        NotificationRepository $notificationRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $notification = $notificationRepository->find($id);

        if ($notification === null || $notification->getRecipient() !== $this->getUser()) {
            return new JsonResponse(['error' => 'Bildirim bulunamadı.'], 404);
        }

        $notification->setIsRead(true);
        $entityManager->flush();

        return new JsonResponse(null, 204);
    }

    #[Route('/read-all', name: 'app_notification_mark_all_read', methods: ['PATCH'])]
    public function markAllAsRead(
        NotificationRepository $notificationRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $notifications = $notificationRepository->findByRecipientOrdered($this->getUser());

        foreach ($notifications as $notification) {
            if (!$notification->isRead()) {
                $notification->setIsRead(true);
            }
        }

        $entityManager->flush();

        return new JsonResponse(null, 204);
    }

    #[Route('/{id}', name: 'app_notification_delete', methods: ['DELETE'])]
    public function delete(
        int $id,
        NotificationRepository $notificationRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $notification = $notificationRepository->find($id);

        if ($notification === null || $notification->getRecipient() !== $this->getUser()) {
            return new JsonResponse(['error' => 'Bildirim bulunamadı.'], 404);
        }

        $notification->setIsDeleted(true);
        $entityManager->flush();

        return new JsonResponse(null, 204);
    }
}

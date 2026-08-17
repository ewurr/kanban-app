<?php

namespace App\Controller;

use App\Entity\ChecklistItem;
use App\Entity\Task;
use App\Repository\ChecklistItemRepository;
use App\Security\Voter\WorkspaceVoter;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/tasks/{taskId}/checklist', requirements: ['taskId' => '\d+'], options: ['utf8' => true])]final class ChecklistItemController extends AbstractController
{
    #[Route ('', name: 'app_checklist_index', methods: ['GET'])]
    public function index (
        int $taskId, 
        ChecklistItemRepository $checklistRepository,
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer
    ): JsonResponse {
        $task = $entityManager->getRepository(Task::class)->find($taskId);

        if($task === null) {
            return new JsonResponse(['error' => 'Task bulunamadı.'], 404);
        }

        $this->denyAccessUnlessGranted(WorkspaceVoter::WORKSPACE_VIEW, $task);

        $items = $checklistRepository->findBy(['task' => $task], ['position' => 'ASC']);
        $json = $serializer->serialize($items, 'json', ['groups' => 'checklist:read']);

        return JsonResponse::fromJsonString($json);
    }
    
    #[Route('', name: 'app_checklist_create', methods: ['POST'])]
    public function create(
        int $taskId,
        Request $request,
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer,
        ValidatorInterface $validator, 
        ChecklistItemRepository $checklistRepository
    ): JsonResponse {
        $task = $entityManager->getRepository(Task::class)->find($taskId);

        if($task === null) {
            return new JsonResponse(['error' => 'Task bulunamadı.'], 404);
        }

        $this->denyAccessUnlessGranted(WorkspaceVoter::CHECKLIST_ITEM_CREATE, $task);

        $data = json_decode($request->getContent(), true);

        $nextPosition = count($checklistRepository->findBy(['task' => $task]));

        $item = new ChecklistItem();
        $item->setTask($task);
        $item->setContent($data['content'] ?? '');
        $item->setPosition($nextPosition);

        $errors = $validator->validate($item);

        if(count($errors) > 0) {
            $messages = [];
            foreach ($errors as $error) {
                $messages[] = $error->getMessage();
            }

            return new JsonResponse(['errors' => $messages], 400);
        }

        $entityManager->persist($item);
        $entityManager->flush();

        $json = $serializer->serialize($item, 'json', ['groups' => 'checklist:read']);

        return JsonResponse::fromJsonString($json, 201);
    }

    #[Route('/{id}', name: 'app_checklist_update', methods: ['PATCH'])]
    public function update(
        int $taskId,
        ChecklistItem $item,
        Request $request,
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer
    ): JsonResponse {
        $this->denyAccessUnlessGranted(WorkspaceVoter::CHECKLIST_ITEM_EDIT, $item);

        $data = json_decode($request->getContent(), true);

        if (!is_array($data)) {
            return new JsonResponse(['error' => 'Geçersiz istek gövdesi.'], 400);
        }

        if (array_key_exists('content', $data) && is_string($data['content'])) {
            $item->setContent($data['content']);
        }

        if (array_key_exists('isCompleted', $data)) {
            $item->setIsCompleted((bool) $data['isCompleted']);
        }

        $entityManager->flush();

        $json = $serializer->serialize($item, 'json', ['groups' => 'checklist:read']);

        return JsonResponse::fromJsonString($json);
    }

    #[Route('/{id}', name: 'app_checklist_delete', methods: ['DELETE'])]
    public function delete(
        int $taskId,
        ChecklistItem $item,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $this->denyAccessUnlessGranted(WorkspaceVoter::CHECKLIST_ITEM_DELETE, $item);

        $entityManager->remove($item);
        $entityManager->flush();

        return new JsonResponse(null, 204);
    }

}
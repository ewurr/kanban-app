<?php

namespace App\Controller;

use App\Entity\Board;
use App\Entity\Label;
use App\Entity\Task;
use App\Repository\LabelRepository;
use App\Security\Voter\WorkspaceVoter;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/labels')]
final class LabelController extends AbstractController
{
    #[Route('', name: 'app_label_index', methods: ['GET'])]
    public function index(
        Request $request,
        LabelRepository $labelRepository,
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer
    ): JsonResponse {
        $boardId = $request->query->get('boardId');

        if ($boardId === null) {
            return new JsonResponse(['error' => 'boardId parametresi zorunludur.'], 400);
        }

        $board = $entityManager->getRepository(Board::class)->find((int) $boardId);

        if ($board === null) {
            return new JsonResponse(['error' => 'Board bulunamadı.'], 404);
        }

        $this->denyAccessUnlessGranted(WorkspaceVoter::WORKSPACE_VIEW, $board);

        $labels = $labelRepository->findBy(['board' => $board]);

        $json = $serializer->serialize($labels, 'json', ['groups' => 'label:read']);

        return JsonResponse::fromJsonString($json);
    }

    #[Route('/colors', name: 'app_label_colors', methods: ['GET'])]
    public function colors(): JsonResponse
    {
        return new JsonResponse(Label::ALLOWED_COLORS);
    }

    #[Route('', name: 'app_label_create', methods: ['POST'])]
    public function create(
        Request $request,
        SerializerInterface $serializer,
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        $board = $entityManager->getRepository(Board::class)->find($data['boardId'] ?? null);

        if ($board === null) {
            return new JsonResponse(['error' => 'Board bulunamadı.'], 404);
        }

        $this->denyAccessUnlessGranted(WorkspaceVoter::LABEL_CREATE, $board);

        $label = new Label();
        $label->setName($data['name'] ?? '');
        $label->setColor($data['color'] ?? '');
        $label->setBoard($board);

        $errors = $validator->validate($label);

        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[] = $error->getMessage();
            }

            return new JsonResponse(['errors' => $errorMessages], 400);
        }

        $entityManager->persist($label);
        $entityManager->flush();

        $json = $serializer->serialize($label, 'json', ['groups' => 'label:read']);

        return JsonResponse::fromJsonString($json, 201);
    }

    #[Route('/{id}', name: 'app_label_delete', methods: ['DELETE'])]
    public function delete(Label $label, EntityManagerInterface $entityManager): JsonResponse
    {
        $this->denyAccessUnlessGranted(WorkspaceVoter::LABEL_DELETE, $label);

        $entityManager->remove($label);
        $entityManager->flush();

        return new JsonResponse(null, 204);
    }

        #[Route('/{id}/labels/{labelId}', name: 'app_task_add_label', methods: ['POST'])]
    public function addLabel(
        Task $task,
        int $labelId,
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer
    ): JsonResponse {
        $this->denyAccessUnlessGranted(WorkspaceVoter::TASK_EDIT, $task);

        $label = $entityManager->getRepository(Label::class)->find($labelId);

        if ($label === null) {
            return new JsonResponse(['error' => 'Etiket bulunamadı.'], 404);
        }

        if($label->getBoard()->getId() !== $task->getBoard()->getId()) {
            return new JsonResponse(['error' => 'Bu etiket bu board\'a ait değil.'], 404);
        }

        $task->addLabel($label);
        $entityManager->flush();

        $json = $serializer->serialize($task, 'json', ['groups' => 'task:read']);

        return JsonResponse::fromJsonString($json);
    }

    #[Route('/{id}/labels/{labelId}', name: 'app_task_remove_label', methods: ['DELETE'])]
    public function removeLabel (
        Task $task,
        int $labelId,
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer
    ): JsonResponse {
        $this->denyAccessUnlessGranted(WorkspaceVoter::TASK_EDIT, $task);

        $label = $entityManager->getRepository(Label::class)->find($labelId);

        if($label === null){
            return new JsonResponse(['error' => 'Etiket bulunamadı.'],404);
        }

        $task->removeLabel($label);
        $entityManager->flush();
    
        $json = $serializer->serialize($task, 'json', ['groups' => 'task:read']);

        return JsonResponse::fromJsonString($json);
    }
}
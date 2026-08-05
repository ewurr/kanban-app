<?php

namespace App\Controller;

use App\Entity\Comment;
use App\Entity\Task;
use App\Enum\ActivityAction;
use App\Repository\CommentRepository;
use App\Security\Voter\CommentVoter;
use App\Security\Voter\WorkspaceVoter;
use App\Service\ActivityLogger;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/tasks/{taskId}/comments')]
final class CommentController extends AbstractController
{
    #[Route('', name: 'app_comment_index', methods: ['GET'])]
    public function index(
        int $taskId,
        EntityManagerInterface $entityManager,
        CommentRepository $commentRepository,
        SerializerInterface $serializer
    ): JsonResponse {
        $task = $entityManager->getRepository(Task::class)->find($taskId);

        if ($task === null) {
            return new JsonResponse(['error' => 'Task not found'], 404);
        }

        $this->denyAccessUnlessGranted(WorkspaceVoter::WORKSPACE_VIEW, $task);

        $comments = $commentRepository->findByTaskOrdered($task);

        $json = $serializer->serialize($comments, 'json', ['groups' => 'comment:read']);

        return JsonResponse::fromJsonString($json);
    }

    #[Route('', name: 'app_comment_create', methods: ['POST'])]
    public function create(
        int $taskId,
        Request $request,
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer,
        ValidatorInterface $validator,
        ActivityLogger $activityLogger
    ): JsonResponse {
        $task = $entityManager->getRepository(Task::class)->find($taskId);

        if ($task === null) {
            return new JsonResponse(['error' => 'Task not found'], 404);
        }

        $this->denyAccessUnlessGranted(WorkspaceVoter::WORKSPACE_VIEW, $task);

        $data = json_decode($request->getContent(), true);

        $comment = new Comment();
        $comment->setTask($task);
        $comment->setContent($data['content'] ?? '');
        $comment->setAuthor($this->getUser());

        $errors = $validator->validate($comment);

        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[] = $error->getMessage();
            }

            return new JsonResponse(['errors' => $errorMessages], 400);
        }

        $entityManager->persist($comment);

        $activityLogger->log($task, ActivityAction::CommentAdded, $this->getUser());

        $entityManager->flush();

        $json = $serializer->serialize($comment, 'json', ['groups' => 'comment:read']);

        return JsonResponse::fromJsonString($json, 201);
    }

    #[Route('/{commentId}', name: 'app_comment_update', methods: ['PUT'])]
    public function update(
        int $taskId,
        int $commentId,
        Request $request,
        EntityManagerInterface $entityManager,
        CommentRepository $commentRepository,
        SerializerInterface $serializer,
        ValidatorInterface $validator
    ): JsonResponse {
        $comment = $commentRepository->find($commentId);

        if ($comment === null || $comment->getTask()->getId() !== $taskId) {
            return new JsonResponse(['error' => 'Comment not found'], 404);
        }

        $this->denyAccessUnlessGranted(CommentVoter::COMMENT_EDIT, $comment);

        $data = json_decode($request->getContent(), true);

        if (isset($data['content'])) {
            $comment->setContent($data['content']);
            $comment->setEditedAt(new \DateTimeImmutable());
        }

        $errors = $validator->validate($comment);

        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[] = $error->getMessage();
            }

            return new JsonResponse(['errors' => $errorMessages], 400);
        }

        $entityManager->flush();

        $json = $serializer->serialize($comment, 'json', ['groups' => 'comment:read']);

        return JsonResponse::fromJsonString($json);
    }

    #[Route('/{commentId}', name: 'app_comment_delete', methods: ['DELETE'])]
    public function delete(
        int $taskId,
        int $commentId,
        EntityManagerInterface $entityManager,
        CommentRepository $commentRepository,
        ActivityLogger $activityLogger
    ): JsonResponse {
        $comment = $commentRepository->find($commentId);

        if ($comment === null || $comment->getTask()->getId() !== $taskId) {
            return new JsonResponse(['error' => 'Comment not found'], 404);
        }

        $this->denyAccessUnlessGranted(CommentVoter::COMMENT_DELETE, $comment);

        $task = $comment->getTask();

        $entityManager->remove($comment);

        $activityLogger->log($task, ActivityAction::CommentDeleted, $this->getUser());

        $entityManager->flush();

        return new JsonResponse(null, 204);
    }
}
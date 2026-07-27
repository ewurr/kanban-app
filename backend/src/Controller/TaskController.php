<?php

namespace App\Controller;

use App\Entity\Column;
use App\Repository\TaskRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;
use App\Entity\Task;
use App\Entity\TaskAssignment;
use App\Entity\User;
use App\Security\Voter\WorkspaceVoter;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Validator\Validator\ValidatorInterface;


#[Route('/api/tasks')]
final class TaskController extends AbstractController
{
    #[Route('', name: 'app_task_index', methods: ['GET'])]
    public function index (TaskRepository $taskRepository, SerializerInterface $serializer): JsonResponse
    {
        $tasks = $taskRepository->findAllForUser($this->getUser());

        $json = $serializer->serialize($tasks, 'json', ['groups' => 'task:read']);

        return JsonResponse::fromJsonString($json);
    }

    #[Route('/{id}', name: 'app_task_show', methods: ['GET'])]
    public function show(Task $task, SerializerInterface $serializer): JsonResponse 
    {
        $this->denyAccessUnlessGranted(WorkspaceVoter::WORKSPACE_VIEW, $task);

        $json = $serializer->serialize($task, 'json', ['groups' => 'task:read']);

        return JsonResponse::fromJsonString($json);
    }

    #[Route('', name: 'app_task_create', methods: ['POST'])]
    public function create (
        Request $request,
        SerializerInterface $serializer, 
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        $column = $entityManager->getRepository(Column::class)->find($data['columnId']);

        $this->denyAccessUnlessGranted(WorkspaceVoter::TASK_CREATE, $column);

        $task = new Task();
        $task->setTitle($data['title']);
        $task->setDescription($data['description'] ?? null);
        $task->setPriority($data['priority']);
        $task->setPosition($data['position']);
        $task->setColumn($column);

        if(isset($data['dueDate'])){
            $task->setDueDate(new \DateTimeImmutable($data['dueDate']));
        }

        $errors = $validator->validate($task);

        if(count($errors) > 0){
            $errorMessages=[];
            foreach ($errors as $error) {
                $errorMessages[] = $error->getMessage();
            }

            return new JsonResponse(['errors' => $errorMessages], 400);
        }

        $entityManager->persist($task);
        $entityManager->flush();

        $json = $serializer->serialize($task, 'json', ['groups' => 'task:read']);

        return JsonResponse::fromJsonString($json, 201);
    }

    #[Route('/{id}', name: 'app_task_update', methods: ['PUT'])]
    public function update(
        Task $task, 
        Request $request,
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer,
        ValidatorInterface $validator
    ): JsonResponse {
        $this->denyAccessUnlessGranted(WorkspaceVoter::TASK_EDIT, $task);

        $data = json_decode($request->getContent(), true);

        if(isset($data['title'])){
            $task->setTitle($data['title']);
        }

        if(isset($data['description'])){
            $task->setDescription($data['description']);
        }

        if(isset($data['priority'])){
            $task->setPriority($data['priority']);  
        }   

        if(isset($data['position'])){
            $task->setPosition($data['position']);
        }

        if (isset($data['dueDate'])) {
            $task->setDueDate(new \DateTimeImmutable($data['dueDate']));
        }

        if (isset($data['columnId'])){
            $column = $entityManager->getRepository(Column::class)->find($data['columnId']);
            $task->setColumn($column);
        }

        $errors = $validator->validate($task);

        if(count($errors) > 0){
            $errorMessages=[];
            foreach ($errors as $error) {
                $errorMessages[] = $error->getMessage();
            }

            return new JsonResponse(['errors' => $errorMessages], 400);
        }

        $entityManager->flush();

        $json = $serializer->serialize($task, 'json', ['groups' => 'task:read']);

        return JsonResponse::fromJsonString($json);
    }

    #[Route('/{id}/assignees', name: 'app_task_add_assşgnee', methods: ['POST'])]
    public function addAssignee(
        Task $task,
        Request $request,
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer
    ): JsonResponse {
        $this->denyAccessUnlessGranted(WorkspaceVoter::TASK_EDIT, $task);

        $data =  json_decode($request->getContent(), true);

        $user = $entityManager->getRepository(User::class)->find($data['userId'] ?? null);

        if($user === null) {
            return new JsonResponse(['error' => 'User not found'], 404);
        }

        $existingAssignment = $entityManager->getRepository(TaskAssignment::class)
            ->findOneBy(['task' => $task, 'user' => $user]);
    
        if($existingAssignment !== null){
            return new JsonResponse(['error' => 'This user is already assigned to this task.'], 409);
        }

        $assignment = new TaskAssignment();
        $assignment->setTask($task);
        $assignment->setUser($user);

        $task->getAssignments()->add($assignment);

        $entityManager->persist($assignment);
        $entityManager->flush();

        $json = $serializer->serialize($task, 'json', ['groups' => 'task:read']);

        return JsonResponse::fromJsonString($json, 201);
    }

    #[Route('/{id}/assignees/{userId}', name: 'app_task_remove_assşgnee', methods: ['DELETE'])]
    public function removeAssignee(
        Task $task,
        int $userId,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $this->denyAccessUnlessGranted(WorkspaceVoter::TASK_EDIT, $task);

        $user = $entityManager->getRepository(User::class)->find($userId);

        if ($user === null) {
            return new JsonResponse(['error' => 'User not found'], 404);
        }

        $assignment = $entityManager->getRepository(TaskAssignment::class)
            ->findOneBy(['task' => $task, 'user' => $user]);    
        
        if($assignment === null) {
            return new JsonResponse(['error' => 'This user is not assigned to this task.', 404]);
        }

        $entityManager->remove($assignment);
        $entityManager->flush();

        return new JsonResponse(null, 204);
    }





    #[Route('/{id}', name: 'app_task_delete', methods: ['DELETE'])]
    public function delete (Task $task, EntityManagerInterface $entityManager): JsonResponse 
    {
        $this->denyAccessUnlessGranted(WorkspaceVoter::TASK_DELETE, $task);

        $entityManager->remove($task);
        $entityManager->flush();

        return new JsonResponse(null, 204);
    }

    



}

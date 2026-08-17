<?php

namespace App\Controller;

use App\Entity\Column;
use App\Entity\Label;
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
use App\Enum\ActivityAction;
use App\Service\ActivityLogger;
use App\Repository\ActivityLogRepository;
use App\Service\NotificationService;


#[Route('/api/tasks')]
final class TaskController extends AbstractController
{
    #[Route('', name: 'app_task_index', methods: ['GET'])]
    public function index(Request $request, TaskRepository $taskRepository, SerializerInterface $serializer): JsonResponse
    {
        $boardId = $request->query->get('boardId');
        $workspaceId = $request->query->get('workspaceId');

        if ($boardId !== null) {
            $tasks = $taskRepository->findAllForUserAndBoard($this->getUser(), (int) $boardId);
        } elseif ($workspaceId !== null) {
            $tasks = $taskRepository->findAllForUserAndWorkspace($this->getUser(), (int) $workspaceId);
        } else {
            $tasks = $taskRepository->findAllForUser($this->getUser());
        }

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
        ValidatorInterface $validator,
        ActivityLogger $activityLogger
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        $column = $entityManager->getRepository(Column::class)->find($data['columnId'] ?? null);

        if ($column === null) {
            return new JsonResponse(['error' => 'Column not found'], 404);
        }

        $this->denyAccessUnlessGranted(WorkspaceVoter::TASK_CREATE, $column);

        $task = new Task();
        $task->setTitle($data['title']);
        $task->setDescription($data['description'] ?? null);
        $task->setPriority($data['priority']);
        $task->setPosition($data['position']);
        $task->setColumn($column);
        $task->setColor($data['color'] ?? '#FFD93D'); 

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

        $activityLogger->log($task, ActivityAction::Created, $this->getUser());

        $entityManager->flush();

        $json = $serializer->serialize($task, 'json', ['groups' => 'task:read']);

        return JsonResponse::fromJsonString($json, 201);
    }

    #[Route('/reorder', name: 'app_task_reorder', methods: ['PATCH'])]
    public function reorder (
        Request $request,
        EntityManagerInterface $entityManager,
        ActivityLogger $activityLogger
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);
        $columnsData = $data['columns'] ?? [];

        $currentUser = $this->getUser();

        if (!$currentUser instanceof User) {
            // JWT string identifier dönüyorsa entity'yi DB'den çek
            $currentUser = $entityManager->getRepository(User::class)
                ->findOneBy(['email' => $currentUser]);
        }

        if (!$currentUser instanceof User) {
            return new JsonResponse(['error' => 'Kullanıcı doğrulanamadı.'], 401);
        }

        if(!is_array($columnsData) || count($columnsData) === 0) {
            return new JsonResponse(['error' => 'Geçersiz veri.'], 400);
        }

        $entityManager->beginTransaction();

        try{
            foreach($columnsData as $columnPayload) {
                $column = $entityManager->getRepository(Column::class)
                    ->find($columnPayload['columnId'] ?? null);

                if($column === null) {
                    throw new \RuntimeException('Column bulunamadı.'); 
                }

                $taskIds = $columnPayload['taskIds'] ?? [];

                foreach($taskIds as $position => $taskId) {

                    $taskId = (int) $taskId;

                    if($taskId === 0){
                        throw new \RuntimeException('Geçersiz task ID.');
                    }

                    $task = $entityManager->getRepository(Task::class)->find($taskId);

                    if($task === null) {
                        throw new \RuntimeException('Task bulunamadı.' . $taskId);
                    }

                    $this->denyAccessUnlessGranted(WorkspaceVoter::TASK_EDIT, $task);

                    $oldColumn = $task->getColumn();

                    if($oldColumn->getId() !== $column->getId()) {
                        $activityLogger->log(
                            $task,
                            ActivityAction::Moved,
                            $currentUser,
                            $oldColumn->getName(),
                            $column->getName()
                        );
                        $task->setColumn($column);
                    }

                    $task->setPosition($position);
                }
            }
            $entityManager->flush();
            $entityManager->commit();
        
        } catch (\Throwable $e) {
            $entityManager->rollback();
            return new JsonResponse(['error' => $e->getMessage()], 400);
        }

        return new JsonResponse(null, 204);

    }


    #[Route('/{id}', name: 'app_task_update', methods: ['PUT'])]
    public function update(
        Task $task, 
        Request $request,
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer,
        ValidatorInterface $validator,
        ActivityLogger $activityLogger
    ): JsonResponse {
        $this->denyAccessUnlessGranted(WorkspaceVoter::TASK_EDIT, $task);

        $data = json_decode($request->getContent(), true);

        $oldColumnId = $task->getColumn()?->getId();
        $oldColumName = $task->getColumn()?->getName();
        $oldPriority = $task->getPriority();

        if(isset($data['title'])){
            $task->setTitle($data['title']);
        }

        if(isset($data['description'])){
            $task->setDescription($data['description']);
        }

        if(isset($data['priority'])){
            $task->setPriority($data['priority']);  
        }   

        if (isset($data['dueDate'])) {
            $task->setDueDate(new \DateTimeImmutable($data['dueDate']));
        }

        if (isset($data['columnId'])){
            $column = $entityManager->getRepository(Column::class)->find($data['columnId']);
            $task->setColumn($column);
        }

        $newColumnId = $task->getColumn()?->getId();

        if($oldColumnId !== null && $newColumnId !== null && $oldColumnId !== $newColumnId){
            $activityLogger->log(
                $task, 
                ActivityAction::Moved, 
                $this->getUser(), 
                $oldColumName, 
                $task->getColumn()?->getName()
            );
        }

        if(isset($data['priority']) && $oldPriority !== null && $oldPriority !== $data['priority']){
            $activityLogger->log(
                $task, 
                ActivityAction::PriorityChanged, 
                $this->getUser(), 
                $oldPriority, 
                $data['priority']
            );
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

    #[Route('/{id}/assignees', name: 'app_task_add_assignee', methods: ['POST'])]
    public function addAssignee(
        Task $task,
        Request $request,
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer,
        ActivityLogger $activityLogger,
        NotificationService $notificationService
    ): JsonResponse {
        $this->denyAccessUnlessGranted(WorkspaceVoter::TASK_EDIT, $task);

        $data =  json_decode($request->getContent(), true);

        $user = $entityManager->getRepository(User::class)->find($data['userId'] ?? null);

        if($user === null) {
            return new JsonResponse(['error' => 'Kullanıcı bulunamadı.'], 404);
        }

        $existingAssignment = $entityManager->getRepository(TaskAssignment::class)
            ->findOneBy(['task' => $task, 'user' => $user]);
    
        if($existingAssignment !== null){
            return new JsonResponse(['error' => 'Bu kullanıcı zaten bu göreve atanmış.'], 409);
        }

        $assignment = new TaskAssignment();
        $assignment->setTask($task);
        $assignment->setUser($user);

        $task->getAssignments()->add($assignment);

        $entityManager->persist($assignment);
        
        $activityLogger->log(
            $task,
            ActivityAction::Assigned,
            $this->getUser(),
            null,
            $user->getName() . ' ' . $user->getSurname()
        );

        if ($this->getUser() !== $user) {
            $notificationService->notifyTaskAssigned($task, $user);
        }

        $entityManager->flush();

        $json = $serializer->serialize($task, 'json', ['groups' => 'task:read']);

        return JsonResponse::fromJsonString($json, 201);
    }

    #[Route('/{id}/assignees/{userId}', name: 'app_task_remove_assignee', methods: ['DELETE'])]
    public function removeAssignee(
        Task $task,
        int $userId,
        EntityManagerInterface $entityManager,
        ActivityLogger $activityLogger
    ): JsonResponse {
        $this->denyAccessUnlessGranted(WorkspaceVoter::TASK_EDIT, $task);

        $user = $entityManager->getRepository(User::class)->find($userId);

        if ($user === null) {
            return new JsonResponse(['error' => 'Kullanıcı bulunamadı.'], 404);
        }

        $assignment = $entityManager->getRepository(TaskAssignment::class)
            ->findOneBy(['task' => $task, 'user' => $user]);    
        
        if($assignment === null) {
            return new JsonResponse(['error' => 'Bu kullanıcı bu göreve atanmamış.', 404]);
        }

        $activityLogger->log(
            $task,
            ActivityAction::Unassigned,
            $this->getUser(),
            null,
            $user->getName() . ' ' . $user->getSurname(),
            null
        );

        $entityManager->remove($assignment);
        $entityManager->flush();

        return new JsonResponse(null, 204);
    }


    #[Route('/{id}', name: 'app_task_delete', methods: ['DELETE'])]
    public function delete (Task $task, EntityManagerInterface $entityManager, ActivityLogger $activityLogger): JsonResponse 
    {
        $this->denyAccessUnlessGranted(WorkspaceVoter::TASK_DELETE, $task);

        $activityLogger->logTaskDeleted($task, $this->getUser());

        $entityManager->remove($task);
        $entityManager->flush();

        return new JsonResponse(null, 204);
    }

    #[Route('/{id}/activity', name: 'app_task_activity', methods: ['GET'])]
    public function activity (
        Task $task,
        SerializerInterface $serializer,
        ActivityLogRepository $activityLogRepository
    ): JsonResponse {
        $this->denyAccessUnlessGranted(WorkspaceVoter::WORKSPACE_VIEW, $task);

        $logs = $activityLogRepository->findByTaskOrdered($task);

        $json = $serializer->serialize($logs, 'json', ['groups' => 'activity:read']);

        return JsonResponse::fromJsonString($json);
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

        if ($label->getBoard()->getId() !== $task->getColumn()->getBoard()->getId()) {
            return new JsonResponse(['error' => 'Bu etiket bu board\'a ait değil.'], 400);
        }

        $task->addLabel($label);
        $entityManager->flush();

        $json = $serializer->serialize($task, 'json', ['groups' => 'task:read']);

        return JsonResponse::fromJsonString($json);
    }

    #[Route('/{id}/labels/{labelId}', name: 'app_task_remove_label', methods: ['DELETE'])]
    public function removeLabel(
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

        $task->removeLabel($label);
        $entityManager->flush();

        $json = $serializer->serialize($task, 'json', ['groups' => 'task:read']);

        return JsonResponse::fromJsonString($json);
    }

}

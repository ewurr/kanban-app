<?php

namespace App\Controller;

use App\Entity\Board;
use App\Entity\Column;
use App\Entity\Project;
use App\Entity\Workspace;
use App\Repository\BoardRepository;
use App\Security\Voter\WorkspaceVoter;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Validator\Validator\ValidatorInterface;



#[Route('/api/boards')]
final class BoardController extends AbstractController
{
    #[Route('', name: 'app_board_index', methods: ['GET'])]
    public function index (Request $request, BoardRepository $boardRepository, SerializerInterface $serializer): JsonResponse
    {
        $projectId = $request->query->get('projectId');

        if($projectId !== null){
            $boards = $boardRepository->findAllForUserAndProject($this->getUser(), (int)$projectId);
        } else {
            $boards = $boardRepository->findAllForUser($this->getUser());
        }

        $json = $serializer->serialize($boards, 'json', ['groups' => 'board:read']);

        return JsonResponse::fromJsonString($json);
    }

    #[Route('/{id}', name: 'app_board_show', methods: ['GET'])]
    public function show(Board $board, SerializerInterface $serializer): JsonResponse
    {
        $this->denyAccessUnlessGranted(WorkspaceVoter::WORKSPACE_VIEW, $board);

        $json = $serializer->serialize($board, 'json', ['groups' => 'board:read']);

        return JsonResponse::fromJsonString($json);
    }

    #[Route('', name: 'app_board_create', methods: ['POST'])]
    public function create (
        Request $request, 
        SerializerInterface $serializer,
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator
    ) : JsonResponse {
        $data = json_decode($request->getContent(), true);

        $project = $entityManager->getRepository(Project::class)->find($data['projectId'] ?? null);

        if ($project === null) {
            return new JsonResponse(['error' => 'Project not found'], 404);
        }

        $this->denyAccessUnlessGranted(WorkspaceVoter::BOARD_CREATE, $project);

        $board = new Board();
        $board->setName($data['name']);
        $board->setProject($project);

        $errors = $validator->validate($board);

        if(count($errors) > 0){
            $errorMessages=[];
            foreach ($errors as $error) {
                $errorMessages[] = $error->getMessage();
            }

            return new JsonResponse(['errors' => $errorMessages], 400);
        }

        $entityManager->persist($board);

        $defaultColumns = ['To Do', 'In Progress', 'Done'];

        foreach($defaultColumns as $index => $columnName){
            $column = new Column();
            $column->setName($columnName);
            $column->setPosition($index + 1);
            $column->setBoard($board);

            $entityManager->persist($column);

        }

        $entityManager->flush();

        $json = $serializer->serialize($board, 'json', ['groups' => 'board:read']);

        return JsonResponse::fromJsonString($json, 201);

    }

    #[Route('/{id}', name: 'app_board_update', methods: ['PUT'])]
    public function update(
        Board $board, 
        Request $request,
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer,
        ValidatorInterface $validator
    ): JsonResponse {
        $this->denyAccessUnlessGranted(WorkspaceVoter::BOARD_EDIT, $board);

        $data = json_decode($request->getContent(), true);

        if(isset($data['name'])){
            $board->setName($data['name']);
        }

        $errors = $validator->validate($board);

        if(count($errors) > 0){
            $errorMessages=[];
            foreach ($errors as $error) {
                $errorMessages[] = $error->getMessage();
            }

            return new JsonResponse(['errors' => $errorMessages], 400);
        }

        $entityManager->flush();

        $json = $serializer->serialize($board, 'json', ['groups' => 'board:read']);

        return JsonResponse::fromJsonString($json);
    }

    #[Route('/{id}', name: 'app_board_delete', methods: ['DELETE'])]
    public function delete (Board $board, EntityManagerInterface $entityManager): JsonResponse
    {
        $this->denyAccessUnlessGranted(WorkspaceVoter::BOARD_DELETE, $board);

        $entityManager->remove($board);
        $entityManager->flush();

        return new JsonResponse(null, 204);
    }



}

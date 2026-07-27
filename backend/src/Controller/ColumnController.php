<?php

namespace App\Controller;

use App\Repository\ColumnRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use App\Entity\Column;
use App\Entity\Board;
use App\Security\Voter\WorkspaceVoter;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;



#[Route('/api/columns')]
final class ColumnController extends AbstractController
{
    #[Route('', name: 'app_column_index', methods: ['GET'])]
    public function index (ColumnRepository $columnRepository, SerializerInterface $serializer): JsonResponse
    {
        $columns = $columnRepository->findAllForUser($this->getUser());

        $json = $serializer->serialize($columns, 'json', ['groups' => 'column:read']);

        return JsonResponse::fromJsonString($json);
    }

    #[Route('/{id}', name: 'app_column_show', methods: ['GET'])]
    public function show(Column $column, SerializerInterface $serializer): JsonResponse
    {
        $this->denyAccessUnlessGranted(WorkspaceVoter::WORKSPACE_VIEW, $column);
        
        $json = $serializer->serialize($column, 'json', ['groups' =>'column:read']);

        return JsonResponse::fromJsonString($json);
    }

    #[Route('', name: 'app_column_create', methods: ['POST'])]
    public function create(
        Request $request,
        SerializerInterface $serializer,
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        $board = $entityManager->getRepository(Board::class)->find($data['boardId']);

        $this->denyAccessUnlessGranted(WorkspaceVoter::COLUMN_CREATE, $board);

        $column = new Column();
        $column->setName($data['name']);
        $column->setPosition($data['position']);
        $column->setBoard($board);

        $errors = $validator->validate($column);

        if(count($errors) > 0){
            $errorMessages=[];
            foreach ($errors as $error) {
                $errorMessages[] = $error->getMessage();
            }

            return new JsonResponse(['errors' => $errorMessages], 400);
        }

        $entityManager->persist($column);
        $entityManager->flush();

        $json = $serializer->serialize($column, 'json', ['groups' => 'column:read']);

        return JsonResponse::fromJsonString($json, 201);
        
    }

    #[Route('/{id}', name: 'app_column_update', methods: ['PUT'])]
    public function update(
        Column $column,
        Request $request,
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer,
        ValidatorInterface $validator
    ): JsonResponse {
        $this->denyAccessUnlessGranted(WorkspaceVoter::COLUMN_EDIT, $column);


        $data = json_decode($request->getContent(), true);

        if(isset($data['name'])){
            $column->setName($data['name']);
        }

        $errors = $validator->validate($column);

        if(count($errors) > 0){
            $errorMessages=[];
            foreach ($errors as $error) {
                $errorMessages[] = $error->getMessage();
            }

            return new JsonResponse(['errors' => $errorMessages], 400);
        }

        $entityManager->flush();

        $json = $serializer->serialize($column, 'json', ['groups' => 'column:read']);

        return JsonResponse::fromJsonString($json);
    }

    #[Route('/{id}', name: 'app_column_delete', methods: ['DELETE'])]
    public function delete(Column $column, EntityManagerInterface $entityManager){
        $this->denyAccessUnlessGranted(WorkspaceVoter::COLUMN_DELETE, $column);
    
        $entityManager->remove($column);
        $entityManager->flush();

        return new JsonResponse(null, 204);
    }
}

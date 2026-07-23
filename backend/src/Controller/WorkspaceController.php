<?php

namespace App\Controller;

use App\Repository\WorkspaceRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;
use App\Entity\Workspace;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use App\Entity\User;
use App\Security\Voter\WorkspaceVoter;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/workspaces')]
final class WorkspaceController extends AbstractController
{
    #[Route('', name: 'app_workspace_index', methods: ['GET'])]
    public function index(WorkspaceRepository $workspaceRepository, SerializerInterface $serializer): JsonResponse
    {
        $workspaces = $workspaceRepository->findAllForUser($this->getUser());

        $json = $serializer->serialize($workspaces, 'json', ['groups' => 'workspace:read']);

        return JsonResponse::fromJsonString($json);
    }

    #[Route('/{id}', name: 'app_workspace_show', methods: ['GET'])]
    public function show (Workspace $workspace, SerializerInterface $serializer): JsonResponse
    {
        $this->denyAccessUnlessGranted(WorkspaceVoter::VIEW, $workspace);

        $json = $serializer->serialize($workspace, 'json', ['groups'=> 'workspace:read']);
        
        return JsonResponse::fromJsonString($json);
    }

    #[Route('', name: 'app_workspace_create', methods: ['POST'])]
    public function create (
        Request $request,
        SerializerInterface $serializer,
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator
    ) : JsonResponse {
        $data = json_decode($request->getContent(), true);

        $workspace = new Workspace();
        $workspace->setName($data['name'] ?? '');
        $workspace->setOwner($this->getUser());

        $errors = $validator->validate($workspace);

        if(count($errors) > 0){
            $errorMessages=[];
            foreach ($errors as $error) {
                $errorMessages[] = $error->getMessage();
            }

            return new JsonResponse(['errors' => $errorMessages], 400);
        }


        $entityManager->persist($workspace);
        $entityManager->flush();

        $json = $serializer->serialize($workspace, 'json', ['groups' => 'workspace:read']);

        return JsonResponse::fromJsonString($json, 201);
    }

    #[Route('/{id}', name: 'app_workspace_update', methods: ['PUT'])]
    public function update(
        Workspace $workspace,
        Request $request,
        SerializerInterface $serializer,
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator
    ) : JsonResponse {

        $this->denyAccessUnlessGranted(WorkspaceVoter::EDIT, $workspace);

        $data = json_decode($request->getContent(), true);

        if(isset($data['name'])) {
            $workspace->setName($data['name']);
        }

        $errors = $validator->validate($workspace);

        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[] = $error->getMessage();
            }

            return new JsonResponse(['errors' => $errorMessages], 400);
        }      

        $entityManager->flush();

        $json = $serializer->serialize($workspace, 'json', ['groups' => 'workspace:read']);

        return JsonResponse::fromJsonString($json);

    }

    #[Route('/{id}/members', name: 'app_workspace_add_member', methods: ['POST'])]
    public function addMember (
        Workspace $workspace,
        Request $request, 
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer
    ): JsonResponse {
        $this->denyAccessUnlessGranted(WorkspaceVoter::EDIT, $workspace);

        $data = json_decode($request->getContent(), true);

        $user = $entityManager->getRepository(User::class)->find($data['userId'] ?? null);

        if($user === null) {
            return new JsonResponse(['error' => 'Kullanıcı bulunamadı'], 404);
        }

        $workspace->addMember($user);
        $entityManager->flush();

        $json = $serializer->serialize($workspace, 'json', ['groups' => 'workspace:read']);

        return JsonResponse::fromJsonString($json);
    }

    #[Route('/{id}', name: 'app_workspace_delete', methods: ['DELETE'])]
    public function delete (Workspace $workspace, EntityManagerInterface $entityManager): JsonResponse
    {
        $this->denyAccessUnlessGranted(WorkspaceVoter::DELETE, $workspace);

        $entityManager->remove($workspace);
        $entityManager->flush();

        return new JsonResponse(null, 204);
    }


    

}
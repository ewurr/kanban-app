<?php

namespace App\Controller;

use App\Repository\ProjectRepository;
use JsonException;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;
use App\Entity\Project;
use App\Entity\Workspace;
use App\Security\Voter\WorkspaceVoter;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Validator\Validator\ValidatorInterface;



#[Route('/api/projects')]
final class ProjectController extends AbstractController
{
    #[Route('', name: 'app_project_index', methods: ['GET'])]
    public function index (ProjectRepository $projectRepository, SerializerInterface $serializer): JsonResponse
    {
        $projects = $projectRepository->findAllForUser($this->getUser());

        $json = $serializer->serialize($projects, 'json', ['groups' => 'project:read']);

        return JsonResponse::fromJsonString($json);
    }

    #[Route('/{id}', name: 'app_project_show', methods: ['GET'])]
    public function show (Project $project, SerializerInterface $serializer): JsonResponse
    {
        $this->denyAccessUnlessGranted(WorkspaceVoter::VIEW, $project->getWorkspace());

        $json = $serializer->serialize($project, 'json', ['groups'=> 'project:read']);
        
        return JsonResponse::fromJsonString($json);
    }

    #[Route('', name: 'app_project_create', methods: ['POST'])]
    public function create (
        Request $request,
        SerializerInterface $serializer,
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator
    ) : JsonResponse {
        $data = json_decode($request->getContent(), true);

        $workspace = $entityManager->getRepository(Workspace::class)->find($data['workspaceId']);

        $this->denyAccessUnlessGranted(WorkspaceVoter::EDIT, $workspace);

        $project = new Project();
        $project->setName($data['name']);
        $project->setDescription($data['description'] ?? null);
        $project->setWorkspace($workspace);

        $errors = $validator->validate($project);

        if(count($errors) > 0){
            $errorMessages=[];
            foreach ($errors as $error) {
                $errorMessages[] = $error->getMessage();
            }

            return new JsonResponse(['errors' => $errorMessages], 400);
        }

        $entityManager->persist($project);
        $entityManager->flush();

        $json = $serializer->serialize($project, 'json', ['groups' => 'project:read']);
        
        return JsonResponse::fromJsonString($json, 201);
    }

    #[Route('/{id}', name: 'app_project_update', methods: ['PUT'])]
    public function update(
        Project $project,
        Request $request,
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer,
        ValidatorInterface $validator
    ): JsonResponse {
        $this->denyAccessUnlessGranted(WorkspaceVoter::EDIT, $project->getWorkspace());

        $data = json_decode($request->getContent(), true);

        if(isset($data['name'])){
            $project->setName($data['name']);
        }

        $errors = $validator->validate($project);

        if(count($errors) > 0){
            $errorMessages=[];
            foreach ($errors as $error) {
                $errorMessages[] = $error->getMessage();
            }

            return new JsonResponse(['errors' => $errorMessages], 400);
        }

        $entityManager->flush();

        $json = $serializer->serialize($project, 'json', ['groups' => 'project:read']);

        return JsonResponse::fromJsonString($json);
    }

    #[Route('/{id}', name: 'app_project_delete', methods: ['DELETE'])]
    public function delete(Project $project, EntityManagerInterface $entityManager): JsonResponse
    {
        $this->denyAccessUnlessGranted(WorkspaceVoter::DELETE, $project->getWorkspace());

        $entityManager->remove($project);
        $entityManager->flush();

        return new JsonResponse(null,204);
    }
    

}


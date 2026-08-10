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
    public function index (Request $request, ProjectRepository $projectRepository, SerializerInterface $serializer): JsonResponse
    {
        $workspaceId = $request->query->get('workspaceId');

        if($workspaceId !== null){
            $projects = $projectRepository->findAllForUserAndWorkspace($this->getUser(), (int)$workspaceId);
        } else {
            $projects = $projectRepository->findAllForUser($this->getUser());
        }

        $json = $serializer->serialize($projects, 'json', ['groups' => 'project:read']);

        return JsonResponse::fromJsonString($json);
    }

    #[Route('/{id}', name: 'app_project_show', methods: ['GET'])]
    public function show (Project $project, SerializerInterface $serializer): JsonResponse
    {
        $this->denyAccessUnlessGranted(WorkspaceVoter::WORKSPACE_VIEW, $project);

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

        $this->denyAccessUnlessGranted(WorkspaceVoter::PROJECT_CREATE, $workspace);

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
        $this->denyAccessUnlessGranted(WorkspaceVoter::PROJECT_EDIT, $project);

        $data = json_decode($request->getContent(), true);

        if(isset($data['name'])){
            $project->setName($data['name']);
        }

        if(array_key_exists('description', $data)){
            $project->setDescription($data['description']);
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
        $this->denyAccessUnlessGranted(WorkspaceVoter::PROJECT_DELETE, $project);

        $entityManager->remove($project);
        $entityManager->flush();

        return new JsonResponse(null,204);
    }
    

}


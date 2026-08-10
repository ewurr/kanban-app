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
use App\Entity\WorkspaceMember;
use App\Enum\WorkspaceRole;
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
        $this->denyAccessUnlessGranted(WorkspaceVoter::WORKSPACE_VIEW, $workspace);

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

        $errors = $validator->validate($workspace);

        if(count($errors) > 0){
            $errorMessages=[];
            foreach ($errors as $error) {
                $errorMessages[] = $error->getMessage();
            }

            return new JsonResponse(['errors' => $errorMessages], 400);
        }


        $entityManager->persist($workspace);

        $ownerMembership = new WorkspaceMember();
        $ownerMembership->setWorkspace($workspace);
        $ownerMembership->setUser($this->getUser());
        $ownerMembership->setRole(WorkspaceRole::OWNER);

        $workspace->getWorkspaceMembers()->add($ownerMembership);

        $entityManager->persist($ownerMembership);
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

        $this->denyAccessUnlessGranted(WorkspaceVoter::WORKSPACE_EDIT, $workspace);

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
        $this->denyAccessUnlessGranted(WorkspaceVoter::WORKSPACE_MANAGE_MEMBERS, $workspace);

        $data = json_decode($request->getContent(), true);

        $user = $entityManager->getRepository(User::class)->findOneBy(['email' => $data['email'] ?? null]);

        if($user === null) {
            return new JsonResponse(['error' => 'Kullanıcı bulunamadı.'], 404);
        }

        $role = WorkspaceRole::tryFrom($data['role'] ?? '');
        
        if($role === null){
            return new JsonResponse(['error' => 'Geçersiz rol. Owner, PM veya Worker olmalıdır.'], 400);
        }

        $existingMembership = $entityManager->getRepository(WorkspaceMember::class)
            ->findOneByWorkspaceAndUser($workspace, $user);

        if ($existingMembership !== null) {
            return new JsonResponse(['error' => 'Bu kullanıcı zaten workspace üyesi.'], 409);
        }

        $membership = new WorkspaceMember();
        $membership->setWorkspace($workspace);
        $membership->setUser($user);
        $membership->setRole($role);

        $entityManager->persist($membership);
        $entityManager->flush();

        $json = $serializer->serialize($workspace, 'json', ['groups' => 'workspace:read']);

        return JsonResponse::fromJsonString($json);
    }

    #[Route('/{id}', name: 'app_workspace_delete', methods: ['DELETE'])]
    public function delete (Workspace $workspace, EntityManagerInterface $entityManager): JsonResponse
    {
        $this->denyAccessUnlessGranted(WorkspaceVoter::WORKSPACE_DELETE, $workspace);

        $entityManager->remove($workspace);
        $entityManager->flush();

        return new JsonResponse(null, 204);
    }

    #[Route('/{id}/members/{memberId}', name: 'app_workspace_update_member', methods: ['PUT'])]
    public function updateMember(
        Workspace $workspace,
        int $memberId,
        Request $request,
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer
    ): JsonResponse {
        $this->denyAccessUnlessGranted(WorkspaceVoter::WORKSPACE_MANAGE_MEMBERS, $workspace);

        $membership = $entityManager->getRepository(WorkspaceMember::class)->find($memberId);

        if ($membership === null || $membership->getWorkspace()->getId() !== $workspace->getId()) {
            return new JsonResponse(['error' => 'Üyelik bulunamadı'], 404);
        }

        if ($membership->getRole() === WorkspaceRole::OWNER) {
            return new JsonResponse(['error' => 'Owner\'ın rolü değiştirilemez'], 403);
        }

        $data = json_decode($request->getContent(), true);
        $role = WorkspaceRole::tryFrom($data['role'] ?? '');

        if ($role === null) {
            return new JsonResponse(['error' => 'Geçersiz rol. owner, pm veya worker olmalıdır.'], 400);
        }

        if ($role === WorkspaceRole::OWNER) {
            return new JsonResponse(['error' => 'Bir üye owner rolüne yükseltilemez'], 403);
        }

        $membership->setRole($role);
        $entityManager->flush();

        $json = $serializer->serialize($workspace, 'json', ['groups' => 'workspace:read']);

        return JsonResponse::fromJsonString($json);
    }

    #[Route('/{id}/members/{memberId}', name: 'app_workspace_remove_member', methods:['DELETE'])]
    public function removeMember(
        Workspace $workspace,
        int $memberId,
        EntityManagerInterface $entityManager
    ): JsonResponse {

        $this->denyAccessUnlessGranted(WorkspaceVoter::WORKSPACE_MANAGE_MEMBERS, $workspace);

        $membership = $entityManager->getRepository(WorkspaceMember::class)->find($memberId);

        if($membership === null || $membership->getWorkspace()->getId() !== $workspace->getId()){
            return new JsonResponse(['error' => 'Üyelik bulunamadı.'], 404);
        }

        if($membership->getRole() === WorkspaceRole::OWNER){
            return new JsonResponse(['error' => 'Owner workspace\'ten çıkarılamaz'], 403);
        }

        $entityManager->remove($membership);
        $entityManager->flush();

        return new JsonResponse(null, 204);

    }

}
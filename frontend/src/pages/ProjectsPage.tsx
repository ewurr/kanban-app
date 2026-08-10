import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "../AuthContext"
import { ProjectCard } from "../components/ProjectCard/ProjectCard"
import { AddProjectCard } from "../components/AddProjectCard/AddProjectCard"
import { AddMemberCard } from '../components/AddMemberCard/AddMemberCard'
import { apiClient } from '../lib/apiClient'
import { LoadingState } from "../components/LoadingState/LoadingState"
import type { Project } from "../types/kanban"


export function ProjectsPage(){
    const {id} = useParams()
    const { user} = useAuth()

    const {data, isLoading, error} = useQuery<Project[]> ({
        queryKey: ['projects', id],
        queryFn: () => apiClient.get<Project[]>('/projects'),
    })

    const { data: workspace } = useQuery<{ workspaceMembers: { user: { id: number }; role: string }[] }>({
        queryKey: ['workspace', id],
        queryFn: () => apiClient.get(`/workspaces/${id}`),
    })

    if(isLoading) return <LoadingState/>
    if(error) return <p>Hata: {error.message}</p>

    const filteredProjects = data?.filter((project) => project.workspace.id === Number(id))
    const myMembership = workspace?.workspaceMembers.find((m) => m.user.id === user?.id)
    const isOwner = myMembership?.role === 'owner'

    return (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
                <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: '36px', marginBottom: '2rem' }}>Projeler</h1>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px 28px' }}>
                    {filteredProjects?.map((project, index) => (
                        <ProjectCard
                            key={project.id}
                            id={project.id}
                            name={project.name}
                            description={project.description}
                            isOwner={isOwner}
                            animationDelay={index * 0.05}

                        />
                    ))}
                </div>
            </div>

            <div style={{ width: '260px', flexShrink: 0, paddingTop: '80px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {isOwner && <AddProjectCard workspaceId={Number(id)} />}
                    {isOwner && <AddMemberCard workspaceId={Number(id)} />}
            </div>
        </div>
    )
}
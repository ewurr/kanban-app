import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../AuthContext";
import { BoardCard } from "../components/BoardCard/BoardCard"
import { AddBoardCard } from "../components/AddBoardCard/AddBoardCard"
import { apiClient } from '../lib/apiClient'
import { LoadingState } from "../components/LoadingState/LoadingState";
import type { Board, Project } from '../types/kanban'


export function BoardsPage(){
    const { id } = useParams()
    const { user } = useAuth()
    
    const {data, isLoading, error} = useQuery<Board[]>({
        queryKey: ['boards', id],
        queryFn: () => apiClient.get<Board[]>('/boards'),
    })

    const { data: project } = useQuery<Project>({
        queryKey: ['project', id],
        queryFn: () => apiClient.get<Project>(`/projects/${id}`),
    })

    const { data: workspace } = useQuery<{ workspaceMembers: { user: { id: number }; role: string }[] }>({
        queryKey: ['workspace', project?.workspace.id],
        enabled: !!project,
        queryFn: () => apiClient.get(`/workspaces/${project?.workspace.id}`),
    })

    if (isLoading) return <LoadingState/>
    if(error) return <p>Hata: {error.message}</p>

    const filteredBoards = data?.filter((board) => board.project.id === Number(id))
    const myMembership = workspace?.workspaceMembers.find((m) => m.user.id === user?.id)
    const canManage = myMembership?.role === 'owner' || myMembership?.role === 'pm'


    return (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
                <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: '36px', marginBottom: '2rem' }}>Boards</h1>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
                    {filteredBoards?.map((board, index) => (
                        <BoardCard key={board.id} id={board.id} name={board.name} canManage={canManage} animationDelay={index * 0.05} />
                    ))}
                </div>
            </div>
            
            <div style={{ width: '260px', flexShrink: 0, paddingTop: '80px' }}>
                    {canManage && <AddBoardCard projectId={Number(id)} />}
            </div>
        </div>
    )
}
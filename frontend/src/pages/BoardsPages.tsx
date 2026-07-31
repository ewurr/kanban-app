import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../AuthContext";
import { BoardCard } from "../components/BoardCard/BoardCard"
import { AddBoardCard } from "../components/AddBoardCard/AddBoardCard"

interface Board {
    id: number
    name: string
    project: {
        id: number
        name: string
    }
}

interface Project {
    id: number
    workspace: {
        id: number
    }
}

export function BoardsPage(){
    const { id } = useParams()
    const { token, user } = useAuth()
    
    const {data, isLoading, error} = useQuery<Board[]>({
        queryKey: ['boards', id],
        queryFn: async () => {
            const response = await fetch ('http://localhost:8000/api/boards', {
                headers: { Authorization: `Bearer ${token}` },
            })

            if(!response.ok) throw new Error(`HTTP ${response.status}`)
                return response.json()
        },
    })

    const { data: project } = useQuery<Project>({
        queryKey: ['project', id],
        queryFn: async () => {
            const response = await fetch(`http://localhost:8000/api/projects/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            return response.json()
        },
    })

    const { data: workspace } = useQuery<{ workspaceMembers: { user: { id: number }; role: string }[] }>({
        queryKey: ['workspace', project?.workspace.id],
        enabled: !!project,
        queryFn: async () => {
            const response = await fetch(`http://localhost:8000/api/workspaces/${project?.workspace.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            return response.json()
        },
    })

    if (isLoading) return <p>Yükleniyor...</p>
    if(error) return <p>Hata: {error.message}</p>

    const filteredBoards = data?.filter((board) => board.project.id === Number(id))
    const myMembership = workspace?.workspaceMembers.find((m) => m.user.id === user?.id)
    const canManage = myMembership?.role === 'owner' || myMembership?.role === 'pm'


    return (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
                <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: '36px', marginBottom: '2rem' }}>Boards</h1>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
                    {filteredBoards?.map((board) => (
                        <BoardCard key={board.id} id={board.id} name={board.name} canManage={canManage} />
                    ))}
                </div>
            </div>
            
            <div style={{ width: '260px', flexShrink: 0, paddingTop: '80px' }}>
                    <AddBoardCard projectId={Number(id)} />
            </div>
        </div>
    )
}
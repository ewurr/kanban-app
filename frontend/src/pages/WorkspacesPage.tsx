import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../AuthContext'
import { WorkspaceCard } from '../components/WorkspaceCard/WorkspaceCard'
import type { Workspace } from '../types/kanban'
import { AddWorkspaceCard } from '../components/AddWorkspaceCard/AddWorkspaceCard'
import { apiClient } from '../lib/apiClient'
import { LoadingState } from '../components/LoadingState/LoadingState'


export function WorkspacesPage() {
  const { user } = useAuth()

  const { data, isLoading, error } = useQuery<Workspace[]>({
    queryKey: ['workspaces'],
    queryFn: () => apiClient.get<Workspace[]>('/workspaces'),
  })

  if (isLoading) {
    return <LoadingState message="Panolar hazırlanıyor..." />
  }

  if (error) {
    return <p>Hata: {error.message}</p>
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: '36px' }}>Workspaces</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {data?.map((workspace, index) => {
                const myMembership = workspace.workspaceMembers.find(
                    (member) => member.user.id === user?.id
                )
                const isOwner = myMembership?.role === 'owner'

                return (
                    <WorkspaceCard
                        key={workspace.id}
                        id={workspace.id}
                        name={workspace.name}
                        memberCount={workspace.workspaceMembers.length}
                        isOwner={isOwner}
                        animationDelay={index * 0.05}
                    />
                )
            })}
          <AddWorkspaceCard />
      </div>
    </div>
  )
}
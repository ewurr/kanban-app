import { useState } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import type { Workspace } from '../../types/kanban'
import styles from './ManageMembersModal.module.css'
import { apiClient, ApiError } from '../../lib/apiClient'
import { ErrorMessage } from '../ErrorMessage/ErrorMessage'
import { RoleToggle } from '../RoleToggle/RoleToggle'

interface ManageMembersModalProps {
  workspaceId: number
  onClose: () => void
}

export function ManageMembersModal({ workspaceId, onClose }: ManageMembersModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('worker')
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: workspace } = useQuery<Workspace>({
    queryKey: ['workspace', workspaceId],
    queryFn: () => apiClient.get<Workspace>(`/workspaces/${workspaceId}`),
  })

  const addMutation = useMutation({
    mutationFn: () => apiClient.post(`/workspaces/${workspaceId}/members`, { email, role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      setEmail('')
      setRole('worker')
      setError(null)
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, newRole }: { memberId: number; newRole: string }) =>
      apiClient.put(`/workspaces/${workspaceId}/members/${memberId}`, { role: newRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] })
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: number) => apiClient.delete(`/workspaces/${workspaceId}/members/${memberId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] })
    },
  })

  const handleRemove = (memberId: number, memberName: string) => {
    if (window.confirm(`${memberName} kişisini workspace'ten çıkarmak istediğine emin misin?`)) {
      removeMemberMutation.mutate(memberId)
    }
  }

  return (
    <div className={`${styles.overlay} animate-fade-in`}  onClick={onClose}>
      <div className={`${styles.modal} animate-pop-in`} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>

        <h2 className={styles.title}>Üyeleri Yönet</h2>

        <h3 className={styles.sectionTitle}>Yeni Üye Ekle</h3>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email adresi"
          className={styles.input}
          autoFocus
        />

        <RoleToggle
          value={role as 'worker' | 'pm'}
          onChange={(newRole) => setRole(newRole)}
        />

        {error && <ErrorMessage message={error}/>}

        <div className={styles.action}>
          <button
            onClick={() => addMutation.mutate()}
            disabled={!email.trim() || addMutation.isPending}
            className={styles.saveButton}
          >
            {addMutation.isPending ? 'Ekleniyor...' : 'Ekle'}
          </button>
        </div>

        <h3 className={styles.sectionTitle}>Mevcut Üyeler</h3>
        <div className={styles.memberList}>
          {workspace?.workspaceMembers.map((member) => {
            const isOwner = member.role === 'owner'
            return (
              <div key={member.id} className={styles.memberRow}>
                <span className={styles.memberName}>
                  {member.user.name} {member.user.surname}
                </span>

                {isOwner ? (
                  <span className={styles.ownerBadge}>Owner</span>
                ) : (
                  <RoleToggle
                    value={member.role as 'worker' | 'pm'}
                    onChange={(newRole) => updateRoleMutation.mutate({ memberId: member.id, newRole })}
                    disabled={updateRoleMutation.isPending}
                  />
                )}

                <button
                  className={styles.removeButton}
                  disabled={isOwner || removeMemberMutation.isPending}
                  onClick={() => handleRemove(member.id, `${member.user.name} ${member.user.surname}`)}
                >
                  Çıkar
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
import { useState } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useAuth } from '../../AuthContext'
import type { Workspace } from '../../types/kanban'
import styles from './ManageMembersModal.module.css'

interface ManageMembersModalProps {
  workspaceId: number
  onClose: () => void
}

export function ManageMembersModal({ workspaceId, onClose }: ManageMembersModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('worker')
  const [error, setError] = useState<string | null>(null)
  const { token } = useAuth()
  const queryClient = useQueryClient()

  const { data: workspace } = useQuery<Workspace>({
    queryKey: ['workspace', workspaceId],
    queryFn: async () => {
      const response = await fetch(`http://localhost:8000/api/workspaces/${workspaceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return response.json()
    },
  })

  const addMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`http://localhost:8000/api/workspaces/${workspaceId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, role }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? 'Üye eklenemedi')
      }
      return data
    },
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
    mutationFn: async ({ memberId, newRole }: { memberId: number; newRole: string }) => {
      const response = await fetch(`http://localhost:8000/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      })
      if (!response.ok) throw new Error('Rol güncellenemedi')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] })
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: number) => {
      const response = await fetch(`http://localhost:8000/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Üye çıkarılamadı')
    },
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

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className={styles.select}
        >
          <option value="worker">Worker</option>
          <option value="pm">PM</option>
        </select>

        {error && <p className={styles.error}>{error}</p>}

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

                <select
                  value={member.role}
                  disabled={isOwner || updateRoleMutation.isPending}
                  onChange={(e) => updateRoleMutation.mutate({ memberId: member.id, newRole: e.target.value })}
                  className={styles.roleSelect}
                >
                  {isOwner && <option value="owner">Owner</option>}
                  <option value="pm">PM</option>
                  <option value="worker">Worker</option>
                </select>

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
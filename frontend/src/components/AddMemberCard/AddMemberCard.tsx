import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../AuthContext'
import styles from './AddMemberCard.module.css'

interface AddMemberCardProps {
  workspaceId: number
}

export function AddMemberCard({ workspaceId }: AddMemberCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('worker')
  const [error, setError] = useState<string | null>(null)
  const { token } = useAuth()
  const queryClient = useQueryClient()

  const mutation = useMutation({
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
      setIsOpen(false)
      setError(null)
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  if (!isOpen) {
    return (
      <button className={styles.closedCard} onClick={() => setIsOpen(true)}>
        <span className={styles.plus}>+</span>
        <span>Üye ekle</span>
      </button>
    )
  }

  return (
    <div className={styles.openCard}>
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
        <option value="owner">Owner</option>
      </select>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.action}>
        <button
          onClick={() => mutation.mutate()}
          disabled={!email.trim() || mutation.isPending}
          className={styles.saveButton}
        >
          {mutation.isPending ? 'Ekleniyor...' : 'Ekle'}
        </button>

        <button onClick={() => setIsOpen(false)} className={styles.cancelButton}>
          İptal
        </button>
      </div>
    </div>
  )
}
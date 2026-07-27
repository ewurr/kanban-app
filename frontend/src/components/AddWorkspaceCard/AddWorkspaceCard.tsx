import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../AuthContext'
import styles from './AddWorkspaceCard.module.css'

export function AddWorkspaceCard() {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const { token } = useAuth()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('http://localhost:8000/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      })
      if (!response.ok) throw new Error('Workspace oluşturulamadı')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      setName('')
      setIsOpen(false)
    },
  })

  if (!isOpen) {
    return (
      <button className={styles.closedCard} onClick={() => setIsOpen(true)}>
        <span className={styles.plus}>+</span>
        <span>Workspace ekle</span>
      </button>
    )
  }

  return (
    <div className={styles.openCard}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Workspace adı"
        className={styles.input}
        autoFocus
      />

      <div className={styles.action}>
        <button
          onClick={() => mutation.mutate()}
          disabled={!name.trim() || mutation.isPending}
          className={styles.saveButton}
        >
          {mutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
        </button>

        <button onClick={() => setIsOpen(false)} className={styles.cancelButton}>
          İptal
        </button>
      </div>
    </div>
  )
}
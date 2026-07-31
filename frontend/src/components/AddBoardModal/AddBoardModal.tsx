import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../AuthContext'
import styles from './AddBoardModal.module.css'

interface AddBoardModalProps {
  projectId: number
  onClose: () => void
}

export function AddBoardModal({ projectId, onClose }: AddBoardModalProps) {
  const [name, setName] = useState('')
  const { token } = useAuth()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('http://localhost:8000/api/boards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ projectId, name }),
      })
      if (!response.ok) throw new Error('Board oluşturulamadı')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] })
      queryClient.invalidateQueries({ queryKey: ['boards-all'] })
      setName('')
      onClose()
    },
  })

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>

        <h2 className={styles.title}>Yeni Board</h2>

        <label className={styles.fieldLabel}>İsim</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={styles.input}
          placeholder="Board adı"
          autoFocus
        />

        <div className={styles.actions}>
          <button
            onClick={() => mutation.mutate()}
            disabled={!name.trim() || mutation.isPending}
            className={styles.saveButton}
          >
            {mutation.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
          </button>
          <button onClick={onClose} className={styles.cancelButton}>
            İptal
          </button>
        </div>
      </div>
    </div>
  )
}
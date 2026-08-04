import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../AuthContext'
import styles from './AddColumnModal.module.css'

interface AddColumnModalProps {
  boardId: number
  nextPosition: number
  onClose: () => void
}

export function AddColumnModal({ boardId, nextPosition, onClose }: AddColumnModalProps) {
  const [name, setName] = useState('')
  const { token } = useAuth()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('http://localhost:8000/api/columns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          boardId,
          name,
          position: nextPosition,
        }),
      })
      if (!response.ok) throw new Error('Column oluşturulamadı')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['columns'] })
      setName('')
      onClose()
    },
  })

  return (
    <div className={`${styles.overlay} animate-fade-in`} onClick={onClose}>
      <div className={`${styles.sheet} animate-pop-in`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.pin} />
        <button className={styles.closeButton} onClick={onClose}>×</button>

        <label className={styles.fieldLabel}>Yeni Column</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Column adı"
          className={styles.input}
          autoFocus
        />

        <div className={styles.actions}>
          <button
            onClick={() => mutation.mutate()}
            disabled={!name.trim() || mutation.isPending}
            className={styles.saveButton}
          >
            {mutation.isPending ? 'Ekleniyor...' : 'Ekle'}
          </button>
          <button onClick={onClose} className={styles.cancelButton}>
            İptal
          </button>
        </div>
      </div>
    </div>
  )
}
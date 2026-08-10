import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import styles from './AddColumnModal.module.css'
import { apiClient } from '../../lib/apiClient'
import { ErrorMessage } from '../ErrorMessage/ErrorMessage'

interface AddColumnModalProps {
  boardId: number
  nextPosition: number
  onClose: () => void
}

export function AddColumnModal({ boardId, nextPosition, onClose }: AddColumnModalProps) {
  const [name, setName] = useState('')
  const queryClient = useQueryClient()

  const mutation = useMutation({
      mutationFn: () => apiClient.post('/columns', { boardId, name, position: nextPosition }),
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
        {mutation.isError && <ErrorMessage message={mutation.error.message} />}
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
import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import styles from './AddBoardModal.module.css'
import { apiClient } from '../../lib/apiClient'
import { ErrorMessage } from '../ErrorMessage/ErrorMessage'

interface AddBoardModalProps {
  projectId: number
  onClose: () => void
}

export function AddBoardModal({ projectId, onClose }: AddBoardModalProps) {

  useEffect(() => {
    const scrollY = window.scrollY
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'

    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      window.scrollTo(0, scrollY)
    }
  }, [])

  const [name, setName] = useState('')
  const queryClient = useQueryClient()

  const mutation = useMutation({
      mutationFn: () => apiClient.post('/boards', { projectId, name }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['boards'] })
        queryClient.invalidateQueries({ queryKey: ['boards-all'] })
        setName('')
        onClose()
      },
    })

  return (
    <div className={`${styles.overlay} animate-fade-in`} onClick={onClose}>
      <div className={`${styles.modal} animate-pop-in`} onClick={(e) => e.stopPropagation()}>
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
        {mutation.isError && <ErrorMessage message={mutation.error.message} />}
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
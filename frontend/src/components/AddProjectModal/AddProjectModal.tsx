import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../AuthContext'
import styles from './AddProjectModal.module.css'

interface AddProjectModalProps {
  workspaceId: number
  onClose: () => void
}

export function AddProjectModal({ workspaceId, onClose }: AddProjectModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const { token } = useAuth()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('http://localhost:8000/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          workspaceId,
          name,
          description: description || null,
        }),
      })
      if (!response.ok) throw new Error('Proje oluşturulamadı')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setName('')
      setDescription('')
      onClose()
    },
  })

  const handleClose = () => {
    if(mutation.isPending) return
    onClose()
  }

  return (
    <div className={`${styles.overlay} animate-fade-in`} onClick={handleClose}>
      <div className={`${styles.modal} animate-pop-in`} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={handleClose}>×</button>

        <h2 className={styles.title}>Yeni Proje</h2>

        <label className={styles.fieldLabel}>İsim</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={styles.input}
          placeholder="Proje adı"
          autoFocus
        />

        <label className={styles.fieldLabel}>Açıklama</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={styles.textarea}
          placeholder="Açıklama (opsiyonel)"
          rows={4}
        />

        <div className={styles.actions}>
          <button
            onClick={() => mutation.mutate()}
            disabled={!name.trim() || mutation.isPending}
            className={styles.saveButton}
          >
            {mutation.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
          </button>
          <button onClick={handleClose} className={styles.cancelButton}>
            İptal
          </button>
        </div>
      </div>
    </div>
  )
}
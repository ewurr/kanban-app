import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../AuthContext'
import styles from './EditProjectModal.module.css'

interface EditProjectModalProps {
  id: number
  name: string
  description: string | null
  onClose: () => void
}

export function EditProjectModal({ id, name, description, onClose }: EditProjectModalProps) {
  const [editedName, setEditedName] = useState(name)
  const [editedDescription, setEditedDescription] = useState(description ?? '')
  const { token } = useAuth()
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`http://localhost:8000/api/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editedName, description: editedDescription || null }),
      })
      if (!response.ok) throw new Error('Proje güncellenemedi')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      onClose()
    },
  })

  const handleClose = () => {
    if(updateMutation.isPending) return
    onClose()
  }

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={handleClose}>
          ×
        </button>

        <h2 className={styles.title}>Projeyi Düzenle</h2>

        <label className={styles.fieldLabel}>İsim</label>
        <input
          type="text"
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
          className={styles.input}
          autoFocus
        />

        <label className={styles.fieldLabel}>Açıklama</label>
        <textarea
          value={editedDescription}
          onChange={(e) => setEditedDescription(e.target.value)}
          className={styles.textarea}
          rows={4}
        />

        <div className={styles.actions}>
          <button
            onClick={() => updateMutation.mutate()}
            disabled={!editedName.trim() || updateMutation.isPending}
            className={styles.saveButton}
          >
            {updateMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
          <button onClick={onClose} className={styles.cancelButton} disabled={updateMutation.isPending}>
            İptal
          </button>
        </div>
      </div>
    </div>
  )
}
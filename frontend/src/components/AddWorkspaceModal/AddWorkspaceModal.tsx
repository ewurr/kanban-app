import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../AuthContext'
import styles from './AddWorkspaceModal.module.css'

interface AddWorkspaceModalProps {
    onClose: () => void
}

export function AddWorkspaceModal({ onClose }: AddWorkspaceModalProps) {
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
            onClose()
        },
    })
    
    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose}>
                    ×
                </button>
                <h2 className={styles.title}>Yeni Workspace Ekle</h2>

                <label className={styles.fieldLabel}>
                    Workspace Adı:
                </label>

                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={styles.input}
                    placeholder="Workspace adı"
                    autoFocus
                />

                <div className={styles.actions}>
                    <button
                        onClick={() => mutation.mutate()}
                        disabled={!name.trim() || mutation.isPending}
                        className={styles.saveButton}
                    >
                        {mutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                    <button onClick={onClose} className={styles.cancelButton}>
                        İptal
                    </button>
                </div>
            </div>
        </div>
    )
}
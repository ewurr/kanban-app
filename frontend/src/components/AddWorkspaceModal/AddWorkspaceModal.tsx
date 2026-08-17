import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import styles from './AddWorkspaceModal.module.css'
import { apiClient } from '../../lib/apiClient'
import { ErrorMessage } from '../ErrorMessage/ErrorMessage'

interface AddWorkspaceModalProps {
    onClose: () => void
}

export function AddWorkspaceModal({ onClose }: AddWorkspaceModalProps) {
    const [name, setName] = useState('')
    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: () => apiClient.post('/workspaces', { name }),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['workspaces']})
            onClose()
        },
    })
    
    return (
        <div className={`${styles.overlay} animate-fade-in`} onClick={onClose}>
            <div className={`${styles.modal} animate-pop-in`} onClick={(e) => e.stopPropagation()}>
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
                {mutation.isError && <ErrorMessage message={mutation.error.message} />}                    
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
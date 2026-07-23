import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../AuthContext";
import styles from './AddProjectCard.module.css'

interface AddProjectCardProps {
    workspaceId: number
}

export function AddProjectCard({ workspaceId }: AddProjectCardProps) {
    const [isOpen, setIsOpen] = useState(false)
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
            queryClient.invalidateQueries({queryKey: ['projects']})
            setName('')
            setDescription('')
            setIsOpen(false)
        },
    })

    if(!isOpen) {
        return (
            <div className={styles.openFolder}>
                <input 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Project Name"
                    className={styles.input}
                    autoFocus
                />

                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description (Optional)"
                    className={styles.textarea}
                    rows={2}
                />

                <div className={styles.actions}>
                    <button
                    onClick={() => mutation.mutate()}
                    disabled={!name.trim || mutation.isPending}
                    className={styles.saveButton}
                    >
                        {mutation.isPending ? 'Saving...' : 'Save'}
                    </button>

                    <button onClick={() => setIsOpen(false)} className={styles.cancelButton}>
                        Cancel
                    </button>
                </div>
            </div>
        )
    }
}
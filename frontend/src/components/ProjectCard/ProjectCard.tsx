import { useState } from 'react'
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../AuthContext'
import styles from './ProjectCard.module.css'

interface ProjectCardProps {
    id: number
    name: string
    description: string | null
    isOwner: boolean
}

export function ProjectCard({ id, name, description, isOwner }: ProjectCardProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [editedName, setEditedName] = useState(name)
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
                body: JSON.stringify({ name: editedName }),
            })
            if (!response.ok) throw new Error('Proje güncellenemedi')
            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] })
            setIsEditing(false)
        },
    })

    const deleteMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`http://localhost:8000/api/projects/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!response.ok) throw new Error('Proje silinemedi')
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] })
        },
    })

    const stop = (event: React.MouseEvent) => {
        event.preventDefault()
        event.stopPropagation()
    }

    const handleDelete = (event: React.MouseEvent) => {
        stop(event)
        if (window.confirm(`"${name}" projesini silmek istediğine emin misin?`)) {
            deleteMutation.mutate()
        }
    }

    const handleEditStart = (event: React.MouseEvent) => {
        stop(event)
        setEditedName(name)
        setIsEditing(true)
    }

    if (isEditing) {
        return (
            <div className={styles.folder}>
                <div className={styles.tab} />
                <div className={styles.body}>
                    <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className={styles.editInput}
                        autoFocus
                        onClick={stop}
                    />
                    <div className={styles.editActions}>
                        <button
                            onClick={(e) => { stop(e); updateMutation.mutate() }}
                            disabled={!editedName.trim() || updateMutation.isPending}
                            className={styles.saveButton}
                        >
                            Kaydet
                        </button>
                        <button onClick={(e) => { stop(e); setIsEditing(false) }} className={styles.cancelButton}>
                            İptal
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return(
        <Link to={`/projects/${id}`} className={styles.folder}>
            <div className={styles.tab} />
            <div className={styles.body}>
                <h3 className={styles.name}>{name}</h3>
                {description && <p className={styles.description}>{description}</p>}

                {isOwner && (
                    <div className={styles.cardActions}>
                        <button className={styles.editButton} onClick={handleEditStart}>Düzenle</button>
                        <button className={styles.deleteButton} onClick={handleDelete} disabled={deleteMutation.isPending}>Sil</button>
                    </div>
                )}
            </div>
        </Link>
    )
}
import { useState } from 'react'
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../AuthContext'
import styles from './BoardCard.module.css'

interface BoardCardProps{
    id: number
    name: string
    canManage: boolean
    onNavigate?: () => void
    animationDelay?: number
}

export function BoardCard({id, name, canManage, onNavigate, animationDelay}: BoardCardProps){
    const [isEditing, setIsEditing] = useState(false)
    const [editedName, setEditedName] = useState(name)
    const { token } = useAuth()
    const queryClient = useQueryClient()

    const updateMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`http://localhost:8000/api/boards/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name: editedName }),
            })
            if (!response.ok) throw new Error('Board güncellenemedi')
            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['boards'] })
            queryClient.invalidateQueries({ queryKey: ['boards-all'] })
            setIsEditing(false)
        },
    })

    const deleteMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`http://localhost:8000/api/boards/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!response.ok) throw new Error('Board silinemedi')
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['boards'] })
            queryClient.invalidateQueries({ queryKey: ['boards-all'] })
        },
    })

    const stop = (event: React.MouseEvent) => {
        event.preventDefault()
        event.stopPropagation()
    }

    const handleDelete = (event: React.MouseEvent) => {
        stop(event)
        if (window.confirm(`"${name}" board'unu silmek istediğine emin misin?`)) {
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
            <div className={styles.miniBoard}>
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
        )
    }

    return(
        <Link
            to={`/boards/${id}`}
            className={`${styles.miniBoard} animate-fade-up`}
            style={{ animationDelay: `${animationDelay ?? 0}s` }}
            onClick={onNavigate}
        >            <div className={styles.miniPostIt} style={{ backgroundColor: '#FFD93D' }} />
            <div className={styles.miniPostIt} style={{ backgroundColor: '#FF9B9B' }} />
            <div className={styles.miniPostIt} style={{ backgroundColor: '#A8E6CF' }} />
            <span className={styles.name}>{name}</span>

            {canManage && (
                <div className={styles.cardActions}>
                    <button className={styles.editButton} onClick={handleEditStart} title="Düzenle">✎</button>
                    <button className={styles.deleteButton} onClick={handleDelete} disabled={deleteMutation.isPending} title="Sil">🗑</button>
                </div>
            )}
        </Link>
    )
}
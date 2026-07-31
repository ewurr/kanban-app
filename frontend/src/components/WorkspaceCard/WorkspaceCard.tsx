import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../AuthContext'
import styles from './WorkspaceCard.module.css'

interface WorkspaceCardProps {
    id: number
    name: string
    memberCount: number
    isOwner: boolean
}

const CARD_COLORS = ['#6C63FF', '#FF6B6B', '#4ECDC4', '#FFB6E1', '#FFD93D']

export function WorkspaceCard({ id, name, memberCount, isOwner }: WorkspaceCardProps) {
    const color = CARD_COLORS[id % CARD_COLORS.length]
    const { token } = useAuth()
    const queryClient = useQueryClient()

    const deleteMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`http://localhost:8000/api/workspaces/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!response.ok) throw new Error('Workspace silinemedi')
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspaces'] })
        },
    })

    const handleDelete = (event: React.MouseEvent) => {
        event.preventDefault()
        event.stopPropagation()
        if (window.confirm(`"${name}" workspace'ini silmek istediğine emin misin?`)) {
            deleteMutation.mutate()
        }
    }

    return(
        <Link to={`/workspaces/${id}`} className={styles.card}>
            <div className={styles.stripe} style={{ backgroundColor: color }} />
            <div className={styles.body}>
                <h3 className={styles.name}>{name}</h3>
                <p className={styles.member}>{memberCount} Üye</p>

                {isOwner && (
                    <button
                        className={styles.deleteButton}
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                    >
                        🗑
                    </button>
                )}
            </div>
        </Link>
    )
}
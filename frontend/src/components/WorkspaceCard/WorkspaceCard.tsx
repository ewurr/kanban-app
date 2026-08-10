import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from '@tanstack/react-query'
import styles from './WorkspaceCard.module.css'
import { apiClient } from '../../lib/apiClient'
import { ErrorMessage } from "../ErrorMessage/ErrorMessage";

interface WorkspaceCardProps {
    id: number
    name: string
    memberCount: number
    isOwner: boolean
    animationDelay?: number
}

const CARD_COLORS = ['#6C63FF', '#FF6B6B', '#4ECDC4', '#FFB6E1', '#FFD93D']

export function WorkspaceCard({ id, name, memberCount, isOwner, animationDelay }: WorkspaceCardProps) {
    const color = CARD_COLORS[id % CARD_COLORS.length]
    const queryClient = useQueryClient()

    const deleteMutation = useMutation({
        mutationFn: () => apiClient.delete(`/workspaces/${id}`),
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
        <>
            <Link
                to={`/workspaces/${id}`}
                className={`${styles.card} animate-fade-up`}
                style={{ animationDelay: `${animationDelay ?? 0}s` }}
            >            <div className={styles.stripe} style={{ backgroundColor: color }} />
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
            {deleteMutation.isError && <ErrorMessage message={deleteMutation.error.message} />}
        </>
    )
}
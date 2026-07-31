import { useState } from 'react'
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../AuthContext'
import { EditProjectModal } from '../EditProjectModal/EditProjectModal'
import styles from './ProjectCard.module.css'

interface ProjectCardProps {
    id: number
    name: string
    description: string | null
    isOwner: boolean
}

interface BoardSummary {
    id: number
    project: {id: number}
}

export function ProjectCard({ id, name, description, isOwner }: ProjectCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const { token } = useAuth()
    const queryClient = useQueryClient()

    const {data: boards} = useQuery<BoardSummary[]>({
        queryKey: ['boards-all'],
        queryFn: async () => {
            const response = await fetch('http://localhost:8000/api/boards', {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            return response.json()
        },
    })

    const firstBoard = boards?.filter((b) => b.project.id === id)[0]    
    const linkTo = firstBoard ? `/boards/${firstBoard.id}` : `/projects/${id}`
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
        setIsModalOpen(true)
    }

    return(
        <>
            <Link to={linkTo} className={styles.folder}>
                <div className={styles.tab} />
                <div className={styles.body}>
                <h3 className={styles.name}>
                    {name.length > 20 ? `${name.slice(0, 30)}...` : name}
                </h3>
                {description && (
                <p className={styles.description}>
                    {description.length > 80 ? `${description.slice(0, 80)}...` : description}
                </p>
                )}

                    {isOwner && (
                        <div className={styles.cardActions}>
                            <button className={styles.editButton} onClick={handleEditStart} title="Düzenle">
                                ✎
                            </button>
                            <button className={styles.deleteButton} onClick={handleDelete} disabled={deleteMutation.isPending}>
                                🗑
                            </button>
                        </div>
                    )}
                </div>
            </Link>

            {isModalOpen && (
                <EditProjectModal
                    id={id}
                    name={name}
                    description={description}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </>
    )
}
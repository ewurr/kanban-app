import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../AuthContext'
import { BoardCard } from '../BoardCard/BoardCard'
import { AddBoardCard } from '../AddBoardCard/AddBoardCard'
import styles from './BoardSelectorModal.module.css'

interface BoardSelectorModalProps {
  projectId: number
  canManage: boolean
  onClose: () => void
}

interface Board {
  id: number
  name: string
  project: { id: number }
}

export function BoardSelectorModal({ projectId, canManage, onClose }: BoardSelectorModalProps) {
  const { token } = useAuth()

  const { data: boards } = useQuery<Board[]>({
    queryKey: ['boards-all'],
    queryFn: async () => {
      const response = await fetch('http://localhost:8000/api/boards', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return response.json()
    },
  })

  const boardsInProject = boards?.filter((b) => b.project.id === projectId) ?? []

  return (
    <div className={`${styles.overlay} animate-fade-in`} onClick={onClose}>
      <div className={`${styles.modal} animate-pop-in`} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>

        <h2 className={styles.title}>Board'lar</h2>

        <div className={styles.boardGrid}>
          {boardsInProject.map((board) => (
            <div key={board.id} className={styles.boardCardWrapper}>
              <BoardCard
                id={board.id}
                name={board.name}
                canManage={canManage}
                onNavigate={onClose}
              />
            </div>
          ))}
          {canManage && (
            <div className={styles.boardCardWrapper}>
              <AddBoardCard projectId={projectId} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
import { useQuery } from '@tanstack/react-query'
import { BoardCard } from '../BoardCard/BoardCard'
import { AddBoardCard } from '../AddBoardCard/AddBoardCard'
import styles from './BoardSelectorModal.module.css'
import { apiClient } from '../../lib/apiClient'
import type { Board } from '../../types/kanban'

interface BoardSelectorModalProps {
  projectId: number
  canManage: boolean
  onClose: () => void
}


export function BoardSelectorModal({ projectId, canManage, onClose }: BoardSelectorModalProps) {

  const { data: boards } = useQuery<Board[]>({
      queryKey: ['boards-all'],
      queryFn: () => apiClient.get<Board[]>('/boards'),
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
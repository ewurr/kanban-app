import { useDroppable } from '@dnd-kit/core'
import styles from './TrashCan.module.css'

interface TrashCanProps {
  isVisible: boolean
  isOver: boolean
}

export function TrashCan({ isVisible, isOver }: TrashCanProps) {
  const { setNodeRef } = useDroppable({
    id: 'trash-can',
  })

  if (!isVisible) return null

  return (
    <div
      ref={setNodeRef}
      className={`${styles.trashCan} ${isOver ? styles.trashCanActive : ''}`}
    >
      🗑️
    </div>
  )
}
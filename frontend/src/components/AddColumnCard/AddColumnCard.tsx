import { useState } from 'react'
import { AddColumnModal } from '../AddColumnModal/AddColumnModal'
import styles from './AddColumnCard.module.css'

interface AddColumnCardProps {
  boardId: number
  nextPosition: number
}

export function AddColumnCard({ boardId, nextPosition }: AddColumnCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button className={styles.paperSheet} onClick={() => setIsModalOpen(true)}>
        <span className={styles.plus}>+</span>
        <span className={styles.label}>Column ekle</span>
      </button>

      {isModalOpen && (
        <AddColumnModal
          boardId={boardId}
          nextPosition={nextPosition}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  )
}
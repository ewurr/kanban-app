import { useState } from "react";
import { AddBoardModal } from "../AddBoardModal/AddBoardModal";
import styles from './AddBoardCard.module.css'

interface AddBoardCardProps{
    projectId: number
}

export function AddBoardCard({ projectId }: AddBoardCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button className={styles.miniBoard} onClick={() => setIsModalOpen(true)}>
        <span className={styles.plus}>+</span>
      </button>

      {isModalOpen && (
        <AddBoardModal
          projectId={projectId}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  )
}
import { useState } from 'react'
import { AddWorkspaceModal } from '../AddWorkspaceModal/AddWorkspaceModal'
import styles from './AddWorkspaceCard.module.css'

export function AddWorkspaceCard() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button className={styles.closedCard} onClick={() => setIsModalOpen(true)}>
        <span className={styles.plus}>+</span>
        <span>Workspace ekle</span>
      </button>

      {isModalOpen && (
        <AddWorkspaceModal onClose={() => setIsModalOpen(false)} />
      )}
    </>
  )
}
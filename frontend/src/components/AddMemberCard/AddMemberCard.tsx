import { useState } from 'react'
import { ManageMembersModal } from '../ManageMembersModal/ManageMembersModal'
import styles from './AddMemberCard.module.css'

interface AddMemberCardProps {
  workspaceId: number
}

export function AddMemberCard({ workspaceId }: AddMemberCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button className={styles.closedCard} onClick={() => setIsModalOpen(true)}>
        <span className={styles.plus}>+</span>
        <span>Üyeleri Yönet</span>
      </button>

      {isModalOpen && (
        <ManageMembersModal
          workspaceId={workspaceId}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  )
}
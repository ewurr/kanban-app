import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../AuthContext'
import { AddTaskModal } from '../AddTaskModal/AddTaskModal'
import type { Column as ColumnType, Task as TaskType } from '../../types/kanban'
import styles from './AddTaskCard.module.css'

interface AddTaskCardProps {
  boardId: number
  columns: ColumnType[]
  tasks: TaskType[]
}

export function AddTaskCard({ boardId, columns, tasks }: AddTaskCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button className={styles.postIt} onClick={() => setIsModalOpen(true)}>
        <span className={styles.plus}>+</span>
        <span className={styles.label}>Task ekle</span>
      </button>

      {isModalOpen && (
        <AddTaskModal
          boardId={boardId}
          columns={columns}
          tasks={tasks}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  )
}
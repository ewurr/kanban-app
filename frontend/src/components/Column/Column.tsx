import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Column as ColumnType, Task as TaskType } from '../../types/kanban'
import { Task } from '../Task/Task'
import styles from './Column.module.css'
import { apiClient } from '../../lib/apiClient'
import { ErrorMessage } from '../ErrorMessage/ErrorMessage'

interface ColumnProps {
  column: ColumnType
  tasks: TaskType[]
  workspaceId: number
  canManage: boolean
}

export function Column({ column, tasks, workspaceId, canManage }: ColumnProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(column.name)
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
      mutationFn: () => apiClient.put(`/columns/${column.id}`, { name: editedName }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['columns'] })
        setIsEditing(false)
      },
  })

  const deleteMutation = useMutation({
      mutationFn: () => apiClient.delete(`/columns/${column.id}`),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['columns'] })
      },
  })

  const handleDelete = () => {
    if (window.confirm(`"${column.name}" column'unu silmek istediğine emin misin? İçindeki tüm task'lar da silinecek.`)) {
      deleteMutation.mutate()
    }
  }

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `column-${column.id}`,
    data: {
      type: 'column',
      columnId: column.id,
    },
  })

  const taskIds = tasks.map((task) => task.id)

  return (
    <div className={styles.paper}>
      <div className={styles.pin} />

      {isEditing ? (
        <div className={styles.editRow}>
          <input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            className={styles.editInput}
            autoFocus
          />
          {updateMutation.isError && <ErrorMessage message={updateMutation.error.message} />}
          <button
            onClick={() => updateMutation.mutate()}
            disabled={!editedName.trim() || updateMutation.isPending}
            className={styles.saveButton}
          >
            Kaydet
          </button>
          <button onClick={() => setIsEditing(false)} className={styles.cancelButton}>
            İptal
          </button>
        </div>
      ) : (
        <div className={styles.titleRow}>
          <h3 className={styles.title}>{column.name}</h3>
          <div className={styles.titleActions}>
            <button className={styles.editButton} onClick={() => { setEditedName(column.name); setIsEditing(true) }}>✎</button>              <button className={styles.deleteButton} onClick={handleDelete} disabled={deleteMutation.isPending}>×</button>
          </div>
        </div>
      )}
      
      {deleteMutation.isError && <ErrorMessage message={deleteMutation.error.message} />}

      <div className={styles.taskList} ref={setDroppableRef}>
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task, index) => (
              <Task key={task.id} task={task} workspaceId={workspaceId} boardId={column.board.id} animationDelay={index * 0.05} />
          ))}
        </SortableContext>
      </div>
      
    </div>
  )
}
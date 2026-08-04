import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../AuthContext'
import type { Column as ColumnType, Task as TaskType } from '../../types/kanban'
import { Task } from '../Task/Task'
import styles from './Column.module.css'

interface ColumnProps {
  column: ColumnType
  tasks: TaskType[]
  workspaceId: number
  canManage: boolean
}

export function Column({ column, tasks, workspaceId, canManage }: ColumnProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(column.name)
  const { token } = useAuth()
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`http://localhost:8000/api/columns/${column.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editedName }),
      })
      if (!response.ok) throw new Error('Column güncellenemedi')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['columns'] })
      setIsEditing(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`http://localhost:8000/api/columns/${column.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Column silinemedi')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['columns'] })
    },
  })

  const handleDelete = () => {
    if (window.confirm(`"${column.name}" column'unu silmek istediğine emin misin? İçindeki tüm task'lar da silinecek.`)) {
      deleteMutation.mutate()
    }
  }

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

      <div className={styles.taskList}>
          {tasks.map((task, index) => (
              <Task key={task.id} task={task} workspaceId={workspaceId} animationDelay={index * 0.05} />
          ))}
      </div>
      
    </div>
  )
}
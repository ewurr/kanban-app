import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../AuthContext'
import type { Column as ColumnType, Task as TaskType } from '../../types/kanban'
import styles from './AddTaskModal.module.css'

interface AddTaskModalProps {
  boardId: number
  columns: ColumnType[]
  tasks: TaskType[]
  onClose: () => void
}

export function AddTaskModal({ boardId, columns, tasks, onClose }: AddTaskModalProps) {
  const columnsInBoard = columns.filter((c) => c.board.id === boardId).sort((a, b) => a.position - b.position)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [columnId, setColumnId] = useState<number | ''>(columnsInBoard[0]?.id ?? '')
  const { token } = useAuth()
  const queryClient = useQueryClient()

  const today = new Date().toISOString().slice(0, 10)

  const tasksInSelectedColumn = tasks.filter((t) => t.column.id === columnId)
  const nextPosition = tasksInSelectedColumn.length

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('http://localhost:8000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          columnId,
          title,
          description: description || null,
          priority,
          position: nextPosition,
          dueDate: dueDate || null,
        }),
      })
      if (!response.ok) throw new Error('Task oluşturulamadı')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      onClose()
    },
  })

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.postIt} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>

        <label className={styles.fieldLabel}>Column</label>
        <select
          value={columnId}
          onChange={(e) => setColumnId(Number(e.target.value))}
          className={styles.select}
        >
          {columnsInBoard.map((col) => (
            <option key={col.id} value={col.id}>{col.name}</option>
          ))}
        </select>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Görev başlığı"
          className={styles.titleInput}
          autoFocus
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Açıklama (opsiyonel)"
          className={styles.textarea}
          rows={3}
        />

        <label className={styles.fieldLabel}>Öncelik</label>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className={styles.select}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <label className={styles.fieldLabel}>Bitiş tarihi</label>
        <input
          type="date"
          value={dueDate}
          min={today}
          onChange={(e) => setDueDate(e.target.value)}
          className={styles.dateInput}
        />

        <div className={styles.actions}>
          <button
            onClick={() => mutation.mutate()}
            disabled={!title.trim() || !columnId || mutation.isPending}
            className={styles.saveButton}
          >
            {mutation.isPending ? 'Ekleniyor...' : 'Ekle'}
          </button>
          <button onClick={onClose} className={styles.cancelButton}>
            İptal
          </button>
        </div>
      </div>
    </div>
  )
}
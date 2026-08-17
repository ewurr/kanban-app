import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../AuthContext'
import type { Column as ColumnType, Task as TaskType } from '../../types/kanban'
import styles from './AddTaskModal.module.css'
import { apiClient } from '../../lib/apiClient'
import { ErrorMessage } from '../ErrorMessage/ErrorMessage'

interface AddTaskModalProps {
  boardId: number
  columns: ColumnType[]
  tasks: TaskType[]
  onClose: () => void
}

const POST_IT_COLORS = ['#FFD93D', '#FF9B9B', '#A8E6CF', '#C9C3FF', '#FFB6E1']

export function AddTaskModal({ boardId, columns, tasks, onClose }: AddTaskModalProps) {

  useEffect(() => {
    const scrollY = window.scrollY
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'

    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      window.scrollTo(0, scrollY)
    }
  }, [])

  const columnsInBoard = columns.filter((c) => c.board.id === boardId).sort((a, b) => a.position - b.position)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [columnId, setColumnId] = useState<number | ''>(columnsInBoard[0]?.id ?? '')
  const [randomColor] = useState(() => POST_IT_COLORS[Math.floor(Math.random() * POST_IT_COLORS.length)])
  const queryClient = useQueryClient()

  const today = new Date().toISOString().slice(0, 10)

  const tasksInSelectedColumn = tasks.filter((t) => t.column.id === columnId)
  const nextPosition = tasksInSelectedColumn.length

  const mutation = useMutation({
    mutationFn: () => 
      apiClient.post('/tasks', {
        columnId,
        title,
        description: description || null,
        priority,
        position: nextPosition,
        dueDate: dueDate || null,
        color: randomColor,
      }),

      onSuccess: () => {
        queryClient.invalidateQueries ({ queryKey: ['tasks']})
      }

  })

  return (
    <div className={`${styles.overlay} animate-fade-in`} onClick={onClose}>
      <div className={`${styles.postIt} animate-pop-in`} style={{ backgroundColor: randomColor }} onClick={(e) => e.stopPropagation()}>
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
          {mutation.isError && <ErrorMessage message={mutation.error.message} />}
          <button
            onClick={() => {mutation.mutate();
                            onClose();
                          }}
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
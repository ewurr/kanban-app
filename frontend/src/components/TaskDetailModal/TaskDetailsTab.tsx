import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../lib/apiClient'
import type { Task as TaskType, Workspace as WorkspaceType, Column as ColumnType } from '../../types/kanban'
import styles from './TaskDetailModal.module.css'

interface TaskDetailsTabProps {
  task: TaskType
  workspaceId: number
  onClose: () => void
}

export function TaskDetailsTab({ task, workspaceId, onClose }: TaskDetailsTabProps) {
  const queryClient = useQueryClient()

  const [selectedUserId, setSelectedUserId] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(task.title)
  const [editedDescription, setEditedDescription] = useState(task.description ?? '')
  const [editedPriority, setEditedPriority] = useState(task.priority)
  const [editedDueDate, setEditedDueDate] = useState(task.dueDate ? task.dueDate.slice(0, 10) : '')
  const [editedColumnId, setEditedColumnId] = useState(task.column.id)

  const { data: workspace } = useQuery<WorkspaceType>({
    queryKey: ['workspace', workspaceId],
    queryFn: () => apiClient.get<WorkspaceType>(`/workspaces/${workspaceId}`),
  })

  const { data: currentColumn } = useQuery<ColumnType>({
    queryKey: ['column', task.column.id],
    queryFn: () => apiClient.get<ColumnType>(`/columns/${task.column.id}`),
  })

  const { data: allColumns } = useQuery<ColumnType[]>({
    queryKey: ['columns'],
    enabled: !!currentColumn,
    queryFn: () => apiClient.get<ColumnType[]>('/columns'),
  })

  const columnsInSameBoard = allColumns?.filter((c) => c.board.id === currentColumn?.board.id) ?? []

  const addAssigneeMutation = useMutation({
    mutationFn: (userId: number) => apiClient.post(`/tasks/${task.id}/assignees`, { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setSelectedUserId('')
    },
  })

  const removeAssigneeMutation = useMutation({
    mutationFn: (userId: number) => apiClient.delete(`/tasks/${task.id}/assignees/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: () =>
      apiClient.put(`/tasks/${task.id}`, {
        title: editedTitle,
        description: editedDescription || null,
        priority: editedPriority,
        dueDate: editedDueDate || null,
        columnId: editedColumnId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setIsEditing(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`/tasks/${task.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      onClose()
    },
  })

  const handleDelete = () => {
    if (window.confirm(`"${task.title}" görevini silmek istediğine emin misin?`)) {
      deleteMutation.mutate()
    }
  }

  const assignedUserIds = task.assignments.map((a) => a.user.id)
  const availableMembers = workspace?.workspaceMembers.filter(
    (member) => !assignedUserIds.includes(member.user.id)
  ) ?? []

  const today = new Date().toISOString().slice(0, 10)

  return (
    <>
      {isEditing ? (
        <div className={styles.editForm}>
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            className={styles.editInput}
            placeholder="Başlık"
            autoFocus
          />
          <textarea
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            className={styles.editTextarea}
            placeholder="Açıklama"
            rows={3}
          />
          <select
            value={editedPriority}
            onChange={(e) => setEditedPriority(e.target.value)}
            className={styles.select}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <label className={styles.fieldLabel}>Bitiş tarihi</label>
          <input
            type="date"
            value={editedDueDate}
            min={today}
            onChange={(e) => setEditedDueDate(e.target.value)}
            className={styles.editInput}
          />

          <label className={styles.fieldLabel}>Column</label>
          <select
            value={editedColumnId}
            onChange={(e) => setEditedColumnId(Number(e.target.value))}
            className={styles.select}
          >
            {columnsInSameBoard.map((col) => (
              <option key={col.id} value={col.id}>{col.name}</option>
            ))}
          </select>

          <div className={styles.editActions}>
            <button
              onClick={() => updateMutation.mutate()}
              disabled={!editedTitle.trim() || updateMutation.isPending}
              className={styles.addButton}
            >
              Kaydet
            </button>
            <button onClick={() => setIsEditing(false)} className={styles.cancelButton} disabled={updateMutation.isPending}>
              İptal
            </button>
          </div>
        </div>
      ) : (
        <>
          <h2 className={styles.title}>{task.title}</h2>

          {task.description && <p className={styles.description}>{task.description}</p>}

          <div className={styles.metaRow}>
            <span className={styles.metaItem}>Öncelik: {task.priority}</span>
            {task.dueDate && (
              <span className={styles.metaItem}>
                Bitiş: {new Date(task.dueDate).toLocaleDateString('tr-TR')}
              </span>
            )}
            {currentColumn && (
              <span className={styles.metaItem}>Column: {currentColumn.name}</span>
            )}
          </div>

          <div className={styles.taskActions}>
            <button className={styles.editTaskButton} onClick={() => {
              setEditedTitle(task.title)
              setEditedDescription(task.description ?? '')
              setEditedPriority(task.priority)
              setEditedDueDate(task.dueDate ? task.dueDate.slice(0, 10) : '')
              setEditedColumnId(task.column.id)
              setIsEditing(true)
            }}>
              Düzenle
            </button>
            <button className={styles.deleteTaskButton} onClick={handleDelete} disabled={deleteMutation.isPending}>
              Görevi Sil
            </button>
          </div>
        </>
      )}

      <h3 className={styles.sectionTitle}>Atanan Kişiler</h3>
      <div className={styles.assigneeList}>
        {task.assignments.length === 0 && <p className={styles.emptyText}>Henüz kimse atanmadı.</p>}
        {task.assignments.map((assignment) => (
          <div key={assignment.id} className={styles.assigneeRow}>
            <span>{assignment.user.name} {assignment.user.surname}</span>
            <button
              className={styles.removeButton}
              onClick={() => removeAssigneeMutation.mutate(assignment.user.id)}
              disabled={removeAssigneeMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
            >
              Çıkar
            </button>
          </div>
        ))}
      </div>

      {availableMembers.length > 0 && (
        <div className={styles.addAssigneeRow}>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className={styles.select}
          >
            <option value="">Kişi seç...</option>
            {availableMembers.map((member) => (
              <option key={member.user.id} value={member.user.id}>
                {member.user.name} {member.user.surname} ({member.role})
              </option>
            ))}
          </select>
          <button
            className={styles.addButton}
            disabled={!selectedUserId || addAssigneeMutation.isPending}
            onClick={() => addAssigneeMutation.mutate(Number(selectedUserId))}
          >
            Ekle
          </button>
        </div>
      )}
    </>
  )
}
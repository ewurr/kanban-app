import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../lib/apiClient'
import type { Task as TaskType, ChecklistItem } from '../../types/kanban'
import styles from './TaskDetailModal.module.css'

interface TaskChecklistTabProps {
  task: TaskType
}

export function TaskChecklistTab({ task }: TaskChecklistTabProps) {
  const queryClient = useQueryClient()
  const [newItemContent, setNewItemContent] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [hideCompleted, setHideCompleted] = useState(false)

  const { data: items = [] } = useQuery<ChecklistItem[]>({
    queryKey: ['checklist', task.id],
    queryFn: () => apiClient.get<ChecklistItem[]>(`/tasks/${task.id}/checklist`),
    initialData: task.checklistItems ?? [],
})

  const completedCount = (items ?? []).filter((i) => i.isCompleted).length
  const totalCount = (items ?? []).length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const visibleItems = hideCompleted ? items.filter((i) => !i.isCompleted) : items

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['checklist', task.id] })
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  }

  const createMutation = useMutation({
    mutationFn: (content: string) =>
      apiClient.post(`/tasks/${task.id}/checklist`, { content }),
    onSuccess: () => {
      setNewItemContent('')
      invalidate()
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isCompleted }: { id: number; isCompleted: boolean }) =>
      apiClient.patch(`/tasks/${task.id}/checklist/${id}`, { isCompleted }),
    onSuccess: () => invalidate(),
  })

  const editMutation = useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) =>
      apiClient.patch(`/tasks/${task.id}/checklist/${id}`, { content }),
    onSuccess: () => {
      setEditingId(null)
      setEditingContent('')
      invalidate()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiClient.delete(`/tasks/${task.id}/checklist/${id}`),
    onSuccess: () => invalidate(),
  })

  function handleAddItem() {
    const trimmed = newItemContent.trim()
    if (!trimmed) return
    createMutation.mutate(trimmed)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleAddItem()
    if (e.key === 'Escape') setNewItemContent('')
  }

  function startEdit(item: ChecklistItem) {
    setEditingId(item.id)
    setEditingContent(item.content)
  }

  function saveEdit() {
    if (!editingContent.trim() || editingId === null) return
    editMutation.mutate({ id: editingId, content: editingContent.trim() })
  }

  return (
    <div className={styles.tabContent}>

      {/* Progress */}
      {totalCount > 0 && (
        <div className={styles.checklistProgress}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>
              {completedCount}/{totalCount} tamamlandı
            </span>
            <span className={styles.progressPercent}>{progressPercent}%</span>
          </div>
          <div className={styles.progressTrack}>
            <div
              className={`${styles.progressBar} ${progressPercent === 100 ? styles.progressComplete : ''}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Tamamlananları gizle toggle */}
      {completedCount > 0 && (
        <button
          className={styles.hideCompletedButton}
          onClick={() => setHideCompleted((v) => !v)}
        >
          {hideCompleted ? `Tamamlananları göster (${completedCount})` : 'Tamamlananları gizle'}
        </button>
      )}

      {/* Madde listesi */}
      <div className={styles.checklistItems}>
        {visibleItems.map((item) => (
          <div key={item.id} className={styles.checklistItem}>
            <button
              className={`${styles.checkbox} ${item.isCompleted ? styles.checkboxChecked : ''}`}
              onClick={() => toggleMutation.mutate({ id: item.id, isCompleted: !item.isCompleted })}
              disabled={toggleMutation.isPending}
              aria-label={item.isCompleted ? 'Tamamlandı olarak işaretli, kaldırmak için tıkla' : 'Tamamlandı olarak işaretle'}
            >
              {item.isCompleted && '✓'}
            </button>

            {editingId === item.id ? (
              <div className={styles.checklistEditRow}>
                <input
                  type="text"
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  className={styles.editInput}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit()
                    if (e.key === 'Escape') { setEditingId(null); setEditingContent('') }
                  }}
                />
                <button className={styles.saveButton} onClick={saveEdit} disabled={editMutation.isPending}>
                  Kaydet
                </button>
                <button className={styles.cancelButton} onClick={() => { setEditingId(null); setEditingContent('') }}>
                  İptal
                </button>
              </div>
            ) : (
              <span
                className={`${styles.checklistContent} ${item.isCompleted ? styles.checklistContentDone : ''}`}
                onDoubleClick={() => startEdit(item)}
              >
                {item.content}
              </span>
            )}

            {editingId !== item.id && (
              <div className={styles.checklistActions}>
                <button
                  className={styles.checklistEditButton}
                  onClick={() => startEdit(item)}
                  title="Düzenle"
                >
                  ✎
                </button>
                <button
                  className={styles.checklistDeleteButton}
                  onClick={() => deleteMutation.mutate(item.id)}
                  disabled={deleteMutation.isPending}
                  title="Sil"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        ))}

        {visibleItems.length === 0 && totalCount === 0 && (
          <p className={styles.emptyText}>Henüz madde eklenmedi.</p>
        )}
      </div>

      {/* Yeni madde ekleme */}
      <div className={styles.checklistAddRow}>
        <input
          type="text"
          value={newItemContent}
          onChange={(e) => setNewItemContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Yeni madde ekle..."
          className={styles.checklistInput}
          maxLength={500}
        />
        <button
          className={styles.addButton}
          onClick={handleAddItem}
          disabled={!newItemContent.trim() || createMutation.isPending}
        >
          Ekle
        </button>
      </div>
    </div>
  )
}
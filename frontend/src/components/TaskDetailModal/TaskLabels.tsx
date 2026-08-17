import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../lib/apiClient'
import type { Task as TaskType, Label as LabelType } from '../../types/kanban'
import styles from './TaskDetailModal.module.css'

interface TaskLabelsProps {
  task: TaskType
  boardId: number
}

export function TaskLabels({ task, boardId }: TaskLabelsProps) {
  const queryClient = useQueryClient()
  const [isCreating, setIsCreating] = useState(false)
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState('')

  const { data: boardLabels } = useQuery<LabelType[]>({
    queryKey: ['labels', boardId],
    queryFn: () => apiClient.get<LabelType[]>(`/labels?boardId=${boardId}`),
  })

  const { data: availableColors } = useQuery<string[]>({
    queryKey: ['label-colors'],
    queryFn: () => apiClient.get<string[]>('/labels/colors'),
    staleTime: Infinity, // renk paleti değişmez, tekrar tekrar çekmeye gerek yok
  })

  const addLabelMutation = useMutation({
    mutationFn: (labelId: number) => apiClient.post(`/tasks/${task.id}/labels/${labelId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const removeLabelMutation = useMutation({
    mutationFn: (labelId: number) => apiClient.delete(`/tasks/${task.id}/labels/${labelId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const createLabelMutation = useMutation({
    mutationFn: () =>
      apiClient.post<LabelType>('/labels', {
        boardId,
        name: newLabelName,
        color: newLabelColor,
      }),
    onSuccess: (createdLabel) => {
      queryClient.invalidateQueries({ queryKey: ['labels', boardId] })
      setIsCreating(false)
      setNewLabelName('')
      setNewLabelColor('')
      // Yeni oluşturulan etiketi otomatik olarak task'a ekle
      addLabelMutation.mutate(createdLabel.id)
    },
  })

  const taskLabelIds = task.labels.map((l) => l.id)
  const unassignedLabels = boardLabels?.filter((l) => !taskLabelIds.includes(l.id)) ?? []

  return (
    <div>
      <h3 className={styles.sectionTitle}>Etiketler</h3>

      <div className={styles.labelList}>
        {task.labels.length === 0 && (
          <p className={styles.emptyText}>Henüz etiket eklenmedi.</p>
        )}
        {task.labels.map((label) => (
          <span
            key={label.id}
            className={styles.labelChip}
            style={{ backgroundColor: label.color }}
          >
            {label.name}
            <button
              className={styles.labelRemoveButton}
              onClick={() => removeLabelMutation.mutate(label.id)}
              disabled={removeLabelMutation.isPending}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {unassignedLabels.length > 0 && (
        <div className={styles.labelPicker}>
          {unassignedLabels.map((label) => (
            <button
              key={label.id}
              className={styles.labelOption}
              style={{ backgroundColor: label.color }}
              onClick={() => addLabelMutation.mutate(label.id)}
              disabled={addLabelMutation.isPending}
            >
              + {label.name}
            </button>
          ))}
        </div>
      )}

      {isCreating ? (
        <div className={styles.labelCreateForm}>
          <input
            type="text"
            value={newLabelName}
            onChange={(e) => setNewLabelName(e.target.value)}
            placeholder="Etiket adı"
            className={styles.editInput}
            maxLength={50}
            autoFocus
          />
          <div className={styles.colorPalette}>
            {availableColors?.map((color) => (
              <button
                key={color}
                className={`${styles.colorSwatch} ${newLabelColor === color ? styles.colorSwatchSelected : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setNewLabelColor(color)}
                aria-label={`Renk: ${color}`}
              />
            ))}
          </div>
          <div className={styles.editActions}>
            <button
              className={styles.addButton}
              disabled={!newLabelName.trim() || !newLabelColor || createLabelMutation.isPending}
              onClick={() => createLabelMutation.mutate()}
            >
              Oluştur
            </button>
            <button
              className={styles.cancelButton}
              onClick={() => {
                setIsCreating(false)
                setNewLabelName('')
                setNewLabelColor('')
              }}
            >
              İptal
            </button>
          </div>
        </div>
      ) : (
        <button className={styles.newLabelButton} onClick={() => setIsCreating(true)}>
          + Yeni Etiket
        </button>
      )}
    </div>
  )
}
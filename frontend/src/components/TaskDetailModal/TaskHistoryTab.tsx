import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../lib/apiClient'
import type { ActivityLog } from '../../types/kanban'
import styles from './TaskDetailModal.module.css'

function formatActivityText(log: ActivityLog): string {
  const userName = `${log.user.name} ${log.user.surname}`

  switch (log.actionType) {
    case 'created':
      return `${userName} görevi oluşturdu`
    case 'moved':
      return `${userName} görevi "${log.oldValue}" sütunundan "${log.newValue}" sütununa taşıdı`
    case 'assigned':
      return `${userName}, ${log.newValue} kişisini atadı`
    case 'unassigned':
      return `${userName}, ${log.oldValue} kişisini çıkardı`
    case 'priority_changed':
      return `${userName} önceliği "${log.oldValue}" iken "${log.newValue}" yaptı`
    case 'deleted':
      return `${userName} görevi sildi`
    default:
      return `${userName} bir değişiklik yaptı`
  }
}

interface TaskHistoryTabProps {
  taskId: number
}

export function TaskHistoryTab({ taskId }: TaskHistoryTabProps) {
  const { data: activityLogs, isLoading } = useQuery<ActivityLog[]>({
    queryKey: ['task-activity', taskId],
    queryFn: () => apiClient.get<ActivityLog[]>(`/tasks/${taskId}/activity`),
  })

  return (
    <div className={styles.historyList}>
      {isLoading && <p className={styles.emptyText}>Yükleniyor...</p>}
      {!isLoading && activityLogs?.length === 0 && (
        <p className={styles.emptyText}>Henüz aktivite yok.</p>
      )}
      {activityLogs?.map((log) => (
        <div key={log.id} className={styles.historyItem}>
          <span className={styles.historyText}>{formatActivityText(log)}</span>
          <span className={styles.historyDate}>
            {new Date(log.createdAt).toLocaleString('tr-TR')}
          </span>
        </div>
      ))}
    </div>
  )
}
import { useState } from 'react'
import type { Task as TaskType } from '../../types/kanban'
import { TaskDetailsTab } from './TaskDetailsTab'
import { TaskHistoryTab } from './TaskHistoryTab'
import { TaskCommentsTab } from './TaskCommentsTab'
import styles from './TaskDetailModal.module.css'

interface TaskDetailModalProps {
  task: TaskType
  workspaceId: number
  onClose: () => void
}

export function TaskDetailModal({ task, workspaceId, onClose }: TaskDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'comments'>('details')

  return (
    <div className={`${styles.overlay} animate-fade-in`} onClick={onClose}>
      <div className={`${styles.modal} animate-pop-in`} style={{ backgroundColor: task.color }} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>

        <div className={styles.tabRow}>
          <button
            className={activeTab === 'details' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('details')}
          >
            Detaylar
          </button>
          <button
            className={activeTab === 'history' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('history')}
          >
            Geçmiş
          </button>
          <button
            className={activeTab === 'comments' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('comments')}
          >
            Yorumlar
          </button>
        </div>

        {activeTab === 'details' && (
          <TaskDetailsTab task={task} workspaceId={workspaceId} onClose={onClose} />
        )}

        {activeTab === 'history' && (
          <TaskHistoryTab taskId={task.id} />
        )}

        {activeTab === 'comments' && (
          <TaskCommentsTab taskId={task.id} workspaceId={workspaceId} />
        )}
      </div>
    </div>
  )
}
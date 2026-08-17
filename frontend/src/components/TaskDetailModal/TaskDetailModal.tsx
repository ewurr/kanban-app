import { useEffect, useState } from 'react'
import type { Task as TaskType } from '../../types/kanban'
import { TaskDetailsTab } from './TaskDetailsTab'
import { TaskHistoryTab } from './TaskHistoryTab'
import { TaskCommentsTab } from './TaskCommentsTab'
import { TaskChecklistTab } from './TaskChecklistTab'
import styles from './TaskDetailModal.module.css'

interface TaskDetailModalProps {
  task: TaskType
  workspaceId: number
  boardId: number
  onClose: () => void
}

export function TaskDetailModal({ task, workspaceId, boardId, onClose }: TaskDetailModalProps) {

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

  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'comments' | 'checklist'>('details')

  return (
    <div className={styles.tabContent}>
      <div className={`${styles.overlay} animate-fade-in`} onClick={onClose}>
        <div
          className={`${styles.modal} animate-pop-in`}
          style={{ backgroundColor: task.color }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className={styles.closeButton} onClick={onClose}>×</button>

          <div className={styles.tabRow}>
            <button
              className={activeTab === 'details' ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab('details')}
            >
              Detaylar
            </button>
            <button
              className={activeTab === 'checklist' ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab('checklist')}
            >
              ✓ Checklist
              {(task.checklistItems?.length ?? 0) > 0 && (
                <span className={styles.tabBadge}>
                  {(task.checklistItems ?? []).filter((i) => i.isCompleted).length}/{task.checklistItems?.length ?? 0}              </span>
              )}
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
            <TaskDetailsTab task={task} workspaceId={workspaceId} boardId={boardId} onClose={onClose} />
          )}

          {activeTab === 'checklist' && (
            <TaskChecklistTab task={task} />
          )}

          {activeTab === 'history' && (
            <TaskHistoryTab taskId={task.id} />
          )}

          {activeTab === 'comments' && (
            <TaskCommentsTab taskId={task.id} workspaceId={workspaceId} />
          )}
        </div>
      </div>
    </div>
  
  )
}
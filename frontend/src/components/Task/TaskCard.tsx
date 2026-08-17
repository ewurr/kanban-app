import type { Task as TaskType } from '../../types/kanban'
import styles from './Task.module.css'

interface TaskCardProps {
  task: TaskType
  rotation: number
  style?: React.CSSProperties
  className?: string
  onClick?: () => void
}

function getPriorityColor(priority: string): string {
    if (priority === 'low') return '#4CAF50'
    if (priority === 'medium') return '#FFC107'
    if (priority === 'high') return '#E53935'
    return 'transparent'
}

export function TaskCard({ task, rotation, style, className, onClick }: TaskCardProps) {
    const priorityColor = getPriorityColor(task.priority)
    const dueDateStatus = task.dueDateStatus

    return (
        <div
            className={`${styles.postIt} ${className ?? ''}`}
            onClick={onClick}
            style={{
                backgroundColor: task.color,
                border: `3px solid ${priorityColor}`,
                transform: `rotate(${rotation}deg)`,
                ...style,
            }}
        >
            {dueDateStatus === 'overdue' && (
                <span className={styles.dueBadgeOverdue}>⚠ Gecikti</span>
            )}
            {dueDateStatus === 'soon' && (
                <span className={styles.dueBadgeSoon}>⏰ Yaklaşıyor</span>
            )}

            <p className={styles.title}>
                {task.title.length > 30
                    ? `${task.title.slice(0, 30)}...`
                    : task.title}
            </p>


            {task.labels.length > 0 && (
                <div className={styles.labelStrip}>
                    {task.labels.map((label) => (
                        <span
                            key={label.id}
                            className={styles.labelDot}
                            style={{ backgroundColor: label.color }}
                            title={label.name}
                        />
                    ))}
                </div>
            )}

            {task.description && (
                <p className={styles.descriptionPreview}>
                    {task.description.length > 40
                        ? `${task.description.slice(0, 40)}...`
                        : task.description}
                </p>
            )}


            {task.assignments.length > 0 && (
                <div className={styles.assignees}>
                    {task.assignments.map((assignment) => (
                        <span key={assignment.id} className={styles.assigneeChip}>
                            {assignment.user.name} {assignment.user.surname}
                        </span>
                    ))}
                </div>
            )}

            {(task.checklistItems?.length ?? 0) > 0 && (
                <div className={styles.checklistSummary}>
                    <span className={styles.checklistIcon}>✓</span>
                    <span className={styles.checklistCount}>
                        {task.checklistItems.filter((i) => i.isCompleted).length}/{task.checklistItems.length}
                    </span>
                </div>
            )}

        </div>
    )
}
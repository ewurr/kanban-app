import { useState } from 'react'
import type { Task as TaskType } from '../../types/kanban'
import { TaskDetailModal } from '../TaskDetailModal/TaskDetailModal'
import styles from './Task.module.css'

interface TaskProps {
    task: TaskType
    workspaceId: number
}

const POST_IT_COLORS = ['#FFD93D', '#FF9B9B', '#A8E6CF', '#C9C3FF', '#FFB6E1']

function getPriorityColor(priority: string): string{
    if(priority === 'low') return '#4CAF50'
    if(priority === 'medium') return '#FFC107'
    if(priority === 'high') return '#E53935'
    return 'transparent'

}

export function Task({ task, workspaceId }: TaskProps) {
    const [isHovered, setIsHovered] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const rotation = (task.id % 5) -2
    const color = POST_IT_COLORS[task.id % POST_IT_COLORS.length]
    const priorityColor = getPriorityColor(task.priority)

    return (
        <>
            <div className={styles.postIt} 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => setIsModalOpen(true)}
            style={{
                backgroundColor: color,
                border: `3px solid ${priorityColor}`,
                transform: isHovered
                ? 'rotate(0deg) scale(1.03)'
                : `rotate(${rotation}deg)`,
            }}
            >
                <p className={styles.title}>
                    {task.title.length > 30 
                    ? `${task.title.slice(0, 30)}...` 
                    : task.title}
                </p>

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
            </div>

            {isModalOpen && (
                <TaskDetailModal
                    task={task}
                    workspaceId={workspaceId}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </>
    )
}
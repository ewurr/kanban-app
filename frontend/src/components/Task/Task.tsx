import { useState } from 'react'
import type { Task as TaskType } from '../../types/kanban'
import { TaskDetailModal } from '../TaskDetailModal/TaskDetailModal'
import styles from './Task.module.css'

interface TaskProps {
    task: TaskType
    workspaceId: number
}

const POST_IT_COLORS = ['#FFD93D', '#FF9B9B', '#A8E6CF', '#C9C3FF', '#FFB6E1']

export function Task({ task, workspaceId }: TaskProps) {
    const [isHovered, setIsHovered] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const rotation = (task.id % 5) -2
    const color = POST_IT_COLORS[task.id % POST_IT_COLORS.length]

    return (
        <>
            <div className={styles.postIt} 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => setIsModalOpen(true)}
            style={{
                backgroundColor: color,
                transform: isHovered
                ? 'rotate(0deg) scale(1.03)'
                : `rotate(${rotation}deg)`,
            }}
            >
                <p className={styles.title}>{task.title}</p>

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
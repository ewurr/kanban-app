import { useState } from 'react'
import type { Task as TaskType } from '../../types/kanban'
import styles from './Task.module.css'

interface TaskProps {
    task: TaskType
}

const POST_IT_COLORS = ['#FFD93D', '#FF9B9B', '#A8E6CF', '#C9C3FF', '#FFB6E1']

export function Task({ task }: TaskProps) {
    const [isHovered, setIsHovered] = useState(false)
    const rotation = (task.id % 5) -2
    const color = POST_IT_COLORS[task.id % POST_IT_COLORS.length]

    return (
        <div className={styles.postIt} 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
            backgroundColor: color,
            transform: isHovered
            ? 'rotate(0deg) scale(1.03)'
            : `rotate(${rotation}deg)`,
        }}
        >
            <p className={styles.title}>{task.title}</p>
        </div>
    )
}
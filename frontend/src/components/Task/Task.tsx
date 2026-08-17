import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task as TaskType } from '../../types/kanban'
import { TaskDetailModal } from '../TaskDetailModal/TaskDetailModal'
import { TaskCard } from './TaskCard'

interface TaskProps {
    task: TaskType
    workspaceId: number
    boardId: number
    animationDelay?: number
}

export function Task({ task, workspaceId, animationDelay, boardId }: TaskProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const rotation = (task.id % 5) - 2

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.id,
        data: {
            type: 'task',
            task,
        },
    })

    return (
        <>
            <div
                ref={setNodeRef}
                {...attributes}
                {...listeners}
                className="animate-fade-up"
                style={{
                    animationDelay: `${animationDelay ?? 0}s`,
                }}
            >
                <TaskCard
                    task={task}
                    rotation={rotation}
                    onClick={() => {
                        if (!isDragging) setIsModalOpen(true)
                    }}
                    style={{
                        transform: transform
                            ? `${CSS.Transform.toString(transform)} rotate(${rotation}deg)`
                            : `rotate(${rotation}deg)`,
                        transition,
                        opacity: isDragging ? 0.4 : 1,
                        cursor: isDragging ? 'grabbing' : 'grab',
                    }}
                />
            </div>

            {isModalOpen && (
                <TaskDetailModal
                    task={task}
                    workspaceId={workspaceId}
                    boardId={boardId}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </>
    )
}
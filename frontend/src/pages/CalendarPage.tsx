import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'
import type { Task as TaskType } from '../types/kanban'
import { TaskDetailModal } from '../components/TaskDetailModal/TaskDetailModal'
import styles from './CalendarPage.module.css'

export function CalendarPage() {
    const { id: workspaceId } = useParams()
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedTask, setSelectedTask] = useState<TaskType | null>(null)
    const navigate = useNavigate()

    const { data: tasks = [] } = useQuery<TaskType[]>({
        queryKey: ['tasks-calendar', workspaceId],
        queryFn: () => apiClient.get<TaskType[]>(`/tasks?workspaceId=${workspaceId}`),
        enabled: !!workspaceId,
    })

    const { data: workspace } = useQuery<{ id: number; name: string }>({
        queryKey: ['workspace-calendar', workspaceId],
        queryFn: () => apiClient.get(`/workspaces/${workspaceId}`),
        enabled: !!workspaceId,
    })

    // Ay navigasyonu
    function prevMonth() {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    }

    function nextMonth() {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    }

    // Bu ayın takvim ızgarasını oluştur
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)

    // Haftanın hangi gününde başlıyor (Pazartesi = 0)
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7

    // Takvim hücrelerini oluştur: önceki aydan dolgu + bu ayın günleri
    const calendarDays: (number | null)[] = [
        ...Array(startOffset).fill(null),
        ...Array.from({ length: lastDayOfMonth.getDate() }, (_, i) => i + 1),
    ]

    // 7'nin katına tamamla (son haftayı doldur)
    while (calendarDays.length % 7 !== 0) {
        calendarDays.push(null)
    }

    // Task'ları due date'e göre grupla
    function getTasksForDay(day: number): TaskType[] {
        return tasks.filter((task) => {
            if (!task.dueDate) return false
            const due = new Date(task.dueDate)
            return due.getFullYear() === year && due.getMonth() === month && due.getDate() === day
        })
    }

    // Bugün mü?
    function isToday(day: number): boolean {
        const today = new Date()
        return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
    }

    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
    const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

    // workspaceId'yi bulmak için task üzerinden
    const workspaceIdNum = workspace?.id ?? Number(workspaceId)

    return (
        <div className={styles.page}>
            <button className={styles.backButton} onClick={() => navigate(`/workspaces/${workspaceId}`)}>
                ← Workspace'e Dön
            </button>
            <div className={styles.header}>
                <h1 className={styles.title}>
                    📅 {workspace?.name ? `${workspace.name} — Takvim` : 'Takvim'}
                </h1>

                <div className={styles.navigation}>
                    <button className={styles.navButton} onClick={prevMonth}>‹</button>
                    <span className={styles.monthLabel}>
                        {monthNames[month]} {year}
                    </span>
                    <button className={styles.navButton} onClick={nextMonth}>›</button>
                </div>
            </div>

            <div className={styles.grid}>
                {dayNames.map((name) => (
                    <div key={name} className={styles.dayHeader}>
                        {name}
                    </div>
                ))}

                {calendarDays.map((day, index) => {
                    if (day === null) {
                        return <div key={`empty-${index}`} className={styles.emptyCell} />
                    }

                    const dayTasks = getTasksForDay(day)

                    return (
                        <div
                            key={day}
                            className={`${styles.dayCell} ${isToday(day) ? styles.today : ''}`}
                        >
                            <span className={styles.dayNumber}>{day}</span>

                            <div className={styles.taskList}>
                                {dayTasks.map((task) => (
                                    <button
                                        key={task.id}
                                        className={`${styles.taskChip} ${
                                            task.dueDateStatus === 'overdue' ? styles.overdue :
                                            task.dueDateStatus === 'soon' ? styles.soon : ''
                                        }`}
                                        style={{ borderLeftColor: task.color }}
                                        onClick={() => setSelectedTask(task)}
                                    >
                                        <span className={styles.taskTitle}>{task.title}</span>
                                        {task.labels.length > 0 && (
                                            <span
                                                className={styles.labelDot}
                                                style={{ backgroundColor: task.labels[0].color }}
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>

            {selectedTask && (
                <TaskDetailModal
                    task={selectedTask}
                    workspaceId={workspaceIdNum}
                    boardId={selectedTask.column.board.id}
                    onClose={() => setSelectedTask(null)}
                />
            )}
        </div>
    )
}
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../AuthContext'
import type { Notification } from '../../types/kanban'
import styles from './NotificationBell.module.css'

function formatNotificationText(notification: Notification): string {
    const taskTitle = notification.taskTitleSnapshot ?? 'bir görev'

    switch (notification.type) {
        case 'task_assigned':
            return `"${taskTitle}" görevine atandın`
        case 'due_date_approaching':
            return `"${taskTitle}" görevinin bitiş tarihi yaklaşıyor`
        case 'due_date_overdue':
            return `"${taskTitle}" görevinin bitiş tarihi geçti`
        default:
            return taskTitle
    }
}

export function NotificationBell() {
    const { token } = useAuth()
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    const [isOpen, setIsOpen] = useState(false)

    const { data: notifications } = useQuery<Notification[]>({
        queryKey: ['notifications'],
        refetchInterval: 60000,
        queryFn: async () => {
            const response = await fetch('http://localhost:8000/api/notifications', {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!response.ok) throw new Error('Bildirimler yüklenemedi')
            return response.json()
        },
    })

    const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0

    const markAsReadMutation = useMutation({
        mutationFn: async (notificationId: number) => {
            const response = await fetch(`http://localhost:8000/api/notifications/${notificationId}/read`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!response.ok) throw new Error('Bildirim güncellenemedi')
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
        },
    })

    const markAllAsReadMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch('http://localhost:8000/api/notifications/read-all', {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!response.ok) throw new Error('Bildirimler güncellenemedi')
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
        },
    })

    const deleteNotificationMutation = useMutation({
        mutationFn: async (notificationId: number) => {
            const response = await fetch(`http://localhost:8000/api/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!response.ok) throw new Error('Bildirim silinemedi')
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
        },
    })

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            markAsReadMutation.mutate(notification.id)
        }

        if (notification.task) {
            navigate(`/boards/${notification.task.column.board.id}`)
            setIsOpen(false)
        }
    }

    return (
        <div className={styles.wrapper}>
            <button className={styles.bellButton} onClick={() => setIsOpen(!isOpen)}>
                🔔
                {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
            </button>

            {isOpen && (
                <>
                    <div className={styles.backdrop} onClick={() => setIsOpen(false)} />
                    <div className={styles.dropdown}>
                        <div className={styles.dropdownHeader}>
                            <span>Bildirimler</span>
                            {unreadCount > 0 && (
                                <button
                                    className={styles.markAllButton}
                                    onClick={() => markAllAsReadMutation.mutate()}
                                    disabled={markAllAsReadMutation.isPending}
                                >
                                    Tümünü okundu işaretle
                                </button>
                            )}
                        </div>

                        <div className={styles.notificationList}>
                            {notifications?.length === 0 && (
                                <p className={styles.emptyText}>Henüz bildirim yok.</p>
                            )}
                            {notifications?.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={notification.isRead ? styles.notificationItem : styles.notificationItemUnread}
                                >
                                    <button
                                        className={styles.notificationMain}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <span className={styles.notificationText}>
                                            {formatNotificationText(notification)}
                                        </span>
                                        <span className={styles.notificationDate}>
                                            {new Date(notification.createdAt).toLocaleString('tr-TR')}
                                        </span>
                                    </button>
                                    <button
                                        className={styles.notificationDeleteButton}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            deleteNotificationMutation.mutate(notification.id)
                                        }}
                                        disabled={deleteNotificationMutation.isPending}
                                        title="Sil"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
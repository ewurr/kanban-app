import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { Workspace, Task as TaskType, Board as BoardType, Project, Column, Board } from '../../types/kanban'
import styles from './SideMenu.module.css'
import { apiClient } from '../../lib/apiClient'
import { useAuth } from '../../AuthContext'

interface SideMenuProps {
  onClose: () => void
}

const COLUMN_ORDER: Record<string, number> = {
  'to do': 0,
  'in progress': 1,
  'done': 2,
}

function getColumnOrder(columnName: string): number {
    return COLUMN_ORDER[columnName.toLowerCase()] ?? 3
}

function getColumnColor(columnName: string): string {
    const normalized = columnName.toLowerCase()
    if (normalized === 'to do') return '#FF6B6B'
    if (normalized === 'in progress') return '#FFD93D'
    if (normalized === 'done') return '#6BCB77'
    return '#4A90E2'
}

export function SideMenu({ onClose }: SideMenuProps) {
    const location = useLocation()

    const { user } = useAuth()

    const workspaceRouteMatch = location.pathname.match(/^\/workspaces\/(\d+)/)
    const workspaceIdFromRoute = workspaceRouteMatch ? Number(workspaceRouteMatch[1]) : null

    const projectRouteMatch = location.pathname.match(/^\/projects\/(\d+)/)
    const projectIdFromRoute = projectRouteMatch ? Number(projectRouteMatch[1]) : null

    const boardMatch = location.pathname.match(/^\/boards\/(\d+)/)
    const boardIdFromUrl = boardMatch ? Number(boardMatch[1]) : null

    // Board sayfasındaysak, board'u çekip project/workspace id'sini oradan türetiyoruz
    const { data: board } = useQuery<BoardType>({
        queryKey: ['sidemenu-board', boardIdFromUrl],
        enabled: boardIdFromUrl !== null,
        queryFn: () => apiClient.get<BoardType>(`/boards/${boardIdFromUrl}`),
    })

    // Nihai project/workspace id'leri: ya doğrudan URL'den, ya da board üzerinden
    const projectIdFromUrl = projectIdFromRoute ?? board?.project.id ?? null
    
    const { data: projectForWorkspace } = useQuery<{ workspace: { id: number } }>({
        queryKey: ['sidemenu-project', projectIdFromUrl],
        enabled: projectIdFromUrl !== null && workspaceIdFromRoute === null && !board,
        queryFn: () => apiClient.get(`/projects/${projectIdFromUrl}`)
    })

    const workspaceIdFromUrl = workspaceIdFromRoute ?? board?.project.workspace.id ?? projectForWorkspace?.workspace.id ?? null

    const { data: workspaces } = useQuery<Workspace[]>({
        queryKey: ['workspaces'],
        queryFn: () => apiClient.get<Workspace[]>('/workspaces'),
    })

    const { data: projects } = useQuery<Project[]>({
        queryKey: ['projects-all', workspaceIdFromUrl],
        enabled: workspaceIdFromUrl !== null,
        queryFn: () => apiClient.get<Project[]>(`/projects?workspaceId=${workspaceIdFromUrl}`),
    })

    const { data: boards } = useQuery<Board[]>({
        queryKey: ['boards-all', projectIdFromUrl],
        enabled: projectIdFromUrl !== null,
        queryFn: () => apiClient.get<Board[]>(`/boards?projectId=${projectIdFromUrl}`),
    })

    const { data: columns } = useQuery<Column[]>({
        queryKey: ['columns-all', boardIdFromUrl],
        enabled: boardIdFromUrl !== null,
        queryFn: () => apiClient.get<Column[]>(`/columns?boardId=${boardIdFromUrl}`),
    })

    const { data: tasks } = useQuery<TaskType[]>({
        queryKey: ['tasks-all', boardIdFromUrl],
        enabled: boardIdFromUrl !== null,
        queryFn: () => apiClient.get<TaskType[]>(`/tasks?boardId=${boardIdFromUrl}`),
    })

        const projectsInWorkspace = projects
        const boardsInProject = boards
        const columnsInBoard = columns
        const myTasks = tasks?.filter((t) => t.assignments.some((a) => a.user.id === user?.id))

        const sortedMyTasks = myTasks?.slice().sort((a, b) => {
            const columnA = columnsInBoard?.find((c) => c.id === a.column.id)
            const columnB = columnsInBoard?.find((c) => c.id === b.column.id)
            return getColumnOrder(columnA?.name ?? '') - getColumnOrder(columnB?.name ?? '')
        })

    return (
        <div className={styles.overlay} onClick={onClose}>
        <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
            <Link to="/" className={styles.homeLink}>
            🏠 Ana Sayfa
            </Link>

            <h3 className={styles.sectionTitle}>Workspace'lerim</h3>
            <div className={styles.itemList}>
            {workspaces?.map((workspace) => (
                <Link
                key={workspace.id}
                to={`/workspaces/${workspace.id}`}
                className={workspace.id === workspaceIdFromUrl ? styles.itemLinkActive : styles.itemLink}
                >
                {workspace.name}
                </Link>
            ))}
            </div>

            {workspaceIdFromUrl !== null && projectsInWorkspace && projectsInWorkspace.length > 0 && (
            <>
                <h3 className={styles.sectionTitle}>Projelerim</h3>
                <div className={styles.itemList}>
                {projectsInWorkspace.map((project) => (
                    <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className={project.id === projectIdFromUrl ? styles.itemLinkActive : styles.itemLink}
                    >
                    {project.name}
                    </Link>
                ))}
                </div>
            </>
            )}

            {projectIdFromUrl !== null && boardsInProject && boardsInProject.length > 0 && (
            <>
                <h3 className={styles.sectionTitle}>Board'larım</h3>
                <div className={styles.itemList}>
                {boardsInProject.map((b) => (
                    <Link
                    key={b.id}
                    to={`/boards/${b.id}`}
                    className={b.id === boardIdFromUrl ? styles.itemLinkActive : styles.itemLink}
                    >
                    {b.name}
                    </Link>
                ))}
                </div>
            </>
            )}

            {boardIdFromUrl !== null && sortedMyTasks && sortedMyTasks.length > 0 && (
            <>
                <h3 className={styles.sectionTitle}>Bana Atanan Görevler</h3>
                <div className={styles.itemList}>
                    {sortedMyTasks?.map((task) => {
                    const column = columnsInBoard?.find((c) => c.id === task.column.id)
                    const color = getColumnColor(column?.name ?? '')
                    return (
                        <div key={task.id} className={styles.taskItem} style={{ borderLeft: `4px solid ${color}` }}>
                        <span className={styles.taskColumn} style={{ color }}>{column?.name ?? '?'}</span>
                        <span className={styles.taskTitle}>{task.title}</span>
                        </div>
                    )
                    })}
                </div>
            </>
            )}
        </div>
        </div>
    )
}
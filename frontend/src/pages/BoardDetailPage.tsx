import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../AuthContext'
import type { Task as TaskType, Column as ColumnType, Board as BoardType } from '../types/kanban'
import { Column } from '../components/Column/Column'
import { Board } from '../components/Board/Board'
import { AddColumnCard } from '../components/AddColumnCard/AddColumnCard'
import { MemberTaskPanel } from '../components/MemberTaskPanel/MemberTaskPanel'
import styles from './BoardDetailPage.module.css'
import { AddTaskCard } from '../components/AddTaskCard/AddTaskCard'


export function BoardDetailPage() {
  const { id } = useParams()
  const { token, user } = useAuth()

  const { data: columns, isLoading: columnsLoading } = useQuery<ColumnType[]>({
    queryKey: ['columns', id],
    queryFn: async () => {
      const response = await fetch('http://localhost:8000/api/columns', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return response.json()
    },
  })

  const { data: tasks, isLoading: tasksLoading } = useQuery<TaskType[]>({
    queryKey: ['tasks', id],
    queryFn: async () => {
      const response = await fetch('http://localhost:8000/api/tasks', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return response.json()
    },
  })

  const { data: board, isLoading: boardLoading } = useQuery<BoardType>({
    queryKey: ['board', id],
    queryFn: async () => {
      const response = await fetch(`http://localhost:8000/api/boards/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return response.json()
    },
  })

  const { data: workspace } = useQuery<{ workspaceMembers: { id: number; user: { id: number; name: string; surname: string }; role: string }[] }>({
    queryKey: ['workspace', board?.project.workspace.id],
    enabled: !!board,
    queryFn: async () => {
      const response = await fetch(`http://localhost:8000/api/workspaces/${board?.project.workspace.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return response.json()
    },
  })

  if (columnsLoading || tasksLoading || boardLoading) {
    return <p>Yükleniyor...</p>
  }

  const boardColumns = columns
    ?.filter((column) => column.board.id === Number(id))
    .sort((a, b) => a.position - b.position)

  const boardTasks = tasks?.filter((task) =>
    boardColumns?.some((col) => col.id === task.column.id)
  ) ?? []

  const myMembership = workspace?.workspaceMembers.find((m) => m.user.id === user?.id)
  const canManage = myMembership?.role === 'owner' || myMembership?.role === 'pm'

  return (
    <div className={styles.pageLayout}>
      <MemberTaskPanel
        members={workspace?.workspaceMembers ?? []}
        boardTasks={boardTasks}
      />

      <div className={styles.centerColumn}>
        <Board>
          {boardColumns?.map((column) => {
            const columnTasks = tasks?.filter((task) => task.column.id === column.id) ?? []
            return <Column
              key={column.id}
              column={column}
              tasks={columnTasks}
              workspaceId={board?.project.workspace.id ?? 0}
              canManage={canManage}
            />
          })}
        </Board>
      </div>

      <div className={styles.rightColumn}>
          <AddColumnCard boardId={Number(id)} nextPosition={boardColumns?.length ?? 0}/>
          <AddTaskCard
              boardId={Number(id)}
              columns={columns ?? []}
              tasks={tasks ?? []}
          />
      </div>

    </div>
  )
}
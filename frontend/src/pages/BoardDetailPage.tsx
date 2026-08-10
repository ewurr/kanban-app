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
import { apiClient } from '../lib/apiClient'
import { ErrorMessage } from '../components/ErrorMessage/ErrorMessage'
import { LoadingState } from '../components/LoadingState/LoadingState'


export function BoardDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()

  const { data: columns, isLoading: columnsLoading, isError: columnsError, error: columnsErrorObj } = useQuery<ColumnType[]>({
      queryKey: ['columns', id],
      queryFn: () => apiClient.get<ColumnType[]>(`/columns?boardId=${id}`),
    })

    const { data: tasks, isLoading: tasksLoading, isError: tasksError, error: tasksErrorObj } = useQuery<TaskType[]>({
      queryKey: ['tasks', id],
      queryFn: () => apiClient.get<TaskType[]>(`/tasks?boardId=${id}`),
    })

    const { data: board, isLoading: boardLoading, isError: boardError, error: boardErrorObj } = useQuery<BoardType>({
      queryKey: ['board', id],
      queryFn: () => apiClient.get<BoardType>(`/boards/${id}`),
    })

    const { data: workspace } = useQuery<{ workspaceMembers: { id: number; user: { id: number; name: string; surname: string; email: string }; role: string }[] }>({
      queryKey: ['workspace', board?.project.workspace.id],
      enabled: !!board,
      queryFn: () => apiClient.get(`/workspaces/${board?.project.workspace.id}`),
    })

  if (columnsLoading || tasksLoading || boardLoading) {
    return <LoadingState message="Panolar hazırlanıyor..." />
  }

  if (columnsError || tasksError || boardError) {
    const firstError = columnsErrorObj ?? tasksErrorObj ?? boardErrorObj
    return (
      <div style={{ padding: '40px' }}>
        <ErrorMessage message={firstError instanceof Error ? firstError.message : 'Bir hata oluştu.'} variant="light" />
      </div>
    )
  }
  
  const boardColumns = columns?.slice().sort((a, b) => a.position - b.position)

  const boardTasks = tasks ?? []

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
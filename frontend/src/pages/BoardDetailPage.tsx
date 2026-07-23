import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../AuthContext'
import type { Task as TaskType, Column as ColumnType } from '../types/kanban'
import { Column } from '../components/Column/Column'
import { Board } from '../components/Board/Board'
import { AddColumnCard } from '../components/AddColumnCard/AddColumnCard'


export function BoardDetailPage() {
  const { id } = useParams()
  const { token } = useAuth()

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

  if (columnsLoading || tasksLoading) {
    return <p>Yükleniyor...</p>
  }

  const boardColumns = columns
    ?.filter((column) => column.board.id === Number(id))
    .sort((a, b) => a.position - b.position)

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      <Board>
        {boardColumns?.map((column) => {
          const columnTasks = tasks?.filter((task) => task.column.id === column.id) ?? []
          return <Column key={column.id} column={column} tasks={columnTasks} />
        })}
        <AddColumnCard boardId={Number(id)} nextPosition={boardColumns?.length ?? 0}/>
      </Board>
    </div>
  )
}
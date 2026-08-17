import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import type { DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core'
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
import { TrashCan } from '../components/TrashCan/TrashCan'
import { UndoToast } from '../components/UndoToast/UndoToast'
import { TaskCard } from '../components/Task/TaskCard'
import { ErrorToast } from '../components/ErrorToast/ErrorToast'

export function BoardDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [searchParams] = useSearchParams()
  const activeFilters = searchParams.get('filter')?.split(',').filter(Boolean) ?? []
  const isAssignedToMeActive = activeFilters.includes('assigned-to-me')

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

  // --- Drag & Drop state ---
  const [localTasks, setLocalTasks] = useState<TaskType[] | null>(null)
  const [activeTask, setActiveTask] = useState<TaskType | null>(null)
  const [isOverTrash, setIsOverTrash] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{ task: TaskType; timeoutId: number } | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)


  // Sürükleme sadece 5px hareketten sonra başlasın — kısa tıklamalar click sayılsın
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  )

  // localTasks varsa onu, yoksa server'dan gelen tasks'ı kullan
  const effectiveTasks = localTasks ?? tasks ?? []

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
  const myMembership = workspace?.workspaceMembers.find((m) => m.user.id === user?.id)
  const canManage = myMembership?.role === 'owner' || myMembership?.role === 'pm'

  // --- Drag & Drop handlers ---

  function handleDragStart(event: DragStartEvent) {
    const task = effectiveTasks.find((t) => t.id === event.active.id)
    setActiveTask(task ?? null)
  }

  function handleDragOver(event: DragOverEvent) {
      const { active, over } = event
      setIsOverTrash(over?.id === 'trash-can')

      if (!over || over.id === 'trash-can') return

      const activeId = Number(active.id)
      const activeTaskData = effectiveTasks.find((t) => t.id === activeId)
      if (!activeTaskData) return

      // Hedef column'u belirle
      const overId = over.id.toString()
      let targetColumnId: number

      if (overId.startsWith('column-')) {
          targetColumnId = Number(overId.replace('column-', ''))
      } else {
          const overTask = effectiveTasks.find((t) => t.id === Number(over.id))
          if (!overTask) return
          targetColumnId = overTask.column.id
      }

      // Zaten doğru column'daysa bir şey yapma (gereksiz re-render'ı önle)
      if (activeTaskData.column.id === targetColumnId) return

      // Task'ı geçici olarak hedef column'a taşı (sadece görsel önizleme için)
      setLocalTasks((current) => {
          const base = current ?? tasks ?? []
          return base.map((t) =>
              t.id === activeId
                  ? { ...t, column: { ...t.column, id: targetColumnId } }
                  : t
          )
      })
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTask(null)
    setIsOverTrash(false)

    if (!over) return

    const activeTaskId = Number(active.id)
    const draggedTask = effectiveTasks.find((t) => t.id === activeTaskId)
    if (!draggedTask) return

    // --- Senaryo 1: Trash-can'e bırakıldı ---
    if (over.id === 'trash-can') {
      handleDropOnTrash(draggedTask)
      return
    }

    // --- Hedef column'u belirle ---
    // over.id ya "column-5" gibi bir column ID'si, ya da başka bir task'ın ID'si olabilir
    const overId = over.id.toString()
    let targetColumnId: number

    if (overId.startsWith('column-')) {
      targetColumnId = Number(overId.replace('column-', ''))
    } else {
      // over bir task ise, o task'ın bulunduğu column'u hedef al
      const overTask = effectiveTasks.find((t) => t.id === Number(over.id))
      if (!overTask) return
      targetColumnId = overTask.column.id
    }

    const sourceColumnId = draggedTask.column.id

    // --- Yeni sıralamayı hesapla (optimistic) ---
    const updated = effectiveTasks.map((t) =>
      t.id === activeTaskId ? { ...t, column: { ...t.column, id: targetColumnId } } : t
    )

    // Hedef column'daki task'ları, sürüklenen task'ın over olduğu pozisyona göre yeniden sırala
    const targetColumnTasks = updated
      .filter((t) => t.column.id === targetColumnId)
      .sort((a, b) => {
        if (a.id === activeTaskId) return 0 // aşağıda düzeltilecek
        return a.position - b.position
      })

    // over bir task'sa, sürüklenen task'ı onun yerine koy
    if (!overId.startsWith('column-')) {
      const overTaskIndex = targetColumnTasks.findIndex((t) => t.id === Number(over.id))
      const activeIndex = targetColumnTasks.findIndex((t) => t.id === activeTaskId)
      if (overTaskIndex !== -1 && activeIndex !== -1) {
        const [moved] = targetColumnTasks.splice(activeIndex, 1)
        targetColumnTasks.splice(overTaskIndex, 0, moved)
      }
    }

    // Local state'i optimistic olarak güncelle
    const newLocalTasks = updated.map((t) => {
      const posInTarget = targetColumnTasks.findIndex((tc) => tc.id === t.id)
      if (posInTarget !== -1 && t.column.id === targetColumnId) {
        return { ...t, position: posInTarget }
      }
      return t
    })
    setLocalTasks(newLocalTasks)

    // --- API'ye gönder ---
    try {
      const payload: { columns: { columnId: number; taskIds: number[] }[] } = {
        columns: [
          {
            columnId: targetColumnId,
            taskIds: targetColumnTasks.map((t) => t.id),
          },
        ],
      }

      // Farklı column'a taşındıysa, kaynak column'un da yeni sırasını gönder
      if (sourceColumnId !== targetColumnId) {
        const sourceColumnTasks = updated
          .filter((t) => t.column.id === sourceColumnId && t.id !== activeTaskId)
          .sort((a, b) => a.position - b.position)

        payload.columns.push({
          columnId: sourceColumnId,
          taskIds: sourceColumnTasks.map((t) => t.id),
        })
      }

      await apiClient.patch('/tasks/reorder', payload)

      // Başarılı: server'dan fresh veri çek, local override'ı temizle
      await queryClient.invalidateQueries({ queryKey: ['tasks', id] })
      setLocalTasks(null)
    } catch (err) {
      // Başarısız: local state'i geri al
      setLocalTasks(null)
      setErrorMessage(
          err instanceof Error ? err.message : 'Görev taşınırken bir hata oluştu.'
      )
    }
  }

  function handleDropOnTrash(task: TaskType) {
      // Optimistic: task'ı hemen ekrandan kaldır
      const withoutTask = effectiveTasks.filter((t) => t.id !== task.id)
      setLocalTasks(withoutTask)

      // 5 saniye sonra gerçek silme işlemini tetikleyecek zamanlayıcı
      const timeoutId = window.setTimeout(() => {
          performActualDelete(task)
      }, 5000)

      setPendingDelete({ task, timeoutId })
  }

  async function performActualDelete(task: TaskType) {
      try {
          await apiClient.delete(`/tasks/${task.id}`)
          await queryClient.invalidateQueries({ queryKey: ['tasks', id] })
          setLocalTasks(null)
      } catch (err) {
          setLocalTasks(null)
          setErrorMessage(
              err instanceof Error ? err.message : 'Görev silinirken bir hata oluştu.'
          )
      }
      setPendingDelete(null)
  }

  function handleUndoDelete() {
      if (!pendingDelete) return

      // Zamanlayıcıyı iptal et — gerçek silme hiç gerçekleşmeyecek
      window.clearTimeout(pendingDelete.timeoutId)

      // Task'ı local state'e geri ekle
      setLocalTasks((current) => {
          const base = current ?? tasks ?? []
          return [...base, pendingDelete.task]
      })

      setPendingDelete(null)
  }

  function handleToastExpire() {
      // UndoToast kendi süresi dolunca bunu çağırıyor —
      // ama gerçek silme zaten kendi setTimeout'unda tetikleniyor,
      // burada sadece toast'ı kapatmamız yeterli (state zaten performActualDelete tarafından temizlenecek)
  }

  const filteredTasks = isAssignedToMeActive
    ? effectiveTasks.filter((task) => 
        task.assignments.some((assignment) => assignment.user.id === user?.id)
      )
      :effectiveTasks
  
  const boardTasks = filteredTasks

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className={styles.pageLayout}>
        <MemberTaskPanel
          members={workspace?.workspaceMembers ?? []}
          boardTasks={boardTasks}
        />

        <div className={styles.centerColumn}>
          <Board>
            {boardColumns?.map((column) => {
              const columnTasks = boardTasks
                .filter((task) => task.column.id === column.id)
                .sort((a, b) => a.position - b.position)
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
                tasks={boardTasks}
            />
        </div>
      </div>

      <TrashCan isVisible={activeTask !== null} isOver={isOverTrash} />

    <DragOverlay>
        {activeTask && (
            <TaskCard
                task={activeTask}
                rotation={(activeTask.id % 5) - 2}
                style={{
                    cursor: 'grabbing',
                    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.35)',
                    transform: `rotate(${(activeTask.id % 5) - 2}deg) scale(1.05)`,
                }}
            />
        )}
    </DragOverlay>

      {pendingDelete && (
        <UndoToast
            message={`"${pendingDelete.task.title}" silindi.`}
            onUndo={handleUndoDelete}
            onExpire={handleToastExpire}
        />
      )}

      {errorMessage && (
        <ErrorToast
          message={errorMessage}
          onDismiss={() => setErrorMessage(null)}
        />
      )}
    </DndContext>
  )
}
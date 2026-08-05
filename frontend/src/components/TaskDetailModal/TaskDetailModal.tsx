import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../AuthContext'
import type { Task as TaskType, 
              Workspace as WorkspaceType, 
              Column as ColumnType, 
              ActivityLog,
              Comment as CommentType 
            } from '../../types/kanban'
import styles from './TaskDetailModal.module.css'

function formatActivityText(log: ActivityLog): string {
  const userName = `${log.user.name} ${log.user.surname}`

  switch (log.actionType) {
    case 'created':
      return `${userName} görevi oluşturdu`
    case 'moved':
      return `${userName} görevi "${log.oldValue}" sütunundan "${log.newValue}" sütununa taşıdı`
    case 'assigned':
      return `${userName}, ${log.newValue} kişisini atadı`
    case 'unassigned':
      return `${userName}, ${log.oldValue} kişisini çıkardı`
    case 'priority_changed':
      return `${userName} önceliği "${log.oldValue}" iken "${log.newValue}" yaptı`
    case 'deleted':
      return `${userName} görevi sildi`
    default:
      return `${userName} bir değişiklik yaptı`
  }
}

interface TaskDetailModalProps {
  task: TaskType
  workspaceId: number
  onClose: () => void
}

export function TaskDetailModal({ task, workspaceId, onClose }: TaskDetailModalProps) {
  const { token, user } = useAuth()
  const queryClient = useQueryClient()

  const [selectedUserId, setSelectedUserId] = useState('')
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'comments'>('details')

  const [newCommentContent, setNewCommentContent] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editingCommentContent, setEditingCommentContent] = useState('')

  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(task.title)
  const [editedDescription, setEditedDescription] = useState(task.description ?? '')
  const [editedPriority, setEditedPriority] = useState(task.priority)
  const [editedDueDate, setEditedDueDate] = useState(task.dueDate ? task.dueDate.slice(0, 10) : '')
  const [editedColumnId, setEditedColumnId] = useState(task.column.id)

  const { data: workspace } = useQuery<WorkspaceType>({
    queryKey: ['workspace', workspaceId],
    queryFn: async () => {
      const response = await fetch(`http://localhost:8000/api/workspaces/${workspaceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return response.json()
    },
  })

  const { data: currentColumn } = useQuery<ColumnType>({
    queryKey: ['column', task.column.id],
    queryFn: async () => {
      const response = await fetch(`http://localhost:8000/api/columns/${task.column.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return response.json()
    },
  })

  const { data: allColumns } = useQuery<ColumnType[]>({
    queryKey: ['columns'],
    enabled: !!currentColumn,
    queryFn: async () => {
      const response = await fetch('http://localhost:8000/api/columns', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return response.json()
    },
  })

  const columnsInSameBoard = allColumns?.filter((c) => c.board.id === currentColumn?.board.id) ?? []

  const addAssigneeMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`http://localhost:8000/api/tasks/${task.id}/assignees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      })
      if (!response.ok) throw new Error('Assignee eklenemedi')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setSelectedUserId('')
    },
  })

  const removeAssigneeMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`http://localhost:8000/api/tasks/${task.id}/assignees/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Assignee çıkarılamadı')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const { data: activityLogs, isLoading: isActivityLoading } = useQuery<ActivityLog[]>({
    queryKey: ['task-activity', task.id],
    enabled: activeTab === 'history',
    queryFn: async () => {
      const response = await fetch(`http://localhost:8000/api/tasks/${task.id}/activity`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Geçmiş yüklenemedi')
      return response.json()
    },
  })

  const { data: comments, isLoading: isCommentsLoading } = useQuery<CommentType[]>({
    queryKey: ['task-comments', task.id],
    enabled: activeTab === 'comments',
    queryFn: async () => {
      const response = await fetch(`http://localhost:8000/api/tasks/${task.id}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Yorumlar yüklenemedi')
      return response.json()
    },
  })

  const currentMembership = workspace?.workspaceMembers.find((m) => m.user.id === user?.id)
  const canModerateComments = currentMembership?.role === 'owner' || currentMembership?.role === 'pm'

  const addCommentMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`http://localhost:8000/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newCommentContent }),
      })
      if (!response.ok) throw new Error('Yorum eklenemedi')
      return response.json()
    },
    onSuccess: () => {
      setNewCommentContent('')
      queryClient.invalidateQueries({ queryKey: ['task-comments', task.id] })
      queryClient.invalidateQueries({ queryKey: ['task-activity', task.id] })
    },
  })

  const editCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const response = await fetch(`http://localhost:8000/api/tasks/${task.id}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: editingCommentContent }),
      })
      if (!response.ok) throw new Error('Yorum güncellenemedi')
      return response.json()
    },
    onSuccess: () => {
      setEditingCommentId(null)
      setEditingCommentContent('')
      queryClient.invalidateQueries({ queryKey: ['task-comments', task.id] })
    },
  })

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const response = await fetch(`http://localhost:8000/api/tasks/${task.id}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Yorum silinemedi')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', task.id] })
      queryClient.invalidateQueries({ queryKey: ['task-activity', task.id] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`http://localhost:8000/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editedTitle,
          description: editedDescription || null,
          priority: editedPriority,
          dueDate: editedDueDate || null,
          columnId: editedColumnId,
        }),
      })
      if (!response.ok) throw new Error('Task güncellenemedi')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setIsEditing(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`http://localhost:8000/api/tasks/${task.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Task silinemedi')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      onClose()
    },
  })

  const handleDelete = () => {
    if (window.confirm(`"${task.title}" görevini silmek istediğine emin misin?`)) {
      deleteMutation.mutate()
    }
  }

  const assignedUserIds = task.assignments.map((a) => a.user.id)
  const availableMembers = workspace?.workspaceMembers.filter(
    (member) => !assignedUserIds.includes(member.user.id)
  ) ?? []

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className={`${styles.overlay} animate-fade-in`} onClick={onClose}>
      <div className={`${styles.modal} animate-pop-in`} style={{ backgroundColor: task.color }} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>

        <div className={styles.tabRow}>
          <button
            className={activeTab === 'details' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('details')}
          >
            Detaylar
          </button>
          <button
            className={activeTab === 'history' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('history')}
          >
            Geçmiş
          </button>
          <button
            className={activeTab === 'comments' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('comments')}
          >
            Yorumlar
          </button>
        </div>

        {activeTab === 'details' && (
          <>
            {isEditing ? (
              <div className={styles.editForm}>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className={styles.editInput}
                  placeholder="Başlık"
                  autoFocus
                />
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className={styles.editTextarea}
                  placeholder="Açıklama"
                  rows={3}
                />
                <select
                  value={editedPriority}
                  onChange={(e) => setEditedPriority(e.target.value)}
                  className={styles.select}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>

                <label className={styles.fieldLabel}>Bitiş tarihi</label>
                <input
                  type="date"
                  value={editedDueDate}
                  min={today}
                  onChange={(e) => setEditedDueDate(e.target.value)}
                  className={styles.editInput}
                />

                <label className={styles.fieldLabel}>Column</label>
                <select
                  value={editedColumnId}
                  onChange={(e) => setEditedColumnId(Number(e.target.value))}
                  className={styles.select}
                >
                  {columnsInSameBoard.map((col) => (
                    <option key={col.id} value={col.id}>{col.name}</option>
                  ))}
                </select>

                <div className={styles.editActions}>
                  <button
                    onClick={() => updateMutation.mutate()}
                    disabled={!editedTitle.trim() || updateMutation.isPending}
                    className={styles.addButton}
                  >
                    Kaydet
                  </button>
                  <button onClick={() => setIsEditing(false)} className={styles.cancelButton} disabled={updateMutation.isPending}>
                    İptal
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className={styles.title}>{task.title}</h2>

                {task.description && <p className={styles.description}>{task.description}</p>}

                <div className={styles.metaRow}>
                  <span className={styles.metaItem}>Öncelik: {task.priority}</span>
                  {task.dueDate && (
                    <span className={styles.metaItem}>
                      Bitiş: {new Date(task.dueDate).toLocaleDateString('tr-TR')}
                    </span>
                  )}
                  {currentColumn && (
                    <span className={styles.metaItem}>Column: {currentColumn.name}</span>
                  )}
                </div>

                <div className={styles.taskActions}>
                  <button className={styles.editTaskButton} onClick={() => {
                    setEditedTitle(task.title)
                    setEditedDescription(task.description ?? '')
                    setEditedPriority(task.priority)
                    setEditedDueDate(task.dueDate ? task.dueDate.slice(0, 10) : '')
                    setEditedColumnId(task.column.id)
                    setIsEditing(true)
                  }}>
                    Düzenle
                  </button>
                  <button className={styles.deleteTaskButton} onClick={handleDelete} disabled={deleteMutation.isPending}>
                    Görevi Sil
                  </button>
                </div>
              </>
            )}

            <h3 className={styles.sectionTitle}>Atanan Kişiler</h3>
            <div className={styles.assigneeList}>
              {task.assignments.length === 0 && <p className={styles.emptyText}>Henüz kimse atanmadı.</p>}
              {task.assignments.map((assignment) => (
                <div key={assignment.id} className={styles.assigneeRow}>
                  <span>{assignment.user.name} {assignment.user.surname}</span>
                  <button
                    className={styles.removeButton}
                    onClick={() => removeAssigneeMutation.mutate(assignment.user.id)}
                    disabled={removeAssigneeMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
                  >
                    Çıkar
                  </button>
                </div>
              ))}
            </div>

            {availableMembers.length > 0 && (
              <div className={styles.addAssigneeRow}>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className={styles.select}
                >
                  <option value="">Kişi seç...</option>
                  {availableMembers.map((member) => (
                    <option key={member.user.id} value={member.user.id}>
                      {member.user.name} {member.user.surname} ({member.role})
                    </option>
                  ))}
                </select>
                <button
                  className={styles.addButton}
                  disabled={!selectedUserId || addAssigneeMutation.isPending}
                  onClick={() => addAssigneeMutation.mutate(Number(selectedUserId))}
                >
                  Ekle
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === 'history' && (
          <div className={styles.historyList}>
            {isActivityLoading && <p className={styles.emptyText}>Yükleniyor...</p>}
            {!isActivityLoading && activityLogs?.length === 0 && (
              <p className={styles.emptyText}>Henüz aktivite yok.</p>
            )}
            {activityLogs?.map((log) => (
              <div key={log.id} className={styles.historyItem}>
                <span className={styles.historyText}>{formatActivityText(log)}</span>
                <span className={styles.historyDate}>
                  {new Date(log.createdAt).toLocaleString('tr-TR')}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'comments' && (
          <div className={styles.commentsSection}>
            <div className={styles.commentList}>
              {isCommentsLoading && <p className={styles.emptyText}>Yükleniyor...</p>}
              {!isCommentsLoading && comments?.length === 0 && (
                <p className={styles.emptyText}>Henüz yorum yok.</p>
              )}
              {comments?.map((comment) => {
                const isAuthor = comment.author.id === user?.id
                const canDelete = isAuthor || canModerateComments

                return (
                  <div key={comment.id} className={styles.commentItem}>
                    {editingCommentId === comment.id ? (
                      <div className={styles.commentEditForm}>
                        <textarea
                          value={editingCommentContent}
                          onChange={(e) => setEditingCommentContent(e.target.value)}
                          className={styles.editTextarea}
                          rows={2}
                          autoFocus
                        />
                        <div className={styles.editActions}>
                          <button
                            className={styles.addButton}
                            disabled={!editingCommentContent.trim() || editCommentMutation.isPending}
                            onClick={() => editCommentMutation.mutate(comment.id)}
                          >
                            Kaydet
                          </button>
                          <button
                            className={styles.cancelButton}
                            onClick={() => {
                              setEditingCommentId(null)
                              setEditingCommentContent('')
                            }}
                            disabled={editCommentMutation.isPending}
                          >
                            İptal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className={styles.commentHeader}>
                          <span className={styles.commentAuthor}>
                            {comment.author.name} {comment.author.surname}
                          </span>
                          <span className={styles.historyDate}>
                            {new Date(comment.createdAt).toLocaleString('tr-TR')}
                            {comment.editedAt && ' (düzenlendi)'}
                          </span>
                        </div>
                        <p className={styles.commentContent}>{comment.content}</p>
                        <div className={styles.commentActions}>
                          {isAuthor && (
                            <button
                              className={styles.commentActionButton}
                              onClick={() => {
                                setEditingCommentId(comment.id)
                                setEditingCommentContent(comment.content)
                              }}
                            >
                              Düzenle
                            </button>
                          )}
                          {canDelete && (
                            <button
                              className={styles.commentActionButton}
                              onClick={() => deleteCommentMutation.mutate(comment.id)}
                              disabled={deleteCommentMutation.isPending}
                            >
                              Sil
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>

            <div className={styles.addCommentRow}>
              <textarea
                value={newCommentContent}
                onChange={(e) => setNewCommentContent(e.target.value)}
                className={styles.editTextarea}
                placeholder="Yorum yaz..."
                rows={2}
              />
              <button
                className={styles.addButton}
                disabled={!newCommentContent.trim() || addCommentMutation.isPending}
                onClick={() => addCommentMutation.mutate()}
              >
                Gönder
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
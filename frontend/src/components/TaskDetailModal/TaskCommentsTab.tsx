import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../lib/apiClient'
import { useAuth } from '../../AuthContext'
import type { Comment as CommentType, Workspace as WorkspaceType } from '../../types/kanban'
import styles from './TaskDetailModal.module.css'

interface TaskCommentsTabProps {
  taskId: number
  workspaceId: number
}

export function TaskCommentsTab({ taskId, workspaceId }: TaskCommentsTabProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [newCommentContent, setNewCommentContent] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editingCommentContent, setEditingCommentContent] = useState('')

  const { data: comments, isLoading } = useQuery<CommentType[]>({
    queryKey: ['task-comments', taskId],
    queryFn: () => apiClient.get<CommentType[]>(`/tasks/${taskId}/comments`),
  })

  const { data: workspace } = useQuery<WorkspaceType>({
    queryKey: ['workspace', workspaceId],
    queryFn: () => apiClient.get<WorkspaceType>(`/workspaces/${workspaceId}`),
  })

  const currentMembership = workspace?.workspaceMembers.find((m) => m.user.id === user?.id)
  const canModerateComments = currentMembership?.role === 'owner' || currentMembership?.role === 'pm'

  const addCommentMutation = useMutation({
    mutationFn: () => apiClient.post(`/tasks/${taskId}/comments`, { content: newCommentContent }),
    onSuccess: () => {
      setNewCommentContent('')
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] })
      queryClient.invalidateQueries({ queryKey: ['task-activity', taskId] })
    },
  })

  const editCommentMutation = useMutation({
    mutationFn: (commentId: number) =>
      apiClient.put(`/tasks/${taskId}/comments/${commentId}`, { content: editingCommentContent }),
    onSuccess: () => {
      setEditingCommentId(null)
      setEditingCommentContent('')
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] })
    },
  })

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) => apiClient.delete(`/tasks/${taskId}/comments/${commentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] })
      queryClient.invalidateQueries({ queryKey: ['task-activity', taskId] })
    },
  })

  return (
    <div className={styles.commentsSection}>
      <div className={styles.commentList}>
        {isLoading && <p className={styles.emptyText}>Yükleniyor...</p>}
        {!isLoading && comments?.length === 0 && (
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
  )
}
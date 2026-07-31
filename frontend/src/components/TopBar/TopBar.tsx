import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../AuthContext'
import type { Board as BoardType } from '../../types/kanban'
import styles from './TopBar.module.css'
import { SideMenu } from '../SideMenu/SideMenu'
import { BoardSelectorModal } from '../BoardSelectorModal/BoardSelectorModal'

export function TopBar() {
  const { user, token, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isBoardSelectorOpen, setIsBoardSelectorOpen] = useState(false)
  const location = useLocation()

  const workspaceMatch = location.pathname.match(/^\/workspaces\/(\d+)/)
  const workspaceIdFromUrl = workspaceMatch ? Number(workspaceMatch[1]) : null

  const projectMatch = location.pathname.match(/^\/projects\/(\d+)/)
  const projectIdFromUrl = projectMatch ? Number(projectMatch[1]) : null

  const boardMatch = location.pathname.match(/^\/boards\/(\d+)/)
  const boardIdFromUrl = boardMatch ? Number(boardMatch[1]) : null

  const { data: workspace } = useQuery<{ name: string }>({
    queryKey: ['breadcrumb-workspace', workspaceIdFromUrl],
    enabled: workspaceIdFromUrl !== null,
    queryFn: async () => {
      const response = await fetch(`http://localhost:8000/api/workspaces/${workspaceIdFromUrl}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return response.json()
    },
  })

  const { data: project } = useQuery<{ name: string; workspace: { id: number; name: string } }>({
    queryKey: ['breadcrumb-project', projectIdFromUrl],
    enabled: projectIdFromUrl !== null,
    queryFn: async () => {
      const response = await fetch(`http://localhost:8000/api/projects/${projectIdFromUrl}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return response.json()
    },
  })

  const { data: board } = useQuery<BoardType>({
    queryKey: ['breadcrumb-board', boardIdFromUrl],
    enabled: boardIdFromUrl !== null,
    queryFn: async () => {
      const response = await fetch(`http://localhost:8000/api/boards/${boardIdFromUrl}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return response.json()
    },
  })

  const { data: workspaceForPermission } = useQuery<{ workspaceMembers: { user: { id: number }; role: string }[] }>({
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

  const myMembership = workspaceForPermission?.workspaceMembers.find((m) => m.user.id === user?.id)
  const canManageBoards = myMembership?.role === 'owner' || myMembership?.role === 'pm'

  return (
    <>
      <div className={styles.topBar}>
        <button className={styles.hamburger} onClick={() => setIsMenuOpen(!isMenuOpen)}>
          ☰
        </button>

        {board && (
          <button className={styles.boardSelectorButton} onClick={() => setIsBoardSelectorOpen(true)} title="Board'lar">
            ⊞
          </button>
        )}

        <div className={styles.breadcrumb}>
          {workspace && (
            <Link to={`/workspaces/${workspaceIdFromUrl}`} className={styles.breadcrumbLink}>
              {workspace.name}
            </Link>
          )}

          {project && (
            <>
              <Link to={`/workspaces/${project.workspace.id}`} className={styles.breadcrumbLink}>
                {project.workspace.name}
              </Link>
              <span className={styles.separator}>›</span>
              <Link to={`/projects/${projectIdFromUrl}`} className={styles.breadcrumbLink}>
                {project.name}
              </Link>
            </>
          )}

          {board && (
            <>
              <Link to={`/workspaces/${board.project.workspace.id}`} className={styles.breadcrumbLink}>
                {board.project.workspace.name}
              </Link>
              <span className={styles.separator}>›</span>
              <Link to={`/projects/${board.project.id}`} className={styles.breadcrumbLink}>
                {board.project.name}
              </Link>
              <span className={styles.separator}>›</span>
              <Link to={`/boards/${boardIdFromUrl}`} className={styles.breadcrumbLink}>
                {board.name}
              </Link>
            </>
          )}
        </div>

        <div className={styles.userSection}>
          {user && <span className={styles.userName}>{user.name} {user.surname}</span>}
          <button className={styles.logoutButton} onClick={logout}>Çıkış</button>
        </div>
      </div>

      {isMenuOpen && <SideMenu onClose={() => setIsMenuOpen(false)} />}

      {isBoardSelectorOpen && board && (
        <BoardSelectorModal
          projectId={board.project.id}
          canManage={canManageBoards}
          onClose={() => setIsBoardSelectorOpen(false)}
        />
      )}
    </>
  )
}
export interface User {
  id: number
  email: string
  name: string
  surname: string
}

export interface TaskAssignment {
  id: number
  user: User
}

export interface Task {
  id: number
  title: string
  description: string | null
  priority: string
  color: string
  dueDate: string | null
  dueDateStatus: 'overdue' | 'soon' | null
  createdAt: string
  position: number
  column: {
    id: number
  }
  assignments: TaskAssignment[]
}

export interface Column {
  id: number
  name: string
  position: number
  board: {
    id: number
  }
}

export interface Board {
  id: number
  name: string
  project: {
    id: number
    name: string
    description: string | null
    workspace: {
      id: number
      name: string
    }
  }
}

export interface WorkspaceMember {
  id: number
  user: User
  role: string
}

export interface Workspace {
  id: number
  name: string
  workspaceMembers: WorkspaceMember[]
}

export interface ActivityLog {
  id: number
  actionType: 'created' | 'moved' | 'assigned' | 'unassigned' | 'priority_changed' | 'deleted'
  user: User
  oldValue: string | null
  newValue: string | null
  createdAt: string
}

export interface Comment {
  id: number
  content: string
  author: User
  createdAt: string
  editedAt: string | null
}

export interface Notification {
  id: number
  type: 'task_assigned' | 'due_date_approaching' | 'due_date_overdue'
  taskTitleSnapshot: string | null
  isRead: boolean
  createdAt: string
  task: {
    id: number
    column: {
      id: number
      board: {
        id: number
      }
    }
  } | null
}

export interface Project {
  id: number
  name: string
  description: string | null
  workspace: {
    id: number
    name: string
  }
}

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


export interface Task {
  id: number
  title: string
  priority: string
  column: {
    id: number
  }
}

export interface Column {
  id: number
  name: string
  position: number
  board: {
    id: number
  }
}
import type { Column as ColumnType, Task as TaskType } from '../../types/kanban'
import { Task } from '../Task/Task'
import { AddTaskCard } from '../AddTaskCard/AddTaskCard'
import styles from './Column.module.css'

interface ColumnProps {
  column: ColumnType
  tasks: TaskType[]
}

export function Column({ column, tasks }: ColumnProps) {
  return (
    <div className={styles.paper}>
      <div className={styles.pin} />
      <h3 className={styles.title}>{column.name}</h3>
      <div className={styles.taskList}>
        {tasks.map((task) => (
          <Task key={task.id} task={task} />
        ))}
        <AddTaskCard columnId={column.id} nextPosition={tasks.length}/>
      </div>
    </div>
  )
}
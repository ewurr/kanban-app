import styles from './MemberTaskPanel.module.css'
import type { Task as TaskType } from '../../types/kanban'

interface Member {
  id: number
  user: { id: number; name: string; surname: string; email: string }
  role: string
}

interface MemberTaskPanelProps {
  members: Member[]
  boardTasks: TaskType[]
}

export function MemberTaskPanel({ members, boardTasks }: MemberTaskPanelProps) {
  const sortedMembers = members.slice().sort((a, b) => {
    const nameA = `${a.user.name} ${a.user.surname}`.toLowerCase()
    const nameB = `${b.user.name} ${b.user.surname}`.toLowerCase()
    return nameA.localeCompare(nameB, 'tr')
  })

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>Görevliler</h3>
      <div className={styles.memberList}>
        {sortedMembers.map((member) => {
          const taskCount = boardTasks.filter((task) =>
            task.assignments.some((a) => a.user.id === member.user.id)
          ).length

          const hasNoTasks = taskCount === 0

          return (
            <div
                key={member.id}
                className={`${styles.memberRow} ${hasNoTasks ? styles.memberRowEmpty : ''}`}
            >
                <div className={styles.memberInfo}>
                    <span className={styles.memberName}>
                        {member.user.name} {member.user.surname}
                    </span>
                    <span className={styles.memberEmail}>{member.user.email}</span>
                </div>
                <span className={styles.taskCount}>{taskCount}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
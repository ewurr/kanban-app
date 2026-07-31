import { useAuth } from '../../AuthContext'
import type { Task as TaskType } from '../../types/kanban'
import styles from './MemberTaskPanel.module.css'

interface Member {
    id: number
    user: { id: number; name: string, surname: string }
    role: string
}

interface MemberTaskPanelProps {
    members: Member[]
    boardTasks: TaskType[]
}

export function MemberTaskPanel ({ members, boardTasks }: MemberTaskPanelProps){
    return(
        <div className={styles.panel}>
            <h3 className={styles.title}>Görevliler</h3>
            <div className={styles.memberList}>
                {members.map((member) => {
                    const taskCount = boardTasks.filter((task) => 
                    task.assignments.some((a) => a.user.id === member.user.id)
                ).length

                return(
                    <div key={member.id} className={styles.memberRow}>
                        <span className={styles.memberName}>
                            {member.user.name} {member.user.surname}
                        </span>
                        <span className={styles.taskCount}>{taskCount}</span>
                    </div>
                )
                })}
            </div>
        </div>
    )
}
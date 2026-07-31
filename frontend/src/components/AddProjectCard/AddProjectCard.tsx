import { useState } from "react";
import { AddProjectModal } from "../AddProjectModal/AddProjectModal";
import styles from './AddProjectCard.module.css'

interface AddProjectCardProps {
    workspaceId: number
}

export function AddProjectCard({ workspaceId }: AddProjectCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    return (
        <>
            <button className={styles.folder} onClick={() => setIsModalOpen(true)}>
                <div className={styles.tab} />
                <div className={styles.body}>
                    <span className={styles.plus}>+</span>
                </div>
            </button>

            {isModalOpen && (
                <AddProjectModal
                    workspaceId={workspaceId}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </>
    )
}
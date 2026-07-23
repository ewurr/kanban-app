import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../AuthContext";
import styles from './AddTaskCard.module.css'

interface AddTaskCardProps {
    columnId: number
    nextPosition: number
}

export function AddTaskCard({ columnId, nextPosition }: AddTaskCardProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [priority, setPriority] = useState('medium')
    const [dueDate, setDueDate] = useState('')
    const { token } = useAuth()
    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: async () => {
            const response = await fetch ('http://localhost:8000/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    columnId,
                    title,
                    description: description || null,
                    priority,
                    position: nextPosition,
                    dueDate: dueDate || null,
                }),
            })

            if(!response.ok) throw new Error('Task can not create')
                return response.json()
        },

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] })
            setTitle('')
            setDescription('')
            setPriority('medium')
            setDueDate('')
            setIsOpen(false)

        },
    })

    if (!isOpen) {
        return (
            <button className={styles.closedCard} onClick={() => setIsOpen(true)}>
                <span className={styles.plus}>+</span>
                <span>Add Task</span>
            </button>
        )
    }

    return (
        <div className={styles.openCard}>
            <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Header"
            className={styles.input}
            autoFocus
            />

            <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (Optional)"
            className={styles.textarea}
            rows={2}
            />

            <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className={styles.select}
            >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
            </select>

            <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={styles.input}
            />

            <div className={styles.action}>
                <button
                onClick={() => mutation.mutate()}
                disabled={!title.trim() || mutation.isPending}
                className={styles.saveButton}
                >
                    {mutation.isPending ? 'Save...' : 'Save'}
                </button>

                <button onClick={() => setIsOpen(false)} className={styles.cancelButton}>
                    Cancel
                </button>
            </div>
        </div>
    )

}
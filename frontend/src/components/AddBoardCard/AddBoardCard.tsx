import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../AuthContext";
import styles from './AddBoardCard.module.css'

interface AddBoardCardProps{
    projectId: number
}

export function AddBoardCard({ projectId }: AddBoardCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const { token } = useAuth()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('http://localhost:8000/api/boards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ projectId, name }),
      })
      if (!response.ok) throw new Error('Board oluşturulamadı')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] })
      setName('')
      setIsOpen(false)
    },
})

    if(!isOpen) {
        return (
            <button className={styles.closedBoard} onClick={() => setIsOpen(true)}>
                <span className={styles.plus}>+</span>
                <span>Add Board</span>
            </button>
        )
    }

  return (
    <div className={styles.openBoard}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Board adı"
        className={styles.input}
        autoFocus
      />
      <div className={styles.actions}>
        <button
          onClick={() => mutation.mutate()}
          disabled={!name.trim() || mutation.isPending}
          className={styles.saveButton}
        >
          {mutation.isPending ? 'Saving...' : 'Save'}
        </button>
        <button onClick={() => setIsOpen(false)} className={styles.cancelButton}>
          Cancel
        </button>
      </div>
    </div>
  )

}



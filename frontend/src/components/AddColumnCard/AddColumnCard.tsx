import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../AuthContext'
import styles from './AddColumnCard.module.css'

interface AddColumnCardProps {
  boardId: number
  nextPosition: number
}

export function AddColumnCard({ boardId, nextPosition }: AddColumnCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const { token } = useAuth()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('http://localhost:8000/api/columns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          boardId,
          name,
          position: nextPosition,
        }),
      })
      if (!response.ok) throw new Error('Column oluşturulamadı')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['columns'] })
      setName('')
      setIsOpen(false)
    },
  })

  if (!isOpen) {
    return (
      <button className={styles.closedCard} onClick={() => setIsOpen(true)}>
        <span className={styles.plus}>+</span>
        <span>Column ekle</span>
      </button>
    )
  }

  return (
    <div className={styles.openCard}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Column adı"
        className={styles.input}
        autoFocus
      />
      <div className={styles.actions}>
        <button
          onClick={() => mutation.mutate()}
          disabled={!name.trim() || mutation.isPending}
          className={styles.saveButton}
        >
          {mutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
        <button onClick={() => setIsOpen(false)} className={styles.cancelButton}>
          İptal
        </button>
      </div>
    </div>
  )
}
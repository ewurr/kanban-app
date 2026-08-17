import { useEffect } from 'react'
import styles from './ErrorToast.module.css'

interface ErrorToastProps {
  message: string
  onDismiss: () => void
  durationMs?: number
}

export function ErrorToast({ message, onDismiss, durationMs = 4000 }: ErrorToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss()
    }, durationMs)

    return () => clearTimeout(timer)
  }, [onDismiss, durationMs])

  return (
    <div className={styles.toast}>
      <span className={styles.icon}>⚠️</span>
      <span className={styles.message}>{message}</span>
      <button className={styles.closeButton} onClick={onDismiss} aria-label="Kapat">
        ×
      </button>
    </div>
  )
}
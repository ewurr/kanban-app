import { useEffect, useRef, useState } from 'react'
import styles from './UndoToast.module.css'

interface UndoToastProps {
  message: string
  onUndo: () => void
  onExpire: () => void
  durationMs?: number
}

export function UndoToast({ message, onUndo, onExpire, durationMs = 5000 }: UndoToastProps) {
  const [progress, setProgress] = useState(100) // yüzde olarak kalan süre
  const startTimeRef = useRef(Date.now())
  const rafRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const expireTimer = setTimeout(() => {
      onExpire()
    }, durationMs)

    // Progress bar'ı her frame'de güncelle (requestAnimationFrame ile pürüzsüz animasyon)
    function tick() {
      const elapsed = Date.now() - startTimeRef.current
      const remaining = Math.max(0, 100 - (elapsed / durationMs) * 100)
      setProgress(remaining)

      if (elapsed < durationMs) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      clearTimeout(expireTimer)
      if (rafRef.current !== undefined) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [onExpire, durationMs])

  const secondsLeft = Math.ceil((progress / 100) * (durationMs / 1000))

  return (
    <div className={styles.toast}>
      <div className={styles.content}>
        <span className={styles.icon}>🗑️</span>
        <span className={styles.message}>{message}</span>
        <button className={styles.undoButton} onClick={onUndo}>
          Geri Al
        </button>
        <span className={styles.seconds}>{secondsLeft}s</span>
      </div>
      <div className={styles.progressTrack}>
        <div
          className={styles.progressBar}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
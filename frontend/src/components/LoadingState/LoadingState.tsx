import styles from './LoadingState.module.css'

interface LoadingStateProps {
  message?: string
}

export function LoadingState({ message = 'Yükleniyor...' }: LoadingStateProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.icon}>
        <span className={styles.emoji}>📋</span>
      </div>
      <p className={styles.text}>{message}</p>
    </div>
  )
}
import styles from './ErrorMessage.module.css'

interface ErrorMessageProps {
  message: string
  variant?: 'dark' | 'light'
}

export function ErrorMessage({ message, variant = 'dark' }: ErrorMessageProps) {
  return (
    <div className={variant === 'dark' ? styles.errorDark : styles.errorLight}>
      <span className={styles.icon}>⚠️</span>
      <span className={styles.text}>{message}</span>
    </div>
  )
}
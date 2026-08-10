import styles from './RoleToggle.module.css'

interface RoleToggleProps {
  value: 'worker' | 'pm'
  onChange: (newRole: 'worker' | 'pm') => void
  disabled?: boolean
}

export function RoleToggle({ value, onChange, disabled = false }: RoleToggleProps) {
  const isPm = value === 'pm'

  const handleClick = () => {
    if (disabled) return
    onChange(isPm ? 'worker' : 'pm')
  }

  return (
    <div className={styles.wrapper}>
      <span className={isPm ? styles.labelInactive : styles.labelActive}>Worker</span>
      <button
        type="button"
        className={isPm ? styles.trackPm : styles.trackWorker}
        onClick={handleClick}
        disabled={disabled}
        aria-label={isPm ? 'PM rolünden Worker rolüne geçir' : 'Worker rolünden PM rolüne geçir'}
      >
        <span className={styles.thumb} />
      </button>
      <span className={isPm ? styles.labelActive : styles.labelInactive}>PM</span>
    </div>
  )
}
import { Link } from 'react-router-dom'
import styles from './NotFoundPage.module.css'

export function NotFoundPage() {
    return (
        <div className={styles.wrapper}>
            <div className={styles.badge}>
                <h1 className={styles.code}>404</h1>
            </div>
            <p className={styles.message}>Bu post-it kayıp görünüyor.</p>
            <Link to="/" className={styles.homeLink}>
                Ana Sayfaya Dön
            </Link>
        </div>
    )
}
import { Link } from "react-router-dom";
import styles from './BoardCard.module.css'

interface BoardCardProps{
    id: number
    name: string
}

export function BoardCard({id, name}: BoardCardProps){
    return(
        <Link to={`/boards/${id}`} className={styles.miniBoard}>
            <div className={styles.miniPostIt} style={{ backgroundColor: '#FFD93D' }} />
            <div className={styles.miniPostIt} style={{ backgroundColor: '#FF9B9B' }} />
            <div className={styles.miniPostIt} style={{ backgroundColor: '#A8E6CF' }} />
            <span className={styles.name}>{name}</span>
        </Link>
    )
}
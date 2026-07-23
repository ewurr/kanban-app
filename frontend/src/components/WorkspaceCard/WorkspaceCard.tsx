import { Link } from "react-router-dom";
import styles from './WorkspaceCard.module.css'

interface WorkspaceCardProps {
    id: number
    name: string
    ownerEmail: string
}

const CARD_COLORS = ['#6C63FF', '#FF6B6B', '#4ECDC4', '#FFB6E1', '#FFD93D']

export function WorkspaceCard({ id, name, ownerEmail }: WorkspaceCardProps) {
    const color = CARD_COLORS[id % CARD_COLORS.length]

    return(
        <Link to={`/workspaces/${id}`} className={styles.card}>
            <div className={styles.stripe} style={{ backgroundColor: color }} />
            <div className={styles.body}>
                <h3 className={styles.name}>{name}</h3>
                <p className={styles.owner}>Owner: {ownerEmail}</p>
            </div>
        </Link>
    )
}
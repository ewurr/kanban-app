import { Link } from "react-router-dom";
import styles from './ProjectCard.module.css'

interface ProjectCardProps {
    id: number
    name: string
    description: string | null
}

export function ProjectCard({ id, name, description }: ProjectCardProps) {

    return(
        <Link to={`/projects/${id}`} className={styles.folder}>
            <div className={styles.tab} />
            <div className={styles.body}>
                <h3 className={styles.name}>{name}</h3>
                {description && <p className={styles.description}>{description}</p>}
            </div>
        </Link>
    )
}
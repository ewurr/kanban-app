import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from './LoginPage.module.css'
import { useAuth } from "../AuthContext";

export function RegisterPage(){
    const[email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [name, setName] = useState('')
    const [surname, setSurname] = useState('')
    const navigate = useNavigate()
    const { login } = useAuth()

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setError(null)

        try {
            const response = await fetch ('http://localhost:8000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name, surname }),
            })

            const data = await response.json()

            if(!response.ok) {
                throw new Error(data.error ?? 'An error occurred during registration.')
            }
            
            login(data.token, data.user)
            navigate('/')
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message)
            }
        }
    }

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <div className={styles.logo}>K</div>
                <h1 className={styles.title}>Aramıza Katıl</h1>
                <p className={styles.subtitle}>Panoları oluşturmaya başla</p>

                <form onSubmit={handleSubmit}>
                    <div className={styles.field}>
                        <label className={styles.label}>Email</label>
                        <input
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Password</label>
                        <input
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Name</label>
                        <input  
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Surname</label>
                        <input  
                            type="text"
                            value={surname}
                            onChange={(e) => setSurname(e.target.value)}
                            className={styles.input}
                        />
                    </div>

                    {error && <p className={styles.error}>{error}</p>}

                    <button type="submit" className={styles.submitButton}>
                        Kayıt Ol
                    </button>
                </form>
                
                <p className={styles.subtitle} style={{ marginTop: '20px', marginBottom: 0 }}>
                    Zaten hesabın var mı? <Link to="/login">Giriş yap</Link>
                </p>
            </div>
        </div>
    )
}
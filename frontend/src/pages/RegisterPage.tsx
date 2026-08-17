import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from './RegisterPage.module.css'
import { useAuth } from "../AuthContext";
import { apiClient } from "../lib/apiClient";
import { ErrorMessage } from "../components/ErrorMessage/ErrorMessage";

export function RegisterPage(){
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [name, setName] = useState('')
    const [surname, setSurname] = useState('')
    const navigate = useNavigate()
    const { login } = useAuth()

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setError(null)

        try {
            const data = await apiClient.post<{ token: string; user: { id: number; email: string; name: string; surname: string } }>(
                '/register',
                { email, password, name, surname }
            )

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
            <div className={styles.visualPanel}>
                <div className={styles.shape1} />
                <div className={styles.shape2} />
                <div className={styles.shape3} />
                <div className={styles.visualContent}>
                    <h2 className={styles.visualTitle}>Ekibinle birlikte<br />büyümeye başla.</h2>
                    <p className={styles.visualText}>Saniyeler içinde bir workspace oluştur, projelerini organize et.</p>
                </div>
            </div>

            <div className={styles.formPanel}>
                <div className={styles.card}>
                    <div className={styles.logo}>K</div>
                    <h1 className={styles.title}>Aramıza Katıl</h1>
                    <p className={styles.subtitle}>Panoları oluşturmaya başla</p>

                    <form onSubmit={handleSubmit}>
                        <div className={styles.field}>
                            <label className={styles.label}>E-posta</label>
                            <input
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={styles.input}
                                autoFocus
                            />
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>Şifre</label>
                            <div className={styles.passwordWrapper}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={styles.input}
                                />
                                <button
                                    type="button"
                                    className={styles.togglePasswordButton}
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? '🙈' : '👁'}
                                </button>
                            </div>
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>İsim</label>
                            <input  
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>Soyad</label>
                            <input  
                                type="text"
                                value={surname}
                                onChange={(e) => setSurname(e.target.value)}
                                className={styles.input}
                            />
                        </div>

                        {error && <ErrorMessage message={error}/>}

                        <button type="submit" className={styles.submitButton}>
                            Kayıt Ol
                        </button>
                    </form>
                    
                    <p className={styles.subtitle} style={{ marginTop: '20px', marginBottom: 0 }}>
                        Zaten hesabın var mı? <Link to="/login">Giriş yap</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
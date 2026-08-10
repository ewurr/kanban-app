import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import styles from './LoginPage.module.css'
import { apiClient } from '../lib/apiClient'
import type { User } from '../AuthContext'
import { ErrorMessage } from '../components/ErrorMessage/ErrorMessage'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    try {
      const data = await apiClient.post<{ token: string}> ('/login_check', { email, password })

      // login() henüz çağrılmadı, bu yüzden token'ı localStorage'a burada elle yazıyoruz —
      // apiClient bir sonraki çağrıda (`/me`) bu token'ı okuyabilsin diye.

      localStorage.setItem('token', data.token)
      const user = await apiClient.get<User>('/me')    

      login(data.token, user)
      navigate('/')
      
    } catch (err) {
        setError('Email veya şifre hatalı')
    }
  }

  return (
    <div className={styles.page}>
      <div className={`${styles.formPanel} ${isVisible ? styles.visible : ''}`}>
        <div className={styles.card}>
          <div className={styles.logo}>K</div>
          <h1 className={styles.title}>Hoş Geldin</h1>
          <p className={styles.subtitle}>Panolarına Devam Etmek İçin Giriş Yap</p>

          <form onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label className={styles.label}>Email</label>
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

            {error && <ErrorMessage message={error}/>}

            <button type="submit" className={styles.submitButton}>
              Giriş yap
            </button>
          </form>

          <p className={styles.subtitle} style={{ marginTop: '20px', marginBottom: 0 }}>
            Hesabın hala yok mu? <Link to="/register">Kayıt ol</Link>
          </p>
        </div>
      </div>

      <div className={styles.visualPanel}>
        <div className={styles.shape1} />
        <div className={styles.shape2} />
        <div className={styles.shape3} />
        <div className={styles.visualContent}>
          <h2 className={styles.visualTitle}>İşlerini düzenle,<br />ekibinle senkron kal.</h2>
          <p className={styles.visualText}>Kanban tarzı görev yönetimiyle projelerini kolayca takip et.</p>
        </div>
      </div>
    </div>
  )
}
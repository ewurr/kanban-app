import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import styles from './LoginPage.module.css'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    try {
      const response = await fetch('http://localhost:8000/api/login_check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        throw new Error('Email veya şifre hatalı')
      }

      const data = await response.json()

      const meResponse = await fetch('http://localhost:8000/api/me', {
        headers: { Authorization: `Bearer ${data.token}` },
      })
      const user = await meResponse.json()

      login(data.token, user)
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
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submitButton}>
            Giriş yap
          </button>
        </form>

        <p className={styles.subtitle} style={{ marginTop: '20px', marginBottom: 0 }}>
          Hesabın hala yok mu? <Link to="/register">Kayıt ol</Link>
        </p>
      </div>
    </div>
  )
}
import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import styles from '../LoginPage/LoginPage.module.css'
import { apiClient } from '../../lib/apiClient'
import { ErrorMessage } from '../../components/ErrorMessage/ErrorMessage'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Şifre en az 8 karakter olmalıdır.')
      return
    }

    if (password !== passwordConfirm) {
      setError('Şifreler eşleşmiyor.')
      return
    }

    setIsSubmitting(true)
    try {
      await apiClient.post('/reset-password', { token, password })
      setIsSuccess(true)
      // Kullanıcı yeni şifresini görüp login sayfasına gitsin diye kısa bir gecikme
      setTimeout(() => navigate('/login'), 2500)
    } catch (err: unknown) {
      // Backend token geçersiz/süresi dolmuş/kullanılmışsa 400 + { error } döner
      const message = err instanceof Error ? err.message : 'Bir şeyler ters gitti.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Linkte token hiç yoksa (biri sayfayı doğrudan ziyaret ettiyse), formu göstermenin anlamı yok
  if (!token) {
    return (
      <div className={styles.page}>
        <div className={`${styles.formPanel} ${isVisible ? styles.visible : ''}`}>
          <div className={styles.card}>
            <div className={styles.logo}>K</div>
            <h1 className={styles.title}>GEÇERSİZ LİNK</h1>
            <p className={styles.subtitle}>
              Bu link eksik ya da hatalı görünüyor. Şifreni sıfırlamak için tekrar talep oluşturabilirsin.
            </p>
            <Link to="/forgot-password">
              <button type="button" className={styles.submitButton}>
                Yeni sıfırlama linki iste
              </button>
            </Link>
          </div>
        </div>
        <div className={styles.visualPanel}>
          <div className={styles.shape1} />
          <div className={styles.shape2} />
          <div className={styles.shape3} />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={`${styles.formPanel} ${isVisible ? styles.visible : ''}`}>
        <div className={styles.card}>
          <div className={styles.logo}>K</div>
          <h1 className={styles.title} style={{ fontSize: '30px' }}>
            YENİ ŞİFRE BELİRLE
          </h1>
          <p className={styles.subtitle}>
            {isSuccess
              ? 'Şifren güncellendi, giriş sayfasına yönlendiriliyorsun...'
              : 'Hesabın için yeni bir şifre gir'}
          </p>

          {!isSuccess && (
            <form onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label className={styles.label}>Yeni şifre</label>
                <div className={styles.passwordWrapper}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles.input}
                    autoFocus
                    required
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
                <label className={styles.label}>Yeni şifre (tekrar)</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>

              {error && <ErrorMessage message={error} />}

              <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                {isSubmitting ? 'Güncelleniyor...' : 'Şifreyi güncelle'}
              </button>
            </form>
          )}

          {!isSuccess && (
            <p className={styles.subtitle} style={{ marginTop: '20px', marginBottom: 0 }}>
              <Link to="/login">Giriş sayfasına dön</Link>
            </p>
          )}
        </div>
      </div>

      <div className={styles.visualPanel}>
        <div className={styles.shape1} />
        <div className={styles.shape2} />
        <div className={styles.shape3} />
        <div className={styles.visualContent}>
          <h2 className={styles.visualTitle}>NEREDEYSE<br />TAMAMLADIN.</h2>
          <p className={styles.visualText}>Yeni şifreni belirle, kaldığın yerden devam et.</p>
        </div>
      </div>
    </div>
  )
}
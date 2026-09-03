import { useState, useEffect, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import styles from '../LoginPage/LoginPage.module.css'
import { apiClient } from '../../lib/apiClient'
import { ErrorMessage } from '../../components/ErrorMessage/ErrorMessage'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      // Backend her durumda (email var/yok fark etmeksizin) aynı generic
      // mesajı döner — burada da kullanıcıya her zaman aynı başarı ekranını
      // gösteriyoruz, bu sayede hangi emaillerin kayıtlı olduğu sızmaz.
      await apiClient.post('/forgot-password', { email })
      setIsSubmitted(true)
    } catch {
      // Backend zaten hep 200 döner (bkz. forgotPassword controller);
      // buraya sadece network hatası gibi beklenmedik durumlarda düşülür.
      setError('Bir şeyler ters gitti, lütfen tekrar deneyin.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={`${styles.formPanel} ${isVisible ? styles.visible : ''}`}>
        <div className={styles.card}>
          <div className={styles.logo}>K</div>
          <h1 className={styles.title} style={{ fontSize: '30px' }}>
            ŞİFRENİ Mİ UNUTTUN?
          </h1>
          <p className={styles.subtitle}>
            {isSubmitted
              ? 'Emailini kontrol et'
              : 'Email adresini gir, sana sıfırlama linki gönderelim'}
          </p>

          {isSubmitted ? (
            <>
              <p className={styles.subtitle} style={{ marginBottom: 0 }}>
                Eğer <strong>{email}</strong> kayıtlıysa, birazdan bir sıfırlama linki alacaksın.
                Gelen kutunu (ve spam klasörünü) kontrol etmeyi unutma.
              </p>
              <p className={styles.subtitle} style={{ marginTop: '20px', marginBottom: 0 }}>
                <Link to="/login">Giriş sayfasına dön</Link>
              </p>
            </>
          ) : (
            <>
              <form onSubmit={handleSubmit}>
                <div className={styles.field}>
                  <label className={styles.label}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.input}
                    autoFocus
                    required
                  />
                </div>

                {error && <ErrorMessage message={error} />}

                <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                  {isSubmitting ? 'Gönderiliyor...' : 'Sıfırlama linki gönder'}
                </button>
              </form>

              <p className={styles.subtitle} style={{ marginTop: '20px', marginBottom: 0 }}>
                <Link to="/login">Giriş sayfasına dön</Link>
              </p>
            </>
          )}
        </div>
      </div>

      <div className={styles.visualPanel}>
        <div className={styles.shape1} />
        <div className={styles.shape2} />
        <div className={styles.shape3} />
        <div className={styles.visualContent}>
          <h2 className={styles.visualTitle}>MERAK ETME,<br />BİRLİKTE HALLEDERİZ.</h2>
          <p className={styles.visualText}>Birkaç adımda şifreni sıfırlayıp kaldığın yerden devam et.</p>
        </div>
      </div>
    </div>
  )
}
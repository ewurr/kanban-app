import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth, type User } from '../AuthContext'
import styles from './ProfilePage.module.css'
import { apiClient } from '../lib/apiClient'
import { ErrorMessage } from '../components/ErrorMessage/ErrorMessage'
import { useNavigate } from 'react-router-dom'

export function ProfilePage() {
  const { user, updateUser } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [name, setName] = useState(user?.name ?? '')
  const [surname, setSurname] = useState(user?.surname ?? '')
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const profileMutation = useMutation({
    mutationFn: () => apiClient.put<User>('/me', { name, surname }),
    onSuccess: (data) => {
      updateUser(data)
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      setProfileError(null)
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    },
    onError: (err: Error) => {
      setProfileError(err.message)
      setProfileSuccess(false)
    },
  })

  const passwordMutation = useMutation({
    mutationFn: () => apiClient.put('/me/password', { currentPassword, newPassword }),
    onSuccess: () => {
      setPasswordError(null)
      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSuccess(false), 3000)
    },
    onError: (err: Error) => {
      setPasswordError(err.message)
      setPasswordSuccess(false)
    },
  })

  const handlePasswordSubmit = () => {
    if (newPassword !== confirmPassword) {
      setPasswordError('Yeni şifreler eşleşmiyor.')
      return
    }
    passwordMutation.mutate()
  }

  return (
    <div className={styles.page}>
      <button className={styles.backButton} onClick={() => navigate(-1)}>
        ← Geri
      </button>
      <h1 className={styles.pageTitle}>Profilim</h1>

      <div className={styles.cardsRow}>
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Profil Bilgileri</h2>

          <label className={styles.fieldLabel}>Email</label>
          <input type="email" value={user?.email ?? ''} disabled className={styles.inputDisabled} />

          <label className={styles.fieldLabel}>İsim</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.input}
          />

          <label className={styles.fieldLabel}>Soyisim</label>
          <input
            type="text"
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            className={styles.input}
          />

          {profileError && <ErrorMessage message={profileError}/>}
          {profileSuccess && <p className={styles.success}>Profil güncellendi.</p>}

          <button
            onClick={() => profileMutation.mutate()}
            disabled={!name.trim() || !surname.trim() || profileMutation.isPending}
            className={styles.saveButton}
          >
            {profileMutation.isPending ? 'Kaydediliyor...' : 'Bilgileri Kaydet'}
          </button>
        </div>

        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Şifre Değiştir</h2>

          <label className={styles.fieldLabel}>Mevcut Şifre</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={styles.input}
          />

          <label className={styles.fieldLabel}>Yeni Şifre</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={styles.input}
          />

          <label className={styles.fieldLabel}>Yeni Şifre (Tekrar)</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={styles.input}
          />

          {passwordError && <ErrorMessage message={passwordError}/>}
          {passwordSuccess && <p className={styles.success}>Şifre başarıyla değiştirildi.</p>}

          <button
            onClick={handlePasswordSubmit}
            disabled={!currentPassword || !newPassword || !confirmPassword || passwordMutation.isPending}
            className={styles.saveButton}
          >
            {passwordMutation.isPending ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
          </button>
        </div>
      </div>
    </div>
  )
}
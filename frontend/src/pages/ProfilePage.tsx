import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../AuthContext'
import styles from './ProfilePage.module.css'

export function ProfilePage() {
  const { user, token, updateUser } = useAuth()
  const queryClient = useQueryClient()

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
    mutationFn: async () => {
      const response = await fetch('http://localhost:8000/api/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, surname }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.errors?.[0] ?? 'Profil güncellenemedi')
      }
      return data
    },
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
    mutationFn: async () => {
      const response = await fetch('http://localhost:8000/api/me/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? 'Şifre değiştirilemedi')
      }
      return data
    },
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

          {profileError && <p className={styles.error}>{profileError}</p>}
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

          {passwordError && <p className={styles.error}>{passwordError}</p>}
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
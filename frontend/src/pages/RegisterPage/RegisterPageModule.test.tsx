import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { RegisterPage } from './RegisterPage'
import { apiClient } from '../../lib/apiClient'
import { AuthProvider } from '../../AuthContext'

vi.mock('../../lib/apiClient', () => ({
  apiClient: {
    post: vi.fn(),
  },
  setUnauthorizedHandler: vi.fn(),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

function renderRegisterPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockReset()
    mockNavigate.mockReset()
  })

  it('kayıt başarılı olursa kullanıcı ana sayfaya yönlendirilir', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      user: { id: 1, email: 'yeni@example.com', name: 'Yeni', surname: 'Kullanıcı' },
    })
    const user = userEvent.setup()

    renderRegisterPage()

    await user.type(screen.getByLabelText('E-posta'), 'yeni@example.com')
    await user.type(screen.getByLabelText('Şifre'), 'sifre12345')
    await user.type(screen.getByLabelText('İsim'), 'Yeni')
    await user.type(screen.getByLabelText('Soyad'), 'Kullanıcı')
    await user.click(screen.getByRole('button', { name: 'Kayıt Ol' }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })

  it('email zaten kayıtlıysa (requiresLogin), kullanıcı login sayfasına yönlendirilir, hata gösterilmez', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        message: 'Eğer bu email uygunsa, hesabın oluşturuldu. Giriş yapmayı deneyebilirsin.',
        requiresLogin: true,
      })
      const user = userEvent.setup()

      renderRegisterPage()

      await user.type(screen.getByLabelText('E-posta'), 'var@example.com')
      await user.type(screen.getByLabelText('Şifre'), 'sifre12345')
      await user.type(screen.getByLabelText('İsim'), 'Var')
      await user.type(screen.getByLabelText('Soyad'), 'Olan')
      await user.click(screen.getByRole('button', { name: 'Kayıt Ol' }))

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login')
      })
  })
})
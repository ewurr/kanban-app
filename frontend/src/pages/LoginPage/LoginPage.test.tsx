import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LoginPage } from './LoginPage'
import { apiClient, setUnauthorizedHandler } from '../../lib/apiClient'
import { AuthProvider } from '../../AuthContext'

vi.mock('../../lib/apiClient', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
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

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockReset()
    vi.mocked(apiClient.get).mockReset()
    mockNavigate.mockReset()
  })

  it('giriş başarılı olursa kullanıcı ana sayfaya yönlendirilir', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({})
    vi.mocked(apiClient.get).mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      name: 'Test',
      surname: 'User',
    })
    const user = userEvent.setup()

    renderLoginPage()

    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Şifre'), 'sifre123')
    await user.click(screen.getByRole('button', { name: 'Giriş yap' }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })

  it('giriş başarısız olursa hata mesajı gösterilir, yönlendirme olmaz', async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error('Invalid credentials'))
    const user = userEvent.setup()

    renderLoginPage()

    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Şifre'), 'yanlissifre')
    await user.click(screen.getByRole('button', { name: 'Giriş yap' }))

    await waitFor(() => {
      expect(screen.getByText('Email veya şifre hatalı')).toBeInTheDocument()
    })

    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
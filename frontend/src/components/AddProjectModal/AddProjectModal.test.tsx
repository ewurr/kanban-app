import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AddProjectModal } from './AddProjectModal'
import { apiClient } from '../../lib/apiClient'

vi.mock('../../lib/apiClient', () => ({
  apiClient: {
    post: vi.fn(),
  },
}))

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  )
}

describe('AddProjectModal', () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockReset()
  })

  it('istek başarılı olursa onClose çağrılır', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({})
    const onClose = vi.fn()
    const user = userEvent.setup()

    renderWithQueryClient(<AddProjectModal workspaceId={1} onClose={onClose} />)

    await user.type(screen.getByPlaceholderText('Proje adı'), 'Yeni Proje')
    await user.click(screen.getByRole('button', { name: 'Oluştur' }))

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  it('istek başarısız olursa onClose çağrılmaz ve hata mesajı gösterilir', async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error('Proje oluşturulamadı'))
    const onClose = vi.fn()
    const user = userEvent.setup()

    renderWithQueryClient(<AddProjectModal workspaceId={1} onClose={onClose} />)

    await user.type(screen.getByPlaceholderText('Proje adı'), 'Yeni Proje')
    await user.click(screen.getByRole('button', { name: 'Oluştur' }))

    await waitFor(() => {
      expect(screen.getByText('Proje oluşturulamadı')).toBeInTheDocument()
    })

    expect(onClose).not.toHaveBeenCalled()
  })

  it('istek devam ederken (pending) kapatma butonuna basılırsa onClose çağrılmaz', async () => {
    // apiClient.post'u bilerek hiç çözülmeyen (asılı kalan) bir Promise ile
    // sahteliyoruz — bu, mutation.isPending'in true kaldığı bir durumu simüle ediyor.
    vi.mocked(apiClient.post).mockImplementation(() => new Promise(() => {}))
    const onClose = vi.fn()
    const user = userEvent.setup()

    renderWithQueryClient(<AddProjectModal workspaceId={1} onClose={onClose} />)

    await user.type(screen.getByPlaceholderText('Proje adı'), 'Yeni Proje')
    await user.click(screen.getByRole('button', { name: 'Oluştur' }))

    // Mutation "pending" durumdayken kapatma butonuna (×) basmayı dene
    await waitFor(() => {
      expect(screen.getByText('Oluşturuluyor...')).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: '×' }))

    expect(onClose).not.toHaveBeenCalled()
  })
})
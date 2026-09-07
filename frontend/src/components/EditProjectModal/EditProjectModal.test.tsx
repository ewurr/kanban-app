import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { EditProjectModal } from './EditProjectModal'
import { apiClient } from '../../lib/apiClient'

vi.mock('../../lib/apiClient', () => ({
  apiClient: {
    put: vi.fn(),
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

describe('EditProjectModal', () => {
  beforeEach(() => {
    vi.mocked(apiClient.put).mockReset()
  })

  it('form, mevcut isim ve açıklama ile önceden doldurulmuş gelir', () => {
    const onClose = vi.fn()

    renderWithQueryClient(
      <EditProjectModal id={1} name="Mevcut Proje" description="Mevcut açıklama" onClose={onClose} />
    )

    expect(screen.getByDisplayValue('Mevcut Proje')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Mevcut açıklama')).toBeInTheDocument()
  })

  it('güncelleme başarılı olursa onClose çağrılır ve doğru veri gönderilir', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({})
    const onClose = vi.fn()
    const user = userEvent.setup()

    renderWithQueryClient(
      <EditProjectModal id={1} name="Eski İsim" description="Eski açıklama" onClose={onClose} />
    )

    const nameInput = screen.getByDisplayValue('Eski İsim')
    await user.clear(nameInput)
    await user.type(nameInput, 'Yeni İsim')
    await user.click(screen.getByRole('button', { name: 'Kaydet' }))

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    expect(apiClient.put).toHaveBeenCalledWith('/projects/1', {
      name: 'Yeni İsim',
      description: 'Eski açıklama',
    })
  })

  it('güncelleme başarısız olursa onClose çağrılmaz ve hata mesajı gösterilir', async () => {
    vi.mocked(apiClient.put).mockRejectedValue(new Error('Proje güncellenemedi'))
    const onClose = vi.fn()
    const user = userEvent.setup()

    renderWithQueryClient(
      <EditProjectModal id={1} name="Proje" description={null} onClose={onClose} />
    )

    await user.click(screen.getByRole('button', { name: 'Kaydet' }))

    await waitFor(() => {
      expect(screen.getByText('Proje güncellenemedi')).toBeInTheDocument()
    })

    expect(onClose).not.toHaveBeenCalled()
  })

  it('güncelleme devam ederken (pending) × butonuna basılırsa onClose çağrılmaz', async () => {
    vi.mocked(apiClient.put).mockImplementation(() => new Promise(() => {}))
    const onClose = vi.fn()
    const user = userEvent.setup()

    renderWithQueryClient(
      <EditProjectModal id={1} name="Proje" description={null} onClose={onClose} />
    )

    await user.click(screen.getByRole('button', { name: 'Kaydet' }))

    await waitFor(() => {
      expect(screen.getByText('Kaydediliyor...')).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: '×' }))

    expect(onClose).not.toHaveBeenCalled()
  })
})
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AddColumnModal } from './AddColumnModal'
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

describe('AddColumnModal', () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockReset()
  })

  it('istek başarılı olursa onClose çağrılır', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({})
    const onClose = vi.fn()
    const user = userEvent.setup()

    renderWithQueryClient(<AddColumnModal boardId={1} nextPosition={0} onClose={onClose} />)

    await user.type(screen.getByPlaceholderText('Column adı'), 'Yeni Column')
    await user.click(screen.getByRole('button', { name: 'Ekle' }))

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  it('istek başarısız olursa onClose çağrılmaz ve hata mesajı gösterilir', async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error('Column oluşturulamadı'))
    const onClose = vi.fn()
    const user = userEvent.setup()

    renderWithQueryClient(<AddColumnModal boardId={1} nextPosition={0} onClose={onClose} />)

    await user.type(screen.getByPlaceholderText('Column adı'), 'Yeni Column')
    await user.click(screen.getByRole('button', { name: 'Ekle' }))

    await waitFor(() => {
      expect(screen.getByText('Column oluşturulamadı')).toBeInTheDocument()
    })

    expect(onClose).not.toHaveBeenCalled()
  })
})
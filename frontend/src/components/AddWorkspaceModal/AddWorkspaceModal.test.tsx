import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AddWorkspaceModal } from './AddWorkspaceModal'
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

describe('AddWorkspaceModal', () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockReset()
  })

  it('istek başarılı olursa onClose çağrılır', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({})
    const onClose = vi.fn()
    const user = userEvent.setup()

    renderWithQueryClient(<AddWorkspaceModal onClose={onClose} />)

    await user.type(screen.getByPlaceholderText('Workspace adı'), 'Yeni Workspace')
    await user.click(screen.getByRole('button', { name: 'Kaydet' }))

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  it('istek başarısız olursa onClose çağrılmaz ve hata mesajı gösterilir', async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error('Workspace oluşturulamadı'))
    const onClose = vi.fn()
    const user = userEvent.setup()

    renderWithQueryClient(<AddWorkspaceModal onClose={onClose} />)

    await user.type(screen.getByPlaceholderText('Workspace adı'), 'Yeni Workspace')
    await user.click(screen.getByRole('button', { name: 'Kaydet' }))

    await waitFor(() => {
      expect(screen.getByText('Workspace oluşturulamadı')).toBeInTheDocument()
    })

    expect(onClose).not.toHaveBeenCalled()
  })
})
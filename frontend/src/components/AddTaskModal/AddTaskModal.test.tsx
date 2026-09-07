import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AddTaskModal } from './AddTaskModal'
import { apiClient } from '../../lib/apiClient'
import type { Column as ColumnType, Task as TaskType } from '../../types/kanban'

// apiClient'ı gerçek network isteği atmayacak şekilde sahteleştiriyoruz.
// Her testte apiClient.post'un ne döneceğini (ya da hata fırlatıp
// fırlatmayacağını) ayrı ayrı belirleyeceğiz.
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

const mockColumns: ColumnType[] = [
  { id: 1, name: 'To Do', position: 0, board: { id: 100 } as never },
]

const mockTasks: TaskType[] = []

describe('AddTaskModal', () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockReset()
  })

    it('istek başarılı olursa onClose çağrılır', async () => {
        vi.mocked(apiClient.post).mockResolvedValue({})
        const onClose = vi.fn()
        const user = userEvent.setup()

        renderWithQueryClient(
        <AddTaskModal boardId={100} columns={mockColumns} tasks={mockTasks} onClose={onClose} />
        )

        await user.type(screen.getByPlaceholderText('Görev başlığı'), 'Yeni görev')
        await user.click(screen.getByRole('button', { name: 'Ekle' }))

        await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1)
        }) 
    })

  it('istek başarısız olursa onClose ÇAĞRILMAZ ve hata mesajı gösterilir', async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error('Sunucu hatası'))
    const onClose = vi.fn()
    const user = userEvent.setup()

    renderWithQueryClient(
      <AddTaskModal boardId={100} columns={mockColumns} tasks={mockTasks} onClose={onClose} />
    )

    await user.type(screen.getByPlaceholderText('Görev başlığı'), 'Yeni görev')
    await user.click(screen.getByRole('button', { name: 'Ekle' }))

    await waitFor(() => {
      expect(screen.getByText('Sunucu hatası')).toBeInTheDocument()
    })

    expect(onClose).not.toHaveBeenCalled()
  })
})
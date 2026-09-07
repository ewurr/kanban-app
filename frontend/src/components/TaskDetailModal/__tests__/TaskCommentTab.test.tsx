import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TaskCommentsTab } from '../TaskCommentsTab'
import { apiClient } from '../../../lib/apiClient'
import { AuthProvider } from '../../../AuthContext'
import type { Comment as CommentType, Workspace as WorkspaceType } from '../../../types/kanban'

vi.mock('../../../lib/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  setUnauthorizedHandler: vi.fn(),
}))

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{ui}</AuthProvider>
    </QueryClientProvider>
  )
}

const mockWorkspace: WorkspaceType = {
  id: 1,
  workspaceMembers: [
    { id: 1, role: 'worker', user: { id: 1, name: 'Test', surname: 'User', email: 'test@example.com' } },
  ],
} as never

describe('TaskCommentsTab', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset()
    vi.mocked(apiClient.post).mockReset()
    vi.mocked(apiClient.put).mockReset()
  })

  it('hiç yorum yoksa "Henüz yorum yok." gösterilir', async () => {
    vi.mocked(apiClient.get).mockImplementation((path: string) => {
      if (path.includes('/comments')) return Promise.resolve([] as CommentType[])
      return Promise.resolve(mockWorkspace)
    })

    renderWithProviders(<TaskCommentsTab taskId={1} workspaceId={1} />)

    await waitFor(() => {
      expect(screen.getByText('Henüz yorum yok.')).toBeInTheDocument()
    })
  })

  it('yeni yorum gönderilirken, baştaki/sondaki boşluklar kırpılır', async () => {
    vi.mocked(apiClient.get).mockImplementation((path: string) => {
      if (path.includes('/comments')) return Promise.resolve([] as CommentType[])
      return Promise.resolve(mockWorkspace)
    })
    vi.mocked(apiClient.post).mockResolvedValue({})
    const user = userEvent.setup()

    renderWithProviders(<TaskCommentsTab taskId={1} workspaceId={1} />)

    await waitFor(() => screen.getByPlaceholderText('Yorum yaz...'))

    await user.type(screen.getByPlaceholderText('Yorum yaz...'), '  boşluklu yorum  ')
    await user.click(screen.getByRole('button', { name: 'Gönder' }))

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/tasks/1/comments', { content: 'boşluklu yorum' })
    })
  })
})
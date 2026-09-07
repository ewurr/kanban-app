import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ManageMembersModal } from './ManageMembersModal'
import { apiClient } from '../../lib/apiClient'
import type { Workspace } from '../../types/kanban'

vi.mock('../../lib/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
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

const mockWorkspace: Workspace = {
  id: 1,
  name: 'Test Workspace',
  workspaceMembers: [
    {
      id: 100,
      role: 'owner',
      user: { id: 1, name: 'Sahip', surname: 'Kişi', email: 'owner@example.com' },
    },
    {
      id: 101,
      role: 'worker',
      user: { id: 2, name: 'Çalışan', surname: 'Kişi', email: 'worker@example.com' },
    },
  ],
} as never

describe('ManageMembersModal', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset()
    vi.mocked(apiClient.post).mockReset()
    vi.mocked(apiClient.put).mockReset()
    vi.mocked(apiClient.delete).mockReset()
    vi.mocked(apiClient.get).mockResolvedValue(mockWorkspace)
  })

  it('owner için rol değiştirme arayüzü yerine sabit "Owner" etiketi gösterilir', async () => {
    renderWithQueryClient(<ManageMembersModal workspaceId={1} onClose={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Owner')).toBeInTheDocument()
    })
  })

  it('owner için "Çıkar" butonu devre dışıdır, worker için aktiftir', async () => {
    renderWithQueryClient(<ManageMembersModal workspaceId={1} onClose={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getAllByText('Çıkar')).toHaveLength(2)
    })

    const removeButtons = screen.getAllByRole('button', { name: 'Çıkar' })
    expect(removeButtons[0]).toBeDisabled() // owner (ilk üye)
    expect(removeButtons[1]).not.toBeDisabled() // worker (ikinci üye)
  })

  it('üye ekleme başarılı olursa form temizlenir', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({})
    const user = userEvent.setup()

    renderWithQueryClient(<ManageMembersModal workspaceId={1} onClose={vi.fn()} />)

    await waitFor(() => screen.getByPlaceholderText('Email adresi'))

    const emailInput = screen.getByPlaceholderText('Email adresi') as HTMLInputElement
    await user.type(emailInput, 'yeni@example.com')
    await user.click(screen.getByRole('button', { name: 'Ekle' }))

    await waitFor(() => {
      expect(emailInput.value).toBe('')
    })
  })

  it('üye ekleme başarısız olursa hata mesajı gösterilir', async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error('Bu email zaten üye'))
    const user = userEvent.setup()

    renderWithQueryClient(<ManageMembersModal workspaceId={1} onClose={vi.fn()} />)

    await waitFor(() => screen.getByPlaceholderText('Email adresi'))

    await user.type(screen.getByPlaceholderText('Email adresi'), 'zaten@example.com')
    await user.click(screen.getByRole('button', { name: 'Ekle' }))

    await waitFor(() => {
      expect(screen.getByText('Bu email zaten üye')).toBeInTheDocument()
    })
  })

  it('Çıkar butonuna basılıp onay verilirse silme isteği gönderilir', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.mocked(apiClient.delete).mockResolvedValue({})
    const user = userEvent.setup()

    renderWithQueryClient(<ManageMembersModal workspaceId={1} onClose={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Çıkar' })).toHaveLength(2)
    })

    const removeButtons = screen.getAllByRole('button', { name: 'Çıkar' })
    await user.click(removeButtons[1]) // worker'ı çıkar

    await waitFor(() => {
      expect(apiClient.delete).toHaveBeenCalledWith('/workspaces/1/members/101')
    })
  })

  it('Çıkar butonuna basılıp onay verilmezse silme isteği gönderilmez', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()

    renderWithQueryClient(<ManageMembersModal workspaceId={1} onClose={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Çıkar' })).toHaveLength(2)
    })

    const removeButtons = screen.getAllByRole('button', { name: 'Çıkar' })
    await user.click(removeButtons[1])

    expect(apiClient.delete).not.toHaveBeenCalled()
  })
})
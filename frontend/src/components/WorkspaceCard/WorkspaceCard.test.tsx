import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WorkspaceCard } from './WorkspaceCard'
import { apiClient } from '../../lib/apiClient'

vi.mock('../../lib/apiClient', () => ({
  apiClient: {
    delete: vi.fn(),
  },
}))

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </MemoryRouter>
  )
}

describe('WorkspaceCard', () => {
  beforeEach(() => {
    vi.mocked(apiClient.delete).mockReset()
  })

  it('isOwner false ise sil butonu görünmez', () => {
    renderWithProviders(
      <WorkspaceCard id={1} name="Test Workspace" memberCount={3} isOwner={false} />
    )

    expect(screen.queryByTitle('Sil')).not.toBeInTheDocument()
  })

  it('isOwner true ise sil butonu görünür', () => {
    renderWithProviders(
      <WorkspaceCard id={1} name="Test Workspace" memberCount={3} isOwner={true} />
    )

    expect(screen.getByTitle('Sil')).toBeInTheDocument()
  })

  it('üye sayısı doğru gösterilir', () => {
    renderWithProviders(
      <WorkspaceCard id={1} name="Test Workspace" memberCount={7} isOwner={false} />
    )

    expect(screen.getByText('7 Üye')).toBeInTheDocument()
  })

  it('silme onaylanırsa deleteMutation doğru ID ile tetiklenir', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.mocked(apiClient.delete).mockResolvedValue({})
    const user = userEvent.setup()

    renderWithProviders(
      <WorkspaceCard id={42} name="Test Workspace" memberCount={3} isOwner={true} />
    )

    await user.click(screen.getByTitle('Sil'))

    await waitFor(() => {
      expect(apiClient.delete).toHaveBeenCalledWith('/workspaces/42')
    })
  })

  it('silme onaylanmazsa deleteMutation tetiklenmez', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()

    renderWithProviders(
      <WorkspaceCard id={1} name="Test Workspace" memberCount={3} isOwner={true} />
    )

    await user.click(screen.getByTitle('Sil'))

    expect(apiClient.delete).not.toHaveBeenCalled()
  })
})
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProjectCard } from './ProjectCard'
import { apiClient } from '../../lib/apiClient'
import type { Board } from '../../types/kanban'

vi.mock('../../lib/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
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

describe('ProjectCard', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset()
    vi.mocked(apiClient.put).mockReset()
    vi.mocked(apiClient.delete).mockReset()
    vi.mocked(apiClient.get).mockResolvedValue([])
  })

  it('isOwner false ise düzenle/sil butonları görünmez', async () => {
    renderWithProviders(
      <ProjectCard id={1} name="Test Proje" description={null} isOwner={false} />
    )

    expect(screen.queryByTitle('Düzenle')).not.toBeInTheDocument()
  })

  it('isOwner true ise düzenle/sil butonları görünür', async () => {
    renderWithProviders(
      <ProjectCard id={1} name="Test Proje" description={null} isOwner={true} />
    )

    expect(screen.getByTitle('Düzenle')).toBeInTheDocument()
  })

  it('düzenle butonuna basılınca EditProjectModal açılır', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <ProjectCard id={1} name="Test Proje" description={null} isOwner={true} />
    )

    await user.click(screen.getByTitle('Düzenle'))

    expect(screen.getByText('Projeyi Düzenle')).toBeInTheDocument()
  })

  it('silme onaylanırsa deleteMutation tetiklenir', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.mocked(apiClient.delete).mockResolvedValue({})
    const user = userEvent.setup()

    renderWithProviders(
      <ProjectCard id={1} name="Test Proje" description={null} isOwner={true} />
    )

    await user.click(screen.getByTitle('Sil'))

    await waitFor(() => {
      expect(apiClient.delete).toHaveBeenCalledWith('/projects/1')
    })
  })

  it('20 karakterden kısa isim hiç kesilmez', () => {
    renderWithProviders(
      <ProjectCard id={1} name="Kısa İsim" description={null} isOwner={false} />
    )

    expect(screen.getByText('Kısa İsim')).toBeInTheDocument()
  })


  it('20 karakterden uzun isim doğru şekilde kesilir', () => {
    const longName = 'Bu İsim Kesinlikle Yirmi Karakterden Çok Daha Uzun'
    renderWithProviders(
      <ProjectCard id={1} name={longName} description={null} isOwner={false} />
    )

    expect(screen.getByText(`${longName.slice(0, 20)}...`)).toBeInTheDocument()
  })
})
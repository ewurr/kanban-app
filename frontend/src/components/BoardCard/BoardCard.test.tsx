import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BoardCard } from './BoardCard'
import { apiClient } from '../../lib/apiClient'

vi.mock('../../lib/apiClient', () => ({
  apiClient: {
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

function renderBoardCard(props: Partial<React.ComponentProps<typeof BoardCard>> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <BoardCard id={1} name="Test Board" canManage={false} {...props} />
      </QueryClientProvider>
    </MemoryRouter>
  )
}

describe('BoardCard', () => {
  beforeEach(() => {
    vi.mocked(apiClient.put).mockReset()
    vi.mocked(apiClient.delete).mockReset()
  })

  it('canManage false ise düzenle/sil butonları görünmez', () => {
    renderBoardCard({ canManage: false })

    expect(screen.queryByTitle('Düzenle')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Sil')).not.toBeInTheDocument()
  })

  it('canManage true ise düzenle/sil butonları görünür', () => {
    renderBoardCard({ canManage: true })

    expect(screen.getByTitle('Düzenle')).toBeInTheDocument()
    expect(screen.getByTitle('Sil')).toBeInTheDocument()
  })

  it('düzenle butonuna basılınca, mevcut isimle dolu bir form açılır', async () => {
    const user = userEvent.setup()
    renderBoardCard({ canManage: true, name: 'Eski İsim' })

    await user.click(screen.getByTitle('Düzenle'))

    expect(screen.getByDisplayValue('Eski İsim')).toBeInTheDocument()
  })

  it('düzenleme başarılı olursa form kapanır', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({})
    const user = userEvent.setup()
    renderBoardCard({ canManage: true, name: 'Eski İsim' })

    await user.click(screen.getByTitle('Düzenle'))
    const input = screen.getByDisplayValue('Eski İsim')
    await user.clear(input)
    await user.type(input, 'Yeni İsim')
    await user.click(screen.getByRole('button', { name: 'Kaydet' }))

    await waitFor(() => {
      expect(screen.queryByDisplayValue('Yeni İsim')).not.toBeInTheDocument()
    })
  })

  it('silme onaylanırsa deleteMutation tetiklenir', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.mocked(apiClient.delete).mockResolvedValue({})
    const user = userEvent.setup()
    renderBoardCard({ canManage: true })

    await user.click(screen.getByTitle('Sil'))

    await waitFor(() => {
      expect(apiClient.delete).toHaveBeenCalledWith('/boards/1')
    })
  })

  it('silme onaylanmazsa deleteMutation tetiklenmez', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()
    renderBoardCard({ canManage: true })

    await user.click(screen.getByTitle('Sil'))

    expect(apiClient.delete).not.toHaveBeenCalled()
  })

  it('düzenle/sil butonuna tıklamak Link navigasyonunu tetiklemez', async () => {
    const onNavigate = vi.fn()
    const user = userEvent.setup()
    renderBoardCard({ canManage: true, onNavigate })

    await user.click(screen.getByTitle('Düzenle'))

    // onNavigate, Link'in kendi onClick'i — eğer stop() doğru çalışmasaydı
    // düzenle butonuna tıklamak da bu callback'i tetiklerdi.
    expect(onNavigate).not.toHaveBeenCalled()
  })
})
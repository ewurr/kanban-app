import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { LoginPage } from './pages/LoginPage'
import { WorkspacesPage } from './pages/WorkspacesPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { BoardsPage } from './pages/BoardsPages'
import { BoardDetailPage } from './pages/BoardDetailPage'
import { RegisterPage } from './pages/RegisterPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { TopBar } from './components/TopBar/TopBar'
import { ProfilePage } from './pages/ProfilePage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/" element={<ProtectedRoute><WorkspacesPage /></ProtectedRoute>} />
        <Route path="/workspaces/:id" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
        <Route path="/projects/:id" element={<ProtectedRoute><BoardsPage /></ProtectedRoute>} />
        <Route path="/boards/:id" element={<ProtectedRoute><BoardDetailPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return (
    <>
      <TopBar />
      <div style={{ paddingTop: '56px' }}>
        {children}
      </div>
    </>
  )
}

function GuestRoute({children}: { children: React.ReactNode }){
  const {token} = useAuth()

  if (token) {
    return <Navigate to = "/" replace />
  }

  return children
}

export default App
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { LoginPage } from './pages/LoginPage'
import { WorkspacesPage } from './pages/WorkspacesPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { BoardsPage } from './pages/BoardsPages'
import { BoardDetailPage } from './pages/BoardDetailPage'
import { RegisterPage } from './pages/RegisterPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<ProtectedRoute><WorkspacesPage /></ProtectedRoute>} />
        <Route path="/workspaces/:id" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
        <Route path="/projects/:id" element={<ProtectedRoute><BoardsPage /></ProtectedRoute>} />
        <Route path="/boards/:id" element={<ProtectedRoute><BoardDetailPage /></ProtectedRoute>} />

      </Routes>
    </BrowserRouter>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default App
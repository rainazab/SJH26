import { Navigate, Route, Routes } from 'react-router-dom'
import { Navbar } from './components/layout/Navbar'
import { PageWrapper } from './components/layout/PageWrapper'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { Commit } from './pages/Commit'
import { Dashboard } from './pages/Dashboard'
import { Explore } from './pages/Explore'
import { Invite } from './pages/Invite'
import { Landing } from './pages/Landing'
import { Log } from './pages/Log'
import { NewProject } from './pages/NewProject'
import { Profile } from './pages/Profile'
import { Project } from './pages/Project'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--gray-mid)', padding: '60px 0' }}>
      Checking session...
    </div>
  )
  if (!user) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <div style={{ minHeight: '100vh', background: 'var(--cream)', color: 'var(--black)' }}>
        <Navbar />
        <PageWrapper>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/new" element={<ProtectedRoute><NewProject /></ProtectedRoute>} />
            <Route path="/project/:id" element={<ProtectedRoute><Project /></ProtectedRoute>} />
            <Route path="/project/:id/commit" element={<ProtectedRoute><Commit /></ProtectedRoute>} />
            <Route path="/project/:id/log" element={<ProtectedRoute><Log /></ProtectedRoute>} />
            <Route path="/invite/:token" element={<Invite />} />
          </Routes>
        </PageWrapper>
      </div>
    </AuthProvider>
  )
}

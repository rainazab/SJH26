import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

export function RequireUsername({ children }) {
  const { user, loading } = useAuth()
  const { pathname } = useLocation()
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    if (loading) return
    if (!user) { setStatus('ok'); return }
    if (pathname === '/profile') { setStatus('ok'); return }
    supabase.from('profiles').select('username').eq('id', user.id).maybeSingle()
      .then(({ data }) => {
        setStatus(data?.username ? 'ok' : 'redirect')
      })
  }, [user, loading, pathname])

  if (status === 'checking') return null
  if (status === 'redirect') return <Navigate to="/profile" replace />
  return children
}

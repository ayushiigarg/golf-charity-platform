import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'

// Wraps any page that requires admin role
// If not admin → redirect to /dashboard
export default function AdminRoute({ children }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
  if (!user || profile?.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}
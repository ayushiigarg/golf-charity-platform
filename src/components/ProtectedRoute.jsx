import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'

// Wraps any page that requires login
// If not logged in → redirect to /login
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      padding: '0.9rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <Link to="/" style={{
        color: 'var(--text-h)',
        textDecoration: 'none',
        fontWeight: 700,
        fontSize: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <span style={{
          width: '28px',
          height: '28px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, var(--accent) 0%, #a855f7 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '0.9rem'
        }}>🎯</span>
        Golf Charity
      </Link>
      
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <Link to="/charities" style={{
          color: 'var(--text)',
          textDecoration: 'none',
          padding: '0.5rem 0.9rem',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.9rem',
          fontWeight: 500,
          transition: 'all 0.2s'
        }}>Charities</Link>
        
        <Link to="/draws" style={{
          color: 'var(--text)',
          textDecoration: 'none',
          padding: '0.5rem 0.9rem',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.9rem',
          fontWeight: 500,
          transition: 'all 0.2s'
        }}>Draws</Link>
        
        {user ? (
          <>
            <Link to="/dashboard" style={{
              color: 'var(--text)',
              textDecoration: 'none',
              padding: '0.5rem 0.9rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.9rem',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}>Dashboard</Link>
            
            <Link to="/profile" style={{
              color: 'var(--text)',
              textDecoration: 'none',
              padding: '0.5rem 0.9rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.9rem',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}>Profile</Link>
            
            {profile?.role === 'admin' && (
              <Link to="/admin" style={{
                color: 'var(--accent)',
                textDecoration: 'none',
                padding: '0.5rem 0.9rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.9rem',
                fontWeight: 600,
                background: 'var(--accent-light)',
                transition: 'all 0.2s'
              }}>Admin</Link>
            )}
            
            <button onClick={signOut} style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={{
              color: 'var(--text)',
              textDecoration: 'none',
              padding: '0.5rem 0.9rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.9rem',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}>Login</Link>
            
            <Link to="/register" style={{
              background: 'var(--accent)',
              color: 'white',
              padding: '0.5rem 1.25rem',
              borderRadius: 'var(--radius-full)',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 600,
              boxShadow: '0 2px 8px var(--accent-glow)',
              transition: 'all 0.2s'
            }}>Sign up</Link>
          </>
        )}
      </div>
    </nav>
  )
}
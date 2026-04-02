import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function Register() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [charityId, setCharityId] = useState('')
  const [charityPercent, setCharityPercent] = useState(10)
  const [charities, setCharities] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('charities').select('id, name').order('name').then(({ data }) => {
      if (data) setCharities(data)
    })
  }, [])

  async function handleRegister(e) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success('Account created! Redirecting...')
    
    setTimeout(() => navigate('/dashboard'), 500)
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 80px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem'
    }}>
      <div className="card animate-fade-in-up" style={{
        width: '100%',
        maxWidth: '480px',
        margin: '0 auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ marginBottom: '0.5rem', fontSize: '1.75rem' }}>Create account</h1>
          <p style={{ color: 'var(--text)', fontSize: '0.95rem' }}>
            Join the Golf Charity Platform
          </p>
        </div>

        <form onSubmit={handleRegister}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
              Full name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              placeholder="John Smith"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.95rem',
                boxSizing: 'border-box',
                background: 'var(--bg)',
                color: 'var(--text-h)'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.95rem',
                boxSizing: 'border-box',
                background: 'var(--bg)',
                color: 'var(--text-h)'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="min 6 characters"
              minLength={6}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.95rem',
                boxSizing: 'border-box',
                background: 'var(--bg)',
                color: 'var(--text-h)'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.25rem', padding: '1rem', background: 'var(--accent-light)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent)' }}>
              Select a charity to support (optional)
            </p>
            <select
              value={charityId}
              onChange={e => setCharityId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.9rem',
                background: 'var(--bg)',
                color: 'var(--text-h)',
                marginBottom: '0.75rem'
              }}
            >
              <option value="">-- Skip for now --</option>
              {charities.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {charityId && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                  Contribution: {charityPercent}%
                </label>
                <input
                  type="range"
                  min="10" max="100" step="5"
                  value={charityPercent}
                  onChange={e => setCharityPercent(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent)' }}
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '0.85rem' }}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
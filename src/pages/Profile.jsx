import { useState } from 'react'
import { useAuth } from '../contexts/useAuth'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [loading, setLoading] = useState(false)

  async function handleUpdate(e) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id)

    if (error) {
      toast.error('Could not update profile')
    } else {
      toast.success('Profile updated!')
      refreshProfile()
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', paddingBottom: '4rem' }}>
      <div className="card">
        <h1 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>Profile</h1>
        <p style={{ color: 'var(--text)', marginBottom: '2rem' }}>Manage your account settings</p>

        <form onSubmit={handleUpdate}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.95rem',
                background: 'var(--bg)',
                color: 'var(--text-h)'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.95rem',
                background: 'var(--bg)',
                color: 'var(--text)',
                opacity: 0.7
              }}
            />
            <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text)' }}>Email cannot be changed</p>
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%' }}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
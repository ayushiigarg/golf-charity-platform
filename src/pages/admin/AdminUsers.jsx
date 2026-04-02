import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editingUser, setEditingUser] = useState(null)
  const [userScores, setUserScores] = useState([])
  const [loadingScores, setLoadingScores] = useState(false)

  async function fetchUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select(`id, full_name, role, charity_percent, created_at, subscriptions (id, plan, status, amount, renewal_date)`)
      .order('created_at', { ascending: false })

    if (error) toast.error('Could not load users')
    else setUsers(data)
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  async function toggleRole(userId, currentRole) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    if (error) toast.error('Could not update role')
    else { toast.success(`Role changed to ${newRole}`); fetchUsers() }
  }

  async function openEditModal(user) {
    setEditingUser({ ...user })
    setLoadingScores(true)
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', user.id)
      .order('played_on', { ascending: false })
      .limit(5)
    
    if (!error) setUserScores(data)
    setLoadingScores(false)
  }

  async function saveUserChanges() {
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: editingUser.full_name, charity_percent: editingUser.charity_percent })
      .eq('id', editingUser.id)
    
    if (error) toast.error('Failed to update profile')
    else {
      toast.success('Profile updated')
      fetchUsers()
      setEditingUser(null)
    }
  }

  async function cancelUserSubscription(subId) {
    if (!confirm('Cancel this subscription?')) return
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('id', subId)
    
    if (error) toast.error('Failed to cancel subscription')
    else {
      toast.success('Subscription cancelled')
      fetchUsers()
      // Update local state for modal
      setEditingUser({
        ...editingUser,
        subscriptions: editingUser.subscriptions.map(s => 
          s.id === subId ? { ...s, status: 'cancelled' } : s
        )
      })
    }
  }

  async function deleteScore(scoreId) {
    if (!confirm('Delete this score?')) return
    const { error } = await supabase.from('scores').delete().eq('id', scoreId)
    if (error) toast.error('Failed to delete score')
    else {
      toast.success('Score deleted')
      setUserScores(userScores.filter(s => s.id !== scoreId))
    }
  }

  const filtered = users.filter(u => u.full_name?.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading users...</div>

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Users</h1>
        <p style={{ color: 'var(--text)' }}>{users.length} total users</p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: '0.75rem 1rem', borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border)', fontSize: '0.95rem',
            width: '100%', maxWidth: '360px', background: 'var(--bg)', color: 'var(--text-h)'
          }}
        />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', background: 'var(--bg)' }}>
                <th style={{ padding: '1rem', color: 'var(--text)', fontWeight: 600 }}>Name</th>
                <th style={{ padding: '1rem', color: 'var(--text)', fontWeight: 600 }}>Role</th>
                <th style={{ padding: '1rem', color: 'var(--text)', fontWeight: 600 }}>Subscription</th>
                <th style={{ padding: '1rem', color: 'var(--text)', fontWeight: 600 }}>Charity %</th>
                <th style={{ padding: '1rem', color: 'var(--text)', fontWeight: 600 }}>Joined</th>
                <th style={{ padding: '1rem', color: 'var(--text)', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => {
                const sub = user.subscriptions?.[0]
                return (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem', fontWeight: 500 }}>{user.full_name || 'No name'}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        background: user.role === 'admin' ? 'var(--accent-light)' : 'var(--bg)',
                        color: user.role === 'admin' ? 'var(--accent)' : 'var(--text)',
                        padding: '4px 10px', borderRadius: 'var(--radius-full)',
                        fontSize: '0.78rem', fontWeight: 600
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {sub ? (
                        <span style={{
                          background: sub.status === 'active' ? '#d1fae5' : '#ffedd5',
                          color: sub.status === 'active' ? '#065f46' : '#c2410c',
                          padding: '4px 10px', borderRadius: 'var(--radius-full)',
                          fontSize: '0.78rem', fontWeight: 600
                        }}>
                          {sub.plan} · {sub.status}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text)', fontSize: '0.8rem' }}>None</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text)' }}>{user.charity_percent ?? 10}%</td>
                    <td style={{ padding: '1rem', color: 'var(--text)' }}>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => openEditModal(user)}
                        style={{
                          padding: '0.4rem 0.75rem', background: 'var(--bg)',
                          border: '1px solid var(--border)', color: 'var(--text-h)',
                          borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.8rem'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleRole(user.id, user.role)}
                        style={{
                          padding: '0.4rem 0.75rem', background: 'transparent',
                          border: '1px solid var(--accent)', color: 'var(--accent)',
                          borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.8rem'
                        }}
                      >
                        Make {user.role === 'admin' ? 'user' : 'admin'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editingUser && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem'
        }} onClick={() => setEditingUser(null)}>
          <div className="card" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>Edit User: {editingUser.full_name}</h2>
              <button onClick={() => setEditingUser(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text)' }}>&times;</button>
            </div>

            <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Full Name</label>
                <input 
                  type="text" value={editingUser.full_name || ''} 
                  onChange={e => setEditingUser({...editingUser, full_name: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Charity Contribution %</label>
                <input 
                  type="number" min="10" max="100" value={editingUser.charity_percent || 10} 
                  onChange={e => setEditingUser({...editingUser, charity_percent: Number(e.target.value)})}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
                />
              </div>
              <button onClick={saveUserChanges} className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>Save Profile Changes</button>
            </div>

            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Subscription</h3>
            {editingUser.subscriptions?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
                {editingUser.subscriptions.map(sub => (
                  <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>{sub.plan} plan</span>
                      <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text)' }}>Status: {sub.status} · Renews: {new Date(sub.renewal_date).toLocaleDateString()}</span>
                    </div>
                    {sub.status === 'active' && (
                      <button onClick={() => cancelUserSubscription(sub.id)} style={{ padding: '0.5rem', border: '1px solid var(--error)', color: 'var(--error)', background: 'transparent', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8rem' }}>
                        Cancel Sub
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text)', marginBottom: '2rem' }}>No subscriptions found.</p>
            )}

            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Golf Scores</h3>
            {loadingScores ? <p>Loading scores...</p> : userScores.length === 0 ? (
              <p style={{ color: 'var(--text)' }}>No scores entered.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {userScores.map(score => (
                  <div key={score.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--accent)', fontSize: '1.1rem', marginRight: '1rem' }}>{score.value} pts</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{new Date(score.played_on).toLocaleDateString()}</span>
                    </div>
                    <button onClick={() => deleteScore(score.id)} style={{ padding: '0.4rem 0.6rem', border: 'none', background: 'var(--error)', color: 'white', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.75rem' }}>
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
            
          </div>
        </div>
      )}
    </div>
  )
}
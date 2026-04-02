import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function AdminWinners() {
  const [winners, setWinners] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  async function fetchWinners() {
    const { data, error } = await supabase
      .from('winners')
      .select('*, profiles (full_name), draws (month, drawn_numbers)')
      .order('created_at', { ascending: false })

    if (error) toast.error('Could not load winners')
    else setWinners(data)
    setLoading(false)
  }

  useEffect(() => { fetchWinners() }, [])

  async function verifyWinner(id) {
    const { error } = await supabase.from('winners').update({ admin_verified: true }).eq('id', id)
    if (error) toast.error('Could not verify')
    else { toast.success('Winner verified!'); fetchWinners() }
  }

  async function markPaid(id) {
    const { error } = await supabase.from('winners').update({ payout_status: 'paid' }).eq('id', id)
    if (error) toast.error('Could not update payout')
    else { toast.success('Marked as paid!'); fetchWinners() }
  }

  const filtered = filter === 'all' ? winners : filter === 'pending' ? winners.filter(w => !w.admin_verified) : winners.filter(w => w.payout_status === 'paid')

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading winners...</div>

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Winners</h1>
        <p style={{ color: 'var(--text)' }}>Verify proof uploads and manage payouts</p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {[{ key: 'all', label: 'All' }, { key: 'pending', label: 'Pending verification' }, { key: 'paid', label: 'Paid' }].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: '0.5rem 1rem',
              background: filter === tab.key ? 'var(--accent)' : 'transparent',
              color: filter === tab.key ? 'white' : 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: 'var(--text)', fontStyle: 'italic' }}>No winners found.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map(winner => (
            <div key={winner.id} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <p style={{ margin: '0 0 0.25rem', fontWeight: 600 }}>{winner.profiles?.full_name || 'Unknown user'}</p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text)' }}>{winner.match_type}-number match · Draw: {winner.draws?.month}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 0.25rem', fontWeight: 700, color: 'var(--success)', fontSize: '1.1rem' }}>£{winner.prize_amount.toFixed(2)}</p>
                  <span style={{
                    background: winner.payout_status === 'paid' ? '#d1fae5' : '#ffedd5',
                    color: winner.payout_status === 'paid' ? '#065f46' : '#c2410c',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.78rem',
                    fontWeight: 600
                  }}>
                    {winner.payout_status}
                  </span>
                </div>
              </div>

              {winner.proof_url ? (
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ margin: '0 0 0.4rem', fontSize: '0.8rem', color: 'var(--text)' }}>Proof uploaded</p>
                  <a href={winner.proof_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontSize: '0.875rem' }}>View proof screenshot</a>
                </div>
              ) : (
                <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: 'var(--text)', fontStyle: 'italic' }}>No proof uploaded yet</p>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {!winner.admin_verified && (
                  <button onClick={() => verifyWinner(winner.id)} style={{ padding: '0.5rem 1rem', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                    Verify winner
                  </button>
                )}
                {winner.admin_verified && winner.payout_status !== 'paid' && (
                  <button onClick={() => markPaid(winner.id)} style={{ padding: '0.5rem 1rem', background: 'var(--success)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                    Mark as paid
                  </button>
                )}
                {winner.admin_verified && (
                  <span style={{ padding: '0.5rem 1rem', background: '#d1fae5', color: '#065f46', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 600 }}>Verified</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
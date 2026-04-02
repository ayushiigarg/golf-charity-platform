import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Draws() {
  const [draws, setDraws] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDraws() {
      const { data } = await supabase.from('draws').select('*').eq('status', 'published').order('created_at', { ascending: false })
      setDraws(data || [])
      setLoading(false)
    }
    loadDraws()
  }, [])

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading draws...</div>

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Draw Results</h1>
        <p style={{ color: 'var(--text)' }}>View the latest published draw results</p>
      </div>

      {draws.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>No draws have been published yet.</p>
          <p style={{ color: 'var(--text)', fontSize: '0.9rem' }}>Check back later for the latest results!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {draws.map(draw => <DrawResult key={draw.id} draw={draw} />)}
        </div>
      )}
    </div>
  )
}

function DrawResult({ draw }) {
  const totalPool = draw.prize_pool?.total ?? 0
  const fallback = totalPool > 0 ? { five_match: totalPool * 0.4, four_match: totalPool * 0.35, three_match: totalPool * 0.25 } : { five_match: 0, four_match: 0, three_match: 0 }
  const resolved = { five_match: draw.prize_pool?.five_match ?? fallback.five_match, four_match: draw.prize_pool?.four_match ?? fallback.four_match, three_match: draw.prize_pool?.three_match ?? fallback.three_match }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--accent)' }}>{draw.month} Draw Results</h2>
        <span style={{ background: 'var(--success)', color: 'white', padding: '0.3rem 0.8rem', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 600 }}>Published</span>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>Winning Numbers</p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {draw.drawn_numbers.map(number => (
            <div key={number} style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, var(--accent) 0%, #8b5cf6 100%)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem' }}>{number}</div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[{ label: '5-match Jackpot', value: `£${resolved.five_match.toFixed(2)}`, color: '#10b981' }, { label: '4-match Prize', value: `£${resolved.four_match.toFixed(2)}`, color: '#f59e0b' }, { label: '3-match Prize', value: `£${resolved.three_match.toFixed(2)}`, color: '#6366f1' }].map(tier => (
          <div key={tier.label} style={{ background: 'var(--bg)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center' }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: 'var(--text)', fontWeight: 500 }}>{tier.label}</p>
            <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: tier.color }}>{tier.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.85rem', color: 'var(--text)', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
        <span>Mode: <strong>{draw.mode}</strong></span>
        <span>Total Pool: <strong>£{draw.prize_pool?.total?.toFixed(2) || '0.00'}</strong></span>
        <span>Draw Date: <strong>{new Date(draw.created_at).toLocaleDateString()}</strong></span>
      </div>

      {draw.jackpot_rollover > 0 && (
        <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--warning)', color: 'white', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', fontWeight: 500 }}>
          <strong>No jackpot winner!</strong> £{draw.jackpot_rollover.toFixed(2)} rolls over to next month's draw.
        </div>
      )}
    </div>
  )
}
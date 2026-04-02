import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, activeSubscribers: 0, totalDraws: 0, pendingWinners: 0 })
  const [loading, setLoading] = useState(true)

  async function fetchStats() {
    const [users, subs, draws, winners] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('draws').select('id', { count: 'exact', head: true }),
      supabase.from('winners').select('id', { count: 'exact', head: true }).eq('payout_status', 'pending')
    ])
    setStats({ totalUsers: users.count ?? 0, activeSubscribers: subs.count ?? 0, totalDraws: draws.count ?? 0, pendingWinners: winners.count ?? 0 })
    setLoading(false)
  }

  useEffect(() => { fetchStats() }, [])

  const cards = [
    { label: 'Total users', value: stats.totalUsers, link: '/admin/users', color: 'var(--accent)' },
    { label: 'Active subscribers', value: stats.activeSubscribers, link: '/admin/users', color: '#10b981' },
    { label: 'Total draws', value: stats.totalDraws, link: '/admin/draws', color: '#0ea5e9' },
    { label: 'Pending payouts', value: stats.pendingWinners, link: '/admin/winners', color: '#f59e0b' },
  ]

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Admin panel</h1>
        <p style={{ color: 'var(--text)' }}>Platform overview</p>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: '4rem' }}>Loading...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {cards.map(card => (
            <Link key={card.label} to={card.link} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ borderTop: `3px solid ${card.color}`, padding: '1.25rem' }}>
                <p style={{ margin: '0 0 0.25rem', fontSize: '0.85rem', color: 'var(--text)' }}>{card.label}</p>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: card.color }}>{card.value}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Platform Reports', desc: 'Analytics and financial reporting', link: '/admin/reports' },
          { label: 'Manage draws', desc: 'Run simulations and publish results', link: '/admin/draws' },
          { label: 'Manage users', desc: 'View all users and subscriptions', link: '/admin/users' },
          { label: 'Manage charities', desc: 'Add, edit, or remove charities', link: '/admin/charities' },
          { label: 'Verify winners', desc: 'Approve proofs and mark payouts', link: '/admin/winners' },
        ].map(item => (
          <Link key={item.label} to={item.link} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ cursor: 'pointer', padding: '1.25rem' }}>
              <h3 style={{ margin: '0 0 0.4rem', fontSize: '0.95rem', color: 'var(--accent)' }}>{item.label}</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text)' }}>{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
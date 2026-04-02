import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminReports() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStats() }, [])

  async function fetchStats() {
    try {
      const [users, activeSubs, allSubs, draws, winners, charities] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('amount', { count: 'exact' }).eq('status', 'active'),
        supabase.from('subscriptions').select('amount, plan, status'),
        supabase.from('draws').select('*, winners(prize_amount, payout_status)').order('created_at', { ascending: false }),
        supabase.from('winners').select('prize_amount, payout_status, match_type'),
        supabase.from('profiles').select('charity_id, charity_percent').not('charity_id', 'is', null)
      ])

      // Calculate total prize pool from active subscriptions
      const activeSubData = activeSubs.data || []
      const totalMonthlyRevenue = activeSubData.reduce((sum, s) => sum + (s.amount || 0), 0)

      // Calculate total prizes awarded
      const winnersData = winners.data || []
      const totalPrizesAwarded = winnersData.reduce((sum, w) => sum + (w.prize_amount || 0), 0)
      const totalPaid = winnersData.filter(w => w.payout_status === 'paid').reduce((sum, w) => sum + (w.prize_amount || 0), 0)
      const totalPending = winnersData.filter(w => w.payout_status === 'pending').reduce((sum, w) => sum + (w.prize_amount || 0), 0)

      // Winner breakdown by match type
      const fiveMatchWinners = winnersData.filter(w => w.match_type === '5').length
      const fourMatchWinners = winnersData.filter(w => w.match_type === '4').length
      const threeMatchWinners = winnersData.filter(w => w.match_type === '3').length

      // Charity contributions
      const charityData = charities.data || []
      const avgCharityPercent = charityData.length > 0
        ? charityData.reduce((sum, c) => sum + (c.charity_percent || 10), 0) / charityData.length
        : 10
      const totalCharityContributions = totalMonthlyRevenue * (avgCharityPercent / 100)

      // Sub breakdown
      const allSubData = allSubs.data || []
      const monthlyActive = allSubData.filter(s => s.plan === 'monthly' && s.status === 'active').length
      const yearlyActive = allSubData.filter(s => s.plan === 'yearly' && s.status === 'active').length
      const cancelled = allSubData.filter(s => s.status === 'cancelled').length

      // Draw stats
      const drawData = draws.data || []
      const publishedDraws = drawData.filter(d => d.status === 'published')
      const simulations = drawData.filter(d => d.status === 'simulation')

      setStats({
        totalUsers: users.count ?? 0,
        activeSubscribers: activeSubs.count ?? 0,
        monthlyActive,
        yearlyActive,
        cancelledSubs: cancelled,
        totalMonthlyRevenue,
        totalPrizesAwarded,
        totalPaid,
        totalPending,
        fiveMatchWinners,
        fourMatchWinners,
        threeMatchWinners,
        totalWinners: winnersData.length,
        avgCharityPercent: avgCharityPercent.toFixed(1),
        totalCharityContributions,
        usersWithCharity: charityData.length,
        totalDraws: drawData.length,
        publishedDraws: publishedDraws.length,
        simulations: simulations.length
      })
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading reports...</div>
  if (!stats) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text)' }}>Could not load reports.</div>

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Reports & Analytics</h1>
          <p style={{ color: 'var(--text)' }}>Platform-wide statistics and insights</p>
        </div>
        <Link to="/admin" style={{
          padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)',
          background: 'var(--accent-light)', color: 'var(--accent)',
          textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600
        }}>Back to Admin</Link>
      </div>

      {/* User & Subscription Stats */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>Users & Subscriptions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
          {[
            { label: 'Total users', value: stats.totalUsers, color: 'var(--accent)' },
            { label: 'Active subscribers', value: stats.activeSubscribers, color: '#10b981' },
            { label: 'Monthly plans', value: stats.monthlyActive, color: '#0ea5e9' },
            { label: 'Yearly plans', value: stats.yearlyActive, color: '#8b5cf6' },
            { label: 'Cancelled', value: stats.cancelledSubs, color: '#ef4444' },
            { label: 'Monthly revenue', value: `£${stats.totalMonthlyRevenue.toFixed(2)}`, color: '#10b981' },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'var(--bg)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <p style={{ margin: '0 0 0.25rem', fontSize: '0.8rem', color: 'var(--text)' }}>{stat.label}</p>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Prize Pool Stats */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>Prize Pool</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
          {[
            { label: 'Total prizes awarded', value: `£${stats.totalPrizesAwarded.toFixed(2)}`, color: 'var(--accent)' },
            { label: 'Paid out', value: `£${stats.totalPaid.toFixed(2)}`, color: '#10b981' },
            { label: 'Pending payout', value: `£${stats.totalPending.toFixed(2)}`, color: '#f59e0b' },
            { label: 'Total winners', value: stats.totalWinners, color: 'var(--text-h)' },
            { label: '5-match winners', value: stats.fiveMatchWinners, color: '#10b981' },
            { label: '4-match winners', value: stats.fourMatchWinners, color: '#f59e0b' },
            { label: '3-match winners', value: stats.threeMatchWinners, color: '#6366f1' },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'var(--bg)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <p style={{ margin: '0 0 0.25rem', fontSize: '0.8rem', color: 'var(--text)' }}>{stat.label}</p>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Charity Stats */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>Charity Contributions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {[
            { label: 'Est. monthly charity total', value: `£${stats.totalCharityContributions.toFixed(2)}`, color: '#10b981' },
            { label: 'Avg contribution %', value: `${stats.avgCharityPercent}%`, color: 'var(--accent)' },
            { label: 'Users with charity selected', value: stats.usersWithCharity, color: '#8b5cf6' },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'var(--bg)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <p style={{ margin: '0 0 0.25rem', fontSize: '0.8rem', color: 'var(--text)' }}>{stat.label}</p>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Draw Stats */}
      <div className="card">
        <h2 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>Draw Statistics</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
          {[
            { label: 'Total draws', value: stats.totalDraws, color: 'var(--accent)' },
            { label: 'Published', value: stats.publishedDraws, color: '#10b981' },
            { label: 'Simulations', value: stats.simulations, color: '#f59e0b' },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'var(--bg)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <p style={{ margin: '0 0 0.25rem', fontSize: '0.8rem', color: 'var(--text)' }}>{stat.label}</p>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

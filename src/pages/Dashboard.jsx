import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/useAuth'
import { supabase } from '../lib/supabase'
import ScoreEntry from '../components/ScoreEntry'
import ScoreList from '../components/ScoreList'
import ProofUpload from '../components/ProofUpload'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [subscription, setSubscription] = useState(null)
  const [charities, setCharities] = useState([])
  const [selectedCharity, setSelectedCharity] = useState('')
  const [charityPercent, setCharityPercent] = useState(10)
  const [scoreRefresh, setScoreRefresh] = useState(0)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [recentDraws, setRecentDraws] = useState([])
  const [drawParticipation, setDrawParticipation] = useState({ entered: 0, upcoming: null })
  const [winnings, setWinnings] = useState({ totalWon: 0, pending: 0, paid: 0 })
  const [selectedPlan, setSelectedPlan] = useState('monthly')
  const [showPlanModal, setShowPlanModal] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    loadDashboardData()
  }, [user?.id])

  async function loadDashboardData() {
    try {
      const [subResult, charityResult, drawsResult, winnersResult] = await Promise.all([
        supabase.from('subscriptions').select('*').eq('user_id', user.id).eq('status', 'active').single(),
        supabase.from('charities').select('id, name'),
        supabase.from('draws').select('*').eq('status', 'published').order('created_at', { ascending: false }).limit(3),
        supabase.from('winners').select('prize_amount, payout_status').eq('user_id', user.id)
      ])

      if (subResult.data) setSubscription(subResult.data)
      if (charityResult.data) setCharities(charityResult.data)
      if (drawsResult.data) setRecentDraws(drawsResult.data)

      // Calculate draw participation
      const publishedDraws = drawsResult.data || []
      const currentMonth = new Date().toISOString().slice(0, 7)
      const nextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().slice(0, 7)
      setDrawParticipation({
        entered: publishedDraws.length,
        upcoming: nextMonth
      })

      if (winnersResult.data) {
        const total = winnersResult.data.reduce((sum, w) => sum + (w.prize_amount || 0), 0)
        const pending = winnersResult.data.filter(w => w.payout_status === 'pending').reduce((sum, w) => sum + (w.prize_amount || 0), 0)
        const paid = winnersResult.data.filter(w => w.payout_status === 'paid').reduce((sum, w) => sum + (w.prize_amount || 0), 0)
        setWinnings({ totalWon: total, pending, paid })
      }

      if (profile?.charity_id) setSelectedCharity(profile.charity_id)
      if (profile?.charity_percent) setCharityPercent(profile.charity_percent)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleScoreAdded() {
    setScoreRefresh(prev => prev + 1)
  }

  async function saveCharityPreference() {
    const { error } = await supabase
      .from('profiles')
      .update({ charity_id: selectedCharity, charity_percent: charityPercent })
      .eq('id', user.id)

    if (error) toast.error('Could not save preference')
    else toast.success('Charity preference saved!')
  }

  async function handleSubscribe() {
    if (subscribing) return
    setSubscribing(true)
    try {
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (existingSub) {
        toast.error('You already have an active subscription')
        return
      }

      const planDetails = selectedPlan === 'monthly'
        ? { amount: 9.99, days: 30 }
        : { amount: 99.99, days: 365 }

      const { error } = await supabase.from('subscriptions').insert({
        user_id: user.id,
        plan: selectedPlan,
        amount: planDetails.amount,
        status: 'active',
        renewal_date: new Date(Date.now() + planDetails.days * 24 * 60 * 60 * 1000).toISOString()
      })

      if (error) toast.error('Failed to subscribe: ' + error.message)
      else {
        toast.success('You are subscribed!')
        loadDashboardData()
      }
    } catch (error) {
      console.error('Subscription error', error)
      toast.error('Subscription failed')
    } finally {
      setSubscribing(false)
      setShowPlanModal(false)
    }
  }

  async function handleCancelSubscription() {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to score entry and draws.')) return
    setCancelling(true)
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (error) toast.error('Could not cancel subscription')
      else {
        toast.success('Subscription cancelled')
        setSubscription(null)
        loadDashboardData()
      }
    } catch (err) {
      toast.error('Cancellation failed')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading dashboard...</div>

  const isActive = subscription?.status === 'active'

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Welcome, {profile?.full_name || 'Golfer'}</h1>
        <p style={{ color: 'var(--text)' }}>Your Golf Charity dashboard</p>
      </div>

      {/* Subscription Card */}
      <div className="card" style={{
        marginBottom: '1.5rem',
        background: isActive ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' : 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
        borderColor: isActive ? '#6ee7b7' : '#fdba74'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: '1rem', color: isActive ? '#065f46' : '#9a3412' }}>
              Subscription: {isActive ? 'Active' : 'Inactive'}
            </p>
            {subscription ? (
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', color: isActive ? '#047857' : '#c2410c' }}>
                {subscription.plan === 'monthly' ? 'Monthly' : 'Yearly'} plan · ${subscription.amount}/{'monthly' === subscription.plan ? 'mo' : 'yr'} · Renews: {subscription.renewal_date ? new Date(subscription.renewal_date).toLocaleDateString() : 'N/A'}
              </p>
            ) : (
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', color: '#c2410c' }}>
                No active subscription
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {!isActive && (
              <button onClick={() => setShowPlanModal(true)} className="btn-primary" style={{ padding: '0.6rem 1.5rem' }}>
                Subscribe now
              </button>
            )}
            {isActive && (
              <button
                onClick={handleCancelSubscription}
                disabled={cancelling}
                style={{
                  padding: '0.6rem 1.25rem',
                  background: 'transparent',
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  cursor: cancelling ? 'not-allowed' : 'pointer',
                  opacity: cancelling ? 0.6 : 1
                }}
              >
                {cancelling ? 'Cancelling...' : 'Cancel subscription'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Plan Selection Modal */}
      {showPlanModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowPlanModal(false)}>
          <div className="card" style={{ maxWidth: '480px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1.5rem' }}>Choose your plan</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <label style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '1rem', border: selectedPlan === 'monthly' ? '2px solid var(--accent)' : '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', cursor: 'pointer', background: selectedPlan === 'monthly' ? 'var(--accent-light)' : 'transparent'
              }}>
                <div>
                  <span style={{ fontWeight: 600 }}>Monthly</span>
                  <span style={{ marginLeft: '0.5rem', color: 'var(--text)', fontSize: '0.9rem' }}>$9.99/mo</span>
                </div>
                <input type="radio" name="plan" checked={selectedPlan === 'monthly'} onChange={() => setSelectedPlan('monthly')} />
              </label>
              <label style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '1rem', border: selectedPlan === 'yearly' ? '2px solid var(--accent)' : '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', cursor: 'pointer', background: selectedPlan === 'yearly' ? 'var(--accent-light)' : 'transparent'
              }}>
                <div>
                  <span style={{ fontWeight: 600 }}>Yearly</span>
                  <span style={{ marginLeft: '0.5rem', color: 'var(--text)', fontSize: '0.9rem' }}>$99.99/yr <span style={{ color: 'var(--success)', fontSize: '0.8rem' }}>(Save 17%)</span></span>
                </div>
                <input type="radio" name="plan" checked={selectedPlan === 'yearly'} onChange={() => setSelectedPlan('yearly')} />
              </label>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setShowPlanModal(false)} style={{ flex: 1, padding: '0.75rem', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSubscribe} disabled={subscribing} className="btn-primary" style={{ flex: 1 }}>{subscribing ? 'Processing...' : 'Subscribe'}</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Scores Section */}
        <div className="card">
          <h2 style={{ marginBottom: '1.25rem' }}>My scores</h2>
          <ScoreEntry onScoreAdded={handleScoreAdded} isSubscribed={isActive} />
          <div style={{ marginTop: '1.5rem' }}>
            <ScoreList refresh={scoreRefresh} />
          </div>
        </div>

        {/* Winnings Section */}
        <div className="card">
          <h2 style={{ marginBottom: '1.25rem' }}>My winnings</h2>
          {winnings.totalWon > 0 ? (
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ background: 'var(--bg)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text)' }}>Total Won</p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '1.75rem', fontWeight: 700, color: 'var(--success)' }}>£{winnings.totalWon.toFixed(2)}</p>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1, background: 'var(--bg)', padding: '0.75rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text)' }}>Pending</p>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '1.1rem', fontWeight: 600, color: 'var(--warning)' }}>£{winnings.pending.toFixed(2)}</p>
                </div>
                <div style={{ flex: 1, background: 'var(--bg)', padding: '0.75rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text)' }}>Paid Out</p>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '1.1rem', fontWeight: 600, color: 'var(--accent)' }}>£{winnings.paid.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text)' }}>
              <p style={{ margin: 0 }}>No winnings yet</p>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem' }}>Enter your scores to participate in draws!</p>
            </div>
          )}
        </div>
      </div>

      {/* Participation Summary */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '1.25rem' }}>Draw participation</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'var(--bg)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text)' }}>Draws entered</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>{drawParticipation.entered}</p>
          </div>
          <div style={{ background: 'var(--bg)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text)' }}>Next draw</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-h)' }}>{drawParticipation.upcoming || 'TBD'}</p>
          </div>
          <div style={{ background: 'var(--bg)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text)' }}>Status</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '1.1rem', fontWeight: 600, color: isActive ? 'var(--success)' : 'var(--error)' }}>
              {isActive ? 'Eligible' : 'Not eligible'}
            </p>
          </div>
        </div>
      </div>

      {/* Charity Section */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '1.25rem' }}>My charity</h2>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
            Choose a charity
          </label>
          {charities.length === 0 ? (
            <p style={{ color: 'var(--text)', fontSize: '0.9rem', fontStyle: 'italic' }}>
              No charities available. Please check your database setup or visit the Charities page.
            </p>
          ) : (
            <select
              value={selectedCharity}
              onChange={e => setSelectedCharity(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.95rem',
                background: 'var(--bg)',
                color: 'var(--text-h)'
              }}
            >
              <option value="">-- Select a charity --</option>
              {charities.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
            Contribution: {charityPercent}% of your subscription
          </label>
          <input
            type="range"
            min="10" max="100" step="5"
            value={charityPercent}
            onChange={e => setCharityPercent(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text)', marginTop: '0.25rem' }}>
            <span>Min 10%</span>
            <span>100%</span>
          </div>
        </div>

        <button
          onClick={saveCharityPreference}
          disabled={!selectedCharity || charities.length === 0}
          style={{
            padding: '0.7rem 1.75rem',
            background: 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: (!selectedCharity || charities.length === 0) ? 'not-allowed' : 'pointer',
            opacity: (!selectedCharity || charities.length === 0) ? 0.6 : 1
          }}
        >
          Save preference
        </button>
      </div>

      {/* Recent Draws */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ margin: 0 }}>Recent Draws</h2>
          <Link to="/draws" style={{
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--accent)',
            color: 'white',
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontWeight: 500
          }}>View All</Link>
        </div>

        {recentDraws.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text)' }}>
            <p style={{ margin: 0 }}>No draws published yet</p>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem' }}>Check back after the next draw!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {recentDraws.map(draw => (
              <div key={draw.id} style={{
                background: 'var(--bg)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                border: '1px solid var(--border)'
              }}>
                <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', color: 'var(--accent)', fontWeight: 600 }}>
                  {draw.month}
                </h3>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  {draw.drawn_numbers.slice(0, 3).map(num => (
                    <span key={num} style={{
                      background: 'var(--accent)',
                      color: 'white',
                      borderRadius: '50%',
                      width: '26px',
                      height: '26px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      {num}
                    </span>
                  ))}
                  {draw.drawn_numbers.length > 3 && (
                    <span style={{ color: 'var(--text)', fontSize: '0.75rem', alignSelf: 'center' }}>
                      +{draw.drawn_numbers.length - 3} more
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text)' }}>
                  Jackpot: £{draw.prize_pool?.five_match?.toFixed(0) || '0'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Proof Upload Section */}
      <ProofUpload />
    </div>
  )
}
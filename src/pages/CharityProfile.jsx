import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/useAuth'
import toast from 'react-hot-toast'

export default function CharityProfile() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const [charity, setCharity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [donating, setDonating] = useState(false)
  const [donationAmount, setDonationAmount] = useState('20')

  useEffect(() => {
    async function fetchCharity() {
      const { data, error } = await supabase
        .from('charities')
        .select('*')
        .eq('id', id)
        .single()
      
      if (!error && data) setCharity(data)
      setLoading(false)
    }
    fetchCharity()
  }, [id])

  async function handleSelect() {
    if (!user) return toast.error('Please log in first')
    const { error } = await supabase.from('profiles').update({ charity_id: charity.id }).eq('id', user.id)
    if (error) toast.error('Failed to select charity')
    else toast.success('Charity selected for your subscription!')
  }

  async function handleDonate(e) {
    e.preventDefault()
    if (!user) return toast.error('Please log in to donate')
    
    setDonating(true)
    // Simulate Stripe independent donation logic
    setTimeout(() => {
      toast.success(`£${donationAmount} donated successfully to ${charity.name}! Thank you.`)
      setDonating(false)
    }, 1500)
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading charity details...</div>
  if (!charity) return <div style={{ textAlign: 'center', padding: '4rem' }}>Charity not found. <Link to="/charities">Go back</Link></div>

  const isSelected = profile?.charity_id === charity.id

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <Link to="/charities" style={{ display: 'inline-block', marginBottom: '2rem', color: 'var(--text)', textDecoration: 'none', fontSize: '0.9rem' }}>
        ← Back to all charities
      </Link>

      <div className="card" style={{ padding: '3rem 2rem', marginBottom: '2rem', background: charity.featured ? 'linear-gradient(135deg, var(--accent) 0%, #8b5cf6 100%)' : 'var(--bg-card)', color: charity.featured ? 'white' : 'var(--text-h)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-md)', background: charity.featured ? 'rgba(255,255,255,0.2)' : 'var(--accent-light)', color: charity.featured ? 'white' : 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.75rem' }}>
            {charity.name.charAt(0)}
          </div>
          <div>
            {charity.featured && <span style={{ background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600, display: 'inline-block', marginBottom: '0.5rem' }}>Featured Partner</span>}
            <h1 style={{ margin: 0, color: charity.featured ? 'white' : 'var(--text-h)', fontSize: '2rem' }}>{charity.name}</h1>
          </div>
        </div>

        <p style={{ fontSize: '1.1rem', lineHeight: 1.7, opacity: charity.featured ? 0.9 : 1, color: charity.featured ? 'white' : 'var(--text)', marginBottom: '2rem', maxWidth: '800px' }}>
          {charity.description || 'No detailed description available for this charity.'}
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {isSelected ? (
            <div style={{ padding: '0.75rem 1.5rem', background: charity.featured ? 'rgba(255,255,255,0.2)' : 'var(--accent-light)', color: charity.featured ? 'white' : 'var(--accent)', borderRadius: 'var(--radius-full)', fontWeight: 600 }}>
              ✓ You are currently supporting this charity
            </div>
          ) : (
            <button onClick={handleSelect} className={charity.featured ? "btn-secondary" : "btn-primary"} style={charity.featured ? { color: 'white', borderColor: 'rgba(255,255,255,0.5)' } : {}}>
              Support with Subscription
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <div className="card">
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Make a One-Off Donation</h2>
          <p style={{ color: 'var(--text)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Want to do more? You can make a direct, one-off donation to {charity.name} right now. Select an amount below.
          </p>

          <form onSubmit={handleDonate}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
              {['10', '20', '50'].map(amount => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setDonationAmount(amount)}
                  style={{
                    padding: '0.75rem',
                    background: donationAmount === amount ? 'var(--accent)' : 'var(--bg)',
                    color: donationAmount === amount ? 'white' : 'var(--text)',
                    border: donationAmount === amount ? 'none' : '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  £{amount}
                </button>
              ))}
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Custom Amount (Optional)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text)' }}>£</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={donationAmount}
                  onChange={e => setDonationAmount(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', fontSize: '1rem' }}
                />
              </div>
            </div>

            <button type="submit" disabled={donating || !donationAmount} className="btn-primary" style={{ width: '100%' }}>
              {donating ? 'Processing...' : `Donate £${donationAmount || '0'}`}
            </button>
            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text)', marginTop: '0.75rem' }}>Processed securely via Stripe.</p>
          </form>
        </div>

        <div className="card" style={{ background: 'var(--bg)' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>About this Charity</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <li style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text)' }}>Status</span>
              <span style={{ fontWeight: 500 }}>Registered Charity</span>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text)' }}>Tax Deductible</span>
              <span style={{ fontWeight: 500 }}>Yes (Gift Aid Eligible)</span>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text)' }}>Platform Partner since</span>
              <span style={{ fontWeight: 500 }}>2026</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

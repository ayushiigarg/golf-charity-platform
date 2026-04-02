import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'

export default function Home() {
  const { user } = useAuth()

  return (
    <div style={{ paddingBottom: '4rem' }}>

      {/* HERO SECTION */}
      <section style={{
        textAlign: 'center',
        padding: '5rem 1rem 4rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          height: '800px',
          background: 'radial-gradient(circle, var(--accent-light) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: -1
        }} />

        <div className="animate-fade-in-up" style={{ opacity: 0 }}>
          <span style={{
            display: 'inline-block',
            background: 'var(--accent-light)',
            color: 'var(--accent)',
            padding: '0.5rem 1.25rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.875rem',
            fontWeight: 600,
            marginBottom: '1.5rem'
          }}>
            Golf · Charity · Prizes
          </span>
        </div>

        <h1 className="animate-fade-in-up stagger-1" style={{
          opacity: 0,
          marginBottom: '1.5rem',
          maxWidth: '720px',
          margin: '0 auto 1.5rem'
        }}>
          Play golf.<span style={{ color: 'var(--accent)' }}> Support charity.</span><br />
          Win prizes.
        </h1>

        <p className="animate-fade-in-up stagger-2" style={{
          opacity: 0,
          fontSize: '1.15rem',
          color: 'var(--text)',
          maxWidth: '540px',
          margin: '0 auto 2.5rem',
          lineHeight: 1.7
        }}>
          Subscribe, enter your Stableford scores, and take part in monthly
          prize draws — while a portion of every subscription goes directly
          to a charity you believe in.
        </p>

        <div className="animate-fade-in-up stagger-3" style={{ opacity: 0 }}>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {user ? (
              <Link to="/dashboard" className="btn-primary">
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-primary">
                  Get started
                </Link>
                <Link to="/login" className="btn-secondary">
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '2rem 1rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.5rem',
          maxWidth: '900px',
          margin: '0 auto'
        }}>
          {[
            { step: '1', title: 'Subscribe', desc: 'Choose a monthly or yearly plan. A portion goes straight to your chosen charity.', icon: '💎' },
            { step: '2', title: 'Enter scores', desc: 'Log your last 5 Stableford scores. These are your draw entries.', icon: '⛳' },
            { step: '3', title: 'Win prizes', desc: 'Monthly draws match your scores. 3, 4, or 5 matches win from the prize pool.', icon: '🏆' },
          ].map((item, i) => (
            <div key={item.step} className="card animate-fade-in-up" style={{
              opacity: 0,
              animationDelay: `${0.3 + i * 0.15}s`
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <span style={{
                  fontSize: '1.5rem'
                }}>{item.icon}</span>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.9rem'
                }}>
                  {item.step}
                </div>
              </div>
              <h3 style={{ marginBottom: '0.5rem' }}>{item.title}</h3>
              <p style={{ fontSize: '0.95rem', color: 'var(--text)', lineHeight: 1.6 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* PRIZE POOL */}
      <section style={{ padding: '3rem 1rem' }}>
        <div className="card" style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%)',
          color: 'white',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <h2 style={{ color: 'white', marginBottom: '1.5rem', fontSize: '1.4rem' }}>
            Prize pool breakdown
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1.25rem'
          }}>
            {[
              { match: '5 numbers', share: '40%', label: 'Jackpot — rolls over if unclaimed' },
              { match: '4 numbers', share: '35%', label: 'Split equally among winners' },
              { match: '3 numbers', share: '25%', label: 'Split equally among winners' },
            ].map((tier, i) => (
              <div key={tier.match} style={{
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.25rem' }}>
                  {tier.match}
                </p>
                <p style={{
                  margin: '0 0 0.5rem',
                  fontSize: '2rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  {tier.share}
                </p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                  {tier.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div className="animate-fade-in-up" style={{ opacity: 0 }}>
            <h2 style={{ marginBottom: '0.75rem' }}>Ready to make a difference?</h2>
            <p style={{ color: 'var(--text)', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem' }}>
              Join golfers supporting great causes — and maybe win some prizes too.
            </p>
            <Link to="/register" className="btn-primary" style={{ padding: '1rem 2.5rem' }}>
              Create free account
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      background: 'var(--bg)',
      padding: '4rem 1.5rem',
      marginTop: 'auto'
    }}>
      <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', marginBottom: '3rem' }}>
          
          <div style={{ flex: 1 }}>
            <Link to="/" style={{
              color: 'var(--text-h)',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '1.25rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <span style={{
                width: '28px', height: '28px', borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--accent) 0%, #a855f7 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: '0.9rem'
              }}>🎯</span>
              Golf Charity
            </Link>
            <p style={{ color: 'var(--text)', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: '280px' }}>
              Subscribe, play, and win while making a real difference. Turning stableford scores into charitable impact.
            </p>
          </div>

          <div>
            <h4 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-h)' }}>Platform</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li><Link to="/charities" style={{ color: 'var(--text)', textDecoration: 'none', fontSize: '0.9rem' }}>Our Charities</Link></li>
              <li><Link to="/draws" style={{ color: 'var(--text)', textDecoration: 'none', fontSize: '0.9rem' }}>Monthly Draws</Link></li>
              <li><Link to="/login" style={{ color: 'var(--text)', textDecoration: 'none', fontSize: '0.9rem' }}>Sign In</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-h)' }}>Support</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li><a href="#" style={{ color: 'var(--text)', textDecoration: 'none', fontSize: '0.9rem' }}>Help Center</a></li>
              <li><a href="#" style={{ color: 'var(--text)', textDecoration: 'none', fontSize: '0.9rem' }}>Contact Us</a></li>
              <li><a href="#" style={{ color: 'var(--text)', textDecoration: 'none', fontSize: '0.9rem' }}>Terms of Service</a></li>
              <li><a href="#" style={{ color: 'var(--text)', textDecoration: 'none', fontSize: '0.9rem' }}>Privacy Policy</a></li>
            </ul>
          </div>

        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
          <p style={{ margin: 0, color: 'var(--text)', fontSize: '0.85rem' }}>
            © {new Date().getFullYear()} Golf Charity Platform. Project by Digital Heroes.
          </p>
        </div>
      </div>
    </footer>
  )
}

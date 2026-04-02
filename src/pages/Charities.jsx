import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'
import toast from 'react-hot-toast'

export default function Charities() {
  const { user, profile } = useAuth()
  const [charities, setCharities] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  async function fetchCharities() {
    const { data, error } = await supabase
      .from('charities')
      .select('*')
      .order('featured', { ascending: false })
      .order('name', { ascending: true })

    if (error || !data || data.length === 0) {
      setCharities(fallbackCharities)
      setFiltered(fallbackCharities)
    } else {
      setCharities(data)
      setFiltered(data)
    }
    setLoading(false)
  }

  useEffect(() => { fetchCharities() }, [])

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(charities)
    } else {
      setFiltered(charities.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.description?.toLowerCase().includes(search.toLowerCase())
      ))
    }
  }, [search, charities])

  const fallbackCharities = [
    { id: 'fallback-1', name: 'Cancer Research UK', description: 'Leading cancer research charity in the UK, funding groundbreaking research to save lives.', featured: true },
    { id: 'fallback-2', name: 'British Heart Foundation', description: 'Fighting heart and circulatory diseases through research, education and campaigning.', featured: true },
    { id: 'fallback-3', name: 'NSPCC', description: 'The UK\'s leading children\'s charity, preventing abuse and helping those affected.', featured: true },
    { id: 'fallback-4', name: 'Oxfam', description: 'International charity working to end poverty and injustice around the world.', featured: false },
    { id: 'fallback-5', name: 'RSPCA', description: 'The oldest and largest animal welfare charity in the world.', featured: false }
  ]

  const navigate = useNavigate()

  async function selectCharity(charityId) {
    navigate(`/charities/${charityId}`)
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading charities...</div>

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Charities</h1>
        <p style={{ color: 'var(--text)', marginBottom: '1.5rem' }}>Choose a cause to support with your subscription</p>
        
        <input
          type="text"
          placeholder="Search charities..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', maxWidth: '420px',
            padding: '0.75rem 1rem',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.95rem',
            boxSizing: 'border-box',
            background: 'var(--bg-card)',
            color: 'var(--text-h)'
          }}
        />
        <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text)' }}>
          {filtered.length} {filtered.length === 1 ? 'charity' : 'charities'} found
        </p>
      </div>

      {!search && charities.some(c => c.featured) && (
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1rem', color: 'var(--accent)', marginBottom: '1rem' }}>Featured charity</h2>
          {charities.filter(c => c.featured).map(charity => (
            <FeaturedCard key={charity.id} charity={charity} isSelected={profile?.charity_id === charity.id} onSelect={() => selectCharity(charity.id)} loggedIn={!!user} />
          ))}
        </div>
      )}

      <h2 style={{ fontSize: '1rem', color: 'var(--text)', marginBottom: '1rem' }}>{search ? 'Search results' : 'All charities'}</h2>

      {filtered.length === 0 ? (
        <p style={{ color: 'var(--text)', fontStyle: 'italic' }}>No charities match your search.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {filtered.map(charity => (
            <CharityCard key={charity.id} charity={charity} isSelected={profile?.charity_id === charity.id} onSelect={() => selectCharity(charity.id)} loggedIn={!!user} />
          ))}
        </div>
      )}
    </div>
  )
}

function FeaturedCard({ charity, isSelected, onSelect }) {
  return (
    <div className="card" onClick={onSelect} style={{ cursor: 'pointer', background: 'linear-gradient(135deg, var(--accent) 0%, #8b5cf6 100%)', color: 'white', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.75rem', display: 'inline-block' }}>Featured</span>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem', color: 'white' }}>{charity.name}</h2>
          <p style={{ margin: 0, opacity: 0.85, fontSize: '0.95rem', maxWidth: '500px' }}>{charity.description}</p>
        </div>
        <div>
          {isSelected ? (
            <span style={{ background: 'rgba(255,255,255,0.25)', color: 'white', padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.9rem' }}>Your charity</span>
          ) : (
            <button style={{ background: 'white', color: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-md)', padding: '0.6rem 1.25rem', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
              View Profile
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function CharityCard({ charity, isSelected, onSelect }) {
  return (
    <div className="card" onClick={onSelect} style={{ cursor: 'pointer', border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)', padding: '1.25rem' }}>
      <div>
        <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.75rem' }}>
          {charity.name.charAt(0)}
        </div>
        <h3 style={{ margin: '0 0 0.4rem', fontSize: '1rem' }}>
          {charity.name}
          {charity.featured && <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', background: 'var(--accent-light)', color: 'var(--accent)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', fontWeight: 600, verticalAlign: 'middle' }}>Featured</span>}
        </h3>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.5 }}>{charity.description || 'No description available.'}</p>
      </div>
      {isSelected ? (
        <div style={{ textAlign: 'center', padding: '0.5rem', background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 600, marginTop: '1rem' }}>Your current charity</div>
      ) : (
        <button style={{ width: '100%', padding: '0.6rem', background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', marginTop: '1rem' }}>
          View Profile
        </button>
      )}
    </div>
  )
}
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/useAuth'
import toast from 'react-hot-toast'

export default function ScoreEntry({ onScoreAdded, isSubscribed = false }) {
  const { user } = useAuth()
  const [value, setValue] = useState('')
  const [playedOn, setPlayedOn] = useState('')
  const [loading, setLoading] = useState(false)
  const [scoreCount, setScoreCount] = useState(0)

  useEffect(() => {
    if (!user?.id) return
    loadScoreCount()
  }, [user?.id])

  async function loadScoreCount() {
    const { count } = await supabase
      .from('scores')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
    setScoreCount(count || 0)
  }

  async function handleSubmit(e) {
    e.preventDefault()

    const score = parseInt(value)
    if (score < 1 || score > 45) {
      toast.error('Score must be between 1 and 45')
      return
    }

    setLoading(true)

    try {
      if (scoreCount >= 5) {
        const { data: oldestScore } = await supabase
          .from('scores')
          .select('id')
          .eq('user_id', user.id)
          .order('played_on', { ascending: true })
          .limit(1)
          .single()

        if (oldestScore) {
          await supabase
            .from('scores')
            .update({ value: score, played_on: playedOn })
            .eq('id', oldestScore.id)
          
          toast.success('Score updated! (Replaced oldest)')
        }
      } else {
        await supabase.from('scores').insert({
          user_id: user.id,
          value: score,
          played_on: playedOn
        })
        toast.success('Score added!')
      }

      setValue('')
      setPlayedOn('')
      loadScoreCount()
      onScoreAdded()
    } catch (err) {
      toast.error('Failed to save score')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: 'var(--accent-light)',
      border: '1px solid var(--accent-glow)',
      borderRadius: 'var(--radius-md)',
      padding: '1.25rem'
    }}>
      {!isSubscribed ? (
        <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text)' }}>
          <p style={{ margin: '0 0 0.5rem', fontWeight: 600, color: 'var(--text-h)' }}>Subscription required</p>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>Subscribe to start entering scores and participating in draws.</p>
        </div>
      ) : (
      <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem' }}>Add a score</h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--text)', background: 'var(--bg)', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-full)' }}>
          {scoreCount}/5 scores
        </span>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: '140px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text)', fontWeight: 500 }}>
            Stableford score (1–45)
          </label>
          <input
            type="number"
            value={value}
            onChange={e => setValue(e.target.value)}
            min="1" max="45"
            required
            placeholder="e.g. 36"
            style={{
              width: '100%',
              padding: '0.65rem 0.9rem',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.95rem',
              boxSizing: 'border-box',
              background: 'var(--bg-card)',
              color: 'var(--text-h)'
            }}
          />
        </div>

        <div style={{ flex: 1, minWidth: '160px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text)', fontWeight: 500 }}>
            Date played
          </label>
          <input
            type="date"
            value={playedOn}
            onChange={e => setPlayedOn(e.target.value)}
            required
            max={new Date().toISOString().split('T')[0]}
            style={{
              width: '100%',
              padding: '0.65rem 0.9rem',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.95rem',
              boxSizing: 'border-box',
              background: 'var(--bg-card)',
              color: 'var(--text-h)'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '0.65rem 1.5rem',
            background: 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            whiteSpace: 'nowrap'
          }}
        >
          {loading ? 'Saving...' : scoreCount >= 5 ? 'Update (replace oldest)' : 'Add score'}
        </button>
      </form>
      </>
      )}
    </div>
  )
}
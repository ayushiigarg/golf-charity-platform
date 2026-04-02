import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/useAuth'
import toast from 'react-hot-toast'

export default function ScoreList({ refresh }) {
  const { user } = useAuth()
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    loadScores()
  }, [refresh, user?.id])

  async function loadScores() {
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', user.id)
      .order('played_on', { ascending: false })
      .limit(5)

    if (!error) setScores(data)
    setLoading(false)
  }

  async function deleteScore(id) {
    const { error } = await supabase
      .from('scores')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Could not delete score')
    } else {
      toast.success('Score removed')
      loadScores()
    }
  }

  if (loading) return <p style={{ color: 'var(--text)' }}>Loading scores...</p>

  if (scores.length === 0) return (
    <p style={{ color: 'var(--text)', fontStyle: 'italic' }}>
      No scores yet. Add your first score above.
    </p>
  )

  return (
    <div>
      <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>
        Your scores ({scores.length}/5)
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {scores.map((score, index) => (
          <div key={score.id} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: index === 0 ? 'var(--accent-light)' : 'var(--bg)',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{
                fontSize: '0.8rem',
                color: 'var(--text)',
                minWidth: '90px'
              }}>
                {new Date(score.played_on).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <span style={{
                fontWeight: 700,
                fontSize: '1.1rem',
                color: 'var(--accent)'
              }}>
                {score.value}
              </span>
            </div>
            <button
              onClick={() => deleteScore(score.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--error)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 500,
                padding: '0.3rem 0.6rem',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
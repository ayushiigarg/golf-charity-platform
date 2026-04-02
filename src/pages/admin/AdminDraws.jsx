import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function AdminDraws() {
  const [mode, setMode] = useState('random')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [draws, setDraws] = useState([])
  const [publishing, setPublishing] = useState(false)

  useEffect(() => {
    async function loadDraws() {
      const { data } = await supabase
        .from('draws')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
      if (data) setDraws(data)
    }

    loadDraws()
  }, [])

  async function fetchDraws() {
    const { data } = await supabase
      .from('draws')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    if (data) setDraws(data)
  }

  async function runDraw(publish = false) {
    publish ? setPublishing(true) : setLoading(true)

    try {
      // For now, use local implementation instead of Edge Function
      // TODO: Replace with Edge Function call when deployed
      const result = await runDrawLocally(mode, publish)

      setResult(result)
      toast.success(publish ? 'Draw published!' : 'Simulation complete!')
      fetchDraws() // refresh draw history

    } catch (err) {
      console.error('Draw error:', err)
      toast.error(err.message || 'Failed to run draw')
    }

    publish ? setPublishing(false) : setLoading(false)
  }

  // Local implementation of draw logic (fallback when Edge Function isn't available)
  async function runDrawLocally(mode, publish) {
    // Get active subscriptions
    const { data: activeSubs, error: subError } = await supabase
      .from('subscriptions')
      .select('user_id, amount')
      .eq('status', 'active')

    if (subError) throw new Error('Failed to fetch subscriptions')
    if (!activeSubs || activeSubs.length === 0) {
      throw new Error('No active subscribers found')
    }

    const activeUserIds = activeSubs.map(s => s.user_id)
    const totalPool = activeSubs.reduce((sum, s) => sum + (s.amount || 0), 0)

    // Get last draw for rollover
    const { data: lastDraw } = await supabase
      .from('draws')
      .select('jackpot_rollover')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const rolloverAmount = lastDraw?.jackpot_rollover || 0

    // Generate numbers
    let drawnNumbers = mode === 'weighted'
      ? await generateWeightedDraw(activeUserIds)
      : generateRandomDraw()

    // Get scores and calculate winners
    const { data: allScores, error: scoreError } = await supabase
      .from('scores')
      .select('user_id, value')
      .in('user_id', activeUserIds)

    if (scoreError) throw new Error('Failed to fetch scores')

    const scoresByUser = {}
    for (const score of allScores || []) {
      if (!scoresByUser[score.user_id]) {
        scoresByUser[score.user_id] = []
      }
      scoresByUser[score.user_id].push(score.value)
    }

    const winners = []
    for (const userId in scoresByUser) {
      const scores = scoresByUser[userId]
      const matches = scores.filter(s => drawnNumbers.includes(s)).length
      if (matches >= 3) {
        winners.push({
          user_id: userId,
          match_type: String(Math.min(matches, 5)),
          matches
        })
      }
    }

    const fiveMatch = winners.filter(w => w.match_type === '5')
    const fourMatch = winners.filter(w => w.match_type === '4')
    const threeMatch = winners.filter(w => w.match_type === '3')

    const prizePool = {
      five_match: totalPool * 0.40 + rolloverAmount,
      four_match: totalPool * 0.35,
      three_match: totalPool * 0.25,
      total: totalPool,
      rollover_included: rolloverAmount
    }

    const fivePrize = fiveMatch.length ? prizePool.five_match / fiveMatch.length : prizePool.five_match
    const fourPrize = fourMatch.length ? prizePool.four_match / fourMatch.length : prizePool.four_match
    const threePrize = threeMatch.length ? prizePool.three_match / threeMatch.length : prizePool.three_match

    const newJackpotRollover = fiveMatch.length === 0 ? prizePool.five_match : 0
    const month = new Date().toISOString().slice(0, 7)

    // Save draw
    const { data: draw, error: drawError } = await supabase
      .from('draws')
      .insert({
        month,
        drawn_numbers: drawnNumbers,
        mode,
        status: publish ? 'published' : 'simulation',
        prize_pool: {
          five_match: prizePool.five_match,
          four_match: prizePool.four_match,
          three_match: prizePool.three_match,
          total: prizePool.total,
          rollover_included: prizePool.rollover_included
        },
        jackpot_rollover: newJackpotRollover
      })
      .select()
      .single()

    if (drawError) throw new Error('Failed to save draw: ' + drawError.message)

    // Save winners if publishing
    if (publish && winners.length > 0) {
      const winnerRows = winners.map(w => ({
        draw_id: draw.id,
        user_id: w.user_id,
        match_type: w.match_type,
        prize_amount:
          w.match_type === '5' ? fivePrize :
          w.match_type === '4' ? fourPrize : threePrize,
        payout_status: 'pending',
        admin_verified: false
      }))

      const { error: winError } = await supabase.from('winners').insert(winnerRows)
      if (winError) throw new Error('Failed to save winners: ' + winError.message)
    }

    return {
      draw_id: draw.id,
      month,
      drawn_numbers: drawnNumbers,
      mode,
      status: publish ? 'published' : 'simulation',
      prize_pool: {
        five_match: prizePool.five_match,
        four_match: prizePool.four_match,
        three_match: prizePool.three_match,
        total: prizePool.total,
        rollover_included: prizePool.rollover_included
      },
      winners: {
        five_match: { count: fiveMatch.length },
        four_match: { count: fourMatch.length },
        three_match: { count: threeMatch.length }
      },
      total_winners: winners.length,
      jackpot_rollover: newJackpotRollover
    }
  }

  // Helper functions
  function generateRandomDraw() {
    const numbers = new Set()
    while (numbers.size < 5) {
      numbers.add(Math.floor(Math.random() * 45) + 1)
    }
    return Array.from(numbers)
  }

  // async function generateWeightedDraw(userIds) {
  //   const { data: scores } = await supabase
  //     .from('scores')
  //     .select('value')
  //     .in('user_id', userIds)

  //   if (!scores || scores.length === 0) return generateRandomDraw()

  //   const freq = {}
  //   for (const s of scores) {
  //     freq[s.value] = (freq[s.value] || 0) + 1
  //   }

  //   const pool = []
  //   for (const value in freq) {
  //     for (let i = 0; i < freq[value]; i++) {
  //       pool.push(Number(value))
  //     }
  //   }

  //   const picked = new Set()
  //   while (picked.size < 5) {
  //     const random = pool[Math.floor(Math.random() * pool.length)]
  //     picked.add(random)
  //   }

  //   return Array.from(picked)
  // }
async function generateWeightedDraw(userIds) {
  // 1. Guard for empty userIds
  if (!userIds || userIds.length === 0) {
    return generateRandomDraw()
  }

  // 2. Fetch scores safely
  const { data: scores, error } = await supabase
    .from('scores')
    .select('value')
    .in('user_id', userIds)

  if (error || !scores || scores.length === 0) {
    console.error('Error fetching scores:', error)
    return generateRandomDraw()
  }

  // 3. Build frequency map safely
  const freq = {}
  for (const s of scores) {
    if (s.value != null) {
      freq[s.value] = (freq[s.value] || 0) + 1
    }
  }

  // 4. Build weighted pool
  const pool = []
  for (const value in freq) {
    for (let i = 0; i < freq[value]; i++) {
      pool.push(Number(value))
    }
  }

  // 5. If pool is empty → fallback
  if (pool.length === 0) {
    return generateRandomDraw()
  }

  // 6. Ensure enough unique values
  const uniqueValues = [...new Set(pool)]
  if (uniqueValues.length < 5) {
    return generateRandomDraw()
  }

  // 7. Pick 5 unique numbers safely
  const picked = new Set()
  let attempts = 0

  while (picked.size < 5 && attempts < 100) {
    const random = pool[Math.floor(Math.random() * pool.length)]
    picked.add(random)
    attempts++
  }

  // 8. Final safety fallback
  if (picked.size < 5) {
    return generateRandomDraw()
  }

  return Array.from(picked)
}
  return (
    <div>
      <h1 style={{ marginBottom: '0.25rem' }}>Draw management</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Run simulations first, then publish when ready
      </p>

      {/* ── DRAW CONTROLS ── */}
      <div style={{
        background: 'white', border: '1px solid #eee',
        borderRadius: '10px', padding: '1.5rem', marginBottom: '2rem'
      }}>
        <h2 style={{ marginTop: 0, fontSize: '1rem', marginBottom: '1rem' }}>Run a draw</h2>

        {/* Mode selector */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
            Draw mode
          </label>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {['random', 'weighted'].map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  padding: '0.5rem 1.25rem',
                  background: mode === m ? '#534AB7' : 'white',
                  color: mode === m ? 'white' : '#534AB7',
                  border: '1px solid #534AB7',
                  borderRadius: '8px', cursor: 'pointer',
                  fontWeight: 500, fontSize: '0.9rem',
                  textTransform: 'capitalize'
                }}
              >
                {m}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.4rem' }}>
            {mode === 'random'
              ? 'Picks 5 completely random numbers between 1 and 45'
              : 'Weights numbers by how frequently they appear in user scores'}
          </p>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => runDraw(false)}
            disabled={loading}
            style={{
              padding: '0.6rem 1.5rem',
              background: '#f0f0f0', color: '#333',
              border: 'none', borderRadius: '8px',
              fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Simulating...' : 'Run simulation'}
          </button>

          <button
            onClick={() => runDraw(true)}
            disabled={publishing || !result}
            style={{
              padding: '0.6rem 1.5rem',
              background: result ? '#2e7d32' : '#ccc',
              color: 'white', border: 'none', borderRadius: '8px',
              fontWeight: 500,
              cursor: (publishing || !result) ? 'not-allowed' : 'pointer',
              opacity: publishing ? 0.7 : 1
            }}
          >
            {publishing ? 'Publishing...' : 'Publish draw'}
          </button>
        </div>

        {!result && (
          <p style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '0.5rem' }}>
            Run a simulation first before publishing
          </p>
        )}
      </div>

      {/* ── SIMULATION RESULT ── */}
      {result && (
        <div style={{
          background: '#f8f8ff', border: '1px solid #e0deff',
          borderRadius: '10px', padding: '1.5rem', marginBottom: '2rem'
        }}>
          <h2 style={{ marginTop: 0, fontSize: '1rem', marginBottom: '1rem', color: '#534AB7' }}>
            {result.status === 'published' ? 'Published draw result' : 'Simulation result'} — {result.month}
          </h2>

          {/* Drawn numbers */}
          <div style={{ marginBottom: '1.25rem' }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', fontWeight: 500, color: '#555' }}>
              Drawn numbers
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {result.drawn_numbers.map(n => (
                <div key={n} style={{
                  width: '44px', height: '44px',
                  background: '#534AB7', color: 'white',
                  borderRadius: '50%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '1rem'
                }}>
                  {n}
                </div>
              ))}
            </div>
          </div>

          {/* Prize pool */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '0.75rem', marginBottom: '1.25rem'
          }}>
            {(() => {
              const totalPool = result.prize_pool?.total ?? 0
              const fallback = totalPool > 0 ? {
                five_match: totalPool * 0.4,
                four_match: totalPool * 0.35,
                three_match: totalPool * 0.25
              } : {
                five_match: 0,
                four_match: 0,
                three_match: 0
              }

              const resolved = {
                five_match: (result.prize_pool?.five_match ?? fallback.five_match),
                four_match: (result.prize_pool?.four_match ?? fallback.four_match),
                three_match: (result.prize_pool?.three_match ?? fallback.three_match)
              }

              return [
                { label: '5-match jackpot', value: `£${resolved.five_match.toFixed(2)}`, count: result.winners.five_match.count },
                { label: '4-match prize', value: `£${resolved.four_match.toFixed(2)}`, count: result.winners.four_match.count },
                { label: '3-match prize', value: `£${resolved.three_match.toFixed(2)}`, count: result.winners.three_match.count },
              ]
            })().map(tier => (
              <div key={tier.label} style={{
                background: 'white', borderRadius: '8px',
                padding: '0.75rem 1rem', border: '1px solid #e0deff'
              }}>
                <p style={{ margin: '0 0 0.2rem', fontSize: '0.78rem', color: '#888' }}>{tier.label}</p>
                <p style={{ margin: '0 0 0.2rem', fontSize: '1.2rem', fontWeight: 700, color: '#534AB7' }}>
                  {tier.value}
                </p>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#666' }}>
                  {tier.count} winner{tier.count !== 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>

          {/* Jackpot rollover notice */}
          {result.jackpot_rollover > 0 && (
            <div style={{
              background: '#fff3e0', border: '1px solid #ffcc80',
              borderRadius: '8px', padding: '0.75rem 1rem',
              fontSize: '0.875rem', color: '#e65100'
            }}>
              No 5-match winner — £{result.jackpot_rollover.toFixed(2)} rolls over to next month's jackpot
            </div>
          )}

          <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#666' }}>
            Total winners: {result.total_winners} · Mode: {result.mode}
          </p>
        </div>
      )}

      {/* ── DRAW HISTORY ── */}
      <div style={{
        background: 'white', border: '1px solid #eee',
        borderRadius: '10px', padding: '1.5rem'
      }}>
        <h2 style={{ marginTop: 0, fontSize: '1rem', marginBottom: '1rem' }}>Draw history</h2>

        {draws.length === 0 ? (
          <p style={{ color: '#888', fontStyle: 'italic' }}>No draws yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem 0.75rem', color: '#555' }}>Month</th>
                <th style={{ padding: '0.5rem 0.75rem', color: '#555' }}>Numbers</th>
                <th style={{ padding: '0.5rem 0.75rem', color: '#555' }}>Mode</th>
                <th style={{ padding: '0.5rem 0.75rem', color: '#555' }}>Status</th>
                <th style={{ padding: '0.5rem 0.75rem', color: '#555' }}>Pool</th>
              </tr>
            </thead>
            <tbody>
              {draws.map(draw => (
                <tr key={draw.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '0.6rem 0.75rem', fontWeight: 500 }}>{draw.month}</td>
                  <td style={{ padding: '0.6rem 0.75rem' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {draw.drawn_numbers.map(n => (
                        <span key={n} style={{
                          background: '#EEEDFE', color: '#534AB7',
                          borderRadius: '50%', width: '26px', height: '26px',
                          display: 'inline-flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600
                        }}>
                          {n}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem', textTransform: 'capitalize', color: '#666' }}>
                    {draw.mode}
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem' }}>
                    <span style={{
                      background: draw.status === 'published' ? '#e8f5e9' : '#fff3e0',
                      color: draw.status === 'published' ? '#2e7d32' : '#e65100',
                      padding: '0.2rem 0.6rem', borderRadius: '10px',
                      fontSize: '0.78rem', fontWeight: 500
                    }}>
                      {draw.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem', color: '#666' }}>
                    £{draw.prize_pool?.total?.toFixed(2) || '0.00'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ✅ Safe JSON parsing
    let body = {}
    try {
      body = await req.json()
    } catch {
      body = {}
    }

    const { mode = 'random', publish = false } = body

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    // ── STEP 1: Active subscriptions ──
    const { data: activeSubs, error: subError } = await supabase
      .from('subscriptions')
      .select('user_id, amount')
      .eq('status', 'active')

    if (subError) throw subError

    if (!activeSubs || activeSubs.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No active subscribers found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const activeUserIds = activeSubs.map(s => s.user_id)

    // ── STEP 2: Prize pool ──
    const totalPool = activeSubs.reduce((sum, s) => sum + (s.amount || 0), 0)

    const { data: lastDraw } = await supabase
      .from('draws')
      .select('jackpot_rollover')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const rolloverAmount = lastDraw?.jackpot_rollover || 0

    const prizePool = {
      five_match: totalPool * 0.50 + rolloverAmount,
      four_match: totalPool * 0.30,
      three_match: totalPool * 0.20,
      total: totalPool,
      rollover_included: rolloverAmount
    }

    // ── STEP 3: Draw numbers ──
    let drawnNumbers = mode === 'weighted'
      ? await generateWeightedDraw(supabase, activeUserIds)
      : generateRandomDraw()

    // ── STEP 4: Get scores ──
    const { data: allScores, error: scoreError } = await supabase
      .from('scores')
      .select('user_id, value')
      .in('user_id', activeUserIds)

    if (scoreError) throw scoreError

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

    const fivePrize = fiveMatch.length ? prizePool.five_match / fiveMatch.length : prizePool.five_match
    const fourPrize = fourMatch.length ? prizePool.four_match / fourMatch.length : prizePool.four_match
    const threePrize = threeMatch.length ? prizePool.three_match / threeMatch.length : prizePool.three_match

    const newJackpotRollover = fiveMatch.length === 0 ? prizePool.five_match : 0

    const month = new Date().toISOString().slice(0, 7)

    // ── STEP 5: Save draw ──
    const { data: draw, error: drawError } = await supabase
      .from('draws')
      .insert({
        month,
        drawn_numbers: drawnNumbers,
        mode,
        status: publish ? 'published' : 'simulation',
        prize_pool: prizePool,
        jackpot_rollover: newJackpotRollover
      })
      .select()
      .single()

    if (drawError) throw drawError

    // ── STEP 6: Save winners ──
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
      if (winError) throw winError
    }

    // ── STEP 7: Return complete draw result ──
    const result = {
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
        five_match: { count: fiveMatch.length, per_winner: fivePrize },
        four_match: { count: fourMatch.length, per_winner: fourPrize },
        three_match: { count: threeMatch.length, per_winner: threePrize }
      },
      total_winners: winners.length,
      jackpot_rollover: newJackpotRollover,
      total_subscribers: activeSubs.length,
      total_pool: totalPool
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// ✅ Random draw
function generateRandomDraw() {
  const numbers = new Set()
  while (numbers.size < 5) {
    numbers.add(Math.floor(Math.random() * 45) + 1)
  }
  return Array.from(numbers)
}

// ✅ Weighted draw
async function generateWeightedDraw(supabase, userIds) {
  const { data: scores } = await supabase
    .from('scores')
    .select('value')
    .in('user_id', userIds)

  if (!scores || scores.length === 0) return generateRandomDraw()

  const freq = {}

  for (const s of scores) {
    freq[s.value] = (freq[s.value] || 0) + 1
  }

  const pool = []
  for (const value in freq) {
    for (let i = 0; i < freq[value]; i++) {
      pool.push(Number(value))
    }
  }

  const picked = new Set()
  while (picked.size < 5) {
    const random = pool[Math.floor(Math.random() * pool.length)]
    picked.add(random)
  }

  return Array.from(picked)
}
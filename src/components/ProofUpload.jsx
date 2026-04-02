import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/useAuth'
import toast from 'react-hot-toast'

export default function ProofUpload() {
  const { user } = useAuth()
  const [myWinnings, setMyWinnings] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState({})

  useEffect(() => {
    if (!user?.id) return
    loadWinnings()
  }, [user?.id])

  async function loadWinnings() {
    const { data, error } = await supabase
      .from('winners')
      .select('*, draws (month)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error) setMyWinnings(data || [])
    setLoading(false)
  }

  async function handleProofUpload(winnerId, file) {
    if (!file) return
    
    setUploading(prev => ({ ...prev, [winnerId]: true }))
    
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${winnerId}-${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('proofs')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('proofs')
        .getPublicUrl(fileName)

      const { error: updateError } = await supabase
        .from('winners')
        .update({ proof_url: publicUrl })
        .eq('id', winnerId)

      if (updateError) throw updateError

      toast.success('Proof uploaded!')
      loadWinnings()
    } catch (err) {
      console.error('Upload error:', err)
      toast.error('Failed to upload proof')
    } finally {
      setUploading(prev => ({ ...prev, [winnerId]: false }))
    }
  }

  if (loading) return <p style={{ color: 'var(--text)' }}>Loading...</p>

  if (myWinnings.length === 0) return null

  const pendingWinnings = myWinnings.filter(w => !w.proof_url && w.payout_status === 'pending')

  if (pendingWinnings.length === 0) return null

  return (
    <div className="card" style={{ marginTop: '1.5rem' }}>
      <h2 style={{ marginBottom: '1rem' }}>Upload Proof</h2>
      <p style={{ color: 'var(--text)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
        Upload a screenshot of your golf scores to verify your winnings
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {pendingWinnings.map(winner => (
          <div key={winner.id} style={{
            background: 'var(--bg)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <span style={{ fontWeight: 600 }}>{winner.draws?.month}</span>
                <span style={{ marginLeft: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>{winner.match_type}-match</span>
              </div>
              <span style={{ fontWeight: 700, color: 'var(--success)' }}>£{winner.prize_amount.toFixed(2)}</span>
            </div>
            
            <label style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'var(--accent)',
              color: 'white',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              {uploading[winner.id] ? 'Uploading...' : 'Upload Screenshot'}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleProofUpload(winner.id, e.target.files[0])}
                disabled={uploading[winner.id]}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}
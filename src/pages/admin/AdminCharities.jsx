import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function AdminCharities() {
  const [charities, setCharities] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({ name: '', description: '', featured: false })

  async function fetchCharities() {
    const { data, error } = await supabase.from('charities').select('*').order('name', { ascending: true })
    if (!error) setCharities(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchCharities() }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      if (editing) {
        const { error } = await supabase.from('charities').update(formData).eq('id', editing)
        if (error) throw error
        toast.success('Charity updated!')
      } else {
        const { error } = await supabase.from('charities').insert(formData)
        if (error) throw error
        toast.success('Charity added!')
      }
      setShowForm(false)
      setEditing(null)
      setFormData({ name: '', description: '', featured: false })
      fetchCharities()
    } catch (err) {
      toast.error('Error: ' + err.message)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this charity?')) return
    const { error } = await supabase.from('charities').delete().eq('id', id)
    if (error) toast.error('Could not delete')
    else { toast.success('Deleted'); fetchCharities() }
  }

  async function toggleFeatured(id, current) {
    const { error } = await supabase.from('charities').update({ featured: !current }).eq('id', id)
    if (error) toast.error('Could not update')
    else fetchCharities()
  }

  function openEdit(charity) {
    setEditing(charity.id)
    setFormData({ name: charity.name, description: charity.description || '', featured: charity.featured || false })
    setShowForm(true)
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading...</div>

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Charities</h1>
          <p style={{ color: 'var(--text)' }}>Manage charity listings</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setFormData({ name: '', description: '', featured: false }) }} className="btn-primary">
          Add Charity
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowForm(false)}>
          <div className="card" style={{ maxWidth: '500px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1.5rem' }}>{editing ? 'Edit Charity' : 'Add Charity'}</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg)', color: 'var(--text-h)' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Description</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg)', color: 'var(--text-h)', resize: 'vertical' }} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.featured} onChange={e => setFormData({ ...formData, featured: e.target.checked })} />
                  <span style={{ fontWeight: 500 }}>Featured charity</span>
                </label>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: '0.75rem', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>{editing ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Charities List */}
      {charities.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text)' }}>No charities yet. Click "Add Charity" to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {charities.map(charity => (
            <div key={charity.id} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem' }}>
                  {charity.name.charAt(0)}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => toggleFeatured(charity.id, charity.featured)} style={{ padding: '0.4rem 0.6rem', background: charity.featured ? 'var(--accent)' : 'var(--bg)', color: charity.featured ? 'white' : 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', cursor: 'pointer' }}>
                    {charity.featured ? 'Featured' : 'Feature'}
                  </button>
                  <button onClick={() => openEdit(charity)} style={{ padding: '0.4rem 0.6rem', background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => handleDelete(charity.id)} style={{ padding: '0.4rem 0.6rem', background: 'var(--error)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
              <h3 style={{ margin: '0 0 0.5rem' }}>{charity.name}</h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text)' }}>{charity.description || 'No description'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
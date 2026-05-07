import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Star, Trash2, ChevronRight, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    client.get('/watchlist').then(r => { setWatchlist(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const remove = async (name) => {
    await client.delete(`/watchlist/${encodeURIComponent(name)}`)
    setWatchlist(w => w.filter(p => p.player_name !== name))
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Watchlist</h1>
          <p className="page-subtitle">Your starred players and form tracking</p>
        </div>
        <div className="badge badge-amber" style={{ fontSize: '0.875rem', padding: '0.4rem 0.875rem' }}>
          ⭐ {watchlist.length} Players
        </div>
      </div>

      {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" /></div>}

      {!loading && watchlist.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <Star size={48} style={{ margin: '0 auto 1rem', display: 'block', color: 'var(--text-muted)', opacity: 0.5 }} />
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Your watchlist is empty
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Star players from the Player Scout to track their form here
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/players')}>
            <User size={15} /> Browse Players
          </button>
        </motion.div>
      )}

      {!loading && watchlist.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {watchlist.map((item, i) => (
            <motion.div
              key={item.player_name}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flex: 1, minWidth: 0 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(99,102,241,0.2))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem'
                }}>⭐</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.player_name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    Added {new Date(item.added_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <button className="btn btn-ghost" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                  onClick={() => navigate(`/players?q=${item.player_name}`)}>
                  Scout <ChevronRight size={13} />
                </button>
                <button className="btn btn-danger" style={{ padding: '0.4rem 0.6rem' }}
                  onClick={() => remove(item.player_name)}
                  title="Remove from watchlist">
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

import { useNavigate } from 'react-router-dom'
import { Zap, Search } from 'lucide-react'
import { useState, useEffect } from 'react'
import useAuthStore from '../../store/authStore'
import client from '../../api/client'

export default function TopBar() {
  const { username } = useAuthStore()
  const navigate = useNavigate()
  const [latestSeason, setLatestSeason] = useState(null)

  useEffect(() => {
    client.get('/meta/stats').then(r => setLatestSeason(r.data.latest_season)).catch(() => {})
  }, [])


  return (
    <header className="topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem' }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
        <div style={{
          width: 32, height: 32,
          background: 'linear-gradient(135deg, #00D4FF, #6366F1)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Zap size={18} color="#0A0E1A" fill="#0A0E1A" />
        </div>
        <div>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>
            SPORTS<span style={{ color: 'var(--accent-blue)' }}>MASSIVE</span>
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '-2px' }}>
            IPL Intelligence Hub
          </div>
        </div>
      </div>

      {/* Center — Live badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', animation: 'pulse-glow 2s infinite' }} />
        <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
          {latestSeason ? `IPL ${latestSeason} Season` : 'Loading...'}
        </span>
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="btn btn-ghost" style={{ padding: '0.4rem 0.75rem' }} onClick={() => navigate('/players')}>
          <Search size={15} />
          <span style={{ fontSize: '0.8rem' }}>Search Players</span>
        </button>
        <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          👋 <strong style={{ color: 'var(--text-primary)' }}>{username}</strong>
        </div>
      </div>
    </header>
  )
}

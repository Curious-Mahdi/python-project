import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Star, TrendingUp, Activity, ChevronRight, Trophy, Zap, Database } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import useAuthStore from '../store/authStore'
import AIStoryBox from '../components/ui/AIStoryBox'

const MATCH_RESULTS = [
  { match: 'CSK vs GT', result: 'GT won by 5 wkts', date: '2023-04-01', venue: 'Chennai' },
  { match: 'PBKS vs RCB', result: 'RCB won by 24 runs', date: '2023-04-02', venue: 'Mumbai' },
  { match: 'SRH vs RR', result: 'RR won by 72 runs', date: '2023-04-03', venue: 'Hyderabad' },
  { match: 'KKR vs RCB', result: 'KKR won by 81 runs', date: '2023-04-04', venue: 'Kolkata' },
  { match: 'GT vs MI', result: 'GT won by 6 wkts', date: '2023-04-05', venue: 'Ahmedabad' },
]

const FEATURED_PLAYERS = [
  { name: 'Virat Kohli', team: 'Royal Challengers Bangalore', stat: '58.3 Avg', role: 'batsman' },
  { name: 'Rashid Khan', team: 'Gujarat Titans', stat: '6.5 Eco', role: 'bowler' },
  { name: 'Shubman Gill', team: 'Gujarat Titans', stat: '1.68 SR', role: 'batsman' },
]


export default function DashboardPage() {
  const { username } = useAuthStore()
  const [watchlist, setWatchlist] = useState([])
  const [insight, setInsight] = useState('')
  const [insightLoading, setInsightLoading] = useState(true)
  const [dbStats, setDbStats] = useState({ total_matches: 5, total_seasons: 1, total_players: 10, latest_season: 2023, first_season: 2023 })
  const navigate = useNavigate()

  useEffect(() => {
    client.get('/watchlist').then(r => setWatchlist(r.data)).catch(() => {})
    client.get('/predict/dashboard-insight')
      .then(r => { setInsight(r.data.insight); setInsightLoading(false) })
      .catch(() => { setInsightLoading(false) })
    client.get('/meta/stats')
      .then(r => setDbStats(r.data))
      .catch(() => {})
  }, [])

  const seasonLabel = dbStats.first_season === dbStats.latest_season
    ? `IPL ${dbStats.latest_season}`
    : `IPL ${dbStats.first_season}–${dbStats.latest_season}`

  const statCards = [
    { label: 'Matches Loaded', value: dbStats.total_matches?.toLocaleString() || '5', icon: Trophy, color: 'var(--accent-amber)' },
    { label: 'Players Tracked', value: dbStats.total_players?.toLocaleString() || '10', icon: Activity, color: 'var(--accent-blue)' },
    { label: 'My Watchlist', value: watchlist.length, icon: Star, color: 'var(--accent-amber)' },
    { label: 'Seasons', value: dbStats.total_seasons || 1, icon: Database, color: 'var(--accent-indigo)' },
  ]


  return (
    <div>
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="page-header"
      >
        <div>
          <h1 className="page-title">Command Center</h1>
          <p className="page-subtitle">Welcome back, <strong style={{ color: 'var(--accent-blue)' }}>{username}</strong> — Your IPL intelligence dashboard</p>
        </div>
        <div className="badge badge-green" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}>
          🔴 IPL 2023 Live
        </div>
      </motion.div>

      {/* Stat Cards */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}
      >
        {statCards.map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={label} className="card"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 10, flexShrink: 0,
              background: `${color}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Icon size={20} color={color} />
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'Rajdhani', color }}>
                {value}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {label}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* AI Daily Insight */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <div style={{ marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            🤖 Daily Scout Insight
          </div>
          <AIStoryBox story={insight} loading={insightLoading} title="AI Scout Tip of the Day" />
        </motion.div>

        {/* Recent Results */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <div style={{ marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            🏏 Recent Results
          </div>
          <div className="card" style={{ padding: '0.75rem' }}>
            {MATCH_RESULTS.map((m, i) => (
              <div
                key={i}
                onClick={() => navigate('/match')}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.6rem 0.75rem', borderRadius: 8, cursor: 'pointer',
                  borderBottom: i < MATCH_RESULTS.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)' }}>{m.match}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', marginTop: 2 }}>{m.result}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{m.date}</div>
                  <ChevronRight size={14} color="var(--text-muted)" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Featured Players + Watchlist */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Featured Players */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>⭐ Hot Players</span>
            <button className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
              onClick={() => navigate('/players')}>
              View All <ChevronRight size={12} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {FEATURED_PLAYERS.map(p => (
              <div key={p.name} className="card" style={{ padding: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                onClick={() => navigate(`/players?q=${p.name}`)}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{p.team}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--accent-blue)' }}>{p.stat}</div>
                  <span className={`badge badge-${p.role === 'bowler' ? 'red' : 'blue'}`} style={{ fontSize: '0.6rem' }}>
                    {p.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* My Watchlist */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>📋 My Watchlist</span>
            <button className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
              onClick={() => navigate('/watchlist')}>
              Manage <ChevronRight size={12} />
            </button>
          </div>
          <div className="card">
            {watchlist.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                <Star size={28} style={{ margin: '0 auto 0.75rem', display: 'block', opacity: 0.4 }} />
                <div style={{ fontSize: '0.875rem' }}>No players starred yet</div>
                <button className="btn btn-ghost" style={{ marginTop: '0.75rem', fontSize: '0.75rem' }}
                  onClick={() => navigate('/players')}>
                  Browse Players
                </button>
              </div>
            ) : (
              <div>
                {watchlist.slice(0, 5).map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.6rem', borderBottom: i < watchlist.length - 1 ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer',
                  }}
                    onClick={() => navigate(`/players?q=${item.player_name}`)}>
                    <span>⭐</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{item.player_name}</span>
                    <ChevronRight size={14} color="var(--text-muted)" style={{ marginLeft: 'auto' }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        style={{ marginTop: '1.5rem' }}
      >
        <div style={{ marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          ⚡ Quick Actions
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate('/battle')}>⚔️ Start Battle Simulator</button>
          <button className="btn btn-ghost" onClick={() => navigate('/predict')}>🔮 Season Predictor</button>
          <button className="btn btn-ghost" onClick={() => navigate('/match')}>📊 Match Analysis</button>
        </div>
      </motion.div>
    </div>
  )
}

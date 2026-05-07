import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Star, StarOff, User, TrendingUp, Activity } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import client from '../api/client'
import PlayerCard from '../components/cards/PlayerCard'
import WagonWheel from '../components/charts/WagonWheel'

const SUGGESTED = ['Virat Kohli', 'Rohit Sharma', 'MS Dhoni', 'Rashid Khan', 'Jasprit Bumrah', 'Shubman Gill']

export default function PlayerPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [searchResults, setSearchResults] = useState([])
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [watchlist, setWatchlist] = useState([])
  const [activeTab, setActiveTab] = useState('batting')

  // Load watchlist
  useEffect(() => {
    client.get('/watchlist').then(r => setWatchlist(r.data.map(w => w.player_name))).catch(() => {})
    // If query param exists, auto-load
    const q = searchParams.get('q')
    if (q) loadPlayer(q)
  }, [])

  const searchPlayers = useCallback(async (q) => {
    if (!q.trim()) { setSearchResults([]); return }
    try {
      const res = await client.get(`/players/search?q=${encodeURIComponent(q)}`)
      setSearchResults(res.data)
    } catch { setSearchResults([]) }
  }, [])

  const loadPlayer = async (name) => {
    setLoading(true)
    setSelectedPlayer(name)
    setSearchResults([])
    setQuery(name)
    try {
      const res = await client.get(`/players/${encodeURIComponent(name)}`)
      setStats(res.data)
    } catch { setStats(null) }
    setLoading(false)
  }

  const toggleWatchlist = async (name) => {
    if (watchlist.includes(name)) {
      await client.delete(`/watchlist/${encodeURIComponent(name)}`)
      setWatchlist(w => w.filter(n => n !== name))
    } else {
      await client.post('/watchlist', { player_name: name })
      setWatchlist(w => [...w, name])
    }
  }

  // Form report chart data
  const formChartData = stats ? [
    {
      metric: 'Runs', career: stats.career_batting?.total_runs || 0, season: stats.current_season_batting?.season_runs || 0
    },
    {
      metric: 'SR', career: stats.career_batting?.strike_rate || 0, season: stats.current_season_batting?.season_sr || 0
    },
    {
      metric: 'Fours', career: stats.career_batting?.fours || 0, season: stats.current_season_batting?.season_fours || 0
    },
    {
      metric: 'Sixes', career: stats.career_batting?.sixes || 0, season: stats.current_season_batting?.season_sixes || 0
    },
  ] : []

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Player Scout</h1>
          <p className="page-subtitle">Search players · Compare form · Build your watchlist</p>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '1.5rem', position: 'relative', maxWidth: 520 }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search player name..."
            value={query}
            onChange={e => { setQuery(e.target.value); searchPlayers(e.target.value) }}
          />
        </div>
        {/* Dropdown */}
        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 8, marginTop: 4, overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
              }}>
              {searchResults.map(p => (
                <div key={p.name}
                  onClick={() => loadPlayer(p.name)}
                  style={{
                    padding: '0.75rem 1rem', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', gap: '0.75rem', transition: 'background 0.15s',
                    borderBottom: '1px solid var(--border)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <User size={14} color="var(--text-muted)" />
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.team} · {p.role}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick suggestions */}
      {!selectedPlayer && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Quick search:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {SUGGESTED.map(name => (
              <button key={name} className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
                onClick={() => loadPlayer(name)}>
                {name}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" />
        </div>
      )}

      {/* Player Stats */}
      {stats && !loading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem' }}>
            {/* Left: Player Card + Watchlist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <PlayerCard
                player={stats.player}
                onStar={toggleWatchlist}
                isStarred={watchlist.includes(stats.player.name)}
              />
              {/* Bowling style note */}
              {stats.career_bowling?.wickets > 0 && (
                <div className="card" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Career Bowling
                  </div>
                  <div className="stat-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className="stat-item">
                      <div className="stat-value" style={{ color: 'var(--accent-red)' }}>{stats.career_bowling.wickets}</div>
                      <div className="stat-label">Wickets</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value" style={{ color: 'var(--accent-amber)' }}>{stats.career_bowling.economy}</div>
                      <div className="stat-label">Economy</div>
                    </div>
                  </div>
                </div>
              )}
              {/* Wagon Wheel */}
              <div className="card" style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Shot Map
                </div>
                <WagonWheel shotZones={stats.shot_zones} />
              </div>
            </div>

            {/* Right: Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Career Batting */}
              <div className="card">
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
                  Career Batting Stats
                </div>
                <div className="stat-grid">
                  {[
                    { label: 'Total Runs', value: stats.career_batting?.total_runs || 0 },
                    { label: 'Strike Rate', value: stats.career_batting?.strike_rate || 0 },
                    { label: 'Fours', value: stats.career_batting?.fours || 0 },
                    { label: 'Sixes', value: stats.career_batting?.sixes || 0 },
                  ].map(s => (
                    <div key={s.label} className="stat-item">
                      <div className="stat-value">{s.value}</div>
                      <div className="stat-label">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Report — Season vs Career */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <TrendingUp size={15} color="var(--accent-blue)" />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Live Form Report — 2023 Season vs Career
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={formChartData} barSize={18} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="metric" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.8rem' }}
                    />
                    <Bar dataKey="career" name="Career" fill="#6366F1" radius={[3,3,0,0]} fillOpacity={0.7} />
                    <Bar dataKey="season" name="2023 Season" fill="#00D4FF" radius={[3,3,0,0]} fillOpacity={0.9} />
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: '#6366F1' }} /> Career
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: '#00D4FF' }} /> 2023 Season
                  </div>
                </div>
              </div>

              {/* Season stats */}
              <div className="card">
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
                  2023 Season Stats
                </div>
                <div className="stat-grid">
                  {[
                    { label: 'Season Runs', value: stats.current_season_batting?.season_runs || 0, color: 'var(--accent-blue)' },
                    { label: 'Season SR', value: stats.current_season_batting?.season_sr || 0, color: 'var(--accent-emerald)' },
                    { label: 'Season 4s', value: stats.current_season_batting?.season_fours || 0, color: 'var(--accent-amber)' },
                    { label: 'Season 6s', value: stats.current_season_batting?.season_sixes || 0, color: 'var(--accent-red)' },
                  ].map(s => (
                    <div key={s.label} className="stat-item">
                      <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                      <div className="stat-label">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {!selectedPlayer && !loading && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ textAlign: 'center', padding: '5rem 2rem' }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏏</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Search for a player to start scouting
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            View career stats, shot maps, and form reports
          </div>
        </motion.div>
      )}
    </div>
  )
}

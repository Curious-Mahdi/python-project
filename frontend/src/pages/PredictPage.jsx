import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Trophy, Zap, ChevronDown } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts'
import client from '../api/client'
import AIStoryBox from '../components/ui/AIStoryBox'
import ExportButton from '../components/ui/ExportButton'

const TEAM_COLORS_MAP = {
  'Royal Challengers Bangalore': '#EC1C24',
  'Royal Challengers Bengaluru': '#EC1C24',
  'Mumbai Indians': '#004BA0',
  'Chennai Super Kings': '#F9CD05',
  'Gujarat Titans': '#1C1C5E',
  'Lucknow Super Giants': '#0057B8',
  'Rajasthan Royals': '#FF2A6E',
  'Sunrisers Hyderabad': '#FF822A',
  'Kolkata Knight Riders': '#3A225D',
  'Delhi Capitals': '#0078BC',
  'Punjab Kings': '#DCDDDF',
  'Delhi Daredevils': '#0078BC',
}

const medals = ['🥇', '🥈', '🥉']

export default function PredictPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [seasons, setSeasons] = useState([])
  const [selectedSeason, setSelectedSeason] = useState(null)

  // Load available seasons from API
  useEffect(() => {
    client.get('/meta/seasons').then(r => {
      const available = r.data
      setSeasons(available)
      // Default to latest season
      if (available.length > 0) setSelectedSeason(available[0].season)
    }).catch(() => {
      // Fallback to known seasons
      const fallback = [2026,2025,2024,2023,2022,2021].map(s => ({ season: s, match_count: 0 }))
      setSeasons(fallback)
      setSelectedSeason(2026)
    })
  }, [])

  const runPredict = async () => {
    if (!selectedSeason) return
    setLoading(true)
    setData(null)
    try {
      const res = await client.post('/predict/season', { season: selectedSeason })
      setData(res.data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const chartData = data?.predictions?.map(p => ({
    name: p.batter?.split(' ').slice(-1)[0] || p.batter,
    fullName: p.batter,
    runs: p.total_runs,
    sr: p.strike_rate,
    confidence: p.confidence,
    color: TEAM_COLORS_MAP[p.team] || '#6366F1',
    matches: p.matches,
  })) || []

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Season Predictor</h1>
          <p className="page-subtitle">AI-powered top run scorer predictions — select any season</p>
        </div>
        {data && <ExportButton aiSummary={data.ai_narrative} />}
      </div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="card"
        style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-end', gap: '1.5rem', flexWrap: 'wrap' }}
      >
        <div style={{ flex: 1, maxWidth: 260 }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Select IPL Season
          </label>
          <div style={{ position: 'relative' }}>
            <select
              className="input"
              value={selectedSeason || ''}
              onChange={e => { setSelectedSeason(Number(e.target.value)); setData(null) }}
              style={{ appearance: 'none', paddingRight: '2rem' }}
            >
              {seasons.map(s => (
                <option key={s.season} value={s.season}>
                  IPL {s.season}{s.match_count > 0 ? ` — ${s.match_count} matches` : ''}
                </option>
              ))}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          </div>
        </div>

        <button className="btn btn-primary" onClick={runPredict} disabled={loading || !selectedSeason}>
          {loading
            ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Predicting...</>
            : <><Zap size={15} /> Generate Predictions</>
          }
        </button>
      </motion.div>

      {data && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Summary banner */}
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.06), rgba(99,102,241,0.06))', border: '1px solid rgba(0,212,255,0.2)', padding: '0.875rem 1.25rem', display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              📊 Showing top run scorers for <strong style={{ color: 'var(--accent-blue)' }}>IPL {data.season}</strong>
            </div>
            {data.predictions[0] && (
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                🏆 Leader: <strong style={{ color: 'var(--accent-amber)' }}>{data.predictions[0].batter}</strong> — {data.predictions[0].total_runs} runs in {data.predictions[0].matches} matches
              </div>
            )}
          </div>

          {/* Top 3 Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {data.predictions.slice(0, 3).map((p, i) => (
              <motion.div key={p.batter}
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="card"
                style={{ borderLeft: `3px solid ${TEAM_COLORS_MAP[p.team] || '#6366F1'}`, position: 'relative', overflow: 'hidden' }}
              >
                <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', fontSize: '1.5rem' }}>{medals[i]}</div>
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: 70, height: 70, background: `radial-gradient(circle, ${TEAM_COLORS_MAP[p.team] || '#6366F1'}18 0%, transparent 70%)`, pointerEvents: 'none' }} />
                <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '1.15rem', marginBottom: '0.2rem', paddingRight: '2rem' }}>{p.batter}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.875rem' }}>{p.team || 'Unknown'}</div>
                <div className="stat-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="stat-item">
                    <div className="stat-value" style={{ fontSize: '1.4rem' }}>{p.total_runs}</div>
                    <div className="stat-label">Runs</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value" style={{ fontSize: '1.4rem', color: 'var(--accent-emerald)' }}>{p.strike_rate}</div>
                    <div className="stat-label">SR</div>
                  </div>
                </div>
                <div style={{ marginTop: '0.75rem', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  {p.matches} matches · {p.balls_faced} balls
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${p.confidence}%` }} />
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.7rem', color: 'var(--accent-blue)', marginTop: 3 }}>{p.confidence}% confidence</div>
              </motion.div>
            ))}
          </div>

          {/* Full leaderboard */}
          {data.predictions.length > 3 && (
            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                📋 Full Run Leaderboard — IPL {data.season}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['#','Batter','Team','Runs','Balls','SR','Matches','Confidence'].map(h => (
                        <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.predictions.map((p, i) => (
                      <tr key={p.batter} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-muted)' }}>{medals[i] || i+1}</td>
                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>{p.batter}</td>
                        <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>{p.team || '-'}</td>
                        <td style={{ padding: '0.5rem 0.75rem', color: 'var(--accent-blue)', fontWeight: 700 }}>{p.total_runs}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{p.balls_faced}</td>
                        <td style={{ padding: '0.5rem 0.75rem', color: 'var(--accent-emerald)' }}>{p.strike_rate}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{p.matches}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden', minWidth: 50 }}>
                              <div style={{ height: '100%', borderRadius: 2, background: 'var(--accent-blue)', width: `${p.confidence}%` }} />
                            </div>
                            <span style={{ color: 'var(--accent-blue)', fontWeight: 600, minWidth: 32 }}>{p.confidence}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Bar Chart */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Trophy size={15} color="var(--accent-amber)" />
              <span style={{ fontWeight: 600 }}>Top Run Scorers — IPL {data.season}</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} barSize={Math.max(16, Math.min(36, 300 / chartData.length))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.8rem' }}
                  formatter={(value, name, props) => [value, props.payload.fullName]}
                />
                <Bar dataKey="runs" radius={[5,5,0,0]}>
                  {chartData.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <AIStoryBox story={data.ai_narrative} loading={false} title={`IPL ${data.season} AI Prediction Report`} />
        </motion.div>
      )}

      {!data && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔮</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            AI-powered season predictions
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Select any IPL season (2008–2026) and generate predictions
          </div>
          <button className="btn btn-primary" onClick={runPredict} disabled={!selectedSeason}>
            <TrendingUp size={15} /> Generate Predictions for IPL {selectedSeason}
          </button>
        </motion.div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Swords, Zap } from 'lucide-react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts'
import client from '../api/client'
import AIStoryBox from '../components/ui/AIStoryBox'
import WagonWheel from '../components/charts/WagonWheel'
import ExportButton from '../components/ui/ExportButton'

const BATSMEN = ['Virat Kohli', 'Rohit Sharma', 'MS Dhoni', 'Shubman Gill', 'KL Rahul', 'Faf du Plessis']
const BOWLERS = ['Jasprit Bumrah', 'Rashid Khan', 'Mohammed Siraj', 'Hardik Pandya']

export default function BattlePage() {
  const [batsman, setBatsman] = useState('')
  const [bowler, setBowler] = useState('')
  const [data, setData] = useState(null)
  const [story, setStory] = useState('')
  const [loading, setLoading] = useState(false)
  const [storyLoading, setStoryLoading] = useState(false)

  const runBattle = async () => {
    if (!batsman || !bowler) return
    setLoading(true)
    setData(null)
    setStory('')
    try {
      const res = await client.post('/head-to-head', { batsman, bowler })
      setData(res.data)

      // Fetch AI story
      setStoryLoading(true)
      const storyRes = await client.post('/predict/battle-story', {
        batsman, bowler, stats: res.data.overall
      })
      setStory(storyRes.data.story)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setStoryLoading(false)
    }
  }

  // Radar data for phase stats
  const radarData = data?.phase_stats?.map(p => ({
    phase: p.phase.split(' ')[0],
    SR: p.sr || 0,
    Runs: p.runs || 0,
  })) || []

  // Dismissal bar chart
  const dismissalData = data?.dismissals?.map(d => ({
    type: d.wicket_kind?.replace('_', ' ') || 'Unknown',
    count: d.count
  })) || []

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Battle Simulator</h1>
          <p className="page-subtitle">Head-to-head historical matchup analysis</p>
        </div>
        {data && <ExportButton h2hData={data} aiSummary={story} />}
      </div>

      {/* Selector */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="card"
        style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-end', gap: '1.5rem', flexWrap: 'wrap' }}
      >
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            🏏 Batsman
          </label>
          <select className="input" value={batsman} onChange={e => setBatsman(e.target.value)}
            style={{ appearance: 'none' }}>
            <option value="">Select Batsman...</option>
            {BATSMEN.map(b => <option key={b}>{b}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', paddingBottom: '0.2rem' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg, #EF4444, #6366F1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Swords size={18} color="#fff" />
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            🎳 Bowler
          </label>
          <select className="input" value={bowler} onChange={e => setBowler(e.target.value)}
            style={{ appearance: 'none' }}>
            <option value="">Select Bowler...</option>
            {BOWLERS.map(b => <option key={b}>{b}</option>)}
          </select>
        </div>

        <button
          className="btn btn-primary"
          onClick={runBattle}
          disabled={!batsman || !bowler || loading}
          style={{ paddingLeft: '2rem', paddingRight: '2rem' }}
        >
          {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Analysing...</> : <><Zap size={15} /> Generate Battle</>}
        </button>
      </motion.div>

      {data && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* VS Banner */}
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(0,212,255,0.08), rgba(239,68,68,0.08))',
            border: '1px solid rgba(99,102,241,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem'
          }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '1.5rem', color: 'var(--accent-blue)' }}>
                {data.batsman}
              </div>
              <span className="badge badge-blue">Batsman</span>
            </div>
            <div style={{ textAlign: 'center', padding: '0 1rem' }}>
              <div style={{ fontFamily: 'Rajdhani', fontWeight: 800, fontSize: '2rem', color: 'var(--text-muted)' }}>VS</div>
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '1.5rem', color: 'var(--accent-red)' }}>
                {data.bowler}
              </div>
              <span className="badge badge-red">Bowler</span>
            </div>
          </div>

          {/* Overall Stats */}
          <div className="card">
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
              Head-to-Head Summary
            </div>
            <div className="stat-grid">
              {[
                { label: 'Balls Faced', value: data.overall.balls_faced || 0 },
                { label: 'Runs Scored', value: data.overall.runs_scored || 0, color: 'var(--accent-blue)' },
                { label: 'Strike Rate', value: data.overall.strike_rate || 0, color: 'var(--accent-emerald)' },
                { label: 'Dismissals', value: data.overall.dismissals || 0, color: 'var(--accent-red)' },
                { label: 'Fours', value: data.overall.fours || 0, color: 'var(--accent-amber)' },
                { label: 'Sixes', value: data.overall.sixes || 0, color: 'var(--accent-violet)' },
                { label: 'Dot Balls', value: data.overall.dot_balls || 0 },
              ].map(s => (
                <div key={s.label} className="stat-item">
                  <div className="stat-value" style={{ color: s.color || 'var(--accent-blue)' }}>{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Phase Breakdown */}
            {data.phase_stats?.length > 0 && (
              <div className="card">
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
                  Phase-wise Performance
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {data.phase_stats.map(p => (
                    <div key={p.phase} style={{
                      background: 'var(--bg-primary)', borderRadius: 8, padding: '0.75rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{p.phase}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-blue)' }}>SR: {p.sr}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.runs} runs off {p.balls} balls</span>
                        {p.wickets > 0 && <span className="badge badge-red" style={{ fontSize: '0.6rem' }}>🔴 {p.wickets}W</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dismissal Types */}
            {dismissalData.length > 0 ? (
              <div className="card">
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
                  Dismissal Types
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={dismissalData} barSize={20}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="type" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.8rem' }} />
                    <Bar dataKey="count" radius={[4,4,0,0]}>
                      {dismissalData.map((_, i) => (
                        <Cell key={i} fill={['#EF4444','#F59E0B','#6366F1','#10B981'][i % 4]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontSize: '2rem' }}>🛡️</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No dismissals in this matchup yet</div>
              </div>
            )}
          </div>

          {/* Wagon Wheel */}
          {data.shot_zones?.length > 0 && (
            <div className="card">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
                Shot Map vs {data.bowler}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <WagonWheel shotZones={data.shot_zones} />
              </div>
            </div>
          )}

          {/* AI Battle Story */}
          <AIStoryBox
            story={story}
            loading={storyLoading}
            title={`Battle Analysis: ${data.batsman} vs ${data.bowler}`}
          />
        </motion.div>
      )}

      {!data && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚔️</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Select a batsman and bowler to begin
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Historical H2H data · Phase breakdown · Shot map · AI analysis
          </div>
        </motion.div>
      )}
    </div>
  )
}

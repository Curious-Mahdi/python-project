import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceDot, Legend
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '0.75rem', fontSize: '0.8rem'
    }}>
      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
        Over {label}
      </div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  )
}

export default function WormChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        No match data available
      </div>
    )
  }

  // Build per-over data combining both innings
  const innings1 = data.find(d => d.innings === 1)
  const innings2 = data.find(d => d.innings === 2)

  // Aggregate to per-over for cleaner display
  const buildOverData = (inningsData) => {
    if (!inningsData?.data) return []
    const overMap = {}
    inningsData.data.forEach(ball => {
      const over = ball.over
      if (!overMap[over]) overMap[over] = { over, runs: 0, wickets: [] }
      overMap[over].runs = ball.cumulative_runs
      if (ball.wicket) overMap[over].wickets.push(ball.player_dismissed)
    })
    return Object.values(overMap).sort((a, b) => a.over - b.over)
  }

  const inn1Data = buildOverData(innings1)
  const inn2Data = buildOverData(innings2)

  // Merge for chart
  const maxLen = Math.max(inn1Data.length, inn2Data.length)
  const chartData = Array.from({ length: maxLen }, (_, i) => ({
    over: i + 1,
    [innings1?.batting_team || 'Inn 1']: inn1Data[i]?.runs ?? null,
    [innings2?.batting_team || 'Inn 2']: inn2Data[i]?.runs ?? null,
    inn1_wicket: inn1Data[i]?.wickets?.length > 0,
    inn2_wicket: inn2Data[i]?.wickets?.length > 0,
  }))

  const team1 = innings1?.batting_team || 'Team 1'
  const team2 = innings2?.batting_team || 'Team 2'

  // Wicket reference dots
  const wicketDots1 = inn1Data.filter(d => d.wickets?.length > 0)
  const wicketDots2 = inn2Data.filter(d => d.wickets?.length > 0)

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="worm1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="worm2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="over"
          tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
          label={{ value: 'Over', position: 'insideBottom', offset: -5, fill: 'var(--text-muted)', fontSize: 11 }}
        />
        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{value}</span>}
        />
        <Area
          type="monotone" dataKey={team1}
          stroke="#00D4FF" strokeWidth={2}
          fill="url(#worm1)" dot={false}
          connectNulls
        />
        <Area
          type="monotone" dataKey={team2}
          stroke="#F59E0B" strokeWidth={2}
          fill="url(#worm2)" dot={false}
          connectNulls
        />
        {/* Wicket markers for innings 1 */}
        {wicketDots1.map((d, i) => (
          <ReferenceDot
            key={`w1-${i}`} x={d.over} y={inn1Data.find(o => o.over === d.over)?.runs || 0}
            r={5} fill="#EF4444" stroke="#fff" strokeWidth={1}
          />
        ))}
        {/* Wicket markers for innings 2 */}
        {wicketDots2.map((d, i) => (
          <ReferenceDot
            key={`w2-${i}`} x={d.over} y={inn2Data.find(o => o.over === d.over)?.runs || 0}
            r={5} fill="#F43F5E" stroke="#fff" strokeWidth={1}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}

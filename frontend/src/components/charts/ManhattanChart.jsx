import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList, Legend
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '0.75rem', fontSize: '0.8rem'
    }}>
      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Over {label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
          {p.payload.wickets > 0 && <span style={{ color: '#EF4444', marginLeft: 6 }}>
            🔴 {p.payload.wickets}W
          </span>}
        </div>
      ))}
    </div>
  )
}

export default function ManhattanChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        No match data available
      </div>
    )
  }

  const innings1 = data.find(d => d.innings === 1)
  const innings2 = data.find(d => d.innings === 2)

  // Merge both innings into one dataset per over
  const maxOvers = Math.max(
    innings1?.data?.length || 0,
    innings2?.data?.length || 0
  )

  const chartData = Array.from({ length: maxOvers }, (_, i) => {
    const over = i + 1
    const d1 = innings1?.data?.find(d => d.over_number === over)
    const d2 = innings2?.data?.find(d => d.over_number === over)
    return {
      over,
      inn1_runs: d1?.over_runs || 0,
      inn1_wickets: d1?.wickets || 0,
      inn2_runs: d2?.over_runs || 0,
      inn2_wickets: d2?.wickets || 0,
    }
  })

  const team1 = innings1?.batting_team || 'Inn 1'
  const team2 = innings2?.batting_team || 'Inn 2'

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} barSize={14} barGap={2} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="over" tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
          label={{ value: 'Over', position: 'insideBottom', offset: -5, fill: 'var(--text-muted)', fontSize: 11 }} />
        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => {
            const name = value === 'inn1_runs' ? team1 : team2
            return <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{name}</span>
          }}
        />
        <Bar dataKey="inn1_runs" name="inn1_runs" radius={[3,3,0,0]}>
          {chartData.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.inn1_wickets > 0 ? '#EF4444' : entry.inn1_runs >= 15 ? '#F59E0B' : '#00D4FF'}
              fillOpacity={0.85}
            />
          ))}
        </Bar>
        <Bar dataKey="inn2_runs" name="inn2_runs" radius={[3,3,0,0]}>
          {chartData.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.inn2_wickets > 0 ? '#F43F5E' : entry.inn2_runs >= 15 ? '#FBBF24' : '#6366F1'}
              fillOpacity={0.85}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

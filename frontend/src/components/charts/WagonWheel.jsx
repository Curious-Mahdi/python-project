/**
 * WagonWheel — Custom SVG shot direction map
 * Maps shot_zone data to pie-wedge sectors on a cricket field diagram
 */

const ZONES = [
  { id: 'fine-leg', angle: 200, label: 'Fine Leg', color: '#00D4FF' },
  { id: 'mid-wicket', angle: 240, label: 'Mid Wicket', color: '#6366F1' },
  { id: 'mid-on', angle: 280, label: 'Mid On', color: '#10B981' },
  { id: 'mid-off', angle: 320, label: 'Mid Off', color: '#F59E0B' },
  { id: 'cover', angle: 360, label: 'Cover', color: '#EF4444' },
  { id: 'point', angle: 40, label: 'Point', color: '#8B5CF6' },
  { id: 'off', angle: 80, label: 'Off Side', color: '#EC4899' },
  { id: 'on', angle: 160, label: 'On Side', color: '#14B8A6' },
]

function polarToXY(angle, radius, cx, cy) {
  const rad = (angle - 90) * (Math.PI / 180)
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  }
}

function Wedge({ cx, cy, innerR, outerR, startAngle, endAngle, color, opacity }) {
  const start1 = polarToXY(startAngle, outerR, cx, cy)
  const end1 = polarToXY(endAngle, outerR, cx, cy)
  const start2 = polarToXY(endAngle, innerR, cx, cy)
  const end2 = polarToXY(startAngle, innerR, cx, cy)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0

  const d = [
    `M ${start1.x} ${start1.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${end1.x} ${end1.y}`,
    `L ${start2.x} ${start2.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${end2.x} ${end2.y}`,
    'Z'
  ].join(' ')

  return <path d={d} fill={color} fillOpacity={opacity} stroke="var(--bg-card)" strokeWidth={1} />
}

export default function WagonWheel({ shotZones }) {
  const cx = 160, cy = 160, R = 140, innerR = 30
  const sectorAngle = 360 / ZONES.length

  // Build zone → run map
  const zoneMap = {}
  if (shotZones) {
    shotZones.forEach(z => { zoneMap[z.shot_zone] = z.runs || 0 })
  }
  const maxRuns = Math.max(...Object.values(zoneMap), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <svg width={320} height={320} viewBox="0 0 320 320">
        {/* Outfield */}
        <circle cx={cx} cy={cy} r={R} fill="var(--bg-primary)" stroke="var(--border)" strokeWidth={1} />
        {/* Inner circle (30-yard) */}
        <circle cx={cx} cy={cy} r={R * 0.55} fill="none" stroke="var(--border)" strokeWidth={1} strokeDasharray="4,3" />
        {/* Pitch */}
        <rect x={cx - 8} y={cy - 28} width={16} height={56} rx={3} fill="#1E3A1A" stroke="#2D5A23" strokeWidth={1} />
        {/* Stumps */}
        {[-5, 0, 5].map(ox => (
          <line key={ox} x1={cx + ox} y1={cy - 30} x2={cx + ox} y2={cy - 22} stroke="#F59E0B" strokeWidth={1.5} />
        ))}
        {[-5, 0, 5].map(ox => (
          <line key={`b${ox}`} x1={cx + ox} y1={cy + 22} x2={cx + ox} y2={cy + 30} stroke="#F59E0B" strokeWidth={1.5} />
        ))}

        {/* Wedges */}
        {ZONES.map((zone, i) => {
          const startAngle = zone.angle - sectorAngle / 2
          const endAngle = zone.angle + sectorAngle / 2
          const runs = zoneMap[zone.id] || 0
          const opacity = shotZones ? 0.15 + (runs / maxRuns) * 0.75 : 0.2
          return (
            <Wedge
              key={zone.id}
              cx={cx} cy={cy}
              innerR={innerR} outerR={R}
              startAngle={startAngle} endAngle={endAngle}
              color={zone.color} opacity={opacity}
            />
          )
        })}

        {/* Zone labels */}
        {ZONES.map(zone => {
          const pos = polarToXY(zone.angle, R * 0.78, cx, cy)
          const runs = zoneMap[zone.id] || 0
          return (
            <g key={`label-${zone.id}`}>
              <text
                x={pos.x} y={pos.y - 6}
                textAnchor="middle" fontSize={8}
                fill="var(--text-muted)"
              >
                {zone.label}
              </text>
              {shotZones && runs > 0 && (
                <text
                  x={pos.x} y={pos.y + 7}
                  textAnchor="middle" fontSize={9} fontWeight="700"
                  fill={zone.color}
                >
                  {runs}
                </text>
              )}
            </g>
          )
        })}

        {/* Batter position */}
        <circle cx={cx} cy={cy} r={6} fill="#00D4FF" />
        <text x={cx} y={cy + 3} textAnchor="middle" fontSize={8} fill="#0A0E1A" fontWeight="700">B</text>
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', maxWidth: 300 }}>
        {ZONES.map(zone => (
          <div key={zone.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: zone.color }} />
            {zone.label}: <strong style={{ color: zone.color }}>{zoneMap[zone.id] || 0}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

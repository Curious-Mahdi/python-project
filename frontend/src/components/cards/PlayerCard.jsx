const TEAM_COLORS = {
  'Mumbai Indians': '#004BA0',
  'Chennai Super Kings': '#F9CD05',
  'Royal Challengers Bangalore': '#EC1C24',
  'Gujarat Titans': '#1C1C5E',
  'Lucknow Super Giants': '#0057B8',
  'Rajasthan Royals': '#FF2A6E',
  'Sunrisers Hyderabad': '#FF822A',
  'Kolkata Knight Riders': '#3A225D',
  'Delhi Capitals': '#0078BC',
  'Punjab Kings': '#DCDDDF',
}

const ROLE_COLORS = {
  'batsman': 'var(--accent-blue)',
  'bowler': 'var(--accent-red)',
  'all-rounder': 'var(--accent-emerald)',
  'wk-batsman': 'var(--accent-amber)',
}

export default function PlayerCard({ player, onStar, isStarred, compact = false }) {
  const teamColor = TEAM_COLORS[player.team] || '#6366F1'
  const roleColor = ROLE_COLORS[player.role] || 'var(--accent-indigo)'

  return (
    <div
      className="card"
      style={{
        borderLeft: `3px solid ${teamColor}`,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.2s',
      }}
    >
      {/* Team color glow accent */}
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 80, height: 80,
        background: `radial-gradient(circle, ${teamColor}22 0%, transparent 70%)`,
        pointerEvents: 'none'
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Player name */}
          <h3 style={{
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
            fontSize: compact ? '1rem' : '1.25rem',
            color: 'var(--text-primary)', marginBottom: '0.35rem',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
          }}>
            {player.name}
          </h3>

          {/* Team */}
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            {player.team || 'Unknown Team'}
          </div>

          {/* Badges */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="badge" style={{
              background: `${roleColor}20`, color: roleColor,
              fontSize: '0.65rem', textTransform: 'capitalize'
            }}>
              {player.role?.replace('-', ' ') || 'Player'}
            </span>
            {player.nationality && player.nationality !== 'Indian' && (
              <span className="badge badge-violet" style={{ fontSize: '0.65rem' }}>
                {player.nationality}
              </span>
            )}
            {player.batting_style && !compact && (
              <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>
                {player.batting_style}
              </span>
            )}
          </div>
        </div>

        {/* Star button */}
        {onStar && (
          <button
            onClick={() => onStar(player.name)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '1.25rem', padding: '0.25rem',
              color: isStarred ? '#F59E0B' : 'var(--text-muted)',
              transition: 'color 0.2s, transform 0.15s',
              flexShrink: 0
            }}
            title={isStarred ? 'Remove from watchlist' : 'Add to watchlist'}
            onMouseEnter={e => e.target.style.transform = 'scale(1.2)'}
            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
          >
            {isStarred ? '⭐' : '☆'}
          </button>
        )}
      </div>

      {/* Bowling style */}
      {player.bowling_style && !compact && (
        <div style={{ marginTop: '0.75rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          🎳 {player.bowling_style}
        </div>
      )}
    </div>
  )
}

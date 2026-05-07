import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Swords, TrendingUp, BarChart3, Star, LogOut, Zap } from 'lucide-react'
import useAuthStore from '../../store/authStore'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Command Center' },
  { to: '/players', icon: Users, label: 'Player Scout' },
  { to: '/battle', icon: Swords, label: 'Battle Simulator' },
  { to: '/match', icon: BarChart3, label: 'Match Analysis' },
  { to: '/predict', icon: TrendingUp, label: 'Season Predictor' },
  { to: '/watchlist', icon: Star, label: 'My Watchlist' },
]

export default function Sidebar() {
  const { username, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="sidebar flex flex-col justify-between py-4">
      <div>
        {/* Scout Profile */}
        <div className="px-4 mb-6">
          <div className="card p-3 flex items-center gap-3">
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #00D4FF, #6366F1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.875rem', color: '#0A0E1A',
              flexShrink: 0
            }}>
              {username?.[0]?.toUpperCase() || 'S'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {username || 'Scout'}
              </div>
              <div className="badge badge-blue" style={{ fontSize: '0.6rem', padding: '1px 6px' }}>Digital Scout</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav>
          <div style={{ padding: '0 1rem 0.5rem', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Scout Tools
          </div>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={17} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="px-4">
        <div className="divider" />
        <button className="btn btn-ghost w-full" onClick={handleLogout}>
          <LogOut size={15} />
          Sign Out
        </button>
        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
          <Zap size={10} style={{ display: 'inline', marginRight: 4 }} />
          SportsMassive v1.0
        </div>
      </div>
    </aside>
  )
}

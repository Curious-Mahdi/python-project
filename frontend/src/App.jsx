import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import useAuthStore from './store/authStore'
import TopBar from './components/layout/TopBar'
import Sidebar from './components/layout/Sidebar'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import PlayerPage from './pages/PlayerPage'
import BattlePage from './pages/BattlePage'
import MatchPage from './pages/MatchPage'
import PredictPage from './pages/PredictPage'
import WatchlistPage from './pages/WatchlistPage'

const pageVariants = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, x: -16, transition: { duration: 0.2 } },
}

function AuthGuard({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <TopBar />
      <Sidebar />
      <main className="main-content">
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} variants={pageVariants} initial="initial" animate="animate" exit="exit">
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<AuthGuard><AppLayout><DashboardPage /></AppLayout></AuthGuard>} />
        <Route path="/players" element={<AuthGuard><AppLayout><PlayerPage /></AppLayout></AuthGuard>} />
        <Route path="/battle" element={<AuthGuard><AppLayout><BattlePage /></AppLayout></AuthGuard>} />
        <Route path="/match" element={<AuthGuard><AppLayout><MatchPage /></AppLayout></AuthGuard>} />
        <Route path="/predict" element={<AuthGuard><AppLayout><PredictPage /></AppLayout></AuthGuard>} />
        <Route path="/watchlist" element={<AuthGuard><AppLayout><WatchlistPage /></AppLayout></AuthGuard>} />
      </Routes>
    </BrowserRouter>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Eye, EyeOff, UserPlus, LogIn } from 'lucide-react'
import client from '../api/client'
import useAuthStore from '../store/authStore'

export default function LoginPage() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/signup'
      const payload = mode === 'login'
        ? { email: form.email, password: form.password }
        : { username: form.username, email: form.email, password: form.password }
      const res = await client.post(endpoint, payload)
      login(res.data.token, res.data.username, res.data.user_id)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow blobs */}
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)',
        top: '10%', left: '10%', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)',
        bottom: '5%', right: '5%', pointerEvents: 'none'
      }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: 420, padding: '0 1rem' }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'linear-gradient(135deg, #00D4FF, #6366F1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 0 30px rgba(0,212,255,0.3)'
          }}>
            <Zap size={28} color="#0A0E1A" fill="#0A0E1A" />
          </div>
          <h1 style={{
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
            fontSize: '2rem', letterSpacing: '0.05em',
            background: 'linear-gradient(135deg, #F0F4FF, #00D4FF)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>
            SPORTSMASSIVE
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            IPL Intelligence & Strategy Hub
          </p>
        </div>

        {/* Card */}
        <div className="glass" style={{ padding: '2rem' }}>
          {/* Tab toggle */}
          <div style={{
            display: 'flex', background: 'var(--bg-primary)',
            borderRadius: 8, padding: 4, marginBottom: '1.5rem'
          }}>
            {['login', 'signup'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError('') }}
                style={{
                  flex: 1, padding: '0.5rem', border: 'none', cursor: 'pointer', borderRadius: 6,
                  fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.2s',
                  background: mode === m ? 'var(--accent-blue)' : 'transparent',
                  color: mode === m ? '#0A0E1A' : 'var(--text-muted)',
                }}>
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  key="username"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                    Scout Name
                  </label>
                  <input className="input" placeholder="e.g. DigitalScout07"
                    value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    required={mode === 'signup'} />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                Email
              </label>
              <input className="input" type="email" placeholder="scout@ipl.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input className="input" type={showPw ? 'text' : 'password'} placeholder="••••••••"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required style={{ paddingRight: '2.5rem' }} />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{
                    position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)'
                  }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 8, padding: '0.6rem 0.875rem',
                  fontSize: '0.8rem', color: 'var(--accent-red)'
                }}
              >
                {error}
              </motion.div>
            )}

            <button className="btn btn-primary" type="submit" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
              {loading ? (
                <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Processing...</>
              ) : mode === 'login' ? (
                <><LogIn size={15} /> Enter the Scout Room</>
              ) : (
                <><UserPlus size={15} /> Create Scout Account</>
              )}
            </button>
          </form>

          {/* Demo hint */}
          <div style={{
            marginTop: '1.25rem', padding: '0.75rem',
            background: 'rgba(0,212,255,0.05)', borderRadius: 8, border: '1px solid rgba(0,212,255,0.1)',
            fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center'
          }}>
            💡 Create any account to get started — no real credentials needed
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Powered by Gemini AI · Cricsheet Data · Built for IPL 2023
        </p>
      </motion.div>
    </div>
  )
}

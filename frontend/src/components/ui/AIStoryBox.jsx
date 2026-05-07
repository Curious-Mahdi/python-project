import { Bot, Sparkles } from 'lucide-react'

export default function AIStoryBox({ story, loading, title = 'AI Scout Analysis' }) {
  return (
    <div className="ai-box">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'linear-gradient(135deg, #6366F1, #00D4FF)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Bot size={14} color="#fff" />
        </div>
        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--accent-blue)' }}>{title}</span>
        <span className="badge badge-violet" style={{ fontSize: '0.6rem', marginLeft: 'auto' }}>
          Gemini AI
        </span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0' }}>
          <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Analysing matchup data...
          </span>
        </div>
      ) : story ? (
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.7 }}>
          {story.split('\n\n').map((para, i) => (
            <p key={i} style={{ marginBottom: i < story.split('\n\n').length - 1 ? '0.75rem' : 0 }}>
              {para}
            </p>
          ))}
        </div>
      ) : (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>
          Run a search to generate AI analysis...
        </div>
      )}
    </div>
  )
}

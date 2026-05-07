import { FileDown, Loader } from 'lucide-react'
import { useState } from 'react'
import client from '../../api/client'

export default function ExportButton({ matchId, playerName, aiSummary, h2hData }) {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      const res = await client.post('/export/pdf', {
        match_id: matchId,
        player_name: playerName,
        ai_summary: aiSummary || '',
        h2h: h2hData || {},
      }, { responseType: 'blob' })

      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.download = 'sportsmassive_strategy.pdf'
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF export failed:', err)
      alert('Export failed. Make sure you are logged in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button className="btn btn-primary" onClick={handleExport} disabled={loading}>
      {loading ? <Loader size={15} className="animate-spin" /> : <FileDown size={15} />}
      {loading ? 'Generating PDF...' : 'Export Strategy PDF'}
    </button>
  )
}

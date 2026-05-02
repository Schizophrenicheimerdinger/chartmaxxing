'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const BLUE = '#4d7cff'
const BG = '#0a0a0f'
const SURFACE = '#111116'
const BORDER = 'rgba(255,255,255,0.06)'
const TEXT = '#e8e8f0'
const MUTED = '#555568'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleReset = async () => {
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/projects')
  }

  const input: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`,
    borderRadius: 8, padding: '11px 14px', color: TEXT, fontSize: 14,
    outline: 'none', boxSizing: 'border-box', marginBottom: 12
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ width: 380, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 36 }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, color: TEXT, margin: '0 0 8px' }}>Set new password</h1>
        <p style={{ color: MUTED, fontSize: 14, margin: '0 0 28px' }}>Choose a new password for your account</p>

        <input value={password} onChange={e => setPassword(e.target.value)} placeholder="New password" type="password" style={input} />
        <input value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirm password" type="password" style={input} onKeyDown={e => e.key === 'Enter' && handleReset()} />

        {error && <div style={{ color: '#ff6b6b', fontSize: 13, marginBottom: 12 }}>{error}</div>}

        <button onClick={handleReset} disabled={loading} style={{
          width: '100%', padding: '12px', borderRadius: 8, border: 'none',
          background: BLUE, color: 'white', fontSize: 14, fontWeight: 700,
          cursor: 'pointer', opacity: loading ? 0.6 : 1
        }}>
          {loading ? 'Saving...' : 'Set password'}
        </button>
      </div>
    </div>
  )
}

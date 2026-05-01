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

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async () => {
    setLoading(true); setError(''); setMessage('')
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Check your email for a confirmation link!')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else router.push('/projects')
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  const input: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`,
    borderRadius: 8, padding: '11px 14px', color: TEXT, fontSize: 14,
    outline: 'none', boxSizing: 'border-box', marginBottom: 12
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ width: 380, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 36 }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, color: TEXT, margin: '0 0 8px' }}>
          {isSignUp ? 'Create account' : 'Welcome back'}
        </h1>
        <p style={{ color: MUTED, fontSize: 14, margin: '0 0 28px' }}>
          {isSignUp ? 'Sign up to get started' : 'Sign in to your account'}
        </p>

        <button onClick={handleGoogle} style={{
          width: '100%', padding: '11px', borderRadius: 8, border: `1px solid ${BORDER}`,
          background: 'rgba(255,255,255,0.04)', color: TEXT, fontSize: 14, fontWeight: 600,
          cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
        }}>
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#4285F4" d="M47.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h13.1c-.6 3-2.3 5.5-4.9 7.2v6h7.9c4.6-4.3 7.4-10.6 7.4-17.2z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.9-6c-2.1 1.4-4.8 2.3-8 2.3-6.1 0-11.3-4.1-13.1-9.7H2.7v6.2C6.7 42.8 14.8 48 24 48z"/><path fill="#FBBC05" d="M10.9 28.8c-.5-1.4-.7-2.9-.7-4.4s.2-3 .7-4.4v-6.2H2.7C1 17.1 0 20.4 0 24s1 6.9 2.7 9.8l8.2-5z"/><path fill="#EA4335" d="M24 9.5c3.4 0 6.5 1.2 8.9 3.5l6.6-6.6C35.9 2.5 30.5 0 24 0 14.8 0 6.7 5.2 2.7 14.2l8.2 6.2C12.7 13.6 17.9 9.5 24 9.5z"/></svg>
          Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: BORDER }} />
          <span style={{ color: MUTED, fontSize: 12 }}>or</span>
          <div style={{ flex: 1, height: 1, background: BORDER }} />
        </div>

        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" style={input} />
        <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" style={input} />

        {error && <div style={{ color: '#ff6b6b', fontSize: 13, marginBottom: 12 }}>{error}</div>}
        {message && <div style={{ color: '#6bffb8', fontSize: 13, marginBottom: 12 }}>{message}</div>}

        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', padding: '12px', borderRadius: 8, border: 'none',
          background: BLUE, color: 'white', fontSize: 14, fontWeight: 700,
          cursor: 'pointer', marginBottom: 16, opacity: loading ? 0.6 : 1
        }}>
          {loading ? 'Loading...' : isSignUp ? 'Create account' : 'Sign in'}
        </button>

        <div style={{ textAlign: 'center', fontSize: 13, color: MUTED }}>
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <button onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage('') }}
            style={{ background: 'none', border: 'none', color: BLUE, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </div>
      </div>
    </div>
  )
}
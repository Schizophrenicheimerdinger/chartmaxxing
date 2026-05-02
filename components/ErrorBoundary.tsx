'use client'

import { Component, ReactNode } from 'react'

export default class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
          <div style={{ textAlign: 'center', color: '#e8e8f0' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>Something went wrong</h2>
            <p style={{ color: '#555568', fontSize: 14, margin: '0 0 24px' }}>Try refreshing the page.</p>
            <button onClick={() => window.location.reload()} style={{ padding: '10px 24px', background: '#4d7cff', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Refresh
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

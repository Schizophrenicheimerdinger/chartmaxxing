'use client'

import React from 'react'

const BLUE = '#4d7cff'
const SURFACE = '#111116'
const BORDER = 'rgba(255,255,255,0.06)'
const TEXT = '#e8e8f0'
const MUTED = '#555568'
const BG = '#0c0c10'

interface Props {
  onBack: () => void
  projectId: string | null
  projectTitle: string
  setProjectTitle: (v: string) => void
  saveStatus: 'saved' | 'saving' | 'unsaved'

  mobileTab: 'data' | 'preview' | 'settings'
  setMobileTab: (v: 'data' | 'preview' | 'settings') => void

  rightTab: 'design' | 'colors' | 'fonts'
  setRightTab: (v: 'design' | 'colors' | 'fonts') => void

  isPlaying: boolean
  playLoading: boolean
  isPro: boolean
  playCount: number
  speed: number
  setSpeed: (v: number) => void
  ratio: 'square' | 'portrait' | 'landscape'
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  onPlay: () => void
  onRestart: () => void
  onExport: () => void
  isRecording: boolean

  dataPanel: React.ReactNode
  settingsPanel: React.ReactNode
}

export default function MobileEditorShell({
  onBack, projectId, projectTitle, setProjectTitle, saveStatus,
  mobileTab, setMobileTab, rightTab, setRightTab,
  isPlaying, playLoading, isPro, playCount, speed, setSpeed, ratio,
  canvasRef, onPlay, onRestart, onExport, isRecording,
  dataPanel, settingsPanel,
}: Props) {
  const playsLeft = Math.max(0, 5 - playCount)

  const canvasAspect = ratio === 'portrait' ? '9/16' : ratio === 'landscape' ? '16/9' : '1/1'
  const canvasMaxW = ratio === 'portrait' ? 220 : ratio === 'landscape' ? '100%' : 300

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: BG, color: TEXT, fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14, overflow: 'hidden' }}>

      {/* Compact header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', height: 44, borderBottom: `1px solid ${BORDER}`, flexShrink: 0, gap: 8 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: '0 4px 0 0', flexShrink: 0 }}>←</button>
        {projectId && (
          <input
            value={projectTitle}
            onChange={e => setProjectTitle(e.target.value)}
            style={{ flex: 1, background: 'transparent', border: 'none', color: TEXT, fontSize: 14, fontWeight: 600, outline: 'none', minWidth: 0 }}
          />
        )}
        {projectId && (
          <span style={{ fontSize: 11, flexShrink: 0, color: saveStatus === 'saved' ? '#4a4' : saveStatus === 'saving' ? MUTED : '#a84' }}>
            {saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'saving' ? '···' : '● Unsaved'}
          </span>
        )}
      </div>

      {/* Panel area */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>

        {/* Data tab */}
        <div style={{ position: 'absolute', inset: 0, display: mobileTab === 'data' ? 'flex' : 'none', flexDirection: 'column', background: SURFACE, overflow: 'hidden' }}>
          {dataPanel}
        </div>

        {/* Preview tab — canvas always in DOM so redraws work */}
        <div style={{ position: 'absolute', inset: 0, display: mobileTab === 'preview' ? 'flex' : 'none', flexDirection: 'column', background: '#08080d' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '16px 16px 8px' }}>
            <div style={{ width: canvasMaxW, maxWidth: '100%', aspectRatio: canvasAspect, borderRadius: 8, overflow: 'hidden', boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 10px 30px rgba(0,0,0,0.6)' }}>
              <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
            </div>
          </div>
          <div style={{ padding: '8px 16px 12px', background: SURFACE, borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <button onClick={onRestart} disabled={playLoading} style={{ width: 42, height: 42, borderRadius: 8, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.05)', color: '#aaa', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>↺</button>
              <button onClick={onPlay} disabled={playLoading} style={{ flex: 1, height: 42, borderRadius: 8, border: 'none', background: BLUE, color: 'white', fontSize: 14, fontWeight: 600, cursor: playLoading ? 'default' : 'pointer', opacity: playLoading ? 0.7 : 1 }}>
                {playLoading ? '⏳ Loading...' : isPlaying ? '⏸ Pause' : `▶ Play${!isPro && playCount > 0 ? ` (${playsLeft} left)` : ''}`}
              </button>
              <button onClick={onExport} disabled={isRecording} style={{ height: 42, borderRadius: 8, border: `1px solid ${isPro ? BLUE : 'rgba(77,124,255,0.3)'}`, background: isPro ? BLUE : 'rgba(77,124,255,0.12)', color: isPro ? 'white' : BLUE, fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: isRecording ? 0.5 : 1, padding: '0 12px', flexShrink: 0 }}>
                {isRecording ? '⏺' : isPro ? '⬇ Export' : '⚡ Pro'}
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: MUTED, flexShrink: 0 }}>Speed {speed.toFixed(1)}×</span>
              <input type="range" min="0.1" max="5" step="0.1" value={speed} onChange={e => setSpeed(parseFloat(e.target.value))} style={{ flex: 1, accentColor: BLUE }} />
            </div>
          </div>
        </div>

        {/* Settings tab */}
        <div style={{ position: 'absolute', inset: 0, display: mobileTab === 'settings' ? 'flex' : 'none', flexDirection: 'column', background: SURFACE, overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
            {(['design', 'colors', 'fonts'] as const).map(tab => (
              <button key={tab} onClick={() => setRightTab(tab)} style={{ flex: 1, padding: '11px 0', fontSize: 11, fontWeight: 600, textTransform: 'capitalize', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: 0.3, color: rightTab === tab ? TEXT : MUTED, borderBottom: rightTab === tab ? `2px solid ${BLUE}` : '2px solid transparent' }}>
                {tab}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
            {settingsPanel}
          </div>
        </div>

      </div>

      {/* Bottom tab bar */}
      <div style={{ display: 'flex', height: 56, borderTop: `1px solid ${BORDER}`, background: SURFACE, flexShrink: 0 }}>
        {([
          { key: 'data' as const, icon: '⊞', label: 'Data' },
          { key: 'preview' as const, icon: '▶', label: 'Preview' },
          { key: 'settings' as const, icon: '⚙', label: 'Settings' },
        ]).map(({ key, icon, label }) => (
          <button
            key={key}
            onClick={() => setMobileTab(key)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 2, background: 'none', border: 'none', cursor: 'pointer',
              borderTop: mobileTab === key ? `2px solid ${BLUE}` : '2px solid transparent',
              color: mobileTab === key ? BLUE : MUTED,
            }}
          >
            <span style={{ fontSize: 16 }}>{icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

'use client'

import { useState, useRef, useCallback, useMemo, useEffect, Suspense } from 'react'
import { drawRaceChart, type RaceChartStyle, RACE_PRESETS, RACE_FONTS, DEFAULT_RACE_COLORS } from '@/lib/race-chart'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import { useRouter, useSearchParams } from 'next/navigation'
import DataImportModal from '@/components/DataImportModal'

const BLUE = '#4d7cff'
const BG = '#0c0c10'
const SURFACE = '#111116'
const BORDER = 'rgba(255,255,255,0.06)'
const TEXT = '#e8e8f0'
const MUTED = '#555568'

function ColorRow({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0' }}>
      <span style={{ fontSize: 13, color: '#aaa' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color: '#444', fontFamily: 'monospace' }}>{value.startsWith('#') ? value.toUpperCase() : ''}</span>
        <input type="color" value={value.startsWith('#') ? value : '#ffffff'} onChange={e => onChange(e.target.value)}
          style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', background: 'transparent', padding: 2, flexShrink: 0 }} />
      </div>
    </div>
  )
}

function FontPicker({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '4px 0' }}>
      <span style={{ fontSize: 13, color: '#aaa', flexShrink: 0, width: 70 }}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ fontSize: 12, background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, borderRadius: 6, padding: '5px 8px', color: TEXT, fontFamily: value, flex: 1 }}>
        {RACE_FONTS.map(f => <option key={f} value={f} style={{ fontFamily: f, background: '#111' }}>{f}</option>)}
      </select>
    </div>
  )
}

function NumField({ label, value, onChange, min, max }: { label: string, value: number, onChange: (v: number) => void, min: number, max: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
      <span style={{ fontSize: 13, color: '#aaa' }}>{label}</span>
      <input type="number" value={value} min={min} max={max} onChange={e => onChange(parseInt(e.target.value) || min)}
        style={{ width: 60, fontSize: 13, background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, borderRadius: 6, padding: '4px 8px', color: TEXT, textAlign: 'right' }} />
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: MUTED, marginTop: 20, marginBottom: 10 }}>{children}</div>
}

function Divider() {
  return <div style={{ height: 1, background: BORDER, margin: '16px 0' }} />
}

const inputBase: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`,
  borderRadius: 8, padding: '9px 12px', color: TEXT, fontSize: 13, outline: 'none', boxSizing: 'border-box',
}

function EditorRaceInner() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project')
  const router = useRouter()

  const [series, setSeries] = useState<string[]>(['YouTube', 'Netflix', 'TikTok', 'Instagram'])
  const [rows, setRows] = useState<{ label: string; values: string[] }[]>([
    { label: '2018', values: ['1800', '1200', '500', '1000'] },
    { label: '2019', values: ['2000', '1500', '800', '1100'] },
    { label: '2020', values: ['2300', '2000', '1500', '1200'] },
    { label: '2021', values: ['2500', '2200', '2000', '1400'] },
    { label: '2022', values: ['2700', '2400', '2500', '1600'] },
  ])
  const [title, setTitle] = useState('Put your title here')
  const [subtitle, setSubtitle] = useState('Insert funny engaging subtitle')
  const [valueLabel, setValueLabel] = useState('Monthly active users (millions)')
  const [style, setStyle] = useState<RaceChartStyle>(RACE_PRESETS.default.style)
  const [speed, setSpeed] = useState(1)
  const [ratio, setRatio] = useState<'square' | 'portrait' | 'landscape'>('square')
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [isPro, setIsPro] = useState(false)
  const [rightTab, setRightTab] = useState<'design' | 'colors' | 'fonts'>('design')
  const [projectTitle, setProjectTitle] = useState('Untitled')
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [loaded, setLoaded] = useState(false)
  const [playCount, setPlayCount] = useState(0)
  const [playLoading, setPlayLoading] = useState(false)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [showImport, setShowImport] = useState(false)

  useEffect(() => {
    fetch('/api/check-pro').then(r => r.json()).then(d => {
      setIsPro(d.isPro)
      if (d.user) {
        fetch('/api/play').then(r => r.json()).then(pd => {
          if (pd.play_count !== undefined) setPlayCount(pd.play_count)
        })
      }
    })
  }, [])

  useEffect(() => {
    if (!projectId) { setLoaded(true); return }
    fetch(`/api/projects/${projectId}`).then(r => r.json()).then(({ project }) => {
      if (!project) { setLoaded(true); return }
      setProjectTitle(project.title ?? 'Untitled')
      if (project.data) {
        const d = project.data
        if (d.series) setSeries(d.series)
        if (d.rows) setRows(d.rows)
        if (d.title) setTitle(d.title)
        if (d.subtitle) setSubtitle(d.subtitle)
        if (d.valueLabel) setValueLabel(d.valueLabel)
      }
      if (project.settings) {
        const s = project.settings
        if (s.style) setStyle(s.style)
        if (s.ratio) setRatio(s.ratio)
        if (s.speed !== undefined) setSpeed(s.speed)
      }
      setLoaded(true)
    })
  }, [projectId])

  const saveProject = useCallback(() => {
    if (!projectId || !loaded) return
    setSaveStatus('saving')
    fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: projectTitle,
        data: { series, rows, title, subtitle, valueLabel },
        settings: { style, ratio, speed }
      })
    }).then(() => setSaveStatus('saved'))
  }, [projectId, loaded, projectTitle, series, rows, title, subtitle, valueLabel, style, ratio, speed])

  useEffect(() => {
    if (!loaded) return
    setSaveStatus('unsaved')
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(saveProject, 1500)
  }, [series, rows, title, subtitle, valueLabel, style, ratio, speed, projectTitle])

  const frames = useMemo(() => rows.map(r => ({
    label: r.label,
    values: series.map((_, i) => parseFloat(r.values[i] ?? '0') || 0)
  })), [rows, series])

  const chartProps = { frames, series, title, subtitle, valueLabel, ratio, style }

  const redraw = useCallback((progress = 1) => {
    if (canvasRef.current) drawRaceChart(canvasRef.current, progress, chartProps)
  }, [chartProps])

  useEffect(() => { redraw(1) }, [redraw])

  const startAnimation = useCallback(async () => {
    if (isPlaying || playLoading) return
    if (!isPro) {
      setPlayLoading(true)
      const res = await fetch('/api/play', { method: 'POST' })
      const data = await res.json()
      setPlayLoading(false)
      if (!data.allowed) { setShowUpgradePrompt(true); return }
      setPlayCount(data.play_count)
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setIsPlaying(true)
    let p = 0
    const step = () => {
      p += 0.003 * speed
      if (p >= 1) { redraw(1); setIsPlaying(false); return }
      redraw(p); rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
  }, [redraw, speed, isPro, isPlaying, playLoading])

  const stopAnimation = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setIsPlaying(false); redraw(1)
  }, [redraw])

  const handleExport = useCallback(async () => {
    if (!isPro) {
      const res = await fetch('/api/checkout', { method: 'POST' })
      const { url } = await res.json()
      window.location.href = url; return
    }
    if (isRecording || !canvasRef.current) return
    setIsRecording(true); setStatusText('Recording...')
    const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm'
    const stream = canvasRef.current.captureStream(60)
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 10_000_000 })
    const chunks: Blob[] = []
    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }
    recorder.onstop = async () => {
      setStatusText('Converting...')
      const webmBlob = new Blob(chunks, { type: mimeType })
      const ffmpeg = new FFmpeg()
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      })
      await ffmpeg.writeFile('input.webm', await fetchFile(webmBlob))
      await ffmpeg.exec(['-i', 'input.webm', '-c:v', 'libx264', '-preset', 'fast', 'output.mp4'])
      const fileData = await ffmpeg.readFile('output.mp4')
      const mp4Blob = new Blob([fileData as BlobPart], { type: 'video/mp4' })
      const url = URL.createObjectURL(mp4Blob)
      const a = document.createElement('a'); a.href = url; a.download = 'chartmaxxing.mp4'; a.click()
      URL.revokeObjectURL(url); setIsRecording(false); setStatusText('')
    }
    redraw(0)
    await new Promise(r => setTimeout(r, 400))
    recorder.start(100)
    await new Promise(r => setTimeout(r, 500))
    await new Promise<void>(resolve => {
      let p = 0
      const step = () => {
        p += 0.0015 * speed
        if (p >= 1) { redraw(1); setTimeout(() => { recorder.stop(); resolve() }, 1200); return }
        redraw(p); requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    })
  }, [isPro, isRecording, redraw, speed])

  const updateCell = (rowIdx: number, colIdx: number, val: string) =>
    setRows(prev => prev.map((r, i) => i === rowIdx ? {
      ...r, values: r.values.map((v, j) => j === colIdx ? val : v)
    } : r))

  const updateRowLabel = (i: number, val: string) =>
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, label: val } : r))

  const addRow = () => setRows(prev => [...prev, { label: '', values: series.map(() => '') }])
  const removeRow = (i: number) => setRows(prev => prev.filter((_, idx) => idx !== i))

  const addSeries = () => {
    setSeries(prev => [...prev, `Series ${prev.length + 1}`])
    setRows(prev => prev.map(r => ({ ...r, values: [...r.values, ''] })))
  }

  const removeSeries = (i: number) => {
    setSeries(prev => prev.filter((_, idx) => idx !== i))
    setRows(prev => prev.map(r => ({ ...r, values: r.values.filter((_, idx) => idx !== i) })))
  }

  const updateSeriesName = (i: number, val: string) =>
    setSeries(prev => prev.map((s, idx) => idx === i ? val : s))

  const updateStyle = (key: keyof RaceChartStyle, val: string | number | string[]) =>
    setStyle(prev => ({ ...prev, [key]: val }))

  const canvasDisplay = ratio === 'portrait' ? { w: 270, h: 480 } : ratio === 'landscape' ? { w: 580, h: 326 } : { w: 540, h: 540 }
  const playsLeft = Math.max(0, 5 - playCount)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: BG, color: TEXT, fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14 }}>

      {showImport && (
        <DataImportModal
          chartType="race"
          onImport={(data: any) => {
            if (data.series && data.rows) {
              setSeries(data.series)
              setRows(data.rows)
            }
          }}
          onClose={() => setShowImport(false)}
        />
      )}

      {showUpgradePrompt && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowUpgradePrompt(false)}>
          <div style={{ background: '#16161e', border: `1px solid ${BORDER}`, borderRadius: 16, width: 400, padding: 36, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚡</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: TEXT, margin: '0 0 12px', fontFamily: 'Syne, sans-serif' }}>You've used your 5 free plays</h2>
            <p style={{ fontSize: 14, color: MUTED, margin: '0 0 28px', lineHeight: 1.6 }}>Upgrade to Pro for unlimited plays, unlimited exports, and no watermark.</p>
            <button onClick={handleExport} style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: BLUE, color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}>Upgrade to Pro — $4.99/mo</button>
            <button onClick={() => setShowUpgradePrompt(false)} style={{ width: '100%', padding: '11px', borderRadius: 10, border: `1px solid ${BORDER}`, background: 'transparent', color: MUTED, fontSize: 14, cursor: 'pointer' }}>Maybe later</button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', height: 50, borderBottom: `1px solid ${BORDER}`, flexShrink: 0, gap: 10 }}>
        <button onClick={() => router.push('/projects')} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 13, cursor: 'pointer', padding: '0 8px 0 0' }}>← Projects</button>
        {projectId && <input value={projectTitle} onChange={e => setProjectTitle(e.target.value)} style={{ background: 'transparent', border: 'none', color: TEXT, fontSize: 14, fontWeight: 600, outline: 'none', width: 180 }} />}
        {projectId && <span style={{ fontSize: 11, color: saveStatus === 'saved' ? '#4a4' : saveStatus === 'saving' ? MUTED : '#a84' }}>{saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'saving' ? 'Saving...' : '● Unsaved'}</span>}
        <div style={{ flex: 1 }} />
        <button onClick={() => { redraw(0); startAnimation() }} disabled={playLoading} style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, borderRadius: 7, padding: '6px 11px', color: '#aaa', fontSize: 13, cursor: 'pointer' }}>↺</button>
        <button onClick={isPlaying ? stopAnimation : startAnimation} disabled={playLoading} style={{ background: BLUE, border: 'none', borderRadius: 7, padding: '6px 16px', color: 'white', fontSize: 13, fontWeight: 600, cursor: playLoading ? 'default' : 'pointer', opacity: playLoading ? 0.7 : 1 }}>
          {playLoading ? '⏳ Loading...' : isPlaying ? '⏸ Pause' : `▶ Play${!isPro && playCount > 0 ? ` (${playsLeft} left)` : ''}`}
        </button>
        <button onClick={handleExport} disabled={isRecording} style={{ background: isPro ? BLUE : 'rgba(77,124,255,0.12)', border: `1px solid ${isPro ? BLUE : 'rgba(77,124,255,0.3)'}`, borderRadius: 7, padding: '6px 16px', color: isPro ? 'white' : BLUE, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: isRecording ? 0.5 : 1 }}>
          {isRecording ? `⏺ ${statusText}` : isPro ? '⬇ Export MP4' : '⚡ Go Pro — $4.99/mo'}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4 }}>
          <span style={{ fontSize: 11, color: MUTED }}>{speed.toFixed(1)}×</span>
          <input type="range" min="0.1" max="5" step="0.1" value={speed} onChange={e => setSpeed(parseFloat(e.target.value))} style={{ width: 64, accentColor: BLUE }} />
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Data panel */}
        <div style={{ width: 320, background: SURFACE, borderRight: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: `1px solid ${BORDER}`, gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#ccc' }}>Data</span>
            <button onClick={addSeries} style={{ fontSize: 11, color: MUTED, background: 'none', border: `1px solid ${BORDER}`, borderRadius: 5, padding: '3px 8px', cursor: 'pointer' }}>+ Series</button>
            <button onClick={() => setShowImport(true)} style={{ marginLeft: 'auto', fontSize: 11, color: MUTED, background: 'none', border: `1px solid ${BORDER}`, borderRadius: 5, padding: '3px 8px', cursor: 'pointer' }}>+ Import</button>
          </div>

          {/* Scrollable table */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <th style={{ padding: '5px 8px', fontSize: 10, color: '#3a3a50', fontWeight: 600, textAlign: 'left', width: 60, background: SURFACE, position: 'sticky', top: 0, zIndex: 1 }}>Time</th>
                  {series.map((s, i) => (
                    <th key={i} style={{ padding: '4px 4px', background: SURFACE, position: 'sticky', top: 0, zIndex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <input value={s} onChange={e => updateSeriesName(i, e.target.value)}
                          style={{ width: 70, background: 'transparent', border: 'none', color: '#4d7cff', fontSize: 11, fontWeight: 600, outline: 'none' }} />
                        <button onClick={() => removeSeries(i)}
                          style={{ background: 'none', border: 'none', color: '#333', cursor: 'pointer', fontSize: 10, padding: 0, lineHeight: 1 }}
                          onMouseOver={e => (e.currentTarget.style.color = '#e55')}
                          onMouseOut={e => (e.currentTarget.style.color = '#333')}>✕</button>
                      </div>
                    </th>
                  ))}
                  <th style={{ width: 22, background: SURFACE, position: 'sticky', top: 0, zIndex: 1 }} />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri} style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '0 8px' }}>
                      <input value={row.label} onChange={e => updateRowLabel(ri, e.target.value)}
                        style={{ width: 52, background: 'transparent', border: 'none', color: TEXT, fontSize: 12, outline: 'none' }}
                        placeholder="Label" />
                    </td>
                    {series.map((_, ci) => (
                      <td key={ci} style={{ padding: '0 4px' }}>
                        <input value={row.values[ci] ?? ''} onChange={e => updateCell(ri, ci, e.target.value)}
                          style={{ width: 70, background: 'transparent', border: 'none', color: TEXT, fontSize: 12, outline: 'none', textAlign: 'right' }}
                          placeholder="0" />
                      </td>
                    ))}
                    <td>
                      <button onClick={() => removeRow(ri)}
                        style={{ width: 20, height: 20, background: 'none', border: 'none', color: '#333', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3 }}
                        onMouseOver={e => (e.currentTarget.style.color = '#e55')}
                        onMouseOut={e => (e.currentTarget.style.color = '#333')}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={addRow} style={{ width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: 12, color: MUTED, background: 'none', border: 'none', cursor: 'pointer' }}>
              + Add row
            </button>
          </div>
          <div style={{ padding: '7px 14px', borderTop: `1px solid ${BORDER}`, fontSize: 11, color: '#333' }}>
            {rows.length} frames · {series.length} series
          </div>
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#08080d', overflow: 'hidden' }}>
          <div style={{ borderRadius: 10, overflow: 'hidden', boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 20px 50px rgba(0,0,0,0.6)', width: canvasDisplay.w, height: canvasDisplay.h }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
          </div>
        </div>

        {/* Right panel */}
        <div style={{ width: 264, background: SURFACE, borderLeft: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
            {(['design', 'colors', 'fonts'] as const).map(tab => (
              <button key={tab} onClick={() => setRightTab(tab)} style={{ flex: 1, padding: '11px 0', fontSize: 11, fontWeight: 600, textTransform: 'capitalize', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: 0.3, color: rightTab === tab ? TEXT : MUTED, borderBottom: rightTab === tab ? `2px solid ${BLUE}` : '2px solid transparent' }}>{tab}</button>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
            {rightTab === 'design' && (
              <div>
                <SectionLabel>Format</SectionLabel>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                  {([{ key: 'portrait', label: '9:16', sub: 'TikTok' }, { key: 'square', label: '1:1', sub: 'Square' }, { key: 'landscape', label: '16:9', sub: 'YouTube' }] as const).map(r => (
                    <button key={r.key} onClick={() => setRatio(r.key)} style={{ padding: '8px 6px', borderRadius: 7, textAlign: 'center', border: `1px solid ${ratio === r.key ? BLUE : BORDER}`, background: ratio === r.key ? 'rgba(77,124,255,0.1)' : 'rgba(255,255,255,0.02)', cursor: 'pointer' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: ratio === r.key ? BLUE : TEXT }}>{r.label}</div>
                      <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{r.sub}</div>
                    </button>
                  ))}
                </div>
                <Divider />
                <SectionLabel>Text</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Chart title" style={inputBase} />
                  <input value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Subtitle" style={{ ...inputBase, color: '#aaa' }} />
                  <input value={valueLabel} onChange={e => setValueLabel(e.target.value)} placeholder="Value label (e.g. users)" style={inputBase} />
                </div>
                <Divider />
                <SectionLabel>Options</SectionLabel>
                <NumField label="Max bars shown" value={style.maxBars} onChange={v => updateStyle('maxBars', Math.min(Math.max(v, 3), 15))} min={3} max={15} />
              </div>
            )}
            {rightTab === 'colors' && (
              <div>
                <SectionLabel>Background</SectionLabel>
                <ColorRow label="Top" value={style.bgColor} onChange={v => updateStyle('bgColor', v)} />
                <ColorRow label="Bottom" value={style.bgColor2} onChange={v => updateStyle('bgColor2', v)} />
                <Divider />
                <SectionLabel>Bar Colors</SectionLabel>
                {style.barColors.slice(0, 10).map((c, i) => (
                  <ColorRow key={i} label={series[i] ?? `Series ${i + 1}`} value={c}
                    onChange={v => updateStyle('barColors', style.barColors.map((col, idx) => idx === i ? v : col))} />
                ))}
                <Divider />
                <SectionLabel>Text</SectionLabel>
                <ColorRow label="Title" value={style.titleColor} onChange={v => updateStyle('titleColor', v)} />
                <ColorRow label="Subtitle" value={style.subtitleColor} onChange={v => updateStyle('subtitleColor', v)} />
                <ColorRow label="Labels" value={style.labelColor} onChange={v => updateStyle('labelColor', v)} />
                <ColorRow label="Values" value={style.valueColor} onChange={v => updateStyle('valueColor', v)} />
                <ColorRow label="Time label" value={style.timeColor} onChange={v => updateStyle('timeColor', v)} />
              </div>
            )}
            {rightTab === 'fonts' && (
              <div>
                <SectionLabel>Fonts</SectionLabel>
                <FontPicker label="Title" value={style.titleFont} onChange={v => updateStyle('titleFont', v)} />
                <FontPicker label="Subtitle" value={style.subtitleFont} onChange={v => updateStyle('subtitleFont', v)} />
                <FontPicker label="Labels" value={style.labelFont} onChange={v => updateStyle('labelFont', v)} />
                <Divider />
                <SectionLabel>Sizes</SectionLabel>
                <NumField label="Title" value={style.titleSize} onChange={v => updateStyle('titleSize', v)} min={20} max={120} />
                <NumField label="Subtitle" value={style.subtitleSize} onChange={v => updateStyle('subtitleSize', v)} min={12} max={60} />
                <NumField label="Labels" value={style.labelSize} onChange={v => updateStyle('labelSize', v)} min={10} max={40} />
                <NumField label="Values" value={style.valueSize} onChange={v => updateStyle('valueSize', v)} min={10} max={40} />
                <NumField label="Time label" value={style.timeSize} onChange={v => updateStyle('timeSize', v)} min={40} max={300} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EditorRace() {
  return <Suspense fallback={<div style={{ background: '#0c0c10', height: '100vh' }} />}><EditorRaceInner /></Suspense>
}
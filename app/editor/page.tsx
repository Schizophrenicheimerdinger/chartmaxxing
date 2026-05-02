'use client'

import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { drawChart, type ChartStyle, type SeriesData, PRESETS, FONTS } from '@/lib/chart'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import DataImportModal from '@/components/DataImportModal'
import MobileEditorShell from '@/components/MobileEditorShell'

const BLUE = '#4d7cff'
const BG = '#0c0c10'
const SURFACE = '#111116'
const BORDER = 'rgba(255,255,255,0.06)'
const TEXT = '#e8e8f0'
const MUTED = '#555568'

const SERIES_COLORS = ['#4d7cff', '#ff6b6b', '#51cf66', '#ffd43b', '#cc5de8', '#74c0fc', '#ff922b', '#f06595']

type SeriesItem = {
  name: string
  rows: { label: string, value: string }[]
  lineColor: string
  dotColor: string
  tipColor: string
  glowColor: string
  shadowColor: string
}

function makeSeries(name: string, color: string, rows?: { label: string, value: string }[]): SeriesItem {
  return {
    name,
    rows: rows ?? [],
    lineColor: color, dotColor: color, tipColor: color, glowColor: color, shadowColor: '#000000',
  }
}

function Toggle({ label, value, onChange }: { label: string, value: boolean, onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0' }}>
      <span style={{ fontSize: 13, color: '#aaa' }}>{label}</span>
      <button onClick={() => onChange(!value)} style={{ width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0, background: value ? BLUE : 'rgba(255,255,255,0.1)', transition: 'background 0.2s' }}>
        <span style={{ position: 'absolute', top: 2, left: value ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 0.2s', display: 'block' }} />
      </button>
    </div>
  )
}

function ColorRow({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0' }}>
      <span style={{ fontSize: 13, color: '#aaa' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color: '#444', fontFamily: 'monospace' }}>{value.startsWith('#') ? value.toUpperCase() : ''}</span>
        <input type="color" value={value.startsWith('#') ? value : '#ffffff'} onChange={e => onChange(e.target.value)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', background: 'transparent', padding: 2, flexShrink: 0 }} />
      </div>
    </div>
  )
}

function Slider({ label, value, onChange, min, max, step }: { label: string, value: number, onChange: (v: number) => void, min: number, max: number, step: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '4px 0' }}>
      <span style={{ fontSize: 13, color: '#aaa', flexShrink: 0 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} style={{ width: 80, accentColor: BLUE }} />
        <span style={{ fontSize: 11, color: '#555', width: 28, textAlign: 'right', flexShrink: 0 }}>{value}</span>
      </div>
    </div>
  )
}

function FontPicker({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '4px 0' }}>
      <span style={{ fontSize: 13, color: '#aaa', flexShrink: 0, width: 70 }}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ fontSize: 12, background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, borderRadius: 6, padding: '5px 8px', color: TEXT, fontFamily: value, flex: 1 }}>
        {FONTS.map(f => <option key={f} value={f} style={{ fontFamily: f, background: '#111' }}>{f}</option>)}
      </select>
    </div>
  )
}

function NumField({ label, value, onChange, min, max }: { label: string, value: number, onChange: (v: number) => void, min: number, max: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
      <span style={{ fontSize: 13, color: '#aaa' }}>{label}</span>
      <input type="number" value={value} min={min} max={max} onChange={e => onChange(parseInt(e.target.value) || min)} style={{ width: 60, fontSize: 13, background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, borderRadius: 6, padding: '4px 8px', color: TEXT, textAlign: 'right' }} />
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

function ExportOverlay({ status, progress }: { status: string, progress: number }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#16161e', border: `1px solid ${BORDER}`, borderRadius: 16, width: 360, padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 16 }}>⏺</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: TEXT, marginBottom: 8 }}>{status}</div>
        <div style={{ fontSize: 13, color: MUTED, marginBottom: 20 }}>Hang tight, this can take up to a minute. The progress bar may look a little off — that's normal, it's still working! Sorry for any inconvenience!</div>
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, height: 8, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 8, background: BLUE, width: `${progress}%`, transition: 'width 0.3s ease' }} />
        </div>
        <div style={{ fontSize: 12, color: MUTED, marginTop: 10 }}>{Math.round(progress)}%</div>
      </div>
    </div>
  )
}

function EditorInner() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project')
  const router = useRouter()

  const [series, setSeries] = useState<SeriesItem[]>([
    makeSeries('Line 1', SERIES_COLORS[0], [
      { label: 'Mon', value: '7' }, { label: 'Tue', value: '6' }, { label: 'Wed', value: '5' },
      { label: 'Thu', value: '3' }, { label: 'Fri', value: '1' }, { label: 'Sat', value: '12' }, { label: 'Sun', value: '10' },
    ])
  ])
  const [activeSeriesIdx, setActiveSeriesIdx] = useState(0)

  const [title, setTitle] = useState('Put your title here')
  const [subtitle, setSubtitle] = useState('Insert funny engaging subtitle')
  const [yLabel, setYLabel] = useState('hours of sleep')
  const [style, setStyle] = useState<ChartStyle>(PRESETS.default.style)
  const [speed, setSpeed] = useState(1)
  const [ratio, setRatio] = useState<'square' | 'portrait' | 'landscape'>('square')
  const [showDots, setShowDots] = useState(true)
  const [showValues, setShowValues] = useState(true)
  const [showAreaFill, setShowAreaFill] = useState(true)
  const [showGlow, setShowGlow] = useState(false)
  const [showShadow, setShowShadow] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [exportProgress, setExportProgress] = useState(0)
  const [isPro, setIsPro] = useState(false)
  const [rightTab, setRightTab] = useState<'design' | 'colors' | 'fonts'>('design')
  const [projectTitle, setProjectTitle] = useState('Untitled')
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [loaded, setLoaded] = useState(false)
  const [playCount, setPlayCount] = useState(0)
  const [playLoading, setPlayLoading] = useState(false)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileTab, setMobileTab] = useState<'data' | 'preview' | 'settings'>('data')

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
        if (d.series) {
          setSeries(d.series)
        } else if (d.rows) {
          // backward compat: single series
          setSeries([makeSeries('Line 1', SERIES_COLORS[0], d.rows)])
        }
        if (d.title) setTitle(d.title)
        if (d.subtitle) setSubtitle(d.subtitle)
        if (d.yLabel) setYLabel(d.yLabel)
      }
      if (project.settings) {
        const s = project.settings
        if (s.style) setStyle(s.style)
        if (s.ratio) setRatio(s.ratio)
        if (s.showDots !== undefined) setShowDots(s.showDots)
        if (s.showValues !== undefined) setShowValues(s.showValues)
        if (s.showAreaFill !== undefined) setShowAreaFill(s.showAreaFill)
        if (s.showGlow !== undefined) setShowGlow(s.showGlow)
        if (s.showShadow !== undefined) setShowShadow(s.showShadow)
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
        data: { series, title, subtitle, yLabel },
        settings: { style, ratio, showDots, showValues, showAreaFill, showGlow, showShadow, speed }
      })
    }).then(() => setSaveStatus('saved'))
  }, [projectId, loaded, projectTitle, series, title, subtitle, yLabel, style, ratio, showDots, showValues, showAreaFill, showGlow, showShadow, speed])

  useEffect(() => {
    if (!loaded) return
    setSaveStatus('unsaved')
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(saveProject, 1500)
  }, [series, title, subtitle, yLabel, style, ratio, showDots, showValues, showAreaFill, showGlow, showShadow, speed, projectTitle])

  const chartSeries = useMemo<SeriesData[]>(() => series.map(ser => ({
    data: ser.rows.map(r => ({ label: r.label, value: parseFloat(r.value) })).filter(d => !isNaN(d.value)),
    lineColor: ser.lineColor,
    dotColor: ser.dotColor,
    tipColor: ser.tipColor,
    glowColor: ser.glowColor,
    shadowColor: ser.shadowColor,
  })), [series])

  const effectiveStyle = useMemo(() => ({
    ...style,
    glowOpacity: showGlow ? style.glowOpacity : 0,
    glowBlur: showGlow ? style.glowBlur : 0,
    shadowOpacity: showShadow ? style.shadowOpacity : 0,
    shadowBlur: showShadow ? style.shadowBlur : 0,
  }), [style, showGlow, showShadow])

  const chartProps = { series: chartSeries, title, subtitle, yLabel, showDots, showValues, showAreaFill, ratio, style: effectiveStyle }

  const redraw = useCallback((progress = 1) => {
    if (canvasRef.current) drawChart(canvasRef.current, progress, chartProps)
  }, [chartProps])

  useEffect(() => { redraw(1) }, [redraw])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

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
    setIsRecording(true); setStatusText('Recording...'); setExportProgress(5)
    const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm'
    const stream = canvasRef.current.captureStream(60)
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 10_000_000 })
    const chunks: Blob[] = []
    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }
    recorder.onstop = async () => {
      setStatusText('Loading converter...'); setExportProgress(30)
      const webmBlob = new Blob(chunks, { type: mimeType })
      const ffmpeg = new FFmpeg()
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      })
      setStatusText('Converting...'); setExportProgress(50)
      ffmpeg.on('progress', ({ progress }) => {
        setExportProgress(50 + Math.round(progress * 45))
      })
      await ffmpeg.writeFile('input.webm', await fetchFile(webmBlob))
      await ffmpeg.exec(['-i', 'input.webm', '-c:v', 'libx264', '-preset', 'fast', 'output.mp4'])
      setExportProgress(98)
      const fileData = await ffmpeg.readFile('output.mp4')
      const mp4Blob = new Blob([fileData as BlobPart], { type: 'video/mp4' })
      const url = URL.createObjectURL(mp4Blob)
      const a = document.createElement('a'); a.href = url; a.download = 'chartmaxxing.mp4'; a.click()
      URL.revokeObjectURL(url)
      setIsRecording(false); setStatusText(''); setExportProgress(0)
    }
    redraw(0)
    await new Promise(r => setTimeout(r, 400))
    recorder.start(100)
    setExportProgress(15)
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

  const updateRow = (si: number, i: number, field: 'label' | 'value', val: string) =>
    setSeries(prev => prev.map((ser, sidx) => sidx !== si ? ser : {
      ...ser, rows: ser.rows.map((r, idx) => idx === i ? { ...r, [field]: val } : r)
    }))

  const addRow = (si: number) =>
    setSeries(prev => prev.map((ser, sidx) => sidx !== si ? ser : { ...ser, rows: [...ser.rows, { label: '', value: '' }] }))

  const removeRow = (si: number, i: number) =>
    setSeries(prev => prev.map((ser, sidx) => sidx !== si ? ser : { ...ser, rows: ser.rows.filter((_, idx) => idx !== i) }))

  const addSeries = () => {
    const nextIdx = series.length
    const color = SERIES_COLORS[nextIdx % SERIES_COLORS.length]
    const baseRows = series[0]?.rows.map(r => ({ label: r.label, value: '' })) ?? []
    setSeries(prev => [...prev, makeSeries(`Line ${nextIdx + 1}`, color, baseRows)])
    setActiveSeriesIdx(nextIdx)
  }

  const removeSeries = (si: number) => {
    if (series.length <= 1) return
    setSeries(prev => prev.filter((_, idx) => idx !== si))
    setActiveSeriesIdx(prev => Math.min(prev, series.length - 2))
  }

  const updateSeriesColor = (si: number, field: keyof Pick<SeriesItem, 'lineColor' | 'dotColor' | 'tipColor' | 'glowColor' | 'shadowColor'>, val: string) =>
    setSeries(prev => prev.map((ser, idx) => idx !== si ? ser : { ...ser, [field]: val }))

  const updateStyle = (key: keyof ChartStyle, val: string | number) =>
    setStyle(prev => ({ ...prev, [key]: val }))

  const canvasDisplay = ratio === 'portrait' ? { w: 270, h: 480 } : ratio === 'landscape' ? { w: 580, h: 326 } : { w: 540, h: 540 }
  const playsLeft = Math.max(0, 5 - playCount)
  const activeSeries = series[activeSeriesIdx] ?? series[0]
  const activeIdx = series[activeSeriesIdx] ? activeSeriesIdx : 0

  if (isMobile) {
    const upgradePrompt = showUpgradePrompt && (
      <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }} onClick={() => setShowUpgradePrompt(false)}>
        <div style={{ background: '#16161e', border: `1px solid rgba(255,255,255,0.06)`, borderRadius: 16, width: '100%', maxWidth: 400, padding: 32, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚡</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: TEXT, margin: '0 0 10px' }}>Used your 5 free plays</h2>
          <p style={{ fontSize: 13, color: MUTED, margin: '0 0 24px', lineHeight: 1.6 }}>Upgrade to Pro for unlimited plays and exports.</p>
          <button onClick={handleExport} style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: BLUE, color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 10 }}>Upgrade — $4.99/mo</button>
          <button onClick={() => setShowUpgradePrompt(false)} style={{ width: '100%', padding: '10px', borderRadius: 10, border: `1px solid rgba(255,255,255,0.06)`, background: 'transparent', color: MUTED, fontSize: 14, cursor: 'pointer' }}>Maybe later</button>
        </div>
      </div>
    )

    const dataPanel = (
      <>
        <div style={{ display: 'flex', alignItems: 'stretch', borderBottom: `1px solid ${BORDER}`, overflowX: 'auto', flexShrink: 0 }}>
          {series.map((ser, si) => (
            <button key={si} onClick={() => setActiveSeriesIdx(si)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', borderBottom: activeIdx === si ? `2px solid ${BLUE}` : '2px solid transparent', color: activeIdx === si ? TEXT : MUTED, fontSize: 12, fontWeight: activeIdx === si ? 600 : 400 }}>
              <span style={{ position: 'relative', width: 10, height: 10, flexShrink: 0 }}>
                <span style={{ display: 'block', width: 10, height: 10, borderRadius: '50%', background: ser.lineColor }} />
                <input type="color" value={ser.lineColor.startsWith('#') ? ser.lineColor : '#4d7cff'} onChange={e => { const c = e.target.value; setSeries(prev => prev.map((s, idx) => idx !== si ? s : { ...s, lineColor: c, dotColor: c, tipColor: c, glowColor: c })) }} onClick={e => e.stopPropagation()} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%', padding: 0, border: 'none' }} />
              </span>
              {ser.name}
            </button>
          ))}
          <button onClick={addSeries} style={{ padding: '8px 10px', background: 'none', border: 'none', cursor: 'pointer', color: MUTED, fontSize: 16, flexShrink: 0, display: 'flex', alignItems: 'center' }}>+</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 14px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0, gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#ccc', flex: 1 }}>Data</span>
          {series.length > 1 && <button onClick={() => removeSeries(activeIdx)} style={{ fontSize: 11, color: '#e55', background: 'none', border: `1px solid rgba(229,85,85,0.25)`, borderRadius: 5, padding: '2px 7px', cursor: 'pointer' }}>Remove</button>}
          <button onClick={() => setShowImport(true)} style={{ fontSize: 11, color: MUTED, background: 'none', border: `1px solid ${BORDER}`, borderRadius: 5, padding: '3px 8px', cursor: 'pointer' }}>+ Import</button>
        </div>
        <div style={{ display: 'flex', padding: '6px 14px', borderBottom: `1px solid ${BORDER}`, fontSize: 11, color: '#3a3a50', flexShrink: 0 }}>
          <span style={{ flex: 1 }}>Label</span><span>Value</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {activeSeries.rows.map((row, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '0 14px', height: 38, borderBottom: `1px solid ${BORDER}` }}>
              <input value={row.label} onChange={e => updateRow(activeIdx, i, 'label', e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', color: TEXT, fontSize: 14, outline: 'none', minWidth: 0 }} placeholder="Label" />
              <input value={row.value} onChange={e => updateRow(activeIdx, i, 'value', e.target.value)} style={{ width: 60, background: 'transparent', border: 'none', color: TEXT, fontSize: 14, outline: 'none', textAlign: 'right' }} placeholder="0" />
              <button onClick={() => removeRow(activeIdx, i)} style={{ width: 28, height: 28, marginLeft: 6, background: 'none', border: 'none', color: '#333', cursor: 'pointer', fontSize: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }} onMouseOver={e => (e.currentTarget.style.color = '#e55')} onMouseOut={e => (e.currentTarget.style.color = '#333')}>✕</button>
            </div>
          ))}
          <button onClick={() => addRow(activeIdx)} style={{ width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: 13, color: MUTED, background: 'none', border: 'none', cursor: 'pointer' }}>+ Add row</button>
        </div>
        <div style={{ padding: '8px 14px', borderTop: `1px solid ${BORDER}`, fontSize: 11, color: '#333', flexShrink: 0 }}>{activeSeries.rows.length} rows · {series.length} series</div>
      </>
    )

    const settingsPanel = (
      <>
        {rightTab === 'design' && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: MUTED, marginTop: 20, marginBottom: 10 }}>Format</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {([{ key: 'portrait', label: '9:16', sub: 'TikTok' }, { key: 'square', label: '1:1', sub: 'Square' }, { key: 'landscape', label: '16:9', sub: 'YouTube' }] as const).map(r => (
                <button key={r.key} onClick={() => setRatio(r.key)} style={{ padding: '8px 6px', borderRadius: 7, textAlign: 'center', border: `1px solid ${ratio === r.key ? BLUE : BORDER}`, background: ratio === r.key ? 'rgba(77,124,255,0.1)' : 'rgba(255,255,255,0.02)', cursor: 'pointer' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: ratio === r.key ? BLUE : TEXT }}>{r.label}</div>
                  <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{r.sub}</div>
                </button>
              ))}
            </div>
            <div style={{ height: 1, background: BORDER, margin: '16px 0' }} />
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: MUTED, marginBottom: 10 }}>Text</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Chart title" style={inputBase} />
              <input value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Subtitle" style={{ ...inputBase, color: '#aaa' }} />
              <input value={yLabel} onChange={e => setYLabel(e.target.value)} placeholder="Y-axis label" style={inputBase} />
            </div>
            <div style={{ height: 1, background: BORDER, margin: '16px 0' }} />
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: MUTED, marginBottom: 10 }}>Options</div>
            <Toggle label="Show dots" value={showDots} onChange={setShowDots} />
            <Toggle label="Show values" value={showValues} onChange={setShowValues} />
            <Toggle label="Area fill" value={showAreaFill} onChange={setShowAreaFill} />
            <Slider label="Tip size" value={style.tipSize ?? 8} onChange={v => updateStyle('tipSize', v)} min={4} max={30} step={1} />
            <Toggle label="Glow" value={showGlow} onChange={setShowGlow} />
            {showGlow && (<><Slider label="Opacity" value={style.glowOpacity} onChange={v => updateStyle('glowOpacity', v)} min={0} max={1} step={0.05} /><Slider label="Blur" value={style.glowBlur} onChange={v => updateStyle('glowBlur', v)} min={0} max={80} step={5} /></>)}
            <Toggle label="Line shadow" value={showShadow} onChange={setShowShadow} />
            {showShadow && (<><Slider label="Opacity" value={style.shadowOpacity} onChange={v => updateStyle('shadowOpacity', v)} min={0} max={1} step={0.05} /><Slider label="Blur" value={style.shadowBlur} onChange={v => updateStyle('shadowBlur', v)} min={0} max={40} step={2} /></>)}
          </div>
        )}
        {rightTab === 'colors' && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: MUTED, marginTop: 20, marginBottom: 10 }}>Background</div>
            <ColorRow label="Top" value={style.bgColor} onChange={v => updateStyle('bgColor', v)} />
            <ColorRow label="Bottom" value={style.bgColor2} onChange={v => updateStyle('bgColor2', v)} />
            <div style={{ height: 1, background: BORDER, margin: '16px 0' }} />
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: MUTED, marginBottom: 10 }}>Line & Dots — {activeSeries.name}</div>
            <ColorRow label="Line" value={activeSeries.lineColor} onChange={v => updateSeriesColor(activeIdx, 'lineColor', v)} />
            <ColorRow label="Dot" value={activeSeries.dotColor} onChange={v => updateSeriesColor(activeIdx, 'dotColor', v)} />
            <ColorRow label="Tip dot" value={activeSeries.tipColor} onChange={v => updateSeriesColor(activeIdx, 'tipColor', v)} />
            <ColorRow label="Glow" value={activeSeries.glowColor} onChange={v => updateSeriesColor(activeIdx, 'glowColor', v)} />
            <ColorRow label="Shadow" value={activeSeries.shadowColor} onChange={v => updateSeriesColor(activeIdx, 'shadowColor', v)} />
            <div style={{ height: 1, background: BORDER, margin: '16px 0' }} />
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: MUTED, marginBottom: 10 }}>Text</div>
            <ColorRow label="Title" value={style.titleColor} onChange={v => updateStyle('titleColor', v)} />
            <ColorRow label="Subtitle" value={style.subtitleColor} onChange={v => updateStyle('subtitleColor', v)} />
            <ColorRow label="Values" value={style.valueColor} onChange={v => updateStyle('valueColor', v)} />
            <ColorRow label="Axis labels" value={style.labelColor} onChange={v => updateStyle('labelColor', v)} />
            <ColorRow label="Y-axis label" value={style.yLabelColor} onChange={v => updateStyle('yLabelColor', v)} />
            <div style={{ height: 1, background: BORDER, margin: '16px 0' }} />
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: MUTED, marginBottom: 10 }}>Grid & Axes</div>
            <ColorRow label="Axis lines" value={style.axisColor} onChange={v => updateStyle('axisColor', v)} />
            <ColorRow label="Grid lines" value={style.gridColor} onChange={v => updateStyle('gridColor', v)} />
          </div>
        )}
        {rightTab === 'fonts' && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: MUTED, marginTop: 20, marginBottom: 10 }}>Fonts</div>
            <FontPicker label="Title" value={style.titleFont} onChange={v => updateStyle('titleFont', v)} />
            <FontPicker label="Subtitle" value={style.subtitleFont} onChange={v => updateStyle('subtitleFont', v)} />
            <FontPicker label="Values" value={style.valueFont} onChange={v => updateStyle('valueFont', v)} />
            <FontPicker label="Axis labels" value={style.labelFont} onChange={v => updateStyle('labelFont', v)} />
            <FontPicker label="Y-axis" value={style.yLabelFont} onChange={v => updateStyle('yLabelFont', v)} />
            <div style={{ height: 1, background: BORDER, margin: '16px 0' }} />
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: MUTED, marginBottom: 10 }}>Sizes</div>
            <NumField label="Title" value={style.titleSize} onChange={v => updateStyle('titleSize', v)} min={20} max={120} />
            <NumField label="Subtitle" value={style.subtitleSize} onChange={v => updateStyle('subtitleSize', v)} min={12} max={60} />
            <NumField label="Values" value={style.valueSize} onChange={v => updateStyle('valueSize', v)} min={12} max={60} />
            <NumField label="Labels" value={style.labelSize} onChange={v => updateStyle('labelSize', v)} min={10} max={40} />
          </div>
        )}
      </>
    )

    return (
      <>
        {isRecording && <ExportOverlay status={statusText} progress={exportProgress} />}
        {showImport && <DataImportModal chartType="line" onImport={rows => { setSeries(prev => prev.map((ser, idx) => idx !== activeIdx ? ser : { ...ser, rows: rows as any })); setShowImport(false) }} onClose={() => setShowImport(false)} />}
        {upgradePrompt}
        <MobileEditorShell
          onBack={() => router.push('/projects')}
          projectId={projectId} projectTitle={projectTitle} setProjectTitle={setProjectTitle} saveStatus={saveStatus}
          mobileTab={mobileTab} setMobileTab={setMobileTab}
          rightTab={rightTab} setRightTab={setRightTab}
          isPlaying={isPlaying} playLoading={playLoading} isPro={isPro} playCount={playCount}
          speed={speed} setSpeed={setSpeed} ratio={ratio} canvasRef={canvasRef}
          onPlay={isPlaying ? stopAnimation : startAnimation}
          onRestart={() => { redraw(0); startAnimation() }}
          onExport={handleExport} isRecording={isRecording}
          dataPanel={dataPanel} settingsPanel={settingsPanel}
        />
      </>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: BG, color: TEXT, fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14 }}>

      {isRecording && <ExportOverlay status={statusText} progress={exportProgress} />}

      {showImport && (
        <DataImportModal chartType="line" onImport={rows => {
          setSeries(prev => prev.map((ser, idx) => idx !== activeIdx ? ser : { ...ser, rows: rows as any }))
          setShowImport(false)
        }} onClose={() => setShowImport(false)} />
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
          {isRecording ? '⏺ Exporting...' : isPro ? '⬇ Export MP4' : '⚡ Go Pro — $4.99/mo'}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4 }}>
          <span style={{ fontSize: 11, color: MUTED }}>{speed.toFixed(1)}×</span>
          <input type="range" min="0.1" max="5" step="0.1" value={speed} onChange={e => setSpeed(parseFloat(e.target.value))} style={{ width: 64, accentColor: BLUE }} />
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left panel */}
        <div style={{ width: 240, background: SURFACE, borderRight: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>

          {/* Series tabs */}
          <div style={{ display: 'flex', alignItems: 'stretch', borderBottom: `1px solid ${BORDER}`, overflowX: 'auto', flexShrink: 0 }}>
            {series.map((ser, si) => (
              <button
                key={si}
                onClick={() => setActiveSeriesIdx(si)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '8px 10px',
                  flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: activeIdx === si ? `2px solid ${BLUE}` : '2px solid transparent',
                  color: activeIdx === si ? TEXT : MUTED, fontSize: 12, fontWeight: activeIdx === si ? 600 : 400,
                  position: 'relative',
                }}
              >
                {/* Color dot — clicking opens color picker */}
                <span style={{ position: 'relative', width: 10, height: 10, flexShrink: 0 }}>
                  <span style={{ display: 'block', width: 10, height: 10, borderRadius: '50%', background: ser.lineColor }} />
                  <input
                    type="color"
                    value={ser.lineColor.startsWith('#') ? ser.lineColor : '#4d7cff'}
                    onChange={e => {
                      const c = e.target.value
                      setSeries(prev => prev.map((s, idx) => idx !== si ? s : { ...s, lineColor: c, dotColor: c, tipColor: c, glowColor: c }))
                    }}
                    onClick={e => e.stopPropagation()}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%', padding: 0, border: 'none' }}
                  />
                </span>
                {ser.name}
              </button>
            ))}
            <button
              onClick={addSeries}
              style={{ padding: '8px 10px', background: 'none', border: 'none', cursor: 'pointer', color: MUTED, fontSize: 16, flexShrink: 0, display: 'flex', alignItems: 'center' }}
              title="Add line"
            >+</button>
          </div>

          {/* Import + header row */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '8px 14px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0, gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#ccc', flex: 1 }}>Data</span>
            {series.length > 1 && (
              <button
                onClick={() => removeSeries(activeIdx)}
                style={{ fontSize: 11, color: '#e55', background: 'none', border: `1px solid rgba(229,85,85,0.25)`, borderRadius: 5, padding: '2px 7px', cursor: 'pointer' }}
              >Remove</button>
            )}
            <button onClick={() => setShowImport(true)} style={{ fontSize: 11, color: MUTED, background: 'none', border: `1px solid ${BORDER}`, borderRadius: 5, padding: '3px 8px', cursor: 'pointer' }}>+ Import</button>
          </div>

          <div style={{ display: 'flex', padding: '6px 14px', borderBottom: `1px solid ${BORDER}`, fontSize: 11, color: '#3a3a50', flexShrink: 0 }}>
            <span style={{ flex: 1 }}>Label</span>
            <span>Value</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {activeSeries.rows.map((row, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '0 14px', height: 34, borderBottom: `1px solid ${BORDER}` }}>
                <input value={row.label} onChange={e => updateRow(activeIdx, i, 'label', e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', color: TEXT, fontSize: 13, outline: 'none', minWidth: 0 }} placeholder="Label" />
                <input value={row.value} onChange={e => updateRow(activeIdx, i, 'value', e.target.value)} style={{ width: 52, background: 'transparent', border: 'none', color: TEXT, fontSize: 13, outline: 'none', textAlign: 'right' }} placeholder="0" />
                <button onClick={() => removeRow(activeIdx, i)} style={{ width: 22, height: 22, marginLeft: 6, background: 'none', border: 'none', color: '#333', cursor: 'pointer', fontSize: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}
                  onMouseOver={e => (e.currentTarget.style.color = '#e55')} onMouseOut={e => (e.currentTarget.style.color = '#333')}>✕</button>
              </div>
            ))}
            <button onClick={() => addRow(activeIdx)} style={{ width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: 12, color: MUTED, background: 'none', border: 'none', cursor: 'pointer' }}>+ Add row</button>
          </div>
          <div style={{ padding: '7px 14px', borderTop: `1px solid ${BORDER}`, fontSize: 11, color: '#333', flexShrink: 0 }}>{activeSeries.rows.length} rows · {series.length} {series.length === 1 ? 'series' : 'series'}</div>
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
                  <input value={yLabel} onChange={e => setYLabel(e.target.value)} placeholder="Y-axis label" style={inputBase} />
                </div>
                <Divider />
                <SectionLabel>Options</SectionLabel>
                <Toggle label="Show dots" value={showDots} onChange={setShowDots} />
                <Toggle label="Show values" value={showValues} onChange={setShowValues} />
                <Toggle label="Area fill" value={showAreaFill} onChange={setShowAreaFill} />
                <Slider label="Tip size" value={style.tipSize ?? 8} onChange={v => updateStyle('tipSize', v)} min={4} max={30} step={1} />
                <Toggle label="Glow" value={showGlow} onChange={setShowGlow} />
                {showGlow && (<>
                  <Slider label="Opacity" value={style.glowOpacity} onChange={v => updateStyle('glowOpacity', v)} min={0} max={1} step={0.05} />
                  <Slider label="Blur" value={style.glowBlur} onChange={v => updateStyle('glowBlur', v)} min={0} max={80} step={5} />
                </>)}
                <Toggle label="Line shadow" value={showShadow} onChange={setShowShadow} />
                {showShadow && (<>
                  <Slider label="Opacity" value={style.shadowOpacity} onChange={v => updateStyle('shadowOpacity', v)} min={0} max={1} step={0.05} />
                  <Slider label="Blur" value={style.shadowBlur} onChange={v => updateStyle('shadowBlur', v)} min={0} max={40} step={2} />
                </>)}
              </div>
            )}
            {rightTab === 'colors' && (
              <div>
                <SectionLabel>Background</SectionLabel>
                <ColorRow label="Top" value={style.bgColor} onChange={v => updateStyle('bgColor', v)} />
                <ColorRow label="Bottom" value={style.bgColor2} onChange={v => updateStyle('bgColor2', v)} />
                <Divider />
                <SectionLabel>Line & Dots — {activeSeries.name}</SectionLabel>
                <ColorRow label="Line" value={activeSeries.lineColor} onChange={v => updateSeriesColor(activeIdx, 'lineColor', v)} />
                <ColorRow label="Dot" value={activeSeries.dotColor} onChange={v => updateSeriesColor(activeIdx, 'dotColor', v)} />
                <ColorRow label="Tip dot" value={activeSeries.tipColor} onChange={v => updateSeriesColor(activeIdx, 'tipColor', v)} />
                <ColorRow label="Glow" value={activeSeries.glowColor} onChange={v => updateSeriesColor(activeIdx, 'glowColor', v)} />
                <ColorRow label="Shadow" value={activeSeries.shadowColor} onChange={v => updateSeriesColor(activeIdx, 'shadowColor', v)} />
                <Divider />
                <SectionLabel>Text</SectionLabel>
                <ColorRow label="Title" value={style.titleColor} onChange={v => updateStyle('titleColor', v)} />
                <ColorRow label="Subtitle" value={style.subtitleColor} onChange={v => updateStyle('subtitleColor', v)} />
                <ColorRow label="Values" value={style.valueColor} onChange={v => updateStyle('valueColor', v)} />
                <ColorRow label="Axis labels" value={style.labelColor} onChange={v => updateStyle('labelColor', v)} />
                <ColorRow label="Y-axis label" value={style.yLabelColor} onChange={v => updateStyle('yLabelColor', v)} />
                <Divider />
                <SectionLabel>Grid & Axes</SectionLabel>
                <ColorRow label="Axis lines" value={style.axisColor} onChange={v => updateStyle('axisColor', v)} />
                <ColorRow label="Grid lines" value={style.gridColor} onChange={v => updateStyle('gridColor', v)} />
              </div>
            )}
            {rightTab === 'fonts' && (
              <div>
                <SectionLabel>Fonts</SectionLabel>
                <FontPicker label="Title" value={style.titleFont} onChange={v => updateStyle('titleFont', v)} />
                <FontPicker label="Subtitle" value={style.subtitleFont} onChange={v => updateStyle('subtitleFont', v)} />
                <FontPicker label="Values" value={style.valueFont} onChange={v => updateStyle('valueFont', v)} />
                <FontPicker label="Axis labels" value={style.labelFont} onChange={v => updateStyle('labelFont', v)} />
                <FontPicker label="Y-axis" value={style.yLabelFont} onChange={v => updateStyle('yLabelFont', v)} />
                <Divider />
                <SectionLabel>Sizes</SectionLabel>
                <NumField label="Title" value={style.titleSize} onChange={v => updateStyle('titleSize', v)} min={20} max={120} />
                <NumField label="Subtitle" value={style.subtitleSize} onChange={v => updateStyle('subtitleSize', v)} min={12} max={60} />
                <NumField label="Values" value={style.valueSize} onChange={v => updateStyle('valueSize', v)} min={12} max={60} />
                <NumField label="Labels" value={style.labelSize} onChange={v => updateStyle('labelSize', v)} min={10} max={40} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Editor() {
  return (
    <Suspense fallback={<div style={{ background: '#0c0c10', height: '100vh' }} />}>
      <EditorInner />
    </Suspense>
  )
}

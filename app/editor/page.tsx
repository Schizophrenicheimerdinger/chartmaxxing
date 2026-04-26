'use client'

import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { drawChart, type ChartStyle, PRESETS, FONTS } from '@/lib/chart'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

const TEMPLATES = [
  { title: 'my motivation on Mondays', yLabel: 'will to live (%)', subtitle: '(scientists baffled)', data: 'Mon,85\nTue,60\nWed,40\nThu,22\nFri,5\nSat,95\nSun,88' },
  { title: 'chances I reply to your text', yLabel: 'probability (%)', subtitle: "(it's not personal)", data: 'Family,18\nBoss,98\nBFF,82\nEx,1\nUnknown,0' },
  { title: 'my bank account this month', yLabel: '$ remaining', subtitle: '(please send help)', data: 'Week 1,1240\nWeek 2,810\nWeek 3,340\nWeek 4,11' },
  { title: 'how much I care about drama', yLabel: 'cares given', subtitle: '(trending downward)', data: 'Jan,90\nFeb,75\nMar,55\nApr,40\nMay,22\nJun,8\nJul,1' },
  { title: 'my sleep schedule', yLabel: 'hours of sleep', subtitle: '(send help)', data: 'Mon,7\nTue,6\nWed,5\nThu,3\nFri,1\nSat,12\nSun,10' },
]

const BG = '#0a0a0f'
const SURFACE = '#111118'
const BORDER = 'rgba(255,255,255,0.07)'
const ACCENT = '#7fff6e'

const s = (cls: string) => cls

function Label({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: '#666', fontWeight: 600, marginBottom: 8 }}>{children}</p>
}

function ColorRow({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0' }}>
      <span style={{ fontSize: 12, color: '#aaa' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color: '#555', fontFamily: 'monospace' }}>{value.startsWith('#') ? value : '—'}</span>
        <input type="color" value={value.startsWith('#') ? value : '#ffffff'} onChange={e => onChange(e.target.value)}
          style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', background: 'transparent', padding: 2 }} />
      </div>
    </div>
  )
}

function Toggle({ label, value, onChange }: { label: string, value: boolean, onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
      <span style={{ fontSize: 12, color: '#aaa' }}>{label}</span>
      <button onClick={() => onChange(!value)} style={{
        width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', position: 'relative',
        background: value ? ACCENT : 'rgba(255,255,255,0.1)', transition: 'background 0.2s'
      }}>
        <span style={{
          position: 'absolute', top: 2, left: value ? 18 : 2, width: 16, height: 16,
          borderRadius: '50%', background: 'white', transition: 'left 0.2s'
        }} />
      </button>
    </div>
  )
}

function Slider({ label, value, onChange, min, max, step, showValue = true }: {
  label: string, value: number, onChange: (v: number) => void, min: number, max: number, step: number, showValue?: boolean
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '3px 0' }}>
      <span style={{ fontSize: 12, color: '#aaa', flexShrink: 0 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))}
          style={{ width: 90, accentColor: ACCENT }} />
        {showValue && <span style={{ fontSize: 11, color: '#555', width: 28, textAlign: 'right' }}>{value}</span>}
      </div>
    </div>
  )
}

function FontPicker({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '3px 0' }}>
      <span style={{ fontSize: 12, color: '#aaa', flexShrink: 0 }}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        fontSize: 11, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 6, padding: '3px 6px', color: 'white', fontFamily: value, flex: 1, maxWidth: 140
      }}>
        {FONTS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
      </select>
    </div>
  )
}

function NumField({ label, value, onChange, min, max }: { label: string, value: number, onChange: (v: number) => void, min: number, max: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '3px 0' }}>
      <span style={{ fontSize: 12, color: '#aaa', flexShrink: 0 }}>{label}</span>
      <input type="number" value={value} min={min} max={max} onChange={e => onChange(parseInt(e.target.value) || min)}
        style={{ width: 56, fontSize: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '3px 8px', color: 'white', textAlign: 'right' }} />
    </div>
  )
}

function Divider() {
  return <div style={{ height: 1, background: BORDER, margin: '12px 0' }} />
}

export default function Editor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)
  const [rows, setRows] = useState<{ label: string, value: string }[]>(
    TEMPLATES[0].data.split('\n').map(l => ({ label: l.split(',')[0], value: l.split(',')[1] }))
  )
  const [title, setTitle] = useState(TEMPLATES[0].title)
  const [subtitle, setSubtitle] = useState(TEMPLATES[0].subtitle)
  const [yLabel, setYLabel] = useState(TEMPLATES[0].yLabel)
  const [style, setStyle] = useState<ChartStyle>(PRESETS.neon.style)
  const [speed, setSpeed] = useState(1)
  const [ratio, setRatio] = useState<'square' | 'portrait' | 'landscape'>('square')
  const [showDots, setShowDots] = useState(true)
  const [showValues, setShowValues] = useState(true)
  const [showGlow, setShowGlow] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [isPro, setIsPro] = useState(false)
  const [rightTab, setRightTab] = useState<'design' | 'colors' | 'fonts'>('design')

  const data = useMemo(() => rows
    .map(r => ({ label: r.label, value: parseFloat(r.value) }))
    .filter(d => !isNaN(d.value)), [rows])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === 'true') setIsPro(true)
    else fetch('/api/check-pro').then(r => r.json()).then(d => setIsPro(d.isPro))
  }, [])

  const effectiveStyle = useMemo(() => ({
    ...style,
    glowOpacity: showGlow ? style.glowOpacity : 0,
    glowBlur: showGlow ? style.glowBlur : 0,
  }), [style, showGlow])

  const chartProps = { data, title, subtitle, yLabel, showDots, showValues, ratio, style: effectiveStyle }

  const redraw = useCallback((progress = 1) => {
    if (canvasRef.current) drawChart(canvasRef.current, progress, chartProps)
  }, [chartProps])

  useEffect(() => { redraw(1) }, [redraw])

  const startAnimation = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setIsPlaying(true)
    let p = 0
    const step = () => {
      p += 0.012 * speed
      if (p >= 1) { redraw(1); setIsPlaying(false); return }
      redraw(p); rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
  }, [redraw, speed])

  const stopAnimation = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setIsPlaying(false); redraw(1)
  }, [redraw])

  const handleExport = useCallback(async () => {
    if (!isPro) {
      const res = await fetch('/api/checkout', { method: 'POST' })
      const { url } = await res.json()
      window.location.href = url
      return
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
        p += 0.006 * speed
        if (p >= 1) { redraw(1); setTimeout(() => { recorder.stop(); resolve() }, 1200); return }
        redraw(p); requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    })
  }, [isPro, isRecording, redraw, speed])

  const updateRow = (i: number, field: 'label' | 'value', val: string) =>
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r))
  const addRow = () => setRows(prev => [...prev, { label: '', value: '' }])
  const removeRow = (i: number) => setRows(prev => prev.filter((_, idx) => idx !== i))
  const loadTemplate = (t: typeof TEMPLATES[0]) => {
    setRows(t.data.split('\n').map(l => ({ label: l.split(',')[0], value: l.split(',')[1] })))
    setTitle(t.title); setSubtitle(t.subtitle); setYLabel(t.yLabel)
  }
  const updateStyle = (key: keyof ChartStyle, val: string | number) =>
    setStyle(prev => ({ ...prev, [key]: val }))

  const canvasDisplay = ratio === 'portrait' ? { w: 280, h: 498 } : ratio === 'landscape' ? { w: 600, h: 338 } : { w: 560, h: 560 }

  const panelStyle: React.CSSProperties = {
    background: SURFACE, borderRight: `1px solid ${BORDER}`, display: 'flex',
    flexDirection: 'column', overflow: 'hidden', flexShrink: 0
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`,
    borderRadius: 8, padding: '8px 12px', color: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: BG, color: 'white', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 52, borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, color: ACCENT }}>Chartmaxxing</span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={() => { redraw(0); startAnimation() }}
            style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '6px 12px', color: '#aaa', fontSize: 13, cursor: 'pointer' }}>↺</button>
          <button onClick={isPlaying ? stopAnimation : startAnimation}
            style={{ background: ACCENT, border: 'none', borderRadius: 8, padding: '7px 18px', color: 'black', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button onClick={handleExport} disabled={isRecording}
            style={{ background: isPro ? ACCENT : 'rgba(127,255,110,0.1)', border: `1px solid rgba(127,255,110,0.3)`, borderRadius: 8, padding: '7px 18px', color: isPro ? 'black' : ACCENT, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: isRecording ? 0.5 : 1 }}>
            {isRecording ? `⏺ ${statusText}` : isPro ? '⬇ Export MP4' : '⚡ Go Pro — $4.99/mo'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4 }}>
            <span style={{ fontSize: 11, color: '#555' }}>{speed.toFixed(1)}×</span>
            <input type="range" min="0.3" max="3" step="0.1" value={speed}
              onChange={e => setSpeed(parseFloat(e.target.value))} style={{ width: 70, accentColor: ACCENT }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* LEFT — Data table */}
        <div style={{ ...panelStyle, width: 260 }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: `1px solid ${BORDER}`, gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#ccc' }}>Data</span>
            <button onClick={() => loadTemplate(TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)])}
              style={{ marginLeft: 'auto', fontSize: 11, color: '#555', background: 'none', border: 'none', cursor: 'pointer' }}
              onMouseOver={e => (e.currentTarget.style.color = ACCENT)} onMouseOut={e => (e.currentTarget.style.color = '#555')}>
              Load example
            </button>
          </div>

          <div style={{ display: 'flex', padding: '6px 16px', borderBottom: `1px solid ${BORDER}`, fontSize: 11, color: '#444' }}>
            <span style={{ flex: 1 }}>Label</span>
            <span style={{ width: 70, textAlign: 'right' }}>Value</span>
            <span style={{ width: 20 }} />
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {rows.map((row, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '0 16px', borderBottom: `1px solid ${BORDER}`, height: 36 }}
                onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                <input value={row.label} onChange={e => updateRow(i, 'label', e.target.value)}
                  style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', fontSize: 13, outline: 'none' }} placeholder="Label" />
                <input value={row.value} onChange={e => updateRow(i, 'value', e.target.value)}
                  style={{ width: 70, background: 'transparent', border: 'none', color: 'white', fontSize: 13, outline: 'none', textAlign: 'right' }} placeholder="0" />
                <button onClick={() => removeRow(i)}
                  style={{ width: 20, background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 12, padding: 0 }}
                  onMouseOver={e => (e.currentTarget.style.color = '#f44')} onMouseOut={e => (e.currentTarget.style.color = '#444')}>✕</button>
              </div>
            ))}
            <button onClick={addRow}
              style={{ width: '100%', textAlign: 'left', padding: '8px 16px', fontSize: 12, color: '#555', background: 'none', border: 'none', cursor: 'pointer' }}
              onMouseOver={e => (e.currentTarget.style.color = ACCENT)} onMouseOut={e => (e.currentTarget.style.color = '#555')}>
              + Add row
            </button>
          </div>

          <div style={{ padding: '8px 16px', borderTop: `1px solid ${BORDER}`, fontSize: 11, color: '#444' }}>
            {rows.length} rows · 1 series
          </div>
        </div>

        {/* CENTER — Canvas */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#07070e', overflow: 'hidden' }}>
          <div style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 24px 60px rgba(0,0,0,0.5)', width: canvasDisplay.w, height: canvasDisplay.h }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
          </div>
        </div>

        {/* RIGHT — Settings */}
        <div style={{ ...panelStyle, borderRight: 'none', borderLeft: `1px solid ${BORDER}`, width: 280 }}>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
            {(['design', 'colors', 'fonts'] as const).map(tab => (
              <button key={tab} onClick={() => setRightTab(tab)} style={{
                flex: 1, padding: '12px 0', fontSize: 11, fontWeight: 600, textTransform: 'capitalize',
                background: 'none', border: 'none', cursor: 'pointer', letterSpacing: 0.5,
                color: rightTab === tab ? ACCENT : '#555',
                borderBottom: rightTab === tab ? `2px solid ${ACCENT}` : '2px solid transparent',
                transition: 'color 0.15s'
              }}>{tab}</button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>

            {rightTab === 'design' && (
              <div>
                <Label>Presets</Label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 16 }}>
                  {Object.entries(PRESETS).map(([key, preset]) => (
                    <button key={key} onClick={() => setStyle(preset.style)} style={{
                      textAlign: 'left', padding: '8px 10px', borderRadius: 8, border: `1px solid ${BORDER}`,
                      background: 'rgba(255,255,255,0.03)', color: '#bbb', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s'
                    }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = '#bbb' }}>
                      {preset.name}
                    </button>
                  ))}
                </div>

                <Divider />
                <Label>Templates</Label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
                  {TEMPLATES.map(t => (
                    <button key={t.title} onClick={() => loadTemplate(t)} style={{
                      textAlign: 'left', padding: '7px 10px', borderRadius: 8, border: `1px solid ${BORDER}`,
                      background: 'rgba(255,255,255,0.02)', color: '#888', fontSize: 11, cursor: 'pointer', transition: 'all 0.15s'
                    }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = '#888' }}>
                      {t.title}
                    </button>
                  ))}
                </div>

                <Divider />
                <Label>Format</Label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 16 }}>
                  {([
                    { key: 'portrait', label: '9:16', sub: 'TikTok' },
                    { key: 'square', label: '1:1', sub: 'Square' },
                    { key: 'landscape', label: '16:9', sub: 'YouTube' },
                  ] as const).map(r => (
                    <button key={r.key} onClick={() => setRatio(r.key)} style={{
                      textAlign: 'left', padding: '8px', borderRadius: 8, border: `1px solid ${ratio === r.key ? ACCENT : BORDER}`,
                      background: ratio === r.key ? 'rgba(127,255,110,0.08)' : 'rgba(255,255,255,0.02)', cursor: 'pointer'
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: ratio === r.key ? ACCENT : 'white' }}>{r.label}</div>
                      <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>{r.sub}</div>
                    </button>
                  ))}
                </div>

                <Divider />
                <Label>Text</Label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Chart title" style={inputStyle} />
                  <input value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Subtitle" style={{ ...inputStyle, color: '#aaa' }} />
                  <input value={yLabel} onChange={e => setYLabel(e.target.value)} placeholder="Y-axis label" style={inputStyle} />
                </div>

                <Divider />
                <Label>Options</Label>
                <Toggle label="Show dots" value={showDots} onChange={setShowDots} />
                <Toggle label="Show values" value={showValues} onChange={setShowValues} />
                <Toggle label="Show glow" value={showGlow} onChange={setShowGlow} />
                {showGlow && (
                  <>
                    <Slider label="Glow opacity" value={style.glowOpacity} onChange={v => updateStyle('glowOpacity', v)} min={0} max={1} step={0.05} />
                    <Slider label="Glow blur" value={style.glowBlur} onChange={v => updateStyle('glowBlur', v)} min={0} max={80} step={5} />
                  </>
                )}
              </div>
            )}

            {rightTab === 'colors' && (
              <div>
                <Label>Background</Label>
                <ColorRow label="Top" value={style.bgColor} onChange={v => updateStyle('bgColor', v)} />
                <ColorRow label="Bottom" value={style.bgColor2} onChange={v => updateStyle('bgColor2', v)} />
                <Divider />
                <Label>Line & Dots</Label>
                <ColorRow label="Line" value={style.lineColor} onChange={v => updateStyle('lineColor', v)} />
                <ColorRow label="Dot" value={style.dotColor} onChange={v => updateStyle('dotColor', v)} />
                <ColorRow label="Glow" value={style.glowColor} onChange={v => updateStyle('glowColor', v)} />
                <Divider />
                <Label>Text</Label>
                <ColorRow label="Title" value={style.titleColor} onChange={v => updateStyle('titleColor', v)} />
                <ColorRow label="Subtitle" value={style.subtitleColor} onChange={v => updateStyle('subtitleColor', v)} />
                <ColorRow label="Values" value={style.valueColor} onChange={v => updateStyle('valueColor', v)} />
                <ColorRow label="Axis labels" value={style.labelColor} onChange={v => updateStyle('labelColor', v)} />
                <ColorRow label="Y-axis label" value={style.yLabelColor} onChange={v => updateStyle('yLabelColor', v)} />
                <Divider />
                <Label>Grid & Axes</Label>
                <ColorRow label="Axis lines" value={style.axisColor} onChange={v => updateStyle('axisColor', v)} />
                <ColorRow label="Grid lines" value={style.gridColor} onChange={v => updateStyle('gridColor', v)} />
              </div>
            )}

            {rightTab === 'fonts' && (
              <div>
                <Label>Fonts</Label>
                <FontPicker label="Title" value={style.titleFont} onChange={v => updateStyle('titleFont', v)} />
                <FontPicker label="Subtitle" value={style.subtitleFont} onChange={v => updateStyle('subtitleFont', v)} />
                <FontPicker label="Values" value={style.valueFont} onChange={v => updateStyle('valueFont', v)} />
                <FontPicker label="Axis labels" value={style.labelFont} onChange={v => updateStyle('labelFont', v)} />
                <FontPicker label="Y-axis" value={style.yLabelFont} onChange={v => updateStyle('yLabelFont', v)} />
                <Divider />
                <Label>Sizes</Label>
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
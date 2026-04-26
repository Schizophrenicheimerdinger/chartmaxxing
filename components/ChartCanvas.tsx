'use client'

import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { drawChart, type DataPoint } from '@/components/ChartCanvas'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

const TEMPLATES = [
  { title: 'my motivation on Mondays', yLabel: 'will to live (%)', subtitle: '(scientists baffled)', data: 'Mon,85\nTue,60\nWed,40\nThu,22\nFri,5\nSat,95\nSun,88' },
  { title: 'chances I reply to your text', yLabel: 'probability (%)', subtitle: "(it's not personal)", data: 'Family,18\nBoss,98\nBFF,82\nEx,1\nUnknown,0' },
  { title: 'my bank account this month', yLabel: '$ remaining', subtitle: '(please send help)', data: 'Week 1,1240\nWeek 2,810\nWeek 3,340\nWeek 4,11' },
  { title: 'how much I care about drama', yLabel: 'cares given', subtitle: '(trending downward)', data: 'Jan,90\nFeb,75\nMar,55\nApr,40\nMay,22\nJun,8\nJul,1' },
]

const THEMES = ['Void', 'Inferno', 'Cyber', 'Rose', 'Gold']
const THEME_COLORS: Record<string, string> = {
  Void: '#7fff6e', Inferno: '#ff6622', Cyber: '#00d4ff', Rose: '#ff3399', Gold: '#ffd700'
}

function parseData(raw: string): DataPoint[] {
  return raw.trim().split('\n').map((line, i) => {
    const parts = line.split(/[,\t]/)
    if (parts.length >= 2) {
      const v = parseFloat(parts[1])
      if (!isNaN(v)) return { label: parts[0].trim(), value: v }
    }
    const v = parseFloat(parts[0])
    return { label: String(i + 1), value: isNaN(v) ? 0 : v }
  }).filter(d => !isNaN(d.value))
}

export default function Editor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)
  const [rows, setRows] = useState<{label: string, value: string}[]>(
    TEMPLATES[0].data.split('\n').map(l => ({ label: l.split(',')[0], value: l.split(',')[1] }))
  )
  const [title, setTitle] = useState(TEMPLATES[0].title)
  const [subtitle, setSubtitle] = useState(TEMPLATES[0].subtitle)
  const [yLabel, setYLabel] = useState(TEMPLATES[0].yLabel)
  const [theme, setTheme] = useState('Void')
  const [speed, setSpeed] = useState(1)
  const [ratio, setRatio] = useState<'square' | 'portrait' | 'landscape'>('square')
  const [showDots, setShowDots] = useState(true)
  const [showValues, setShowValues] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [isPro, setIsPro] = useState(false)

  const data = useMemo(() => rows
    .map((r, i) => ({ label: r.label, value: parseFloat(r.value) }))
    .filter(d => !isNaN(d.value)), [rows])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === 'true') setIsPro(true)
    else fetch('/api/check-pro').then(r => r.json()).then(d => setIsPro(d.isPro))
  }, [])

  const props = { data, title, subtitle, yLabel, theme, showDots, showValues, ratio }

  const redraw = useCallback((progress = 1) => {
    if (canvasRef.current) drawChart(canvasRef.current, progress, props)
  }, [props])

  useEffect(() => { redraw(1) }, [redraw])

  const startAnimation = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setIsPlaying(true)
    let p = 0
    const step = () => {
      p += 0.012 * speed
      if (p >= 1) { redraw(1); setIsPlaying(false); return }
      redraw(p)
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
  }, [redraw, speed])

  const stopAnimation = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setIsPlaying(false)
    redraw(1)
  }, [redraw])

  const handleExport = useCallback(async () => {
    if (!isPro) {
      const res = await fetch('/api/checkout', { method: 'POST' })
      const { url } = await res.json()
      window.location.href = url
      return
    }
    if (isRecording || !canvasRef.current) return
    setIsRecording(true)
    setStatusText('Recording...')

    const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
      .find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm'

    const stream = canvasRef.current.captureStream(60)
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 10_000_000 })
    const chunks: Blob[] = []

    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }
    recorder.onstop = async () => {
      setStatusText('Converting to MP4...')
      const webmBlob = new Blob(chunks, { type: mimeType })
      const ffmpeg = new FFmpeg()
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      })
      await ffmpeg.writeFile('input.webm', await fetchFile(webmBlob))
      await ffmpeg.exec(['-i', 'input.webm', '-c:v', 'libx264', '-preset', 'fast', 'output.mp4'])
      const data = await ffmpeg.readFile('output.mp4')
      const mp4Blob = new Blob([data as BlobPart], { type: 'video/mp4' })
      const url = URL.createObjectURL(mp4Blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'chartmaxxing.mp4'
      a.click()
      URL.revokeObjectURL(url)
      setIsRecording(false)
      setStatusText('')
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
        redraw(p)
        requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    })
  }, [isPro, isRecording, redraw, speed])

  const updateRow = (i: number, field: 'label' | 'value', val: string) => {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r))
  }

  const addRow = () => setRows(prev => [...prev, { label: '', value: '' }])
  const removeRow = (i: number) => setRows(prev => prev.filter((_, idx) => idx !== i))

  const loadTemplate = (t: typeof TEMPLATES[0]) => {
    setRows(t.data.split('\n').map(l => ({ label: l.split(',')[0], value: l.split(',')[1] })))
    setTitle(t.title)
    setSubtitle(t.subtitle)
    setYLabel(t.yLabel)
  }

  const canvasDisplay = ratio === 'portrait'
    ? { w: 300, h: 533 }
    : ratio === 'landscape'
    ? { w: 640, h: 360 }
    : { w: 480, h: 480 }

  return (
    <div className="flex flex-col h-screen bg-[#0d0d12] text-white" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#0d0d12] shrink-0">
        <h1 style={{ fontFamily: 'Syne, sans-serif' }} className="text-xl font-black text-[#7fff6e]">Chartmaxxing</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">← Back</span>
          {!isPro && (
            <button onClick={handleExport} className="text-xs bg-[#7fff6e] text-black font-bold px-4 py-2 rounded-lg hover:bg-[#b4ff3a] transition">
              ⚡ Go Pro — $4.99/mo
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* LEFT — Data table */}
        <aside className="w-72 border-r border-white/10 flex flex-col bg-[#0d0d12] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
            <button className="text-xs font-semibold bg-white/10 px-3 py-1.5 rounded-md">Table</button>
            <button className="text-xs text-gray-500 px-3 py-1.5 rounded-md hover:bg-white/5">CSV</button>
            <button
              onClick={() => {
                const t = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)]
                loadTemplate(t)
              }}
              className="ml-auto text-xs text-gray-400 hover:text-[#7fff6e] transition"
            >
              Load example
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Table header */}
            <div className="flex items-center px-4 py-2 border-b border-white/5 text-xs text-gray-500 font-medium">
              <span className="flex-1">Label</span>
              <span className="w-24 text-right">Value</span>
              <span className="w-6" />
            </div>

            {/* Rows */}
            {rows.map((row, i) => (
              <div key={i} className="flex items-center px-4 py-1.5 border-b border-white/5 hover:bg-white/3 group">
                <input
                  value={row.label}
                  onChange={e => updateRow(i, 'label', e.target.value)}
                  className="flex-1 bg-transparent text-sm text-white focus:outline-none"
                  placeholder="Label"
                />
                <input
                  value={row.value}
                  onChange={e => updateRow(i, 'value', e.target.value)}
                  className="w-24 bg-transparent text-sm text-right text-white focus:outline-none"
                  placeholder="0"
                />
                <button
                  onClick={() => removeRow(i)}
                  className="w-6 text-center text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition text-xs"
                >✕</button>
              </div>
            ))}

            <button
              onClick={addRow}
              className="w-full text-left px-4 py-2 text-xs text-gray-500 hover:text-[#7fff6e] hover:bg-white/3 transition"
            >
              + Add row
            </button>
          </div>

          <div className="px-4 py-2 border-t border-white/10 text-xs text-gray-600">
            {rows.length} rows · 1 series
          </div>
        </aside>

        {/* CENTER — Chart preview */}
        <main className="flex-1 flex flex-col items-center justify-center bg-[#080810] gap-4 overflow-hidden">
          <div
            className="rounded-xl overflow-hidden shadow-2xl border border-white/5"
            style={{ width: canvasDisplay.w, height: canvasDisplay.h }}
          >
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
          </div>

          {/* Playback bar */}
          <div className="flex items-center gap-3 bg-[#0d0d12] border border-white/10 rounded-xl px-4 py-2">
            <button
              onClick={() => { redraw(0); startAnimation() }}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition text-sm"
            >↺</button>
            <button
              onClick={isPlaying ? stopAnimation : startAnimation}
              className="flex items-center gap-2 bg-[#7fff6e] text-black font-bold text-sm px-5 py-2 rounded-lg hover:bg-[#b4ff3a] transition"
            >
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
            <button
              onClick={handleExport}
              disabled={isRecording}
              className="flex items-center gap-2 bg-[#7fff6e]/10 border border-[#7fff6e]/30 text-[#7fff6e] font-bold text-sm px-5 py-2 rounded-lg hover:bg-[#7fff6e]/20 transition disabled:opacity-50"
            >
              {isRecording ? `⏺ ${statusText}` : isPro ? '⬇ Export MP4' : '🔒 Export'}
            </button>
            <div className="flex items-center gap-2 ml-2">
              <span className="text-xs text-gray-500">{speed.toFixed(1)}×</span>
              <input type="range" min="0.3" max="3" step="0.1" value={speed}
                onChange={e => setSpeed(parseFloat(e.target.value))}
                className="w-20 accent-[#7fff6e]"
              />
            </div>
          </div>
        </main>

        {/* RIGHT — Settings */}
        <aside className="w-72 border-l border-white/10 flex flex-col bg-[#0d0d12] overflow-y-auto">

          {/* Format */}
          <div className="px-4 py-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Format</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {([
                { key: 'portrait', label: '9:16', sub: 'TikTok · Reels · Shorts' },
                { key: 'square', label: '1:1', sub: 'Square' },
                { key: 'landscape', label: '16:9', sub: 'YouTube · X' },
              ] as const).map(r => (
                <button
                  key={r.key}
                  onClick={() => setRatio(r.key)}
                  className={`text-left p-3 rounded-lg border transition ${ratio === r.key ? 'border-[#7fff6e] bg-[#7fff6e]/10' : 'border-white/10 hover:border-white/20'}`}
                >
                  <div className={`text-sm font-bold ${ratio === r.key ? 'text-[#7fff6e]' : 'text-white'}`}>{r.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{r.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Chart title */}
          <div className="px-4 py-4 border-b border-white/10">
            <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Chart Title</span>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="mt-2 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7fff6e]"
            />
            <input
              value={subtitle}
              onChange={e => setSubtitle(e.target.value)}
              placeholder="Subtitle"
              className="mt-2 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-400 focus:outline-none focus:border-[#7fff6e]"
            />
          </div>

          {/* Series */}
          <div className="px-4 py-4 border-b border-white/10">
            <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Series</span>
            <input
              value={yLabel}
              onChange={e => setYLabel(e.target.value)}
              placeholder="Y-axis label"
              className="mt-2 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7fff6e]"
            />
          </div>

          {/* Colors & Theme */}
          <div className="px-4 py-4 border-b border-white/10">
            <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Colors & Background</span>
            <div className="flex gap-2 mt-3 flex-wrap">
              {THEMES.map(t => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  title={t}
                  className={`w-8 h-8 rounded-full border-2 transition ${theme === t ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ background: THEME_COLORS[t] }}
                />
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-2">{theme}</div>
          </div>

          {/* Options */}
          <div className="px-4 py-4">
            <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Options</span>
            <div className="mt-3 space-y-3">
              {[
                { label: 'Show dots', val: showDots, set: setShowDots },
                { label: 'Show values', val: showValues, set: setShowValues },
              ].map(t => (
                <div key={t.label} className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">{t.label}</span>
                  <button
                    onClick={() => t.set(!t.val)}
                    className={`w-10 h-6 rounded-full transition-colors ${t.val ? 'bg-[#7fff6e]' : 'bg-white/10'}`}
                  >
                    <span className={`block w-4 h-4 bg-white rounded-full mx-1 transition-transform ${t.val ? 'translate-x-4' : ''}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </aside>
      </div>
    </div>
  )
}
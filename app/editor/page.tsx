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
  const [rawData, setRawData] = useState(TEMPLATES[0].data)
  const [title, setTitle] = useState(TEMPLATES[0].title)
  const [subtitle, setSubtitle] = useState(TEMPLATES[0].subtitle)
  const [yLabel, setYLabel] = useState(TEMPLATES[0].yLabel)
  const [theme, setTheme] = useState('Void')
  const [speed, setSpeed] = useState(1)
  const [ratio, setRatio] = useState<'square' | 'portrait' | 'landscape'>('square')
  const [showDots, setShowDots] = useState(true)
  const [showValues, setShowValues] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [isPro, setIsPro] = useState(false)

  const data = useMemo(() => parseData(rawData), [rawData])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === 'true') {
      setIsPro(true)
    } else {
      fetch('/api/check-pro').then(r => r.json()).then(d => setIsPro(d.isPro))
    }
  }, [])

  const props = { data, title, subtitle, yLabel, theme, showDots, showValues, ratio }

  const redraw = useCallback((progress = 1) => {
    if (canvasRef.current) drawChart(canvasRef.current, progress, props)
  }, [props])

  useEffect(() => { redraw(1) }, [redraw])

  const startAnimation = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    let p = 0
    const step = () => {
      p += 0.012 * speed
      if (p >= 1) { redraw(1); return }
      redraw(p)
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
  }, [redraw, speed])

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
      const mp4Blob = new Blob([data instanceof Uint8Array ? data : new Uint8Array(data as ArrayBuffer)], { type: 'video/mp4' })
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
        if (p >= 1) {
          redraw(1)
          setTimeout(() => { recorder.stop(); resolve() }, 1200)
          return
        }
        redraw(p)
        requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    })
  }, [isPro, isRecording, redraw, speed])

  return (
    <div className="flex h-screen bg-[#07070f] text-white overflow-hidden">
      <aside className="w-80 border-r border-white/10 flex flex-col bg-[#0f0f1a] overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h1 className="text-xl font-black text-[#7fff6e]">Chartmaxxing</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <div>
            <label className="text-xs tracking-widest text-gray-500 uppercase">Templates</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {TEMPLATES.map(t => (
                <button
                  key={t.title}
                  onClick={() => { setRawData(t.data); setTitle(t.title); setSubtitle(t.subtitle); setYLabel(t.yLabel) }}
                  className="text-left text-xs text-gray-400 bg-[#161625] border border-white/10 rounded-lg p-2 hover:border-[#7fff6e] hover:text-[#7fff6e] transition"
                >
                  {t.title}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs tracking-widest text-gray-500 uppercase">Data (label, value)</label>
            <textarea
              value={rawData}
              onChange={e => setRawData(e.target.value)}
              className="mt-2 w-full bg-[#161625] border border-white/10 rounded-lg p-3 text-sm font-mono text-white h-28 resize-none focus:outline-none focus:border-[#7fff6e]"
            />
          </div>

          {[
            { label: 'Chart title', value: title, set: setTitle },
            { label: 'Subtitle', value: subtitle, set: setSubtitle },
            { label: 'Y-axis label', value: yLabel, set: setYLabel },
          ].map(f => (
            <div key={f.label}>
              <label className="text-xs tracking-widest text-gray-500 uppercase">{f.label}</label>
              <input
                value={f.value}
                onChange={e => f.set(e.target.value)}
                className="mt-2 w-full bg-[#161625] border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-[#7fff6e]"
              />
            </div>
          ))}

          <div>
            <label className="text-xs tracking-widest text-gray-500 uppercase">Theme</label>
            <div className="flex gap-2 mt-3 flex-wrap">
              {['Void','Inferno','Cyber','Rose','Gold'].map(t => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`text-xs px-3 py-1 rounded-full border transition ${theme === t ? 'border-[#7fff6e] text-[#7fff6e]' : 'border-white/10 text-gray-400'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs tracking-widest text-gray-500 uppercase">Speed: {speed.toFixed(1)}x</label>
            <input type="range" min="0.3" max="3" step="0.1" value={speed}
              onChange={e => setSpeed(parseFloat(e.target.value))}
              className="mt-2 w-full accent-[#7fff6e]"
            />
          </div>

          {[
            { label: 'Show dots', val: showDots, set: setShowDots },
            { label: 'Show values', val: showValues, set: setShowValues },
          ].map(t => (
            <div key={t.label} className="flex justify-between items-center">
              <span className="text-sm text-gray-400">{t.label}</span>
              <button
                onClick={() => t.set(!t.val)}
                className={`w-10 h-6 rounded-full transition ${t.val ? 'bg-[#7fff6e]' : 'bg-white/10'}`}
              >
                <span className={`block w-4 h-4 bg-white rounded-full mx-1 transition-transform ${t.val ? 'translate-x-4' : ''}`} />
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-white/10 space-y-2">
          <button onClick={startAnimation}
            className="w-full py-3 border border-white/10 rounded-xl text-sm font-bold hover:border-[#7fff6e] hover:text-[#7fff6e] transition">
            ▶ Preview
          </button>
          <button onClick={handleExport} disabled={isRecording}
            className="w-full py-3 bg-[#7fff6e] text-black rounded-xl text-sm font-bold hover:bg-[#b4ff3a] transition disabled:opacity-50">
            {isRecording ? `⏺ ${statusText}` : isPro ? '⬇ Download MP4' : '⚡ Go Pro — $4.99/mo'}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
        <div className="border border-white/10 rounded-xl overflow-hidden shadow-2xl"
          style={{ width: ratio === 'landscape' ? 640 : ratio === 'portrait' ? 270 : 480,
                   height: ratio === 'portrait' ? 480 : ratio === 'landscape' ? 360 : 480 }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
        </div>

        <div className="flex gap-2">
          {(['square','portrait','landscape'] as const).map(r => (
            <button key={r} onClick={() => setRatio(r)}
              className={`px-4 py-2 text-xs rounded-lg border transition ${ratio === r ? 'border-[#7fff6e] text-[#7fff6e]' : 'border-white/10 text-gray-400'}`}>
              {r === 'square' ? '□ 1:1' : r === 'portrait' ? '▯ 9:16' : '▭ 16:9'}
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
'use client'

import { useRef, useEffect, useCallback } from 'react'

export interface DataPoint {
  label: string
  value: number
}

interface Props {
  data: DataPoint[]
  title: string
  subtitle: string
  yLabel: string
  theme: string
  showDots: boolean
  showValues: boolean
  canvasRef: React.RefObject<HTMLCanvasElement>
  ratio: 'square' | 'portrait' | 'landscape'
}

const THEMES: Record<string, any> = {
  Void:    { bg: ['#06060f','#0c0c20'], line: '#7fff6e', glow: '#7fff6e', text: '#fff', muted: '#556068', accent: '#7fff6e' },
  Inferno: { bg: ['#0d0400','#1c0800'], line: '#ff6622', glow: '#ff4400', text: '#fff', muted: '#7a5040', accent: '#ff6622' },
  Cyber:   { bg: ['#000a18','#000c28'], line: '#00d4ff', glow: '#00aaff', text: '#fff', muted: '#3a6080', accent: '#ff00cc' },
  Rose:    { bg: ['#0d0010','#1a0020'], line: '#ff3399', glow: '#ff1177', text: '#fff', muted: '#6a3050', accent: '#ff3399' },
  Gold:    { bg: ['#0a0800','#150f00'], line: '#ffd700', glow: '#ffaa00', text: '#fff', muted: '#705830', accent: '#ffd700' },
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

function hexAlpha(hex: string, a: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  lines.push(line)
  return lines
}

export function drawChart(
  canvas: HTMLCanvasElement,
  progress: number,
  props: Omit<Props, 'canvasRef'>
) {
  const { data, title, subtitle, yLabel, theme, showDots, showValues, ratio } = props
  if (!data.length) return

  const dims = ratio === 'portrait' ? { w: 1080, h: 1920 }
    : ratio === 'landscape' ? { w: 1920, h: 1080 }
    : { w: 1080, h: 1080 }

  if (canvas.width !== dims.w || canvas.height !== dims.h) {
    canvas.width = dims.w
    canvas.height = dims.h
  }

  const ctx = canvas.getContext('2d')!
  const c = THEMES[theme] || THEMES.Void
  const s = dims.w / 1080

  ctx.clearRect(0, 0, dims.w, dims.h)

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, dims.w, dims.h)
  bgGrad.addColorStop(0, c.bg[0])
  bgGrad.addColorStop(1, c.bg[1])
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, dims.w, dims.h)

  const pad = { top: 190 * s, right: 80 * s, bottom: 150 * s, left: 110 * s }
  const cW = dims.w - pad.left - pad.right
  const cH = dims.h - pad.top - pad.bottom

  const vals = data.map(d => d.value)
  const maxV = Math.max(...vals)
  const minV = Math.min(0, ...vals)
  const range = maxV - minV || 1

  const xS = (i: number) => pad.left + (data.length > 1 ? (i / (data.length - 1)) * cW : cW / 2)
  const yS = (v: number) => pad.top + cH - ((v - minV) / range) * cH

  // Grid
  for (let i = 0; i <= 5; i++) {
    const y = pad.top + (i / 5) * cH
    const v = maxV - (i / 5) * range
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 10])
    ctx.beginPath()
    ctx.moveTo(pad.left, y)
    ctx.lineTo(pad.left + cW, y)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = c.muted
    ctx.font = `${19 * s}px 'Space Mono', monospace`
    ctx.textAlign = 'right'
    ctx.fillText(v % 1 === 0 ? String(Math.round(v)) : v.toFixed(1), pad.left - 10 * s, y + 6 * s)
  }

  // Axes
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(pad.left, pad.top)
  ctx.lineTo(pad.left, pad.top + cH)
  ctx.lineTo(pad.left + cW, pad.top + cH)
  ctx.stroke()

  // X labels
  data.forEach((d, i) => {
    ctx.fillStyle = c.muted
    ctx.font = `${19 * s}px 'Space Mono', monospace`
    ctx.textAlign = 'center'
    ctx.fillText(d.label, xS(i), pad.top + cH + 34 * s)
  })

  // Y label
  ctx.save()
  ctx.translate(30 * s, pad.top + cH / 2)
  ctx.rotate(-Math.PI / 2)
  ctx.fillStyle = c.accent
  ctx.font = `bold ${22 * s}px 'Space Mono', monospace`
  ctx.textAlign = 'center'
  ctx.fillText(yLabel, 0, 0)
  ctx.restore()

  if (data.length < 2) return

  const prog = easeInOut(Math.min(progress, 1))
  const totalSeg = data.length - 1
  const animLen = prog * totalSeg
  const full = Math.floor(animLen)
  const frac = animLen - full

  const pts: { x: number; y: number; idx: number; partial?: boolean }[] = []
  for (let i = 0; i <= full; i++) pts.push({ x: xS(i), y: yS(data[i].value), idx: i })
  if (full < data.length - 1) {
    pts.push({
      x: xS(full) + frac * (xS(full + 1) - xS(full)),
      y: yS(data[full].value) + frac * (yS(data[full + 1].value) - yS(data[full].value)),
      idx: -1,
      partial: true,
    })
  }

  if (pts.length < 2) return
  const last = pts[pts.length - 1]

  // Area
  const areaGrad = ctx.createLinearGradient(0, pad.top, 0, pad.top + cH)
  areaGrad.addColorStop(0, hexAlpha(c.line, 0.25))
  areaGrad.addColorStop(1, hexAlpha(c.line, 0.01))
  ctx.beginPath()
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
  ctx.lineTo(last.x, pad.top + cH)
  ctx.lineTo(pad.left, pad.top + cH)
  ctx.closePath()
  ctx.fillStyle = areaGrad
  ctx.fill()

  // Glow line
  ctx.beginPath()
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
  ctx.strokeStyle = hexAlpha(c.glow, 0.35)
  ctx.lineWidth = 14 * s
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.shadowColor = c.glow
  ctx.shadowBlur = 40 * s
  ctx.stroke()
  ctx.shadowBlur = 0

  // Crisp line
  ctx.beginPath()
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
  ctx.strokeStyle = c.line
  ctx.lineWidth = 4 * s
  ctx.shadowColor = c.glow
  ctx.shadowBlur = 16 * s
  ctx.stroke()
  ctx.shadowBlur = 0

  // Dots
  if (showDots) {
    pts.filter(p => !p.partial).forEach(p => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 14 * s, 0, Math.PI * 2)
      ctx.fillStyle = hexAlpha(c.line, 0.18)
      ctx.fill()

      ctx.shadowColor = c.glow
      ctx.shadowBlur = 20 * s
      ctx.beginPath()
      ctx.arc(p.x, p.y, 7 * s, 0, Math.PI * 2)
      ctx.fillStyle = c.line
      ctx.fill()
      ctx.shadowBlur = 0

      ctx.beginPath()
      ctx.arc(p.x, p.y, 3 * s, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.fill()

      if (showValues) {
        const v = data[p.idx].value
        const label = v % 1 === 0 ? String(v) : v.toFixed(1)
        ctx.fillStyle = c.text
        ctx.font = `bold ${24 * s}px 'Space Mono', monospace`
        ctx.textAlign = 'center'
        ctx.shadowColor = 'rgba(0,0,0,0.8)'
        ctx.shadowBlur = 6
        ctx.fillText(label, p.x, p.y - 20 * s)
        ctx.shadowBlur = 0
      }
    })
  }

  // Title
  ctx.font = `800 ${58 * s}px 'Syne', sans-serif`
  ctx.textAlign = 'center'
  const titleLines = wrapText(ctx, title, dims.w - 80 * s)
  const titleLineH = 66 * s
  const titleY = pad.top * 0.32
  ctx.shadowColor = 'rgba(0,0,0,0.7)'
  ctx.shadowBlur = 20
  ctx.fillStyle = c.text
  titleLines.forEach((line, i) => ctx.fillText(line, dims.w / 2, titleY + i * titleLineH))
  ctx.shadowBlur = 0

  if (subtitle) {
    ctx.font = `${25 * s}px 'Space Mono', monospace`
    ctx.fillStyle = c.muted
    ctx.fillText(subtitle, dims.w / 2, titleY + titleLines.length * titleLineH + 4 * s)
  }
}

export default function ChartCanvas({ canvasRef, ...props }: Props) {
  useEffect(() => {
    if (canvasRef.current) {
      drawChart(canvasRef.current, 1, props)
    }
  })

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
    />
  )
}
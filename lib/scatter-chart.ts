export interface ScatterPoint {
  label: string
  x: number
  y: number
}

export interface ScatterChartStyle {
  bgColor: string
  bgColor2: string
  dotColor: string
  lobfColor: string
  glowColor: string
  glowOpacity: number
  glowBlur: number
  titleColor: string
  subtitleColor: string
  axisColor: string
  gridColor: string
  labelColor: string
  xLabelColor: string
  yLabelColor: string
  titleFont: string
  subtitleFont: string
  labelFont: string
  titleSize: number
  subtitleSize: number
  labelSize: number
  dotSize: number
  showLOBF: boolean
}

export const SCATTER_PRESETS: Record<string, { name: string; style: ScatterChartStyle }> = {
  default: {
    name: 'Default',
    style: {
      bgColor: '#0a0a0f', bgColor2: '#0a0a0f',
      dotColor: '#4d7cff', lobfColor: '#ff6b6b',
      glowColor: '#4d7cff', glowOpacity: 0, glowBlur: 0,
      titleColor: '#ffffff', subtitleColor: '#666680',
      axisColor: 'rgba(255,255,255,0.08)', gridColor: 'rgba(255,255,255,0.05)',
      labelColor: '#444458', xLabelColor: '#666680', yLabelColor: '#666680',
      titleFont: 'Inter', subtitleFont: 'Inter', labelFont: 'Inter',
      titleSize: 58, subtitleSize: 25, labelSize: 19,
      dotSize: 12, showLOBF: true,
    }
  },
}

export const SCATTER_FONTS = [
  'Inter', 'DM Sans', 'Syne', 'Space Mono', 'Roboto Mono',
  'IBM Plex Mono', 'Bebas Neue', 'Oswald', 'Anton',
  'Archivo Black', 'Playfair Display', 'Permanent Marker',
]

function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

function clearShadow(ctx: CanvasRenderingContext2D) {
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word }
    else line = test
  }
  lines.push(line)
  return lines
}

function niceNumber(range: number, round: boolean) {
  const exp = Math.floor(Math.log10(range))
  const f = range / Math.pow(10, exp)
  let nf: number
  if (round) {
    if (f < 1.5) nf = 1
    else if (f < 3) nf = 2
    else if (f < 7) nf = 5
    else nf = 10
  } else {
    if (f <= 1) nf = 1
    else if (f <= 2) nf = 2
    else if (f <= 5) nf = 5
    else nf = 10
  }
  return nf * Math.pow(10, exp)
}

function niceAxis(min: number, max: number, ticks: number) {
  const range = niceNumber(max - min, false)
  const d = niceNumber(range / (ticks - 1), true)
  const graphMin = Math.floor(min / d) * d
  const graphMax = Math.ceil(max / d) * d
  return { min: graphMin, max: graphMax, step: d }
}

export function drawScatterChart(
  canvas: HTMLCanvasElement,
  progress: number,
  props: {
    data: ScatterPoint[]
    title: string
    subtitle: string
    xLabel: string
    yLabel: string
    ratio: 'square' | 'portrait' | 'landscape'
    style: ScatterChartStyle
  }
) {
  const { data, title, subtitle, xLabel, yLabel, ratio, style: cs } = props
  if (!data.length) return

  const dims = ratio === 'portrait' ? { w: 1080, h: 1920 } : ratio === 'landscape' ? { w: 1920, h: 1080 } : { w: 1080, h: 1080 }
  if (canvas.width !== dims.w || canvas.height !== dims.h) { canvas.width = dims.w; canvas.height = dims.h }

  const ctx = canvas.getContext('2d')!
  const s = dims.w / 1080

  clearShadow(ctx)
  ctx.clearRect(0, 0, dims.w, dims.h)
  const bgGrad = ctx.createLinearGradient(0, 0, dims.w, dims.h)
  bgGrad.addColorStop(0, cs.bgColor); bgGrad.addColorStop(1, cs.bgColor2)
  ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, dims.w, dims.h)

  const pad = { top: 190 * s, right: 80 * s, bottom: 160 * s, left: 120 * s }
  const cW = dims.w - pad.left - pad.right
  const cH = dims.h - pad.top - pad.bottom

  const xs = data.map(d => d.x)
  const ys = data.map(d => d.y)
  const xAxis = niceAxis(Math.min(...xs), Math.max(...xs), 6)
  const yAxis = niceAxis(Math.min(...ys), Math.max(...ys), 6)

  const toCanvasX = (x: number) => pad.left + ((x - xAxis.min) / (xAxis.max - xAxis.min)) * cW
  const toCanvasY = (y: number) => pad.top + cH - ((y - yAxis.min) / (yAxis.max - yAxis.min)) * cH

  // Grid
  for (let v = xAxis.min; v <= xAxis.max + xAxis.step * 0.01; v += xAxis.step) {
    const x = toCanvasX(v)
    ctx.strokeStyle = cs.gridColor; ctx.lineWidth = 1; ctx.setLineDash([4, 10])
    ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + cH); ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = cs.labelColor
    ctx.font = `${cs.labelSize * s}px '${cs.labelFont}', sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(v % 1 === 0 ? String(Math.round(v)) : v.toFixed(1), x, pad.top + cH + 30 * s)
  }

  for (let v = yAxis.min; v <= yAxis.max + yAxis.step * 0.01; v += yAxis.step) {
    const y = toCanvasY(v)
    ctx.strokeStyle = cs.gridColor; ctx.lineWidth = 1; ctx.setLineDash([4, 10])
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + cW, y); ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = cs.labelColor
    ctx.font = `${cs.labelSize * s}px '${cs.labelFont}', sans-serif`
    ctx.textAlign = 'right'
    ctx.fillText(v % 1 === 0 ? String(Math.round(v)) : v.toFixed(1), pad.left - 10 * s, y + 5 * s)
  }

  // Axes
  ctx.strokeStyle = cs.axisColor; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top + cH); ctx.lineTo(pad.left + cW, pad.top + cH); ctx.stroke()

  // Axis labels
  if (xLabel) {
    ctx.fillStyle = cs.xLabelColor
    ctx.font = `bold ${cs.labelSize * s}px '${cs.labelFont}', sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(xLabel, pad.left + cW / 2, pad.top + cH + 70 * s)
  }
  if (yLabel) {
    ctx.save(); ctx.translate(30 * s, pad.top + cH / 2); ctx.rotate(-Math.PI / 2)
    ctx.fillStyle = cs.yLabelColor
    ctx.font = `bold ${cs.labelSize * s}px '${cs.labelFont}', sans-serif`
    ctx.textAlign = 'center'; ctx.fillText(yLabel, 0, 0); ctx.restore()
  }

  clearShadow(ctx)

  // Animation phases:
  // 0 to 0.75: dots appear one by one
  // 0.75 to 1.0: LOBF draws in
  const dotPhase = Math.min(progress / 0.75, 1)
  const lobfPhase = progress >= 0.75 ? (progress - 0.75) / 0.25 : 0

  const n = data.length
  const totalDotProgress = easeInOut(dotPhase) * n

  // Draw dots
  data.forEach((d, i) => {
    const dotProgress = Math.min(Math.max(totalDotProgress - i, 0), 1)
    if (dotProgress <= 0) return

    const easedP = easeOut(dotProgress)
    const cx = toCanvasX(d.x)
    const cy = toCanvasY(d.y)
    const r = cs.dotSize * s * easedP

    if (cs.glowOpacity > 0) {
      ctx.beginPath(); ctx.arc(cx, cy, r * 1.8, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(77,124,255,${cs.glowOpacity * 0.3})`
      ctx.shadowColor = cs.glowColor; ctx.shadowBlur = cs.glowBlur * s
      ctx.fill(); clearShadow(ctx)
    }

    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = cs.dotColor; ctx.fill()

    ctx.beginPath(); ctx.arc(cx, cy, r * 0.4, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,255,255,0.4)`; ctx.fill()
  })

  clearShadow(ctx)

  // LOBF
  if (cs.showLOBF && lobfPhase > 0 && data.length >= 2) {
    // Linear regression
    const n = data.length
    const sumX = data.reduce((a, d) => a + d.x, 0)
    const sumY = data.reduce((a, d) => a + d.y, 0)
    const sumXY = data.reduce((a, d) => a + d.x * d.y, 0)
    const sumX2 = data.reduce((a, d) => a + d.x * d.x, 0)
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    const x1 = xAxis.min
    const x2 = xAxis.max
    const y1 = slope * x1 + intercept
    const y2 = slope * x2 + intercept

    const cx1 = toCanvasX(x1)
    const cy1 = toCanvasY(y1)
    const cx2 = toCanvasX(x2)
    const cy2 = toCanvasY(y2)

    const easedLobf = easeInOut(lobfPhase)
    const midX = cx1 + (cx2 - cx1) * easedLobf
    const midY = cy1 + (cy2 - cy1) * easedLobf

    ctx.save()
    ctx.beginPath()
    ctx.moveTo(cx1, cy1)
    ctx.lineTo(midX, midY)
    ctx.strokeStyle = cs.lobfColor
    ctx.lineWidth = 2.5 * s
    ctx.setLineDash([8 * s, 6 * s])
    ctx.stroke()
    ctx.setLineDash([])
    ctx.restore()

    // Tip dot on LOBF
    if (lobfPhase < 1) {
      ctx.beginPath(); ctx.arc(midX, midY, 5 * s, 0, Math.PI * 2)
      ctx.fillStyle = cs.lobfColor; ctx.fill()
    }
  }

  // Title
  clearShadow(ctx)
  ctx.font = `700 ${cs.titleSize * s}px '${cs.titleFont}', sans-serif`
  ctx.textAlign = 'center'
  const titleLines = wrapText(ctx, title, dims.w - 80 * s)
  const titleLineH = (cs.titleSize + 8) * s
  const titleY = pad.top * 0.32
  ctx.fillStyle = cs.titleColor
  titleLines.forEach((line, i) => ctx.fillText(line, dims.w / 2, titleY + i * titleLineH))

  if (subtitle) {
    ctx.font = `${cs.subtitleSize * s}px '${cs.subtitleFont}', sans-serif`
    ctx.fillStyle = cs.subtitleColor
    ctx.fillText(subtitle, dims.w / 2, titleY + titleLines.length * titleLineH + 4 * s)
  }
}
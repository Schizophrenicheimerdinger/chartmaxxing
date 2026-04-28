export interface DataPoint {
  label: string
  value: number
}

export interface BarChartStyle {
  bgColor: string
  bgColor2: string
  barColor: string
  barColor2: string
  glowColor: string
  glowOpacity: number
  glowBlur: number
  titleColor: string
  subtitleColor: string
  valueColor: string
  labelColor: string
  axisColor: string
  gridColor: string
  yLabelColor: string
  titleFont: string
  subtitleFont: string
  valueFont: string
  labelFont: string
  yLabelFont: string
  titleSize: number
  subtitleSize: number
  valueSize: number
  labelSize: number
}

export const BAR_PRESETS: Record<string, { name: string; style: BarChartStyle }> = {
  default: {
    name: 'Default',
    style: {
      bgColor: '#0a0a0f', bgColor2: '#0a0a0f',
      barColor: '#4d7cff', barColor2: '#4d7cff',
      glowColor: '#4d7cff', glowOpacity: 0, glowBlur: 0,
      titleColor: '#ffffff', subtitleColor: '#666680', valueColor: '#ffffff',
      labelColor: '#444458', axisColor: 'rgba(255,255,255,0.08)', gridColor: 'rgba(255,255,255,0.05)',
      yLabelColor: '#666680',
      titleFont: 'Inter', subtitleFont: 'Inter', valueFont: 'Inter',
      labelFont: 'Inter', yLabelFont: 'Inter',
      titleSize: 58, subtitleSize: 25, valueSize: 24, labelSize: 19,
    }
  },
}

export const BAR_FONTS = [
  'Inter', 'DM Sans', 'Syne', 'Space Mono', 'Roboto Mono',
  'IBM Plex Mono', 'Bebas Neue', 'Oswald', 'Anton',
  'Archivo Black', 'Playfair Display', 'Permanent Marker',
]

function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

function hexAlpha(hex: string, a: number) {
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
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

export function drawBarChart(
  canvas: HTMLCanvasElement,
  progress: number,
  props: {
    data: DataPoint[]
    title: string
    subtitle: string
    yLabel: string
    showValues: boolean
    ratio: 'square' | 'portrait' | 'landscape'
    style: BarChartStyle
  }
) {
  const { data, title, subtitle, yLabel, showValues, ratio, style: cs } = props
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

  const pad = { top: 190 * s, right: 80 * s, bottom: 150 * s, left: 110 * s }
  const cW = dims.w - pad.left - pad.right
  const cH = dims.h - pad.top - pad.bottom
  const vals = data.map(d => d.value)
  const maxV = Math.max(...vals)
  const range = maxV || 1

  const yS = (v: number) => pad.top + cH - (v / range) * cH

  // Grid lines
  for (let i = 0; i <= 5; i++) {
    const y = pad.top + (i / 5) * cH
    const v = maxV - (i / 5) * range
    ctx.strokeStyle = cs.gridColor; ctx.lineWidth = 1; ctx.setLineDash([4, 10])
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + cW, y); ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = cs.labelColor
    ctx.font = `${cs.labelSize * s}px '${cs.labelFont}', sans-serif`
    ctx.textAlign = 'right'
    ctx.fillText(v % 1 === 0 ? String(Math.round(v)) : v.toFixed(1), pad.left - 10 * s, y + 6 * s)
  }

  // Axes
  ctx.strokeStyle = cs.axisColor; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top + cH); ctx.lineTo(pad.left + cW, pad.top + cH); ctx.stroke()

  // Y label
  ctx.save(); ctx.translate(30 * s, pad.top + cH / 2); ctx.rotate(-Math.PI / 2)
  ctx.fillStyle = cs.yLabelColor
  ctx.font = `bold ${cs.labelSize * s}px '${cs.yLabelFont}', sans-serif`
  ctx.textAlign = 'center'; ctx.fillText(yLabel, 0, 0); ctx.restore()
  clearShadow(ctx)

  if (!data.length) return

  const n = data.length
  const barW = (cW / n) * 0.6
  const barGap = cW / n

  // Animation: bars appear one by one, each growing upward
  const prog = Math.min(progress, 1)
  const totalProgress = prog * n
  const isAnimating = progress < 1
  const currentBarIdx = Math.floor(totalProgress)
  const currentBarFrac = totalProgress - currentBarIdx

  data.forEach((d, i) => {
    const barProgress = Math.min(Math.max(totalProgress - i, 0), 1)
    if (barProgress <= 0) return

    const easedProg = easeOut(barProgress)
    const x = pad.left + i * barGap + barGap / 2 - barW / 2
    const fullH = (d.value / range) * cH
    const animH = fullH * easedProg
    const y = pad.top + cH - animH

    // Bar gradient
    const barGrad = ctx.createLinearGradient(x, y, x, pad.top + cH)
    barGrad.addColorStop(0, cs.barColor)
    barGrad.addColorStop(1, hexAlpha(cs.barColor2, 0.6))

    if (cs.glowOpacity > 0) {
      ctx.shadowColor = cs.glowColor
      ctx.shadowBlur = cs.glowBlur * s
    }

    ctx.fillStyle = barGrad
    const radius = Math.min(6 * s, animH / 2)
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + barW - radius, y)
    ctx.quadraticCurveTo(x + barW, y, x + barW, y + radius)
    ctx.lineTo(x + barW, pad.top + cH)
    ctx.lineTo(x, pad.top + cH)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
    ctx.fill()
    clearShadow(ctx)

    // Value label
    if (showValues && barProgress >= 0.8) {
      const alpha = Math.min((barProgress - 0.8) / 0.2, 1)
      const label = d.value % 1 === 0 ? String(d.value) : d.value.toFixed(1)
      ctx.fillStyle = `rgba(${parseInt(cs.valueColor.slice(1,3),16)},${parseInt(cs.valueColor.slice(3,5),16)},${parseInt(cs.valueColor.slice(5,7),16)},${alpha})`
      ctx.font = `600 ${cs.valueSize * s}px '${cs.valueFont}', sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(label, x + barW / 2, y - 10 * s)
    }

    // X label
    if (!isAnimating || i <= currentBarIdx) {
      ctx.fillStyle = cs.labelColor
      ctx.font = `${cs.labelSize * s}px '${cs.labelFont}', sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(d.label, x + barW / 2, pad.top + cH + 34 * s)
    }
  })

  // Big current label during animation
  if (isAnimating && currentBarIdx < n) {
    ctx.fillStyle = cs.titleColor
    ctx.font = `700 ${72 * s}px '${cs.labelFont}', sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(data[currentBarIdx].label, dims.w / 2, pad.top + cH + 90 * s)
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
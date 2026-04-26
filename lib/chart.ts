export interface DataPoint {
  label: string
  value: number
}

export interface ChartStyle {
  bgColor: string
  bgColor2: string
  lineColor: string
  dotColor: string
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

export const PRESETS: Record<string, { name: string; style: ChartStyle }> = {
  default: {
    name: 'Default',
    style: {
      bgColor: '#0a0a1a', bgColor2: '#111130',
      lineColor: '#4466ff', dotColor: '#4466ff', glowColor: '#2244ff', glowOpacity: 0.35, glowBlur: 40,
      titleColor: '#ffffff', subtitleColor: '#8888aa', valueColor: '#ffffff',
      labelColor: '#8888aa', axisColor: 'rgba(255,255,255,0.15)', gridColor: 'rgba(255,255,255,0.06)',
      yLabelColor: '#4466ff',
      titleFont: 'Inter', subtitleFont: 'Inter', valueFont: 'Inter',
      labelFont: 'Inter', yLabelFont: 'Inter',
      titleSize: 58, subtitleSize: 25, valueSize: 24, labelSize: 19,
    }
  },
  neon: {
    name: 'Neon',
    style: {
      bgColor: '#06060f', bgColor2: '#0c0c20',
      lineColor: '#7fff6e', dotColor: '#7fff6e', glowColor: '#7fff6e', glowOpacity: 0.35, glowBlur: 40,
      titleColor: '#ffffff', subtitleColor: '#556068', valueColor: '#ffffff',
      labelColor: '#556068', axisColor: 'rgba(255,255,255,0.12)', gridColor: 'rgba(255,255,255,0.06)',
      yLabelColor: '#7fff6e',
      titleFont: 'Syne', subtitleFont: 'Space Mono', valueFont: 'Space Mono',
      labelFont: 'Space Mono', yLabelFont: 'Space Mono',
      titleSize: 58, subtitleSize: 25, valueSize: 24, labelSize: 19,
    }
  },
  inferno: {
    name: 'Inferno',
    style: {
      bgColor: '#0d0400', bgColor2: '#1c0800',
      lineColor: '#ff6622', dotColor: '#ff6622', glowColor: '#ff4400', glowOpacity: 0.35, glowBlur: 40,
      titleColor: '#ffffff', subtitleColor: '#7a5040', valueColor: '#ffffff',
      labelColor: '#7a5040', axisColor: 'rgba(255,255,255,0.12)', gridColor: 'rgba(255,255,255,0.06)',
      yLabelColor: '#ff6622',
      titleFont: 'Bebas Neue', subtitleFont: 'DM Sans', valueFont: 'DM Sans',
      labelFont: 'DM Sans', yLabelFont: 'DM Sans',
      titleSize: 72, subtitleSize: 28, valueSize: 26, labelSize: 20,
    }
  },
  newspaper: {
    name: 'Newspaper',
    style: {
      bgColor: '#f5f0e8', bgColor2: '#ece7d8',
      lineColor: '#1a1a1a', dotColor: '#1a1a1a', glowColor: '#1a1a1a', glowOpacity: 0, glowBlur: 0,
      titleColor: '#1a1a1a', subtitleColor: '#555550', valueColor: '#1a1a1a',
      labelColor: '#888880', axisColor: 'rgba(0,0,0,0.2)', gridColor: 'rgba(0,0,0,0.08)',
      yLabelColor: '#333330',
      titleFont: 'Playfair Display', subtitleFont: 'Inter', valueFont: 'Roboto Mono',
      labelFont: 'Inter', yLabelFont: 'Inter',
      titleSize: 58, subtitleSize: 25, valueSize: 22, labelSize: 18,
    }
  },
  meme: {
    name: 'Meme',
    style: {
      bgColor: '#ffffff', bgColor2: '#f0f0f0',
      lineColor: '#ff0066', dotColor: '#ff0066', glowColor: '#ff0066', glowOpacity: 0.2, glowBlur: 20,
      titleColor: '#000000', subtitleColor: '#444444', valueColor: '#000000',
      labelColor: '#666666', axisColor: 'rgba(0,0,0,0.2)', gridColor: 'rgba(0,0,0,0.06)',
      yLabelColor: '#ff0066',
      titleFont: 'Permanent Marker', subtitleFont: 'DM Sans', valueFont: 'DM Sans',
      labelFont: 'DM Sans', yLabelFont: 'DM Sans',
      titleSize: 58, subtitleSize: 25, valueSize: 22, labelSize: 18,
    }
  },
  cyber: {
    name: 'Cyber',
    style: {
      bgColor: '#000a18', bgColor2: '#000c28',
      lineColor: '#00d4ff', dotColor: '#00d4ff', glowColor: '#00aaff', glowOpacity: 0.35, glowBlur: 50,
      titleColor: '#ffffff', subtitleColor: '#3a6080', valueColor: '#ffffff',
      labelColor: '#3a6080', axisColor: 'rgba(255,255,255,0.12)', gridColor: 'rgba(255,255,255,0.06)',
      yLabelColor: '#ff00cc',
      titleFont: 'Oswald', subtitleFont: 'Roboto Mono', valueFont: 'Roboto Mono',
      labelFont: 'Roboto Mono', yLabelFont: 'Roboto Mono',
      titleSize: 58, subtitleSize: 25, valueSize: 24, labelSize: 19,
    }
  },
}

export const FONTS = [
  'Inter', 'DM Sans', 'Syne', 'Space Mono', 'Roboto Mono',
  'IBM Plex Mono', 'Bebas Neue', 'Oswald', 'Anton',
  'Archivo Black', 'Playfair Display', 'Permanent Marker',
]

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

function hexAlpha(hex: string, a: number) {
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex
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
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word }
    else line = test
  }
  lines.push(line)
  return lines
}

export function drawChart(
  canvas: HTMLCanvasElement,
  progress: number,
  props: {
    data: DataPoint[]
    title: string
    subtitle: string
    yLabel: string
    showDots: boolean
    showValues: boolean
    ratio: 'square' | 'portrait' | 'landscape'
    style: ChartStyle
  }
) {
  const { data, title, subtitle, yLabel, showDots, showValues, ratio, style: cs } = props
  if (!data.length) return

  const dims = ratio === 'portrait' ? { w: 1080, h: 1920 } : ratio === 'landscape' ? { w: 1920, h: 1080 } : { w: 1080, h: 1080 }
  if (canvas.width !== dims.w || canvas.height !== dims.h) { canvas.width = dims.w; canvas.height = dims.h }

  const ctx = canvas.getContext('2d')!
  const s = dims.w / 1080

  ctx.clearRect(0, 0, dims.w, dims.h)
  const bgGrad = ctx.createLinearGradient(0, 0, dims.w, dims.h)
  bgGrad.addColorStop(0, cs.bgColor); bgGrad.addColorStop(1, cs.bgColor2)
  ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, dims.w, dims.h)

  const pad = { top: 190 * s, right: 80 * s, bottom: 150 * s, left: 110 * s }
  const cW = dims.w - pad.left - pad.right
  const cH = dims.h - pad.top - pad.bottom
  const vals = data.map(d => d.value)
  const maxV = Math.max(...vals), minV = Math.min(0, ...vals), range = maxV - minV || 1
  const xS = (i: number) => pad.left + (data.length > 1 ? (i / (data.length - 1)) * cW : cW / 2)
  const yS = (v: number) => pad.top + cH - ((v - minV) / range) * cH

  for (let i = 0; i <= 5; i++) {
    const y = pad.top + (i / 5) * cH, v = maxV - (i / 5) * range
    ctx.strokeStyle = cs.gridColor; ctx.lineWidth = 1; ctx.setLineDash([4, 10])
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + cW, y); ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = cs.labelColor
    ctx.font = `${cs.labelSize * s}px '${cs.labelFont}', sans-serif`
    ctx.textAlign = 'right'
    ctx.fillText(v % 1 === 0 ? String(Math.round(v)) : v.toFixed(1), pad.left - 10 * s, y + 6 * s)
  }

  ctx.strokeStyle = cs.axisColor; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top + cH); ctx.lineTo(pad.left + cW, pad.top + cH); ctx.stroke()

  data.forEach((d, i) => {
    ctx.fillStyle = cs.labelColor
    ctx.font = `${cs.labelSize * s}px '${cs.labelFont}', sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(d.label, xS(i), pad.top + cH + 34 * s)
  })

  ctx.save(); ctx.translate(30 * s, pad.top + cH / 2); ctx.rotate(-Math.PI / 2)
  ctx.fillStyle = cs.yLabelColor
  ctx.font = `bold ${cs.labelSize * s}px '${cs.yLabelFont}', sans-serif`
  ctx.textAlign = 'center'; ctx.fillText(yLabel, 0, 0); ctx.restore()

  if (data.length < 2) return

  const prog = easeInOut(Math.min(progress, 1))
  const animLen = prog * (data.length - 1), full = Math.floor(animLen), frac = animLen - full
  const pts: { x: number; y: number; idx: number; partial?: boolean }[] = []
  for (let i = 0; i <= full; i++) pts.push({ x: xS(i), y: yS(data[i].value), idx: i })
  if (full < data.length - 1) pts.push({
    x: xS(full) + frac * (xS(full + 1) - xS(full)),
    y: yS(data[full].value) + frac * (yS(data[full + 1].value) - yS(data[full].value)),
    idx: -1, partial: true
  })
  if (pts.length < 2) return
  const last = pts[pts.length - 1]

  const areaGrad = ctx.createLinearGradient(0, pad.top, 0, pad.top + cH)
  areaGrad.addColorStop(0, hexAlpha(cs.lineColor, 0.25))
  areaGrad.addColorStop(1, hexAlpha(cs.lineColor, 0.01))
  ctx.beginPath(); pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y))
  ctx.lineTo(last.x, pad.top + cH); ctx.lineTo(pad.left, pad.top + cH); ctx.closePath()
  ctx.fillStyle = areaGrad; ctx.fill()

  // Glow line
  if (cs.glowOpacity > 0) {
    ctx.beginPath(); pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y))
    ctx.strokeStyle = hexAlpha(cs.glowColor, cs.glowOpacity)
    ctx.lineWidth = 14 * s; ctx.lineJoin = 'round'; ctx.lineCap = 'round'
    ctx.shadowColor = cs.glowColor; ctx.shadowBlur = cs.glowBlur * s; ctx.stroke(); ctx.shadowBlur = 0
  }

  // Crisp line
  ctx.beginPath(); pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y))
  ctx.strokeStyle = cs.lineColor; ctx.lineWidth = 4 * s; ctx.lineJoin = 'round'; ctx.lineCap = 'round'
  ctx.shadowColor = cs.glowColor; ctx.shadowBlur = (cs.glowBlur * 0.4) * s; ctx.stroke(); ctx.shadowBlur = 0

  if (showDots) {
    pts.filter(p => !p.partial).forEach(p => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 14 * s, 0, Math.PI * 2)
      ctx.fillStyle = hexAlpha(cs.dotColor, 0.18); ctx.fill()
      ctx.shadowColor = cs.glowColor; ctx.shadowBlur = 20 * s
      ctx.beginPath(); ctx.arc(p.x, p.y, 7 * s, 0, Math.PI * 2)
      ctx.fillStyle = cs.dotColor; ctx.fill(); ctx.shadowBlur = 0
      ctx.beginPath(); ctx.arc(p.x, p.y, 3 * s, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'; ctx.fill()
      if (showValues && p.idx >= 0) {
        const v = data[p.idx].value, label = v % 1 === 0 ? String(v) : v.toFixed(1)
        ctx.fillStyle = cs.valueColor
        ctx.font = `bold ${cs.valueSize * s}px '${cs.valueFont}', sans-serif`
        ctx.textAlign = 'center'
        ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 6
        ctx.fillText(label, p.x, p.y - 20 * s); ctx.shadowBlur = 0
      }
    })
  }

  ctx.font = `800 ${cs.titleSize * s}px '${cs.titleFont}', sans-serif`
  ctx.textAlign = 'center'
  const titleLines = wrapText(ctx, title, dims.w - 80 * s)
  const titleLineH = (cs.titleSize + 8) * s
  const titleY = pad.top * 0.32
  ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 20
  ctx.fillStyle = cs.titleColor
  titleLines.forEach((line, i) => ctx.fillText(line, dims.w / 2, titleY + i * titleLineH))
  ctx.shadowBlur = 0

  if (subtitle) {
    ctx.font = `${cs.subtitleSize * s}px '${cs.subtitleFont}', sans-serif`
    ctx.fillStyle = cs.subtitleColor
    ctx.fillText(subtitle, dims.w / 2, titleY + titleLines.length * titleLineH + 4 * s)
  }
}s
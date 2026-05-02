export interface DataPoint {
  label: string
  value: number
}

export interface SeriesData {
  data: DataPoint[]
  lineColor: string
  dotColor: string
  tipColor: string
  glowColor: string
  shadowColor: string
}

export interface ChartStyle {
  bgColor: string
  bgColor2: string
  lineColor: string
  dotColor: string
  tipColor: string
  tipSize: number
  glowColor: string
  glowOpacity: number
  glowBlur: number
  shadowColor: string
  shadowOpacity: number
  shadowBlur: number
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
      bgColor: '#0a0a0f', bgColor2: '#0a0a0f',
      lineColor: '#4d7cff', dotColor: '#4d7cff', tipColor: '#4d7cff', tipSize: 8,
      glowColor: '#4d7cff', glowOpacity: 0, glowBlur: 0,
      shadowColor: '#000000', shadowOpacity: 0.6, shadowBlur: 15,
      titleColor: '#ffffff', subtitleColor: '#666680', valueColor: '#ffffff',
      labelColor: '#444458', axisColor: 'rgba(255,255,255,0.08)', gridColor: 'rgba(255,255,255,0.05)',
      yLabelColor: '#666680',
      titleFont: 'Inter', subtitleFont: 'Inter', valueFont: 'Inter',
      labelFont: 'Inter', yLabelFont: 'Inter',
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

export function drawChart(
  canvas: HTMLCanvasElement,
  progress: number,
  props: {
    series: SeriesData[]
    title: string
    subtitle: string
    yLabel: string
    showDots: boolean
    showValues: boolean
    showAreaFill: boolean
    ratio: 'square' | 'portrait' | 'landscape'
    style: ChartStyle
  }
) {
  const { series, title, subtitle, yLabel, showDots, showValues, showAreaFill, ratio, style: cs } = props
  if (!series.length || series.every(ser => ser.data.length === 0)) return

  const dims = ratio === 'portrait' ? { w: 1080, h: 1920 } : ratio === 'landscape' ? { w: 1920, h: 1080 } : { w: 1080, h: 1080 }
  if (canvas.width !== dims.w || canvas.height !== dims.h) { canvas.width = dims.w; canvas.height = dims.h }

  const ctx = canvas.getContext('2d')!
  const sc = dims.w / 1080

  clearShadow(ctx)
  ctx.clearRect(0, 0, dims.w, dims.h)
  const bgGrad = ctx.createLinearGradient(0, 0, dims.w, dims.h)
  bgGrad.addColorStop(0, cs.bgColor); bgGrad.addColorStop(1, cs.bgColor2)
  ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, dims.w, dims.h)

  const pad = { top: 190 * sc, right: 80 * sc, bottom: 150 * sc, left: 110 * sc }
  const cW = dims.w - pad.left - pad.right
  const cH = dims.h - pad.top - pad.bottom

  const allVals = series.flatMap(ser => ser.data.map(d => d.value))
  const maxV = Math.max(...allVals), minV = Math.min(0, ...allVals), range = maxV - minV || 1

  const totalPoints = Math.max(...series.map(ser => ser.data.length))
  const totalSpan = totalPoints - 1
  const labelSeries = series.reduce((a, b) => a.data.length >= b.data.length ? a : b)

  const yS = (v: number) => pad.top + cH - ((v - minV) / range) * cH

  const prog = easeInOut(Math.min(progress, 1))
  const animLen = prog * totalSpan
  const full = Math.floor(animLen)
  const frac = animLen - full

  const drawingDone = prog >= 1
  const compressionPhaseStart = 0.75
  const compressionT = prog < compressionPhaseStart
    ? 0
    : Math.min((prog - compressionPhaseStart) / (1 - compressionPhaseStart), 1)
  const easedCompression = compressionT * compressionT * (3 - 2 * compressionT)

  const xS = (i: number) => {
    if (drawingDone || compressionT === 0) {
      const span = Math.max(animLen, 1)
      return pad.left + (i / span) * cW
    }
    const span = Math.max(animLen, 1)
    const drawX = pad.left + (i / span) * cW
    const finalX = pad.left + (totalSpan > 0 ? (i / totalSpan) * cW : cW / 2)
    return drawX + (finalX - drawX) * easedCompression
  }

  const xSFinal = (i: number) => pad.left + (totalSpan > 0 ? (i / totalSpan) * cW : cW / 2)

  // Grid
  for (let gi = 0; gi <= 5; gi++) {
    const y = pad.top + (gi / 5) * cH, v = maxV - (gi / 5) * range
    ctx.strokeStyle = cs.gridColor; ctx.lineWidth = 1; ctx.setLineDash([4, 10])
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + cW, y); ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = cs.labelColor
    ctx.font = `${cs.labelSize * sc}px '${cs.labelFont}', sans-serif`
    ctx.textAlign = 'right'
    ctx.fillText(v % 1 === 0 ? String(Math.round(v)) : v.toFixed(1), pad.left - 10 * sc, y + 6 * sc)
  }

  // Axes
  ctx.strokeStyle = cs.axisColor; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top + cH); ctx.lineTo(pad.left + cW, pad.top + cH); ctx.stroke()

  // X labels
  const isAnimating = progress < 1
  if (isAnimating) {
    const currentLabel = full < labelSeries.data.length ? labelSeries.data[full].label : labelSeries.data[labelSeries.data.length - 1].label
    ctx.fillStyle = cs.titleColor
    ctx.font = `700 ${72 * sc}px '${cs.labelFont}', sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(currentLabel, dims.w / 2, pad.top + cH + 90 * sc)
  } else {
    labelSeries.data.forEach((d, i) => {
      ctx.fillStyle = cs.labelColor
      ctx.font = `${cs.labelSize * sc}px '${cs.labelFont}', sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(d.label, xSFinal(i), pad.top + cH + 34 * sc)
    })
  }

  // Y label
  ctx.save(); ctx.translate(30 * sc, pad.top + cH / 2); ctx.rotate(-Math.PI / 2)
  ctx.fillStyle = cs.yLabelColor
  ctx.font = `bold ${cs.labelSize * sc}px '${cs.yLabelFont}', sans-serif`
  ctx.textAlign = 'center'; ctx.fillText(yLabel, 0, 0); ctx.restore()
  clearShadow(ctx)

  // Build points for each series
  const allPts: { x: number; y: number; idx: number; partial?: boolean }[][] = series.map(ser => {
    if (ser.data.length < 2) return []
    const serFull = Math.min(full, ser.data.length - 1)
    const pts: { x: number; y: number; idx: number; partial?: boolean }[] = []
    for (let i = 0; i <= serFull; i++) {
      pts.push({ x: xS(i), y: yS(ser.data[i].value), idx: i })
    }
    if (serFull < ser.data.length - 1 && frac > 0 && serFull === full) {
      pts.push({
        x: xS(serFull) + frac * (xS(serFull + 1) - xS(serFull)),
        y: yS(ser.data[serFull].value) + frac * (yS(ser.data[serFull + 1].value) - yS(ser.data[serFull].value)),
        idx: -1, partial: true,
      })
    }
    return pts
  })

  // Area fills
  if (showAreaFill) {
    series.forEach((ser, si) => {
      const pts = allPts[si]
      if (pts.length < 2) return
      const last = pts[pts.length - 1]
      const areaGrad = ctx.createLinearGradient(0, pad.top, 0, pad.top + cH)
      areaGrad.addColorStop(0, hexAlpha(ser.lineColor, 0.2))
      areaGrad.addColorStop(1, hexAlpha(ser.lineColor, 0.0))
      ctx.beginPath(); pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y))
      ctx.lineTo(last.x, pad.top + cH); ctx.lineTo(pad.left, pad.top + cH); ctx.closePath()
      ctx.fillStyle = areaGrad; ctx.fill()
    })
  }

  // Glows
  series.forEach((ser, si) => {
    const pts = allPts[si]
    if (pts.length < 2 || cs.glowOpacity <= 0) return
    ctx.save()
    ctx.beginPath(); pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y))
    ctx.strokeStyle = hexAlpha(ser.glowColor, cs.glowOpacity)
    ctx.lineWidth = 14 * sc; ctx.lineJoin = 'round'; ctx.lineCap = 'round'
    ctx.shadowColor = ser.glowColor; ctx.shadowBlur = cs.glowBlur * sc
    ctx.stroke(); ctx.restore()
  })

  clearShadow(ctx)

  // Lines
  series.forEach((ser, si) => {
    const pts = allPts[si]
    if (pts.length < 2) return
    ctx.save()
    if (cs.shadowOpacity > 0) {
      ctx.shadowColor = hexAlpha(ser.shadowColor, cs.shadowOpacity)
      ctx.shadowBlur = cs.shadowBlur * sc
      ctx.shadowOffsetY = 4 * sc
    }
    ctx.beginPath(); pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y))
    ctx.strokeStyle = ser.lineColor; ctx.lineWidth = 3 * sc; ctx.lineJoin = 'round'; ctx.lineCap = 'round'
    ctx.stroke(); ctx.restore()
    clearShadow(ctx)

    // Tip circle
    const last = pts[pts.length - 1]
    const tipR = (cs.tipSize ?? 8) * sc
    ctx.beginPath(); ctx.arc(last.x, last.y, tipR, 0, Math.PI * 2)
    ctx.fillStyle = ser.tipColor ?? ser.lineColor
    ctx.fill()
  })

  clearShadow(ctx)

  // Dots and values
  if (showDots) {
    series.forEach((ser, si) => {
      const pts = allPts[si]
      pts.filter(p => !p.partial).forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, 6 * sc, 0, Math.PI * 2)
        ctx.fillStyle = ser.dotColor; ctx.fill()
      })
    })

    if (showValues) {
      for (let xi = 0; xi < totalPoints; xi++) {
        let maxVal = -Infinity
        let maxPt: { x: number; y: number } | null = null
        series.forEach((ser, si) => {
          if (xi >= ser.data.length) return
          const pt = allPts[si].find(p => p.idx === xi)
          if (!pt) return
          if (ser.data[xi].value > maxVal) { maxVal = ser.data[xi].value; maxPt = pt }
        })
        if (maxPt) {
          const label = maxVal % 1 === 0 ? String(maxVal) : maxVal.toFixed(1)
          ctx.fillStyle = cs.valueColor
          ctx.font = `600 ${cs.valueSize * sc}px '${cs.valueFont}', sans-serif`
          ctx.textAlign = 'center'
          ctx.fillText(label, (maxPt as { x: number; y: number }).x, (maxPt as { x: number; y: number }).y - 18 * sc)
        }
      }
    }
  }

  clearShadow(ctx)
  ctx.font = `700 ${cs.titleSize * sc}px '${cs.titleFont}', sans-serif`
  ctx.textAlign = 'center'
  const titleLines = wrapText(ctx, title, dims.w - 80 * sc)
  const titleLineH = (cs.titleSize + 8) * sc
  const titleY = pad.top * 0.32
  ctx.fillStyle = cs.titleColor
  titleLines.forEach((line, i) => ctx.fillText(line, dims.w / 2, titleY + i * titleLineH))

  if (subtitle) {
    ctx.font = `${cs.subtitleSize * sc}px '${cs.subtitleFont}', sans-serif`
    ctx.fillStyle = cs.subtitleColor
    ctx.fillText(subtitle, dims.w / 2, titleY + titleLines.length * titleLineH + 4 * sc)
  }
}

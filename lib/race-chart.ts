export interface RaceFrame {
  label: string
  values: number[]
}

export interface RaceChartStyle {
  bgColor: string
  bgColor2: string
  barColors: string[]
  titleColor: string
  subtitleColor: string
  labelColor: string
  valueColor: string
  timeColor: string
  titleFont: string
  subtitleFont: string
  labelFont: string
  titleSize: number
  subtitleSize: number
  labelSize: number
  valueSize: number
  timeSize: number
  maxBars: number
}

export const DEFAULT_RACE_COLORS = [
  '#4d7cff', '#ff6b6b', '#ffd93d', '#6bcb77', '#c77dff',
  '#ff9f43', '#48dbfb', '#ff6b81', '#a29bfe', '#fd79a8',
]

export const RACE_PRESETS: Record<string, { name: string; style: RaceChartStyle }> = {
  default: {
    name: 'Default',
    style: {
      bgColor: '#0a0a0f', bgColor2: '#0a0a0f',
      barColors: [...DEFAULT_RACE_COLORS],
      titleColor: '#ffffff', subtitleColor: '#666680',
      labelColor: '#e8e8f0', valueColor: '#888899',
      timeColor: 'rgba(255,255,255,0.05)',
      titleFont: 'Inter', subtitleFont: 'Inter', labelFont: 'Inter',
      titleSize: 52, subtitleSize: 24, labelSize: 22, valueSize: 20, timeSize: 160,
      maxBars: 8,
    }
  }
}

export const RACE_FONTS = [
  'Inter', 'DM Sans', 'Syne', 'Space Mono', 'Roboto Mono',
  'IBM Plex Mono', 'Bebas Neue', 'Oswald', 'Anton', 'Archivo Black', 'Playfair Display',
]

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

function easeInOut(t: number) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t }

function formatValue(v: number): string {
  if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B'
  if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M'
  if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K'
  return Math.round(v).toString()
}

export function drawRaceChart(
  canvas: HTMLCanvasElement,
  progress: number,
  props: {
    frames: RaceFrame[]
    series: string[]
    title: string
    subtitle: string
    valueLabel: string
    ratio: 'square' | 'portrait' | 'landscape'
    style: RaceChartStyle
  }
) {
  const { frames, series, title, subtitle, valueLabel, ratio, style: cs } = props
  if (!frames.length || !series.length) return

  const dims = ratio === 'portrait' ? { w: 1080, h: 1920 } :
    ratio === 'landscape' ? { w: 1920, h: 1080 } : { w: 1080, h: 1080 }

  if (canvas.width !== dims.w || canvas.height !== dims.h) {
    canvas.width = dims.w; canvas.height = dims.h
  }

  const ctx = canvas.getContext('2d')!
  const s = dims.w / 1080

  ctx.clearRect(0, 0, dims.w, dims.h)
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0

  const bgGrad = ctx.createLinearGradient(0, 0, 0, dims.h)
  bgGrad.addColorStop(0, cs.bgColor); bgGrad.addColorStop(1, cs.bgColor2)
  ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, dims.w, dims.h)

  const n = frames.length
  const totalT = Math.max(n - 1, 1)
  const rawT = progress * totalT
  const frameIdx = Math.min(Math.floor(rawT), n - 2 < 0 ? 0 : n - 2)
  const subT = n <= 1 ? 1 : easeInOut(Math.min(rawT - frameIdx, 1))

  const frameA = frames[frameIdx]
  const frameB = frames[Math.min(frameIdx + 1, n - 1)]

  // Interpolated values for each series
  const currentValues = series.map((_, i) => lerp(
    frameA.values[i] ?? 0,
    frameB.values[i] ?? 0,
    subT
  ))

  // Compute rank order at A and B separately
  const rankAtA: number[] = series.map((_, i) => i)
    .sort((a, b) => (frameA.values[b] ?? 0) - (frameA.values[a] ?? 0))
  const rankAtB: number[] = series.map((_, i) => i)
    .sort((a, b) => (frameB.values[b] ?? 0) - (frameB.values[a] ?? 0))

  // Map: seriesIndex → rank at A and B
  const rankOfA: Record<number, number> = {}
  const rankOfB: Record<number, number> = {}
  rankAtA.forEach((seriesIdx, rank) => { rankOfA[seriesIdx] = rank })
  rankAtB.forEach((seriesIdx, rank) => { rankOfB[seriesIdx] = rank })

  // Lerped rank for each series (smooth position transition)
  const lerpedRank = series.map((_, i) =>
    lerp(rankOfA[i] ?? 0, rankOfB[i] ?? 0, subT)
  )

  // Max value (lerped so scale doesn't jump)
  const maxA = Math.max(...(frameA.values.filter(v => isFinite(v))), 1)
  const maxB = Math.max(...(frameB.values.filter(v => isFinite(v))), 1)
  const maxValue = lerp(maxA, maxB, subT)

  const maxBars = Math.min(cs.maxBars, series.length)

  const padTop = 160 * s
  const padBottom = 110 * s
  const padLeft = 260 * s
  const padRight = 160 * s
  const chartH = dims.h - padTop - padBottom
  const chartW = dims.w - padLeft - padRight
  const barSlotH = chartH / maxBars
  const barH = Math.min(barSlotH * 0.62, 72 * s)
  const barOffsetY = (barSlotH - barH) / 2

  // Time label
  const timeLabel = subT >= 0.5 ? frameB.label : frameA.label
  ctx.font = `900 ${cs.timeSize * s}px '${cs.titleFont}', sans-serif`
  ctx.textAlign = 'right'
  ctx.fillStyle = cs.timeColor
  ctx.fillText(timeLabel, dims.w - 40 * s, dims.h - 30 * s)

  // Draw bars — sorted by lerped rank so rendering order is correct
  const drawOrder = series
    .map((_, i) => i)
    .sort((a, b) => lerpedRank[b] - lerpedRank[a]) // draw bottom to top

  drawOrder.forEach(i => {
    const rank = lerpedRank[i]
    // Skip if out of visible range
    if (rank >= maxBars + 0.5 || rank < -0.5) return

    const barY = padTop + rank * barSlotH + barOffsetY
    const barW = Math.max((currentValues[i] / maxValue) * chartW, 10 * s)
    const barX = padLeft
    const r = Math.min(8 * s, barH / 2)
    const color = cs.barColors[i % cs.barColors.length]

    // Fade out bars entering/leaving top N
    const alpha = Math.min(1, Math.min(
      maxBars - rank, // fade out at bottom
      rank + 1         // fade in at top
    ))
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha))

    // Bar shape
    ctx.beginPath()
    ctx.moveTo(barX, barY)
    ctx.lineTo(barX + barW - r, barY)
    ctx.arcTo(barX + barW, barY, barX + barW, barY + r, r)
    ctx.lineTo(barX + barW, barY + barH - r)
    ctx.arcTo(barX + barW, barY + barH, barX + barW - r, barY + barH, r)
    ctx.lineTo(barX, barY + barH)
    ctx.closePath()

    const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0)
    grad.addColorStop(0, color + 'aa')
    grad.addColorStop(1, color)
    ctx.fillStyle = grad
    ctx.fill()

    // Series label (left of bar)
    ctx.font = `600 ${cs.labelSize * s}px '${cs.labelFont}', sans-serif`
    ctx.textAlign = 'right'
    ctx.fillStyle = cs.labelColor
    ctx.fillText(series[i], barX - 14 * s, barY + barH / 2 + cs.labelSize * s * 0.36)

    // Value label (right of bar)
    ctx.font = `500 ${cs.valueSize * s}px '${cs.labelFont}', sans-serif`
    ctx.textAlign = 'left'
    ctx.fillStyle = cs.valueColor
    ctx.fillText(formatValue(currentValues[i]), barX + barW + 12 * s, barY + barH / 2 + cs.valueSize * s * 0.36)

    // Rank number inside bar
    if (barW > 55 * s) {
      const displayRank = Math.round(rank) + 1
      ctx.font = `700 ${cs.labelSize * 0.75 * s}px '${cs.labelFont}', sans-serif`
      ctx.textAlign = 'left'
      ctx.fillStyle = 'rgba(0,0,0,0.3)'
      ctx.fillText(`#${displayRank}`, barX + 12 * s, barY + barH / 2 + cs.labelSize * 0.75 * s * 0.36)
    }

    ctx.globalAlpha = 1
  })

  // Title & subtitle
  ctx.globalAlpha = 1
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0
  ctx.font = `700 ${cs.titleSize * s}px '${cs.titleFont}', sans-serif`
  ctx.textAlign = 'left'
  ctx.fillStyle = cs.titleColor
  ctx.fillText(title, padLeft, 88 * s)

  if (subtitle) {
    ctx.font = `${cs.subtitleSize * s}px '${cs.subtitleFont}', sans-serif`
    ctx.fillStyle = cs.subtitleColor
    ctx.fillText(subtitle, padLeft, 88 * s + cs.titleSize * s + 10 * s)
  }

  if (valueLabel) {
    ctx.font = `400 ${cs.labelSize * 0.8 * s}px '${cs.labelFont}', sans-serif`
    ctx.textAlign = 'left'
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.fillText(valueLabel, padLeft, dims.h - 20 * s)
  }
}
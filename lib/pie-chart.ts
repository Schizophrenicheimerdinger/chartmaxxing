export interface DataPoint {
  label: string
  value: number
}

export interface PieChartStyle {
  bgColor: string
  bgColor2: string
  titleColor: string
  subtitleColor: string
  valueColor: string
  labelColor: string
  titleFont: string
  subtitleFont: string
  valueFont: string
  labelFont: string
  titleSize: number
  subtitleSize: number
  valueSize: number
  labelSize: number
}

export const PIE_COLORS = ['#4d7cff', '#ff6b6b', '#ffd93d', '#6bcb77', '#c77dff', '#ff9f43', '#00d2d3', '#ff6b9d']

export const PIE_PRESETS: Record<string, { name: string; style: PieChartStyle }> = {
  default: {
    name: 'Default',
    style: {
      bgColor: '#0a0a0f', bgColor2: '#0a0a0f',
      titleColor: '#ffffff', subtitleColor: '#666680', valueColor: '#ffffff',
      labelColor: '#aaaacc',
      titleFont: 'Inter', subtitleFont: 'Inter', valueFont: 'Inter', labelFont: 'Inter',
      titleSize: 58, subtitleSize: 25, valueSize: 22, labelSize: 18,
    }
  },
}

export const PIE_FONTS = [
  'Inter', 'DM Sans', 'Syne', 'Space Mono', 'Roboto Mono',
  'IBM Plex Mono', 'Bebas Neue', 'Oswald', 'Anton',
  'Archivo Black', 'Playfair Display', 'Permanent Marker',
]

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

function clearShadow(ctx: CanvasRenderingContext2D) {
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0
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

export function drawPieChart(
  canvas: HTMLCanvasElement,
  progress: number,
  props: {
    data: DataPoint[]
    title: string
    subtitle: string
    showValues: boolean
    ratio: 'square' | 'portrait' | 'landscape'
    style: PieChartStyle
    colors?: string[]
  }
) {
  const { data, title, subtitle, showValues, ratio, style: cs, colors = PIE_COLORS } = props
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

  const total = data.reduce((sum, d) => sum + d.value, 0)
  if (total === 0) return

  const prog = easeInOut(Math.min(progress, 1))
  const n = data.length
  const totalProgress = prog * n
  const isAnimating = progress < 1

  // Pie center and radius
  const cx = dims.w / 2
  const titleH = 200 * s
  const cy = titleH + (dims.h - titleH) * 0.45
  const maxR = Math.min(dims.w, dims.h - titleH) * 0.32

  // Draw segments
  let startAngle = -Math.PI / 2
  data.forEach((d, i) => {
    const segProgress = Math.min(Math.max(totalProgress - i, 0), 1)
    if (segProgress <= 0) return

    const fullAngle = (d.value / total) * 2 * Math.PI
    const animAngle = fullAngle * segProgress
    const color = colors[i % colors.length]

    // Segment
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, maxR, startAngle, startAngle + animAngle)
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()

    // Thin gap
    ctx.strokeStyle = cs.bgColor
    ctx.lineWidth = 2 * s
    ctx.stroke()

    // Label + value (only when segment mostly drawn)
    if (segProgress > 0.7 && showValues) {
      const midAngle = startAngle + animAngle / 2
      const labelR = maxR * 0.65
      const lx = cx + Math.cos(midAngle) * labelR
      const ly = cy + Math.sin(midAngle) * labelR
      const pct = Math.round((d.value / total) * 100)

      ctx.fillStyle = '#ffffff'
      ctx.font = `700 ${cs.valueSize * s}px '${cs.valueFont}', sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${pct}%`, lx, ly)
      ctx.textBaseline = 'alphabetic'
    }

    if (segProgress >= 1) startAngle += fullAngle
    else startAngle += animAngle
  })

  // Legend
  if (!isAnimating) {
    const legendY = cy + maxR + 50 * s
    const itemW = 180 * s
    const totalW = Math.min(n, 4) * itemW
    let lx = cx - totalW / 2

    data.forEach((d, i) => {
      const color = colors[i % colors.length]
      const row = Math.floor(i / 4)
      const col = i % 4
      const x = cx - totalW / 2 + col * itemW
      const y = legendY + row * 36 * s

      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x + 8 * s, y, 7 * s, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = cs.labelColor
      ctx.font = `${cs.labelSize * s}px '${cs.labelFont}', sans-serif`
      ctx.textAlign = 'left'
      ctx.fillText(d.label, x + 22 * s, y + 5 * s)
    })
  } else {
    // Show current label big during animation
    const currentIdx = Math.min(Math.floor(totalProgress), n - 1)
    ctx.fillStyle = cs.titleColor
    ctx.font = `700 ${64 * s}px '${cs.labelFont}', sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(data[currentIdx].label, cx, cy + maxR + 80 * s)
  }

  // Title
  clearShadow(ctx)
  ctx.font = `700 ${cs.titleSize * s}px '${cs.titleFont}', sans-serif`
  ctx.textAlign = 'center'
  const titleLines = wrapText(ctx, title, dims.w - 80 * s)
  const titleLineH = (cs.titleSize + 8) * s
  const titleY = 80 * s
  ctx.fillStyle = cs.titleColor
  titleLines.forEach((line, i) => ctx.fillText(line, dims.w / 2, titleY + i * titleLineH))

  if (subtitle) {
    ctx.font = `${cs.subtitleSize * s}px '${cs.subtitleFont}', sans-serif`
    ctx.fillStyle = cs.subtitleColor
    ctx.fillText(subtitle, dims.w / 2, titleY + titleLines.length * titleLineH + 4 * s)
  }
}
'use client'

import { useEffect } from 'react'
import { drawChart, type DataPoint, type SeriesData, type ChartStyle } from '@/lib/chart'

interface Props {
  data?: DataPoint[]
  series?: SeriesData[]
  title: string
  subtitle: string
  yLabel: string
  style: ChartStyle
  showDots: boolean
  showValues: boolean
  showAreaFill: boolean
  canvasRef: React.RefObject<HTMLCanvasElement>
  ratio: 'square' | 'portrait' | 'landscape'
}

export default function ChartCanvas({ canvasRef, data, series, ...rest }: Props) {
  useEffect(() => {
    if (!canvasRef.current) return
    const resolvedSeries: SeriesData[] = series ?? [{
      data: data ?? [],
      lineColor: rest.style.lineColor,
      dotColor: rest.style.dotColor,
      tipColor: rest.style.tipColor,
      glowColor: rest.style.glowColor,
      shadowColor: rest.style.shadowColor,
    }]
    drawChart(canvasRef.current, 1, { ...rest, series: resolvedSeries })
  })

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
    />
  )
}

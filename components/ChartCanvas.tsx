'use client'

import { useEffect } from 'react'
import { drawChart, type DataPoint, type ChartStyle } from '@/lib/chart'

interface Props {
  data: DataPoint[]
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
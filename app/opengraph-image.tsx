import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Chartmaxxing — charts that break the internet'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0a0a0f',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Badge */}
        <div style={{
          display: 'flex',
          background: 'rgba(77,124,255,0.15)',
          border: '1px solid rgba(77,124,255,0.3)',
          borderRadius: 24,
          padding: '6px 20px',
          fontSize: 14,
          fontWeight: 700,
          color: '#4d7cff',
          letterSpacing: 2,
          textTransform: 'uppercase',
          marginBottom: 32,
        }}>
          Animated chart videos
        </div>

        {/* Title */}
        <div style={{
          fontSize: 96,
          fontWeight: 800,
          color: '#e8e8f0',
          letterSpacing: -4,
          marginBottom: 20,
          display: 'flex',
        }}>
          Chartmaxxing
        </div>

        {/* Subtitle */}
        <div style={{
          fontSize: 28,
          color: '#666680',
          marginBottom: 48,
          display: 'flex',
        }}>
          Turn your data into viral chart videos — in minutes
        </div>

        {/* CTA pill */}
        <div style={{
          display: 'flex',
          background: '#4d7cff',
          color: 'white',
          fontSize: 20,
          fontWeight: 700,
          padding: '14px 40px',
          borderRadius: 12,
        }}>
          chartmaxxing.com
        </div>
      </div>
    ),
    { ...size }
  )
}

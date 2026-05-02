import type { Metadata } from 'next'
import './globals.css'
import ErrorBoundary from '@/components/ErrorBoundary'

export const metadata: Metadata = {
  title: 'Chartmaxxing — charts that break the internet',
  description: 'Make animated chart videos that go viral on TikTok and Instagram.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.png?v=3" type="image/png" />
        <link rel="shortcut icon" href="/favicon.png?v=3" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Anton&family=Archivo+Black&family=Bebas+Neue&family=DM+Sans:wght@400;700&family=IBM+Plex+Mono:wght@400;700&family=Inter:wght@400;700&family=Oswald:wght@400;700&family=Permanent+Marker&family=Playfair+Display:wght@400;700&family=Roboto+Mono:wght@400;700&family=Space+Mono:wght@400;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      </head>
      <body><ErrorBoundary>{children}</ErrorBoundary></body>
    </html>
  )
}
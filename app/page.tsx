'use client'

import { useState } from 'react'
import Link from 'next/link'

const BORDER = 'rgba(255,255,255,0.06)'
const BLUE = '#4d7cff'
const BG = '#0a0a0f'
const SURFACE = '#111116'
const TEXT = '#e8e8f0'
const MUTED = '#666680'

export default function Home() {
  const [showHowTo, setShowHowTo] = useState(false)

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', padding: '0 32px', height: 56,
        background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${BORDER}`
      }}>
        <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, color: TEXT }}>
          Chartmaxxing
        </span>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={() => setShowHowTo(true)} style={{
            background: 'rgba(255,255,255,0.06)', border: `1px solid ${BORDER}`,
            borderRadius: 8, padding: '7px 16px', color: MUTED, fontSize: 13,
            cursor: 'pointer', fontWeight: 500
          }}>
            How to use
          </button>
          <Link href="/editor" style={{
            background: BLUE, color: 'white', fontWeight: 600, fontSize: 13,
            padding: '7px 18px', borderRadius: 8, textDecoration: 'none'
          }}>
            Sign in
          </Link>
        </div>
      </nav>

      {/* How To Popup */}
      {showHowTo && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={() => setShowHowTo(false)}>
          <div style={{
            background: '#16161e', border: `1px solid ${BORDER}`, borderRadius: 16,
            width: 420, maxHeight: '80vh', overflowY: 'auto', padding: 28,
            position: 'relative'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800 }}>How to use</span>
              <button onClick={() => setShowHowTo(false)} style={{
                background: 'none', border: 'none', color: MUTED, fontSize: 20, cursor: 'pointer', lineHeight: 1
              }}>✕</button>
            </div>
            {[
              {
                n: '1', title: 'Enter your data',
                desc: 'Type your labels and values directly into the data panel. Or use a simple AI prompt — just describe your data and the AI will format it ready to import automatically.'
              },
              {
                n: '2', title: 'Design your chart',
                desc: 'Pick colors, fonts, aspect ratio (9:16 for TikTok, 16:9 for YouTube, 1:1 for Instagram), and toggle options like area fill, glow, and dots.'
              },
              {
                n: '3', title: 'Preview your animation',
                desc: 'Hit Play to watch the chart animate. Adjust the speed slider to control how fast the line draws. Hit the reset button to replay from the start.'
              },
              {
                n: '4', title: 'Export as MP4',
                desc: 'Go Pro for $4.99/month to export a clean 1080p MP4 with no watermark. Download and post directly to TikTok, Instagram Reels, or YouTube Shorts.'
              },
            ].map(step => (
              <div key={step.n} style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', background: 'rgba(77,124,255,0.15)',
                  border: `1px solid rgba(77,124,255,0.3)`, color: BLUE, fontWeight: 700, fontSize: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>{step.n}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{step.title}</div>
                  <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hero */}
      <div style={{ paddingTop: 160, paddingBottom: 100, textAlign: 'center', padding: '160px 24px 100px' }}>
        <div style={{
          display: 'inline-block', background: 'rgba(77,124,255,0.1)', border: '1px solid rgba(77,124,255,0.25)',
          borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 600, color: BLUE,
          letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 28
        }}>
          Animated chart videos
        </div>
        <h1 style={{
          fontFamily: 'Syne, sans-serif', fontSize: 80, fontWeight: 800, color: TEXT,
          margin: '0 0 20px', lineHeight: 1, letterSpacing: -3
        }}>
          Chartmaxxing
        </h1>
        <p style={{ fontSize: 20, color: MUTED, margin: '0 0 48px', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
          Turn your data into viral chart videos for TikTok, Instagram, and YouTube — in minutes.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center' }}>
          <Link href="/editor" style={{
            background: BLUE, color: 'white', fontWeight: 700, fontSize: 16,
            padding: '14px 36px', borderRadius: 10, textDecoration: 'none'
          }}>
            Open the editor →
          </Link>
          <button onClick={() => setShowHowTo(true)} style={{
            background: 'transparent', border: `1px solid ${BORDER}`, color: MUTED,
            fontWeight: 600, fontSize: 15, padding: '14px 28px', borderRadius: 10, cursor: 'pointer'
          }}>
            How it works
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 80, padding: '0 24px 100px' }}>
        {[
          { val: '$4.99', sub: '/month' },
          { val: 'No watermark', sub: 'on exports' },
          { val: '1080p', sub: 'video quality' },
        ].map(item => (
          <div key={item.val} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: TEXT }}>{item.val}</div>
            <div style={{ fontSize: 13, color: MUTED, marginTop: 6 }}>{item.sub}</div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ maxWidth: 800, margin: '0 auto', height: 1, background: BORDER }} />

      {/* How it works steps */}
      <div style={{ padding: '100px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 36, fontWeight: 700, margin: '0 0 60px', color: TEXT }}>
          From data to viral video — in minutes
        </h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 0, maxWidth: 900, margin: '0 auto', position: 'relative' }}>
          {/* connecting line */}
          <div style={{
            position: 'absolute', top: 22, left: '16%', right: '16%', height: 1,
            background: `linear-gradient(to right, ${BLUE}, rgba(77,124,255,0.2))`
          }} />
          {[
            { n: '1', title: 'Paste your data', desc: 'Type values directly, or use an AI prompt to generate and format your data automatically.' },
            { n: '2', title: 'Make it look great', desc: 'Customize colors, fonts, aspect ratio, and animation style to match your brand.' },
            { n: '3', title: 'Export & go viral', desc: 'Download your MP4 in seconds and post it anywhere — no watermark.' },
          ].map(step => (
            <div key={step.n} style={{ flex: 1, padding: '0 24px', textAlign: 'center', position: 'relative' }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', background: BLUE,
                color: 'white', fontWeight: 700, fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', position: 'relative', zIndex: 1
              }}>{step.n}</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10, color: TEXT }}>{step.title}</div>
              <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.6, maxWidth: 220, margin: '0 auto' }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ maxWidth: 800, margin: '0 auto', height: 1, background: BORDER }} />

      {/* Chart types */}
      <div style={{ padding: '100px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 36, fontWeight: 700, margin: '0 0 12px', color: TEXT }}>
          Multiple chart types
        </h2>
        <p style={{ fontSize: 16, color: MUTED, margin: '0 0 56px' }}>
          More chart types coming soon.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 680, margin: '0 auto' }}>
          {[
            { name: 'Line chart', desc: 'Show trends over time. Perfect for growth stories.', available: true },
            { name: 'Bar chart', desc: 'Compare categories side by side.', available: false },
            { name: 'Pie chart', desc: 'Show proportions and percentages.', available: false },
            { name: 'More coming', desc: 'New chart types added regularly.', available: false },
          ].map(chart => (
            <div key={chart.name} style={{
              background: SURFACE,
              border: `1px solid ${chart.available ? BLUE : BORDER}`,
              borderRadius: 12, padding: '24px', textAlign: 'left',
              opacity: chart.available ? 1 : 0.45,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>{chart.name}</span>
                {chart.available && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, background: BLUE, color: 'white',
                    borderRadius: 4, padding: '2px 6px', letterSpacing: 0.5
                  }}>LIVE</span>
                )}
              </div>
              <p style={{ fontSize: 13, color: MUTED, margin: 0, lineHeight: 1.6 }}>{chart.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', padding: '60px 24px 120px' }}>
        <h2 style={{ fontSize: 40, fontWeight: 800, fontFamily: 'Syne, sans-serif', margin: '0 0 20px', color: TEXT }}>
          Ready to go viral?
        </h2>
        <p style={{ color: MUTED, fontSize: 16, margin: '0 0 40px' }}>Start for free. Export with Pro.</p>
        <Link href="/editor" style={{
          background: BLUE, color: 'white', fontWeight: 700, fontSize: 16,
          padding: '16px 44px', borderRadius: 10, textDecoration: 'none'
        }}>
          Open the editor →
        </Link>
      </div>

    </div>
  )
}
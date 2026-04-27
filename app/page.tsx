import Link from 'next/link'

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e8e8f0', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center' }}>

      {/* Hero */}
      <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 72, fontWeight: 800, color: '#e8e8f0', margin: 0, lineHeight: 1.05, letterSpacing: -2 }}>
        Chartmaxxing
      </h1>
      <p style={{ fontSize: 20, color: '#666680', marginTop: 16, marginBottom: 40 }}>
        Animated chart videos that go viral.
      </p>

      <Link href="/editor" style={{
        background: '#4d7cff', color: 'white', fontWeight: 700, fontSize: 16,
        padding: '14px 36px', borderRadius: 10, textDecoration: 'none',
        transition: 'opacity 0.15s'
      }}>
        Open the editor →
      </Link>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 60, marginTop: 64, marginBottom: 80 }}>
        {[
          { val: '$4.99', sub: '/month' },
          { val: 'No watermark', sub: 'on exports' },
          { val: '1080p', sub: 'video quality' },
        ].map(item => (
          <div key={item.val}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#4d7cff' }}>{item.val}</div>
            <div style={{ fontSize: 13, color: '#666680', marginTop: 4 }}>{item.sub}</div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ width: '100%', maxWidth: 640, height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 80 }} />

      {/* Chart types */}
      <div style={{ maxWidth: 680, width: '100%' }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 12px', color: '#e8e8f0' }}>
          Multiple chart types
        </h2>
        <p style={{ fontSize: 16, color: '#666680', marginBottom: 48 }}>
          Choose the format that fits your data — more chart types coming soon.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { name: 'Line chart', desc: 'Show trends over time. Perfect for growth stories.', available: true },
            { name: 'Bar chart', desc: 'Compare categories side by side.', available: false },
            { name: 'Pie chart', desc: 'Show proportions and percentages.', available: false },
            { name: 'More coming', desc: 'New chart types added regularly.', available: false },
          ].map(chart => (
            <div key={chart.name} style={{
              background: '#111116', border: `1px solid ${chart.available ? '#4d7cff' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 12, padding: '20px 24px', textAlign: 'left',
              opacity: chart.available ? 1 : 0.5,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: chart.available ? '#e8e8f0' : '#666680' }}>{chart.name}</span>
                {chart.available && <span style={{ fontSize: 10, fontWeight: 700, background: '#4d7cff', color: 'white', borderRadius: 4, padding: '2px 6px' }}>LIVE</span>}
              </div>
              <p style={{ fontSize: 13, color: '#555568', margin: 0, lineHeight: 1.5 }}>{chart.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </main>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const BLUE = '#4d7cff'
const BG = '#0a0a0f'
const SURFACE = '#111116'
const BORDER = 'rgba(255,255,255,0.06)'
const TEXT = '#e8e8f0'
const MUTED = '#555568'

interface Project {
  id: string
  title: string
  chart_type: string
  updated_at: string
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ email: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/check-pro').then(r => r.json()).then(d => {
      if (!d.user) { router.push('/login'); return }
      setUser(d.user)
    })
    fetch('/api/projects').then(r => r.json()).then(d => {
      setProjects(d.projects ?? [])
      setLoading(false)
    })
  }, [])

  const getEditorPath = (chartType: string) => {
  if (chartType === 'bar') return '/editor-bar'
  if (chartType === 'pie') return '/editor-pie'
  if (chartType === 'scatter') return '/editor-scatter'
  if (chartType === 'race') return '/editor-race'
  return '/editor'
}

const createProject = async (chartType: string) => {
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Untitled', chart_type: chartType })
  })
  const { project } = await res.json()
  router.push(`${getEditorPath(chartType)}?project=${project.id}`)
}

  const deleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this project?')) return
    await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  const formatDate = (d: string) => {
    const date = new Date(d)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  const chartTypes = [
  { key: 'line', label: 'Line chart', desc: 'Trends over time', icon: '📈', available: true },
  { key: 'bar', label: 'Bar chart', desc: 'Compare categories', icon: '📊', available: true },
  { key: 'pie', label: 'Pie chart', desc: 'Show proportions', icon: '🥧', available: true },
  { key: 'scatter', label: 'Scatter plot', desc: 'Correlation & distribution', icon: '✦', available: true },
  { key: 'race', label: 'Race bar', desc: 'Rankings over time', icon: '🏆', available: true },
  { key: 'more', label: 'More coming', desc: 'Stay tuned', icon: '✨', available: false },
]

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Navbar */}
      <nav style={{
        display: 'flex', alignItems: 'center', padding: '0 32px', height: 56,
        background: SURFACE, borderBottom: `1px solid ${BORDER}`, position: 'sticky', top: 0, zIndex: 100
      }}>
        <Link href="/" style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, color: TEXT, textDecoration: 'none' }}>
          Chartmaxxing
        </Link>
        <div style={{ flex: 1 }} />
        {user && <span style={{ fontSize: 13, color: MUTED }}>{user.email}</span>}
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 32px' }}>

        {/* Create new */}
        <div style={{ marginBottom: 64 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>Create new</h2>
          <p style={{ fontSize: 14, color: MUTED, margin: '0 0 24px' }}>Choose a chart type to get started</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {chartTypes.map(ct => (
              <button key={ct.key} onClick={() => ct.available && createProject(ct.key)}
                disabled={!ct.available}
                style={{
                  background: SURFACE, border: `1px solid ${ct.available ? BORDER : BORDER}`,
                  borderRadius: 12, padding: '28px 20px', textAlign: 'left', cursor: ct.available ? 'pointer' : 'default',
                  opacity: ct.available ? 1 : 0.4, transition: 'border-color 0.15s',
                  position: 'relative'
                }}
                onMouseOver={e => { if (ct.available) e.currentTarget.style.borderColor = BLUE }}
                onMouseOut={e => { e.currentTarget.style.borderColor = BORDER }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{ct.icon}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{ct.label}</span>
                  {ct.available && (
                    <span style={{ fontSize: 9, fontWeight: 700, background: BLUE, color: 'white', borderRadius: 4, padding: '2px 5px' }}>LIVE</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: MUTED }}>{ct.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Past projects */}
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>Recent projects</h2>
          <p style={{ fontSize: 14, color: MUTED, margin: '0 0 24px' }}>Pick up where you left off</p>

          {loading ? (
            <div style={{ color: MUTED, fontSize: 14 }}>Loading...</div>
          ) : projects.length === 0 ? (
            <div style={{
              border: `1px dashed ${BORDER}`, borderRadius: 12, padding: '48px',
              textAlign: 'center', color: MUTED, fontSize: 14
            }}>
              No projects yet — create one above
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {projects.map(project => (
                <div key={project.id}
                  onClick={() => router.push(`${getEditorPath(project.chart_type)}?project=${project.id}`)}
                  style={{
                    background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12,
                    overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s',
                    position: 'relative'
                  }}
                  onMouseOver={e => (e.currentTarget.style.borderColor = BLUE)}
                  onMouseOut={e => (e.currentTarget.style.borderColor = BORDER)}>

                  {/* Thumbnail placeholder */}
                  <div style={{
                    height: 120, background: '#0c0c14',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderBottom: `1px solid ${BORDER}`
                  }}>
                    <span style={{ fontSize: 32 }}>
                      {project.chart_type === 'line' ? '📈' : project.chart_type === 'bar' ? '📊' : project.chart_type === 'scatter' ? '✦' : project.chart_type === 'race' ? '🏆' : '🥧'}
                    </span>
                  </div>

                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {project.title}
                    </div>
                    <div style={{ fontSize: 11, color: MUTED }}>
                      {formatDate(project.updated_at)}
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={e => deleteProject(project.id, e)}
                    style={{
                      position: 'absolute', top: 8, right: 8, width: 24, height: 24,
                      background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 6,
                      color: '#666', fontSize: 12, cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', opacity: 0,
                      transition: 'opacity 0.15s'
                    }}
                    onMouseOver={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#e55' }}
                    onMouseOut={e => { e.currentTarget.style.opacity = '0' }}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
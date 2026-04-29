'use client'

import { useState } from 'react'

const BLUE = '#4d7cff'
const BORDER = 'rgba(255,255,255,0.06)'
const TEXT = '#e8e8f0'
const MUTED = '#555568'

const AI_PROMPTS: Record<string, string> = {
  line: `Output ONLY raw CSV data for a line chart. Two columns: label and numeric value. No headers, no explanation, no markdown. One row per line, comma separated. Example:
Mon,85
Tue,60
Wed,40

Now output data for: [DESCRIBE YOUR DATA HERE]`,
  bar: `Output ONLY raw CSV data for a bar chart. Two columns: label and numeric value. No headers, no explanation, no markdown. One row per line, comma separated. Example:
Apples,120
Bananas,85
Oranges,200

Now output data for: [DESCRIBE YOUR DATA HERE]`,
  pie: `Output ONLY raw CSV data for a pie chart. Two columns: label and numeric value. No headers, no explanation, no markdown. One row per line, comma separated. Example:
Marketing,35
Engineering,45
Sales,20

Now output data for: [DESCRIBE YOUR DATA HERE]`,
  scatter: `Output ONLY raw CSV data for a scatter plot. Three columns: label, x value, y value. No headers, no explanation, no markdown. One row per line, comma separated. Example:
Alice,2,4
Bob,5,9
Charlie,8,6

Now output data for: [DESCRIBE YOUR DATA HERE]`,
  race: `Output ONLY raw CSV data for a race bar chart. First row is headers: a time column and series names. Subsequent rows are time label and values. No explanation, no markdown. Example:
Year,YouTube,Netflix,TikTok
2018,1800,1200,500
2019,2000,1500,800
2020,2300,2000,1500

Now output data for: [DESCRIBE YOUR DATA HERE]`,
}

interface StandardRow { label: string; value: string }
interface ScatterRow { label: string; x: string; y: string }
interface RaceImportData { series: string[]; rows: { label: string; values: string[] }[] }

interface Props {
  chartType: 'line' | 'bar' | 'pie' | 'scatter' | 'race'
  onImport: (data: StandardRow[] | ScatterRow[] | RaceImportData) => void
  onClose: () => void
}

function parseCSVStandard(raw: string): StandardRow[] {
  return raw.split('\n').map(l => l.trim()).filter(l => l.length > 0).map(line => {
    const i = line.lastIndexOf(',')
    if (i === -1) return null
    return { label: line.slice(0, i).trim().replace(/^"|"$/g, ''), value: line.slice(i + 1).trim().replace(/^"|"$/g, '') }
  }).filter(Boolean) as StandardRow[]
}

function parseCSVScatter(raw: string): ScatterRow[] {
  return raw.split('\n').map(l => l.trim()).filter(l => l.length > 0).map(line => {
    const parts = line.split(',')
    if (parts.length < 2) return null
    if (parts.length === 2) return { label: '', x: parts[0].trim().replace(/^"|"$/g, ''), y: parts[1].trim().replace(/^"|"$/g, '') }
    return { label: parts[0].trim().replace(/^"|"$/g, ''), x: parts[1].trim().replace(/^"|"$/g, ''), y: parts[2].trim().replace(/^"|"$/g, '') }
  }).filter(Boolean) as ScatterRow[]
}

function parseCSVRace(raw: string): RaceImportData | null {
  const lines = raw.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  if (lines.length < 2) return null
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  const series = headers.slice(1)
  const rows = lines.slice(1).map(line => {
    const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''))
    return { label: parts[0], values: series.map((_, i) => parts[i + 1] ?? '0') }
  })
  return { series, rows }
}

export default function DataImportModal({ chartType, onImport, onClose }: Props) {
  const [tab, setTab] = useState<'ai' | 'csv'>('ai')
  const [csvText, setCsvText] = useState('')
  const [preview, setPreview] = useState<StandardRow[] | ScatterRow[] | RaceImportData | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const prompt = AI_PROMPTS[chartType] ?? AI_PROMPTS.line
  const isScatter = chartType === 'scatter'
  const isRace = chartType === 'race'

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const handleCSVPreview = () => {
    if (isRace) {
      const data = parseCSVRace(csvText)
      if (!data || data.rows.length === 0) { setError('Could not parse. First row should be headers: Time,Series1,Series2,...'); return }
      setError(''); setPreview(data)
    } else if (isScatter) {
      const rows = parseCSVScatter(csvText)
      if (rows.length === 0) { setError('Could not parse. Each line should be: label,x,y or just x,y'); return }
      setError(''); setPreview(rows)
    } else {
      const rows = parseCSVStandard(csvText)
      if (rows.length === 0) { setError('Could not parse. Each line should be: label,value'); return }
      setError(''); setPreview(rows)
    }
  }

  const handleApply = () => {
    if (!preview) return
    onImport(preview as any); onClose()
  }

  const textareaStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`,
    borderRadius: 8, padding: '10px 12px', color: TEXT, fontSize: 13,
    outline: 'none', resize: 'vertical', minHeight: 120, boxSizing: 'border-box',
    fontFamily: 'monospace', lineHeight: 1.5
  }

  const racePreview = isRace && preview ? preview as RaceImportData : null
  const standardPreview = !isRace && preview ? preview as StandardRow[] | ScatterRow[] : null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#16161e', border: `1px solid ${BORDER}`, borderRadius: 16, width: 480, maxHeight: '85vh', overflowY: 'auto', padding: 28 }} onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 800, color: TEXT }}>Import data</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}`, marginBottom: 20 }}>
          {([['ai', '✨ AI Prompt'], ['csv', '📄 Paste CSV']] as const).map(([key, label]) => (
            <button key={key} onClick={() => { setTab(key); setPreview(null); setError('') }} style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', color: tab === key ? TEXT : MUTED, borderBottom: tab === key ? `2px solid ${BLUE}` : '2px solid transparent', marginBottom: -1 }}>{label}</button>
          ))}
        </div>

        {tab === 'ai' && (
          <div>
            <p style={{ fontSize: 13, color: MUTED, margin: '0 0 14px', lineHeight: 1.6 }}>
              Copy this prompt, paste it into ChatGPT or Claude, replace the last line with your data description, then paste the output into the CSV tab.
            </p>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '12px 14px', fontSize: 12, fontFamily: 'monospace', color: '#aaa', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 12 }}>
              {prompt}
            </div>
            <button onClick={handleCopy} style={{ width: '100%', padding: '11px', borderRadius: 8, border: `1px solid ${BLUE}`, background: copied ? 'rgba(77,124,255,0.2)' : 'transparent', color: BLUE, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              {copied ? '✓ Copied!' : 'Copy prompt'}
            </button>
            <p style={{ fontSize: 12, color: MUTED, marginTop: 14, textAlign: 'center' }}>
              Then paste the AI output into the <strong style={{ color: TEXT }}>Paste CSV</strong> tab →
            </p>
          </div>
        )}

        {tab === 'csv' && (
          <div>
            <p style={{ fontSize: 13, color: MUTED, margin: '0 0 12px', lineHeight: 1.6 }}>
              {isRace ? 'First row = headers (Time, Series1, Series2...). Subsequent rows = time label and values.'
                : isScatter ? 'Each line: label,x,y or just x,y'
                : 'Each line: label,value'}
            </p>
            <textarea value={csvText} onChange={e => { setCsvText(e.target.value); setPreview(null); setError('') }}
              placeholder={isRace ? 'Year,YouTube,Netflix\n2018,1800,1200\n2019,2000,1500' : isScatter ? 'Alice,2,4\nBob,5,9' : 'Mon,85\nTue,60'}
              style={textareaStyle} />
            {error && <div style={{ color: '#ff6b6b', fontSize: 13, marginTop: 8 }}>{error}</div>}
            <button onClick={handleCSVPreview} disabled={!csvText.trim()} style={{ width: '100%', padding: '11px', borderRadius: 8, border: 'none', background: BLUE, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 10, opacity: !csvText.trim() ? 0.5 : 1 }}>
              Preview
            </button>
          </div>
        )}

        {racePreview && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: MUTED, marginBottom: 10 }}>
              Preview — {racePreview.rows.length} frames · {racePreview.series.length} series
            </div>
            <div style={{ fontSize: 12, color: BLUE, marginBottom: 8 }}>Series: {racePreview.series.join(', ')}</div>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: `1px solid ${BORDER}`, overflow: 'hidden', maxHeight: 180, overflowY: 'auto' }}>
              {racePreview.rows.slice(0, 6).map((row, i) => (
                <div key={i} style={{ display: 'flex', padding: '6px 12px', borderBottom: i < racePreview.rows.length - 1 ? `1px solid ${BORDER}` : 'none', gap: 8 }}>
                  <span style={{ fontSize: 12, color: TEXT, width: 50, flexShrink: 0 }}>{row.label}</span>
                  {row.values.map((v, j) => (
                    <span key={j} style={{ fontSize: 12, color: MUTED }}>{racePreview.series[j]}: {v}</span>
                  ))}
                </div>
              ))}
            </div>
            <button onClick={handleApply} style={{ width: '100%', padding: '12px', borderRadius: 8, border: 'none', background: '#22c55e', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 12 }}>
              ✓ Apply to chart
            </button>
          </div>
        )}

        {standardPreview && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: MUTED, marginBottom: 10 }}>
              Preview — {standardPreview.length} rows
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: `1px solid ${BORDER}`, overflow: 'hidden', maxHeight: 200, overflowY: 'auto' }}>
              {isScatter
                ? (standardPreview as ScatterRow[]).map((row, i) => (
                  <div key={i} style={{ display: 'flex', padding: '7px 12px', borderBottom: i < standardPreview.length - 1 ? `1px solid ${BORDER}` : 'none', gap: 8 }}>
                    <span style={{ flex: 1, fontSize: 13, color: TEXT }}>{row.label || '—'}</span>
                    <span style={{ fontSize: 13, color: MUTED }}>x: {row.x}</span>
                    <span style={{ fontSize: 13, color: MUTED }}>y: {row.y}</span>
                  </div>
                ))
                : (standardPreview as StandardRow[]).map((row, i) => (
                  <div key={i} style={{ display: 'flex', padding: '7px 12px', borderBottom: i < standardPreview.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                    <span style={{ flex: 1, fontSize: 13, color: TEXT }}>{row.label}</span>
                    <span style={{ fontSize: 13, color: MUTED }}>{row.value}</span>
                  </div>
                ))
              }
            </div>
            <button onClick={handleApply} style={{ width: '100%', padding: '12px', borderRadius: 8, border: 'none', background: '#22c55e', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 12 }}>
              ✓ Apply to chart
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
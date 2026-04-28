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
}

interface StandardRow { label: string; value: string }
interface ScatterRow { label: string; x: string; y: string }

interface Props {
  chartType: 'line' | 'bar' | 'pie' | 'scatter'
  onImport: (rows: StandardRow[] | ScatterRow[]) => void
  onClose: () => void
}

function parseCSVStandard(raw: string): StandardRow[] {
  return raw
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      const commaIdx = line.lastIndexOf(',')
      if (commaIdx === -1) return null
      const label = line.slice(0, commaIdx).trim().replace(/^"|"$/g, '')
      const value = line.slice(commaIdx + 1).trim().replace(/^"|"$/g, '')
      return { label, value }
    })
    .filter(Boolean) as StandardRow[]
}

function parseCSVScatter(raw: string): ScatterRow[] {
  return raw
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      const parts = line.split(',')
      if (parts.length < 2) return null
      if (parts.length === 2) {
        // Just x,y — generate label
        return { label: '', x: parts[0].trim().replace(/^"|"$/g, ''), y: parts[1].trim().replace(/^"|"$/g, '') }
      }
      // label,x,y
      return { label: parts[0].trim().replace(/^"|"$/g, ''), x: parts[1].trim().replace(/^"|"$/g, ''), y: parts[2].trim().replace(/^"|"$/g, '') }
    })
    .filter(Boolean) as ScatterRow[]
}

export default function DataImportModal({ chartType, onImport, onClose }: Props) {
  const [tab, setTab] = useState<'ai' | 'csv'>('ai')
  const [csvText, setCsvText] = useState('')
  const [preview, setPreview] = useState<StandardRow[] | ScatterRow[] | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const prompt = AI_PROMPTS[chartType] ?? AI_PROMPTS.line
  const isScatter = chartType === 'scatter'

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCSVPreview = () => {
    const rows = isScatter ? parseCSVScatter(csvText) : parseCSVStandard(csvText)
    if (rows.length === 0) {
      setError(isScatter
        ? 'Could not parse. Each line should be: label,x,y or just x,y'
        : 'Could not parse. Each line should be: label,value')
      return
    }
    setError('')
    setPreview(rows)
  }

  const handleApply = () => {
    if (!preview) return
    onImport(preview as any)
    onClose()
  }

  const textareaStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`,
    borderRadius: 8, padding: '10px 12px', color: TEXT, fontSize: 13,
    outline: 'none', resize: 'vertical', minHeight: 120, boxSizing: 'border-box',
    fontFamily: 'monospace', lineHeight: 1.5
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }} onClick={onClose}>
      <div style={{
        background: '#16161e', border: `1px solid ${BORDER}`, borderRadius: 16,
        width: 480, maxHeight: '85vh', overflowY: 'auto', padding: 28
      }} onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 800, color: TEXT }}>Import data</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}`, marginBottom: 20 }}>
          {([['ai', '✨ AI Prompt'], ['csv', '📄 Paste CSV']] as const).map(([key, label]) => (
            <button key={key} onClick={() => { setTab(key); setPreview(null); setError('') }} style={{
              padding: '8px 16px', fontSize: 13, fontWeight: 600, background: 'none', border: 'none',
              cursor: 'pointer', color: tab === key ? TEXT : MUTED,
              borderBottom: tab === key ? `2px solid ${BLUE}` : '2px solid transparent',
              marginBottom: -1
            }}>{label}</button>
          ))}
        </div>

        {tab === 'ai' && (
          <div>
            <p style={{ fontSize: 13, color: MUTED, margin: '0 0 14px', lineHeight: 1.6 }}>
              Copy this prompt, paste it into ChatGPT or Claude, replace the last line with your data description, then paste the output into the CSV tab.
            </p>
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`,
              borderRadius: 8, padding: '12px 14px', fontSize: 12,
              fontFamily: 'monospace', color: '#aaa', lineHeight: 1.7,
              whiteSpace: 'pre-wrap', marginBottom: 12
            }}>
              {prompt}
            </div>
            <button onClick={handleCopy} style={{
              width: '100%', padding: '11px', borderRadius: 8, border: `1px solid ${BLUE}`,
              background: copied ? 'rgba(77,124,255,0.2)' : 'transparent',
              color: BLUE, fontSize: 14, fontWeight: 700, cursor: 'pointer'
            }}>
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
              {isScatter
                ? 'Paste CSV with three columns: label, x, y — or just two columns: x, y.'
                : 'Paste CSV with two columns: label and value, comma separated.'}
            </p>
            <textarea
              value={csvText}
              onChange={e => { setCsvText(e.target.value); setPreview(null); setError('') }}
              placeholder={isScatter ? 'Alice,2,4\nBob,5,9\nCharlie,8,6' : 'Mon,85\nTue,60\nWed,40'}
              style={textareaStyle}
            />
            {error && <div style={{ color: '#ff6b6b', fontSize: 13, marginTop: 8 }}>{error}</div>}
            <button onClick={handleCSVPreview} disabled={!csvText.trim()} style={{
              width: '100%', padding: '11px', borderRadius: 8, border: 'none',
              background: BLUE, color: 'white', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', marginTop: 10, opacity: !csvText.trim() ? 0.5 : 1
            }}>
              Preview
            </button>
          </div>
        )}

        {error && tab === 'ai' && (
          <div style={{ color: '#ff6b6b', fontSize: 13, marginTop: 12 }}>{error}</div>
        )}

        {preview && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: MUTED, marginBottom: 10 }}>
              Preview — {preview.length} rows
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: `1px solid ${BORDER}`, overflow: 'hidden', maxHeight: 200, overflowY: 'auto' }}>
              {isScatter
                ? (preview as ScatterRow[]).map((row, i) => (
                  <div key={i} style={{ display: 'flex', padding: '7px 12px', borderBottom: i < preview.length - 1 ? `1px solid ${BORDER}` : 'none', gap: 8 }}>
                    <span style={{ flex: 1, fontSize: 13, color: TEXT }}>{row.label || '—'}</span>
                    <span style={{ fontSize: 13, color: MUTED }}>x: {row.x}</span>
                    <span style={{ fontSize: 13, color: MUTED }}>y: {row.y}</span>
                  </div>
                ))
                : (preview as StandardRow[]).map((row, i) => (
                  <div key={i} style={{ display: 'flex', padding: '7px 12px', borderBottom: i < preview.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                    <span style={{ flex: 1, fontSize: 13, color: TEXT }}>{row.label}</span>
                    <span style={{ fontSize: 13, color: MUTED }}>{row.value}</span>
                  </div>
                ))
              }
            </div>
            <button onClick={handleApply} style={{
              width: '100%', padding: '12px', borderRadius: 8, border: 'none',
              background: '#22c55e', color: 'white', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', marginTop: 12
            }}>
              ✓ Apply to chart
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
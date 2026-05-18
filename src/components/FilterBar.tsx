'use client'

import { useState, useRef, useEffect } from 'react'
import { ACCENT, ACCENT3, FY_LIST, MONTHS } from '@/lib/constants'
import type { UploadStatus } from '@/lib/chartTypes'

interface FilterBarProps {
  fy: string
  setFy: (fy: string) => void
  selectedMonths: number[]
  setSelectedMonths: (m: number[]) => void
  isMobile: boolean
  uploadStatus: UploadStatus
  allowAll?: boolean
}

export default function FilterBar({ fy, setFy, selectedMonths, setSelectedMonths, isMobile, uploadStatus, allowAll = false }: FilterBarProps) {
  const [fyOpen, setFyOpen] = useState(false)
  const fyRef   = useRef<HTMLDivElement>(null)
  const pillRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (fyRef.current && !fyRef.current.contains(e.target as Node)) setFyOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const toggle = (idx: number) => {
    if (allowAll) {
      // Upload tab: single-select only
      setSelectedMonths(selectedMonths.includes(idx) ? [] : [idx])
    } else {
      setSelectedMonths(selectedMonths.includes(idx)
        ? selectedMonths.filter(x => x !== idx)
        : [...selectedMonths, idx].sort((a, b) => a - b))
    }
  }

  const hasData = (idx: number) => uploadStatus.pl.includes(idx) && uploadStatus.bs.includes(idx)
  const hasPL   = (idx: number) => uploadStatus.pl.includes(idx)
  const hasBS   = (idx: number) => uploadStatus.bs.includes(idx)

  return (
    <div style={{ background: '#0a0d15', borderBottom: '1px solid #1a1d2a', padding: isMobile ? '10px 0' : '0 36px', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 8 : 0, padding: isMobile ? 0 : '10px 0', minWidth: 0, width: '100%' }}>

        {/* FY Selector */}
        <div ref={fyRef} style={{ position: 'relative', flexShrink: 0, zIndex: 200, paddingLeft: isMobile ? 14 : 0 }}>
          <button
            onClick={() => setFyOpen(!fyOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#141720', border: '1px solid #2a2d3a', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', color: '#e2e8f0', fontSize: 12, fontFamily: "'DM Mono',monospace", whiteSpace: 'nowrap' }}
          >
            <span style={{ color: ACCENT, fontSize: 10 }}>FY</span>
            {fy}
            <span style={{ color: '#4b5563', fontSize: 9, marginLeft: 2 }}>▼</span>
          </button>
          {fyOpen && (
            <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, background: '#141720', border: '1px solid #2a2d3a', borderRadius: 8, zIndex: 200, minWidth: 130, boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
              {FY_LIST.map(f => (
                <div key={f} onClick={() => { setFy(f); setSelectedMonths([]); setFyOpen(false) }}
                  className="nav-item"
                  style={{ padding: '10px 16px', fontSize: 12, fontFamily: "'DM Mono',monospace", cursor: 'pointer', color: f === fy ? ACCENT : '#9ca3af', background: f === fy ? 'rgba(0,229,160,0.06)' : 'transparent', borderBottom: '1px solid #1a1d2a' }}
                >
                  {f}{f === fy && <span style={{ float: 'right', color: ACCENT }}>✓</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {!isMobile && <div style={{ width: 1, height: 28, background: '#1a1d2a', margin: '0 16px' }} />}

        {/* Month Pills */}
        <div style={{ flex: 1, minWidth: 0, position: 'relative', overflow: isMobile ? 'visible' : 'hidden', width: isMobile ? '100%' : undefined }}>
          <div ref={pillRef} className="pill-strip"
            style={{ display: 'flex', gap: 6, overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch', touchAction: 'pan-x', width: '100%', paddingBottom: isMobile ? 6 : 0, paddingLeft: isMobile ? 14 : 0, paddingRight: isMobile ? 14 : 0, scrollbarWidth: 'none', alignItems: 'center', height: isMobile ? 40 : 38 }}
          >
            <button
              onClick={() => setSelectedMonths([])}
              style={{ flexShrink: 0, background: selectedMonths.length === 0 ? ACCENT : 'transparent', color: selectedMonths.length === 0 ? '#000' : '#6b7280', border: `1px solid ${selectedMonths.length === 0 ? ACCENT : '#2a2d3a'}`, borderRadius: 6, padding: '0 12px', height: 28, fontSize: 11, fontFamily: "'DM Mono',monospace", cursor: 'pointer', fontWeight: selectedMonths.length === 0 ? 600 : 400, transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease', whiteSpace: 'nowrap' }}
            >All</button>

            {MONTHS.map(m => {
              const isActive  = selectedMonths.includes(m.idx)
              const full      = hasData(m.idx)
              const partial   = !full && (hasPL(m.idx) || hasBS(m.idx))
              const missing   = !full && !partial
              const clickable = allowAll || !missing
              const dotColor  = full ? ACCENT : partial ? ACCENT3 : 'transparent'
              return (
                <button
                  key={m.idx}
                  onClick={() => clickable && toggle(m.idx)}
                  title={missing && !allowAll ? `${m.full} — no data uploaded` : partial ? `${m.full} — partial (${hasPL(m.idx) ? 'P&L' : ''}${hasPL(m.idx) && hasBS(m.idx) ? '+' : ''}${hasBS(m.idx) ? 'B/S' : ''} only)` : m.full}
                  style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, background: isActive ? ACCENT : missing ? 'transparent' : 'rgba(0,229,160,0.05)', color: isActive ? '#000' : missing ? (allowAll ? '#6b7280' : '#2a2d3a') : '#9ca3af', border: `1px solid ${isActive ? ACCENT : missing ? (allowAll ? '#2a2d3a' : '#1e2130') : partial ? ACCENT3 : '#2a2d3a'}`, borderStyle: missing && !allowAll ? 'dashed' : 'solid', borderRadius: 6, padding: '0 10px', height: 28, fontSize: 11, fontFamily: "'DM Mono',monospace", cursor: clickable ? 'pointer' : 'not-allowed', fontWeight: isActive ? 600 : 400, transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease', opacity: missing && !allowAll ? 0.35 : 1, whiteSpace: 'nowrap' }}
                >
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: isActive ? 'rgba(0,0,0,0.3)' : dotColor, flexShrink: 0, transition: 'background 0.15s ease' }} />
                  {m.short}
                </button>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: 12, flexShrink: 0, marginLeft: 16 }}>
            {[{ color: ACCENT, label: 'Data ready' }, { color: ACCENT3, label: 'Partial' }, { color: '#2a2d3a', label: 'Missing' }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#4b5563', fontFamily: "'DM Mono',monospace" }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: l.color, display: 'inline-block' }} />
                {l.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

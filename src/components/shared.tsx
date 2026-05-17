'use client'

import { type ReactElement } from 'react'
import { ResponsiveContainer } from 'recharts'
import { ACCENT, MONTHS, fmt } from '@/lib/constants'

interface TooltipPayloadItem { name: string; color: string; value: number }
interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}

export function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0f1117', border: '1px solid #2a2d3a', borderRadius: 8, padding: '10px 14px', fontSize: 11, fontFamily: "'DM Mono',monospace" }}>
      <p style={{ color: '#6b7280', marginBottom: 6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, margin: '2px 0' }}>{p.name}: {fmt(Math.abs(p.value))}</p>
      ))}
    </div>
  )
}

export function KpiCard({ label, value, sub, color, tag }: { label: string; value: string; sub: string; color: string; tag?: string }) {
  return (
    <div className="card" style={{ background: '#0f1117', border: '1px solid #1a1d2a', borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontSize: 10, color: '#4b5563', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
        {tag && <span style={{ fontSize: 9, background: 'rgba(0,229,160,0.08)', color: ACCENT, borderRadius: 4, padding: '2px 6px', fontFamily: "'DM Mono',monospace" }}>{tag}</span>}
      </div>
      <div style={{ fontSize: 21, fontWeight: 600, color, marginTop: 7, fontFamily: "'Syne',sans-serif" }}>{value}</div>
      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{sub}</div>
    </div>
  )
}

export function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, letterSpacing: -0.5 }}>{title}</h1>
      <p style={{ color: '#6b7280', fontSize: 12, marginTop: 3 }}>{sub}</p>
    </div>
  )
}

export function ChartCard({ title, height, children, hint }: { title: string; height?: number; children: ReactElement; hint?: string }) {
  return (
    <div className="card" style={{ background: '#0f1117', border: '1px solid #1a1d2a', borderRadius: 12, padding: '18px 14px', marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 4 }}>
        <div style={{ fontSize: 11, color: '#9ca3af', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: 1 }}>{title}</div>
        {hint && <div style={{ fontSize: 10, color: '#374151', fontFamily: "'DM Mono',monospace" }}>{hint}</div>}
      </div>
      <ResponsiveContainer width="100%" height={height ?? 210}>{children}</ResponsiveContainer>
    </div>
  )
}

export function ToggleTableBtn({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} style={{ width: '100%', background: 'transparent', border: '1px solid #2a2d3a', borderRadius: 8, color: '#6b7280', padding: '10px', fontSize: 11, fontFamily: "'DM Mono',monospace", cursor: 'pointer', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
      {show ? '▲ Hide Table' : '▼ Show Monthly Table'}
    </button>
  )
}

export function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 14px' }}>
      <div style={{ flex: 1, height: 1, background: '#1a1d2a' }} />
      <span style={{ fontSize: 10, color: '#374151', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: '#1a1d2a' }} />
    </div>
  )
}

export function NoData({ month }: { month: string }) {
  return (
    <div style={{ background: '#0f1117', border: '1px dashed #2a2d3a', borderRadius: 12, padding: '48px 24px', textAlign: 'center', marginBottom: 14 }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>◎</div>
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 700, color: '#374151', marginBottom: 6 }}>No data for {month}</div>
      <div style={{ fontSize: 12, color: '#374151' }}>Upload the P&L and Balance Sheet JSON for this month to see data here.</div>
    </div>
  )
}

export function ContextBanner({ fy, selectedMonth }: { fy: string; selectedMonth: number | null }) {
  if (selectedMonth === null) return null
  const m = MONTHS[selectedMonth]
  if (!m) return null
  return (
    <div style={{ background: 'rgba(0,229,160,0.04)', border: '1px solid rgba(0,229,160,0.12)', borderRadius: 10, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: ACCENT, fontSize: 14 }}>◎</span>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>
          Showing data for <span style={{ color: ACCENT, fontFamily: "'DM Mono',monospace", fontWeight: 600 }}>{m.full} · {fy}</span>
        </span>
      </div>
      <div style={{ fontSize: 11, color: '#4b5563', fontFamily: "'DM Mono',monospace" }}>
        P&L = monthly slice &nbsp;·&nbsp; B/S = cumulative to {m.short} end
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { ACCENT, ACCENT2, ACCENT3, RED, PURPLE, MONTHS, fmt } from '@/lib/constants'
import { SectionHeader, ContextBanner } from '@/components/shared'
import type { LedgerLineItem, UploadStatus } from '@/lib/chartTypes'

interface LedgerPageProps {
  plItems: LedgerLineItem[]
  bsItems: LedgerLineItem[]
  selectedMonth: number | null
  fy: string
  uploadStatus: UploadStatus
}

const PL_SECTIONS: { key: string; label: string; color: string }[] = [
  { key: 'trading_sales',     label: 'Trading Sales',      color: ACCENT  },
  { key: 'trading_costs',     label: 'Cost of Goods Sold', color: RED     },
  { key: 'direct_expenses',   label: 'Direct Expenses',    color: ACCENT3 },
  { key: 'indirect_income',   label: 'Indirect Income',    color: ACCENT2 },
  { key: 'indirect_expenses', label: 'Indirect Expenses',  color: '#f97316' },
]

const BS_SECTIONS: { key: string; label: string; color: string }[] = [
  { key: 'fixed_assets',        label: 'Fixed Assets',            color: PURPLE  },
  { key: 'investments',         label: 'Investments',             color: ACCENT2 },
  { key: 'current_assets',      label: 'Current Assets',          color: ACCENT  },
  { key: 'capital',             label: 'Capital',                 color: ACCENT2 },
  { key: 'loans',               label: 'Loans',                   color: '#f97316' },
  { key: 'current_liabilities', label: 'Current Liabilities',     color: RED     },
]

function SectionTable({ items, color }: { items: LedgerLineItem[]; color: string }) {
  const total = items.reduce((s, i) => s + i.amount, 0)
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <tbody>
        {items.map((item, i) => (
          <tr key={i} style={{ borderBottom: '1px solid #0d1018' }}>
            <td style={{ padding: '7px 12px', color: '#9ca3af' }}>{item.ledger_name}</td>
            <td style={{ padding: '7px 12px', textAlign: 'right', color, fontFamily: "'DM Mono',monospace" }}>{fmt(item.amount)}</td>
          </tr>
        ))}
        <tr style={{ borderTop: '1px solid #2a2d3a' }}>
          <td style={{ padding: '8px 12px', color: '#e2e8f0', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total</td>
          <td style={{ padding: '8px 12px', textAlign: 'right', color, fontFamily: "'DM Mono',monospace", fontWeight: 600 }}>{fmt(total)}</td>
        </tr>
      </tbody>
    </table>
  )
}

export default function LedgerPage({ plItems, bsItems, selectedMonth, fy, uploadStatus }: LedgerPageProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})
  const [tab, setTab] = useState<'pl' | 'bs'>('pl')

  const toggle = (key: string) => setOpenSections(p => ({ ...p, [key]: !p[key] }))

  const filterItems = (items: LedgerLineItem[]) =>
    selectedMonth !== null ? items.filter(i => i.month_index === selectedMonth) : items

  const filteredPL = filterItems(plItems)
  const filteredBS = filterItems(bsItems)

  const subLabel = selectedMonth !== null ? `${MONTHS[selectedMonth]?.full ?? ''} · ${fy}` : `Full Year · ${fy}`

  const hasData = tab === 'pl'
    ? (selectedMonth !== null ? uploadStatus.pl.includes(selectedMonth) : uploadStatus.pl.length > 0)
    : (selectedMonth !== null ? uploadStatus.bs.includes(selectedMonth) : uploadStatus.bs.length > 0)

  const sections = tab === 'pl' ? PL_SECTIONS : BS_SECTIONS
  const items    = tab === 'pl' ? filteredPL  : filteredBS

  return (
    <div className="fade-in">
      <SectionHeader title="Ledger" sub={subLabel} />
      <ContextBanner fy={fy} selectedMonth={selectedMonth} />

      {/* P&L / B/S toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['pl', 'bs'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{ padding: '6px 18px', borderRadius: 6, border: `1px solid ${tab === t ? ACCENT : '#2a2d3a'}`, background: tab === t ? 'rgba(0,229,160,0.08)' : 'transparent', color: tab === t ? ACCENT : '#6b7280', fontSize: 11, fontFamily: "'DM Mono',monospace", cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 1 }}
          >
            {t === 'pl' ? 'P&L' : 'Balance Sheet'}
          </button>
        ))}
      </div>

      {!hasData ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#4b5563', fontSize: 13 }}>
          No data uploaded for this period
        </div>
      ) : sections.map(({ key, label, color }) => {
        const sectionItems = items.filter(i => i.section === key)
        if (sectionItems.length === 0) return null
        const isOpen = openSections[key] ?? false
        const total  = sectionItems.reduce((s, i) => s + i.amount, 0)
        return (
          <div key={key} style={{ marginBottom: 10, border: '1px solid #1a1d2a', borderRadius: 10, overflow: 'hidden' }}>
            <button
              onClick={() => toggle(key)}
              style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#0f1117', border: 'none', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: 10, color: '#4b5563', fontFamily: "'DM Mono',monospace" }}>{sectionItems.length} entries</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, color, fontFamily: "'DM Mono',monospace", fontWeight: 600 }}>{fmt(total)}</span>
                <span style={{ fontSize: 14, color: '#4b5563', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
              </div>
            </button>
            {isOpen && (
              <div style={{ background: '#080b12', borderTop: '1px solid #1a1d2a' }}>
                <SectionTable items={sectionItems} color={color} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

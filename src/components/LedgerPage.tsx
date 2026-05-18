'use client'

import { useState } from 'react'
import { ACCENT, ACCENT2, ACCENT3, RED, PURPLE, MONTHS, fmt } from '@/lib/constants'
import { SectionHeader, ContextBanner } from '@/components/shared'
import type { LedgerLineItem, UploadStatus } from '@/lib/chartTypes'

interface LedgerPageProps {
  plItems: LedgerLineItem[]
  bsItems: LedgerLineItem[]
  selectedMonths: number[]
  fy: string
  uploadStatus: UploadStatus
}

const COGS_NAMES = ['opening stock', 'add: purchase accounts', 'less: closing stock']

interface Section {
  id: string
  label: string
  color: string
  items: LedgerLineItem[]
}

const BS_SECTION_DEFS = [
  { key: 'fixed_assets',        label: 'Fixed Assets',        color: PURPLE    },
  { key: 'investments',         label: 'Investments',         color: ACCENT2   },
  { key: 'current_assets',      label: 'Current Assets',      color: ACCENT    },
  { key: 'capital',             label: 'Capital',             color: ACCENT2   },
  { key: 'loans',               label: 'Loans',               color: '#f97316' },
  { key: 'current_liabilities', label: 'Current Liabilities', color: RED       },
]

function buildPLSections(items: LedgerLineItem[]): Section[] {
  const get = (section: string, filter?: (i: LedgerLineItem) => boolean) =>
    items.filter(i => i.section === section && (!filter || filter(i)))

  const cogsItems = get('trading_costs', i => COGS_NAMES.includes(i.ledger_name.toLowerCase()))
    .map(i => i.ledger_name.toLowerCase().includes('closing stock') ? { ...i, amount: -i.amount } : i)

  return [
    { id: 'trading_sales',     label: 'Trading Sales',      color: ACCENT,     items: get('trading_sales') },
    { id: 'cogs',              label: 'Cost of Goods Sold', color: RED,        items: cogsItems },
    { id: 'direct_expenses',   label: 'Direct Expenses',    color: ACCENT3,    items: [...get('trading_costs', i => !COGS_NAMES.includes(i.ledger_name.toLowerCase())), ...get('direct_expenses')] },
    { id: 'indirect_income',   label: 'Indirect Income',    color: ACCENT2,    items: get('indirect_income') },
    { id: 'indirect_expenses', label: 'Indirect Expenses',  color: '#f97316',  items: get('indirect_expenses') },
  ].filter(s => s.items.length > 0)
}

function buildBSSections(items: LedgerLineItem[]): Section[] {
  return BS_SECTION_DEFS
    .map(({ key, label, color }) => ({ id: key, label, color, items: items.filter(i => i.section === key) }))
    .filter(s => s.items.length > 0)
}

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

export default function LedgerPage({ plItems, bsItems, selectedMonths, fy, uploadStatus }: LedgerPageProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})
  const [tab, setTab] = useState<'pl' | 'bs'>('pl')

  const isFiltered = selectedMonths.length > 0
  const lastMonth  = isFiltered ? selectedMonths[selectedMonths.length - 1] : null
  const toggle = (id: string) => setOpenSections(p => ({ ...p, [id]: !p[id] }))

  const filterItems = (items: LedgerLineItem[]) =>
    isFiltered ? items.filter(i => selectedMonths.includes(i.month_index)) : items

  const subLabel = !isFiltered
    ? `Full Year · ${fy}`
    : selectedMonths.length === 1
      ? `${MONTHS[selectedMonths[0]]?.full ?? ''} · ${fy}`
      : `${MONTHS[selectedMonths[0]]?.short ?? ''} → ${MONTHS[lastMonth!]?.short ?? ''} · ${fy}`

  const hasData = tab === 'pl'
    ? (isFiltered ? selectedMonths.some(m => uploadStatus.pl.includes(m)) : uploadStatus.pl.length > 0)
    : (isFiltered ? selectedMonths.some(m => uploadStatus.bs.includes(m)) : uploadStatus.bs.length > 0)

  const sections = tab === 'pl'
    ? buildPLSections(filterItems(plItems))
    : buildBSSections(filterItems(bsItems))

  return (
    <div className="fade-in">
      <SectionHeader title="Ledger" sub={subLabel} />
      <ContextBanner fy={fy} selectedMonths={selectedMonths} />

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
      ) : sections.map(({ id, label, color, items }) => {
        const isOpen = openSections[id] ?? false
        const total  = items.reduce((s, i) => s + i.amount, 0)
        return (
          <div key={id} style={{ marginBottom: 10, border: '1px solid #1a1d2a', borderRadius: 10, overflow: 'hidden' }}>
            <button
              onClick={() => toggle(id)}
              style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#0f1117', border: 'none', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: 10, color: '#4b5563', fontFamily: "'DM Mono',monospace" }}>{items.length} entries</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, color, fontFamily: "'DM Mono',monospace", fontWeight: 600 }}>{fmt(total)}</span>
                <span style={{ fontSize: 14, color: '#4b5563', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
              </div>
            </button>
            {isOpen && (
              <div style={{ background: '#080b12', borderTop: '1px solid #1a1d2a' }}>
                <SectionTable items={items} color={color} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

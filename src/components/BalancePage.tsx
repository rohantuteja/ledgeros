'use client'

import { useState } from 'react'
import { AreaChart, Area, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { ACCENT, ACCENT2, ACCENT3, RED, PURPLE, MONTHS, fmt } from '@/lib/constants'
import { KpiCard, SectionHeader, ChartCard, ContextBanner, ToggleTableBtn, Divider, NoData, CustomTooltip } from '@/components/shared'
import type { BSChartRow, UploadStatus } from '@/lib/chartTypes'

interface BalancePageProps {
  bsData: BSChartRow[]
  selectedMonth: number | null
  fy: string
  uploadStatus: UploadStatus
}

export default function BalancePage({ bsData, selectedMonth, fy, uploadStatus }: BalancePageProps) {
  const [show, setShow] = useState(false)

  if (selectedMonth !== null && !uploadStatus.bs.includes(selectedMonth)) {
    return (
      <div className="fade-in">
        <SectionHeader title="Balance Sheet" sub={`${MONTHS[selectedMonth]?.full ?? ''} · ${fy}`} />
        <NoData month={`${MONTHS[selectedMonth]?.full ?? ''} ${fy} Balance Sheet`} />
      </div>
    )
  }

  const snap     = selectedMonth !== null ? bsData[selectedMonth] : bsData[bsData.length - 1]
  const subLabel = selectedMonth !== null ? `As of ${MONTHS[selectedMonth]?.full ?? ''} end · ${fy}` : `As of Mar end · ${fy}`
  const chartData = selectedMonth !== null ? bsData.slice(0, selectedMonth + 1) : bsData
  const dte       = snap && snap.equity > 0 ? `${(snap.loans / snap.equity).toFixed(2)}x` : 'N/A'

  if (!snap) return null

  return (
    <div className="fade-in">
      <SectionHeader title="Balance Sheet" sub={subLabel} />
      <ContextBanner fy={fy} selectedMonth={selectedMonth} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <KpiCard label="Total Assets"      value={fmt(snap.totalAssets)}      sub={subLabel} color={ACCENT}  />
        <KpiCard label="Total Liabilities" value={fmt(snap.totalLiabilities)} sub={subLabel} color={RED}     />
        <KpiCard label="Equity"            value={fmt(snap.equity)}           sub={subLabel} color={ACCENT2} />
        <KpiCard label="Debt-to-Equity"    value={dte}                        sub="Loans ÷ Equity" color={ACCENT3} />
      </div>

      <Divider label="Assets" />
      <ChartCard title="Asset Composition" height={200} hint={selectedMonth !== null ? `Apr → ${MONTHS[selectedMonth]?.short ?? ''}` : 'Full Year'}>
        <AreaChart data={chartData}>
          <defs>
            {([['gCash', ACCENT], ['gDeb', ACCENT2], ['gInv', ACCENT3]] as [string, string][]).map(([id, c]) => (
              <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={c} stopOpacity={0.2} />
                <stop offset="95%" stopColor={c} stopOpacity={0}   />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1d2a" />
          <XAxis dataKey="month" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmt} width={50} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 10, color: '#6b7280' }} />
          <Area type="monotone" dataKey="cash"      stroke={ACCENT}  strokeWidth={2} fill="url(#gCash)" name="Cash & Bank" />
          <Area type="monotone" dataKey="debtors"   stroke={ACCENT2} strokeWidth={2} fill="url(#gDeb)"  name="Debtors"    />
          <Area type="monotone" dataKey="inventory" stroke={ACCENT3} strokeWidth={2} fill="url(#gInv)"  name="Inventory"  />
        </AreaChart>
      </ChartCard>

      <Divider label="Liabilities & Equity" />
      <ChartCard title="Creditors · Loans · Equity" height={200}>
        <BarChart data={chartData} barGap={3}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1d2a" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmt} width={50} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 10, color: '#6b7280' }} />
          <Bar dataKey="creditors" fill={RED}      opacity={0.85} radius={[3, 3, 0, 0]} name="Creditors" />
          <Bar dataKey="loans"     fill="#f97316"  opacity={0.85} radius={[3, 3, 0, 0]} name="Loans"     />
          <Bar dataKey="equity"    fill={ACCENT2}  opacity={0.85} radius={[3, 3, 0, 0]} name="Equity"    />
        </BarChart>
      </ChartCard>

      <ToggleTableBtn show={show} onToggle={() => setShow(!show)} />
      {show && (
        <div className="card fade-in" style={{ background: '#0f1117', border: '1px solid #1a1d2a', borderRadius: 12, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 580 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1a1d2a' }}>
                {['Month', 'Cash', 'Debtors', 'Inventory', 'Fixed Assets', 'Creditors', 'Loans', 'Equity'].map(h => (
                  <th key={h} style={{ padding: '11px 11px', textAlign: h === 'Month' ? 'left' : 'right', color: '#4b5563', fontFamily: "'DM Mono',monospace", fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bsData.map((row, i) => {
                const rowHasBS = uploadStatus.bs.includes(i)
                return (
                  <tr key={row.month} style={{ borderBottom: '1px solid #12151f', background: i % 2 === 0 ? 'transparent' : '#0a0d15', opacity: rowHasBS ? 1 : 0.3 }}>
                    <td style={{ padding: '9px 11px', color: '#9ca3af' }}>
                      {row.month}
                      {!rowHasBS && <span style={{ fontSize: 9, color: '#374151', marginLeft: 6, fontFamily: "'DM Mono',monospace" }}>NO DATA</span>}
                    </td>
                    {[row.cash, row.debtors, row.inventory, row.fixedAssets, row.creditors, row.loans, row.equity].map((v, j) => (
                      <td key={j} style={{ padding: '9px 11px', textAlign: 'right', color: [ACCENT, ACCENT2, ACCENT3, PURPLE, RED, '#f97316', ACCENT2][j], fontFamily: "'DM Mono',monospace" }}>
                        {rowHasBS ? fmt(v) : '—'}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

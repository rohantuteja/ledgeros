'use client'

import { useState } from 'react'
import { BarChart, Bar, ComposedChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { ACCENT, ACCENT2, ACCENT3, RED, PURPLE, MONTHS, fmt } from '@/lib/constants'
import { KpiCard, SectionHeader, ChartCard, ContextBanner, ToggleTableBtn, NoData, CustomTooltip } from '@/components/shared'
import type { PLChartRow, UploadStatus } from '@/lib/chartTypes'

interface PLPageProps {
  plData: PLChartRow[]
  selectedMonth: number | null
  fy: string
  uploadStatus: UploadStatus
}

export default function PLPage({ plData, selectedMonth, fy, uploadStatus }: PLPageProps) {
  const [show, setShow] = useState(false)

  if (selectedMonth !== null && !uploadStatus.pl.includes(selectedMonth)) {
    return (
      <div className="fade-in">
        <SectionHeader title="Profit & Loss" sub={`${MONTHS[selectedMonth]?.full ?? ''} · ${fy}`} />
        <NoData month={`${MONTHS[selectedMonth]?.full ?? ''} ${fy} P&L`} />
      </div>
    )
  }

  const slice        = selectedMonth !== null ? [plData[selectedMonth]] : plData
  const totalRevenue = slice.reduce((s, d) => s + d.revenue, 0)
  const totalGross   = slice.reduce((s, d) => s + d.grossProfit, 0)
  const totalNet     = slice.reduce((s, d) => s + d.netProfit, 0)
  const grossMargin  = totalRevenue ? ((totalGross / totalRevenue) * 100).toFixed(1) : '0'
  const netMargin    = totalRevenue ? ((totalNet   / totalRevenue) * 100).toFixed(1) : '0'
  const subLabel     = selectedMonth !== null ? `${MONTHS[selectedMonth]?.full ?? ''} · ${fy}` : `Full Year · ${fy}`

  return (
    <div className="fade-in">
      <SectionHeader title="Profit & Loss" sub={subLabel} />
      <ContextBanner fy={fy} selectedMonth={selectedMonth} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <KpiCard label="Revenue"      value={fmt(totalRevenue)} sub={subLabel}                           color={ACCENT}  />
        <KpiCard label="Gross Profit" value={fmt(totalGross)}   sub={`${grossMargin}% gross margin`}    color={ACCENT2} />
        <KpiCard label="Net Profit"   value={fmt(totalNet)}     sub={`${netMargin}% net margin`}        color={totalNet >= 0 ? ACCENT3 : RED} />
        <KpiCard
          label={selectedMonth !== null ? 'Monthly Rev' : 'Avg Monthly Rev'}
          value={fmt(selectedMonth !== null ? totalRevenue : totalRevenue / 12)}
          sub={selectedMonth !== null ? 'This month' : 'Per month'}
          color={PURPLE}
        />
      </div>

      <ChartCard title="Revenue · Direct Costs · Operating Expenses" height={240}>
        <BarChart data={slice} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1d2a" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmt} width={50} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 10, color: '#6b7280' }} />
          <Bar dataKey="revenue"     fill={ACCENT}  opacity={0.85} radius={[3, 3, 0, 0]} name="Revenue"       />
          <Bar dataKey="directCosts" fill={RED}     opacity={0.85} radius={[3, 3, 0, 0]} name="Direct Costs"  />
          <Bar dataKey="operatingExp" fill={ACCENT2} opacity={0.85} radius={[3, 3, 0, 0]} name="Operating Exp" />
        </BarChart>
      </ChartCard>

      <ChartCard title="Gross Profit vs Net Profit" height={200}>
        <ComposedChart data={slice}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1d2a" />
          <XAxis dataKey="month" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmt} width={50} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 10, color: '#6b7280' }} />
          <Bar  dataKey="grossProfit" fill={ACCENT2} opacity={0.4} radius={[3, 3, 0, 0]} name="Gross Profit" />
          <Line type="monotone" dataKey="netProfit" stroke={ACCENT} strokeWidth={2.5} dot={{ fill: ACCENT, r: 3 }} name="Net Profit" />
        </ComposedChart>
      </ChartCard>

      {selectedMonth === null && (
        <>
          <ToggleTableBtn show={show} onToggle={() => setShow(!show)} />
          {show && (
            <div className="card fade-in" style={{ background: '#0f1117', border: '1px solid #1a1d2a', borderRadius: 12, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 500 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1a1d2a' }}>
                    {['Month', 'Revenue', 'Direct Costs', 'Gross Profit', 'Op. Exp', 'Net Profit', 'Net Margin'].map(h => (
                      <th key={h} style={{ padding: '12px 12px', textAlign: h === 'Month' ? 'left' : 'right', color: '#4b5563', fontFamily: "'DM Mono',monospace", fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {plData.map((row, i) => {
                    const nm      = row.revenue ? ((row.netProfit / row.revenue) * 100).toFixed(1) : '0.0'
                    const rowHasPL = uploadStatus.pl.includes(i)
                    return (
                      <tr key={row.month} style={{ borderBottom: '1px solid #12151f', background: i % 2 === 0 ? 'transparent' : '#0a0d15', opacity: rowHasPL ? 1 : 0.3 }}>
                        <td style={{ padding: '9px 12px', color: '#9ca3af' }}>
                          {row.month}
                          {!rowHasPL && <span style={{ fontSize: 9, color: '#374151', marginLeft: 6, fontFamily: "'DM Mono',monospace" }}>NO DATA</span>}
                        </td>
                        <td style={{ padding: '9px 12px', textAlign: 'right', color: ACCENT,  fontFamily: "'DM Mono',monospace" }}>{rowHasPL ? fmt(row.revenue)      : '—'}</td>
                        <td style={{ padding: '9px 12px', textAlign: 'right', color: RED,     fontFamily: "'DM Mono',monospace" }}>{rowHasPL ? fmt(row.directCosts) : '—'}</td>
                        <td style={{ padding: '9px 12px', textAlign: 'right', color: ACCENT2, fontFamily: "'DM Mono',monospace" }}>{rowHasPL ? fmt(row.grossProfit) : '—'}</td>
                        <td style={{ padding: '9px 12px', textAlign: 'right', color: ACCENT3, fontFamily: "'DM Mono',monospace" }}>{rowHasPL ? fmt(row.operatingExp): '—'}</td>
                        <td style={{ padding: '9px 12px', textAlign: 'right', color: row.netProfit >= 0 ? ACCENT : RED, fontFamily: "'DM Mono',monospace" }}>{rowHasPL ? fmt(row.netProfit) : '—'}</td>
                        <td style={{ padding: '9px 12px', textAlign: 'right' }}>
                          {rowHasPL
                            ? <span style={{ background: parseFloat(nm) > 20 ? 'rgba(0,229,160,0.1)' : 'rgba(248,113,113,0.1)', color: parseFloat(nm) > 20 ? ACCENT : RED, borderRadius: 4, padding: '2px 6px', fontSize: 10, fontFamily: "'DM Mono',monospace" }}>{nm}%</span>
                            : <span style={{ color: '#374151' }}>—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}

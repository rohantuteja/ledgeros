'use client'

import { useState } from 'react'
import { BarChart, Bar, ComposedChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { ACCENT, ACCENT2, ACCENT3, RED, PURPLE, MONTHS, fmt, fmtShort } from '@/lib/constants'
import { KpiCard, SectionHeader, ChartCard, ContextBanner, ToggleTableBtn, NoData, CustomTooltip } from '@/components/shared'
import type { PLChartRow, UploadStatus, ExpenseLineItem } from '@/lib/chartTypes'

interface PLPageProps {
  plData: PLChartRow[]
  selectedMonth: number | null
  fy: string
  uploadStatus: UploadStatus
  expenseItems: ExpenseLineItem[]
}

export default function PLPage({ plData, selectedMonth, fy, uploadStatus, expenseItems }: PLPageProps) {
  const [show, setShow] = useState(false)

  if (selectedMonth !== null && !uploadStatus.pl.includes(selectedMonth)) {
    return (
      <div className="fade-in">
        <SectionHeader title="Profit & Loss" sub={`${MONTHS[selectedMonth]?.full ?? ''} · ${fy}`} />
        <NoData month={`${MONTHS[selectedMonth]?.full ?? ''} ${fy} P&L`} />
      </div>
    )
  }

  const slice           = selectedMonth !== null ? [plData[selectedMonth]] : plData
  const uploadedMonths  = uploadStatus.pl.length

  const cogsAndDirectExp = (items: ExpenseLineItem[]) => {
    const isStock = (n: string) => n.includes('opening stock') || n.includes('closing stock') || n.includes('purchase')
    let op = 0, pur = 0, cl = 0, dirExp = 0
    for (const e of items) {
      const n = e.ledger_name.toLowerCase()
      if (e.section === 'trading_costs') {
        if (n.includes('opening stock'))  op  += e.amount
        else if (n.includes('purchase'))  pur += e.amount
        else if (n.includes('closing stock')) cl += e.amount
      }
      if (e.section === 'direct_expenses') dirExp += e.amount
      if (e.section === 'trading_costs' && !isStock(n)) dirExp += e.amount
    }
    return { openingStock: op, purchases: pur, closingStock: cl, cogs: op + pur - cl, directExp: dirExp }
  }

  const relevantItems   = selectedMonth !== null
    ? expenseItems.filter(e => e.month_index === selectedMonth)
    : expenseItems
  const { openingStock, purchases, closingStock, cogs: cogsTotal, directExp: directExpTotal } = cogsAndDirectExp(relevantItems)

  // Per-month breakdown for chart
  const chartData = slice.map(row => {
    const monthIdx = MONTHS.findIndex(m => m.short === row.month)
    const { cogs, directExp } = cogsAndDirectExp(expenseItems.filter(e => e.month_index === monthIdx))
    return { ...row, cogs, directExp }
  })
  const totalRevenue    = slice.reduce((s, d) => s + d.revenue, 0)
  const totalGross      = slice.reduce((s, d) => s + d.grossProfit, 0)
  const totalNet        = slice.reduce((s, d) => s + d.netProfit, 0)
  const grossMargin     = totalRevenue ? ((totalGross / totalRevenue) * 100).toFixed(1) : '0'
  const netMargin       = totalRevenue ? ((totalNet   / totalRevenue) * 100).toFixed(1) : '0'
  const subLabel        = selectedMonth !== null ? `${MONTHS[selectedMonth]?.full ?? ''} · ${fy}` : `Full Year · ${fy}`

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
          value={fmt(selectedMonth !== null ? totalRevenue : (uploadedMonths ? totalRevenue / uploadedMonths : 0))}
          sub={selectedMonth !== null ? 'This month' : 'Per month'}
          color={PURPLE}
        />
      </div>

      {cogsTotal > 0 && (
        <div className="card" style={{ background: '#0f1117', border: '1px solid #1a1d2a', borderRadius: 12, padding: '18px 16px', marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: '#9ca3af', fontFamily: "'DM Mono',monospace", marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Cost of Goods Sold Breakdown</div>
          {[
            { label: 'Opening Stock',      value: openingStock,              prefix: '',  color: ACCENT3  },
            { label: 'Purchases',          value: purchases,                 prefix: '+', color: ACCENT3  },
            { label: 'Closing Stock',      value: closingStock,              prefix: '−', color: ACCENT2  },
            { label: 'Cost of Goods Sold', value: cogsTotal, prefix: '=', color: '#e2e8f0', bold: true },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #12151f' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ width: 14, textAlign: 'center', fontSize: 12, color: '#4b5563', fontFamily: "'DM Mono',monospace" }}>{r.prefix}</span>
                <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: r.bold ? 600 : 400 }}>{r.label}</span>
              </div>
              <span style={{ fontSize: 12, color: r.color, fontFamily: "'DM Mono',monospace", fontWeight: r.bold ? 600 : 400 }}>{fmt(r.value)}</span>
            </div>
          ))}
        </div>
      )}

      <ChartCard title="Revenue · COGS · Direct Expenses · Operating Expenses" height={240}>
        <BarChart data={chartData} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1d2a" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtShort} width={50} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 10, color: '#6b7280' }} />
          <Bar dataKey="revenue"    fill={ACCENT}  opacity={0.85} radius={[3, 3, 0, 0]} name="Revenue"        />
          <Bar dataKey="cogs"       fill={RED}     opacity={0.85} radius={[3, 3, 0, 0]} name="COGS"           />
          <Bar dataKey="directExp"  fill={ACCENT3} opacity={0.85} radius={[3, 3, 0, 0]} name="Direct Expenses"/>
          <Bar dataKey="operatingExp" fill={ACCENT2} opacity={0.85} radius={[3, 3, 0, 0]} name="Operating Exp" />
        </BarChart>
      </ChartCard>

      <ChartCard title="Gross Profit vs Net Profit" height={200}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1d2a" />
          <XAxis dataKey="month" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtShort} width={50} />
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
                    {['Month', 'Revenue', 'COGS', 'Direct Exp', 'Gross Profit', 'Op. Exp', 'Net Profit', 'Net Margin'].map(h => (
                      <th key={h} style={{ padding: '12px 12px', textAlign: h === 'Month' ? 'left' : 'right', color: '#4b5563', fontFamily: "'DM Mono',monospace", fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {plData.map((row, i) => {
                    const nm       = row.revenue ? ((row.netProfit / row.revenue) * 100).toFixed(1) : '0.0'
                    const rowHasPL = uploadStatus.pl.includes(i)
                    const { cogs, directExp } = cogsAndDirectExp(expenseItems.filter(e => e.month_index === i))
                    return (
                      <tr key={row.month} style={{ borderBottom: '1px solid #12151f', background: i % 2 === 0 ? 'transparent' : '#0a0d15', opacity: rowHasPL ? 1 : 0.3 }}>
                        <td style={{ padding: '9px 12px', color: '#9ca3af' }}>
                          {row.month}
                          {!rowHasPL && <span style={{ fontSize: 9, color: '#374151', marginLeft: 6, fontFamily: "'DM Mono',monospace" }}>NO DATA</span>}
                        </td>
                        <td style={{ padding: '9px 12px', textAlign: 'right', color: ACCENT,  fontFamily: "'DM Mono',monospace" }}>{rowHasPL ? fmt(row.revenue)      : '—'}</td>
                        <td style={{ padding: '9px 12px', textAlign: 'right', color: RED,     fontFamily: "'DM Mono',monospace" }}>{rowHasPL ? fmt(cogs)            : '—'}</td>
                        <td style={{ padding: '9px 12px', textAlign: 'right', color: ACCENT3, fontFamily: "'DM Mono',monospace" }}>{rowHasPL ? fmt(directExp)       : '—'}</td>
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

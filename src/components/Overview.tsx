'use client'

import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'
import { ACCENT, ACCENT2, ACCENT3, RED, PURPLE, MONTHS, fmt } from '@/lib/constants'
import { KpiCard, SectionHeader, ChartCard, ContextBanner, CustomTooltip } from '@/components/shared'
import type { PLChartRow, BSChartRow } from '@/lib/chartTypes'

const topExpenses = [
  { name: 'Employee Benefits', pct: 33 },
  { name: 'Rent',              pct: 34 },
  { name: 'Marketing',         pct: 14 },
  { name: 'Electricity',       pct:  4 },
  { name: 'Software',          pct:  1 },
  { name: 'Others',            pct: 14 },
]

interface OverviewPageProps {
  isMobile: boolean
  plData: PLChartRow[]
  bsData: BSChartRow[]
  selectedMonth: number | null
  fy: string
}

export default function Overview({ isMobile, plData, bsData, selectedMonth, fy }: OverviewPageProps) {
  const slice   = selectedMonth !== null ? [plData[selectedMonth]] : plData
  const bsSnap  = selectedMonth !== null ? bsData[selectedMonth] : bsData[bsData.length - 1]

  const totalRevenue = slice.reduce((s, d) => s + d.revenue, 0)
  const totalProfit  = slice.reduce((s, d) => s + d.netProfit, 0)
  const margin       = totalRevenue ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0'
  const subLabel     = selectedMonth !== null ? (MONTHS[selectedMonth]?.full ?? '') : `Full Year · ${fy}`

  if (!bsSnap) return null

  return (
    <div className="fade-in">
      <SectionHeader title="Financial Overview" sub={subLabel} />
      <ContextBanner fy={fy} selectedMonth={selectedMonth} />

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        <KpiCard label="Revenue"         value={fmt(totalRevenue)} sub={subLabel}                               color={ACCENT}  tag="P&L" />
        <KpiCard label="Net Profit"      value={fmt(totalProfit)}  sub={`${margin}% margin`}                    color={totalProfit >= 0 ? ACCENT2 : RED} tag="P&L" />
        <KpiCard label="Cash & Bank"     value={fmt(bsSnap.cash)}  sub={`As of ${bsSnap.month} end`}            color={ACCENT3} tag="B/S" />
        <KpiCard label="Working Capital" value={fmt(bsSnap.debtors + bsSnap.cash - bsSnap.creditors)} sub="Current assets − creditors" color={PURPLE} tag="B/S" />
      </div>

      <ChartCard title="Revenue vs Net Profit" height={200} hint={selectedMonth !== null ? 'Single month' : 'Monthly trend'}>
        <AreaChart data={selectedMonth !== null ? [plData[selectedMonth]] : plData}>
          <defs>
            <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={ACCENT}  stopOpacity={0.15} />
              <stop offset="95%" stopColor={ACCENT}  stopOpacity={0}    />
            </linearGradient>
            <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={ACCENT2} stopOpacity={0.15} />
              <stop offset="95%" stopColor={ACCENT2} stopOpacity={0}    />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1d2a" />
          <XAxis dataKey="month" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmt} width={50} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="revenue"   stroke={ACCENT}  strokeWidth={2} fill="url(#gRev)"    name="Revenue"    />
          <Area type="monotone" dataKey="netProfit" stroke={ACCENT2} strokeWidth={2} fill="url(#gProfit)" name="Net Profit" />
        </AreaChart>
      </ChartCard>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
        <div className="card" style={{ background: '#0f1117', border: '1px solid #1a1d2a', borderRadius: 12, padding: '18px 16px' }}>
          <div style={{ fontSize: 11, color: '#9ca3af', fontFamily: "'DM Mono',monospace", marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Expense Breakdown · P&L</div>
          {topExpenses.map((e, i) => (
            <div key={e.name} style={{ marginBottom: 11 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: '#9ca3af' }}>{e.name}</span>
                <span style={{ color: '#e2e8f0', fontFamily: "'DM Mono',monospace" }}>{e.pct}%</span>
              </div>
              <div style={{ height: 4, background: '#1a1d2a', borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${e.pct}%`, borderRadius: 2, background: [ACCENT, RED, ACCENT3, ACCENT2, PURPLE, '#94a3b8'][i] }} />
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{ background: '#0f1117', border: '1px solid #1a1d2a', borderRadius: 12, padding: '18px 16px' }}>
          <div style={{ fontSize: 11, color: '#9ca3af', fontFamily: "'DM Mono',monospace", marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>
            Balance Sheet · {bsSnap.month} End
          </div>
          {[
            { label: 'Cash & Bank',  value:  bsSnap.cash,        color: ACCENT    },
            { label: 'Debtors',      value:  bsSnap.debtors,     color: ACCENT2   },
            { label: 'Inventory',    value:  bsSnap.inventory,   color: ACCENT3   },
            { label: 'Fixed Assets', value:  bsSnap.fixedAssets, color: PURPLE    },
            { label: 'Creditors',    value: -bsSnap.creditors,   color: RED       },
            { label: 'Loans',        value: -bsSnap.loans,       color: '#f97316' },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #12151f' }}>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>{r.label}</span>
              <span style={{ fontSize: 12, color: r.color, fontFamily: "'DM Mono',monospace" }}>{fmt(r.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

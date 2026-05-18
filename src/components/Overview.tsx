'use client'

import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'
import { ACCENT, ACCENT2, ACCENT3, RED, PURPLE, MONTHS, fmt, fmtShort } from '@/lib/constants'
import { KpiCard, SectionHeader, ChartCard, ContextBanner, CustomTooltip } from '@/components/shared'
import type { PLChartRow, BSChartRow, ExpenseLineItem, LedgerLineItem } from '@/lib/chartTypes'

interface OverviewPageProps {
  isMobile: boolean
  plData: PLChartRow[]
  bsData: BSChartRow[]
  selectedMonth: number | null
  fy: string
  expenseItems: ExpenseLineItem[]
  bsItems: LedgerLineItem[]
}

const EXPENSE_COLORS = [ACCENT, RED, ACCENT3, ACCENT2, PURPLE, '#94a3b8']
const CATEGORY_ORDER = ['Marketing', 'Salaries', 'Shipping', 'Rent', 'Software', 'Others']

function categorise(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('marketing'))                                                              return 'Marketing'
  if (n.includes('employee benifit'))                                                        return 'Salaries'
  if (n.includes('shipping'))                                                               return 'Shipping'
  if (n.includes('rent') || n.includes('residence'))                                       return 'Rent'
  if (n.includes('software'))                                                               return 'Software'
  return 'Others'
}

export default function Overview({ isMobile, plData, bsData, selectedMonth, fy, expenseItems, bsItems }: OverviewPageProps) {
  const slice   = selectedMonth !== null ? [plData[selectedMonth]] : plData
  const bsSnap  = selectedMonth !== null
    ? bsData[selectedMonth]
    : [...bsData].reverse().find(d => d.totalAssets > 0) ?? bsData[bsData.length - 1]

  const totalRevenue = slice.reduce((s, d) => s + d.revenue, 0)
  const totalProfit  = slice.reduce((s, d) => s + d.netProfit, 0)
  const margin       = totalRevenue ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0'
  const subLabel     = selectedMonth !== null ? (MONTHS[selectedMonth]?.full ?? '') : `Full Year · ${fy}`

  const EXPENSE_SECTIONS = ['trading_costs', 'direct_expenses', 'indirect_expenses']
  const STOCK_PURCHASE_NAMES = ['opening stock', 'add: purchase accounts', 'less: closing stock']
  const relevantItems = (selectedMonth !== null
    ? expenseItems.filter(e => e.month_index === selectedMonth)
    : expenseItems
  ).filter(e =>
    EXPENSE_SECTIONS.includes(e.section) &&
    !(e.section === 'trading_costs' && STOCK_PURCHASE_NAMES.includes(e.ledger_name.toLowerCase()))
  )

  const categoryTotals: Record<string, number> = {}
  for (const item of relevantItems) {
    const cat = categorise(item.ledger_name)
    categoryTotals[cat] = (categoryTotals[cat] ?? 0) + item.amount
  }
  const grandTotal = Object.values(categoryTotals).reduce((s, v) => s + v, 0)
  const categories = CATEGORY_ORDER
    .filter(c => (categoryTotals[c] ?? 0) > 0)
    .map((name, i) => ({
      name,
      amount: categoryTotals[name],
      pct:    grandTotal ? (categoryTotals[name] / grandTotal) * 100 : 0,
      color:  EXPENSE_COLORS[i],
    }))

  const latestBsMonth = bsItems.length > 0 ? Math.max(...bsItems.map(i => i.month_index)) : null
  const bsMonthForBalance = selectedMonth !== null ? selectedMonth : latestBsMonth
  const balanceItems = bsMonthForBalance !== null ? bsItems.filter(i => i.month_index === bsMonthForBalance) : []
  const totalBalance = balanceItems
    .filter(i => {
      const n = i.ledger_name.toLowerCase()
      return n.includes('bank') || n.includes('cash') || n.includes('fdr')
    })
    .reduce((s, i) => s + i.amount, 0)
  const balanceMonth = bsMonthForBalance !== null ? (MONTHS[bsMonthForBalance]?.short ?? '') : ''

  if (!bsSnap) return null

  return (
    <div className="fade-in">
      <SectionHeader title="Financial Overview" sub={subLabel} />
      <ContextBanner fy={fy} selectedMonth={selectedMonth} />

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        <KpiCard label="Revenue"             value={fmt(totalRevenue)}                        sub={subLabel}                          color={ACCENT}  tag="P&L" />
        <KpiCard label="Marketing Expenses"  value={fmt(categoryTotals['Marketing'] ?? 0)}  sub={subLabel}                          color={RED}     tag="P&L" />
        <KpiCard label="Net Profit"          value={fmt(totalProfit)}                        sub={`${margin}% margin`}               color={totalProfit >= 0 ? ACCENT2 : RED} tag="P&L" />
        <KpiCard label="Total Balance"       value={fmt(totalBalance)}                       sub={balanceMonth ? `As of ${balanceMonth} end` : '—'} color={ACCENT3} tag="B/S" />
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
          <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtShort} width={56} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="revenue"   stroke={ACCENT}  strokeWidth={2} fill="url(#gRev)"    name="Revenue"    />
          <Area type="monotone" dataKey="netProfit" stroke={ACCENT2} strokeWidth={2} fill="url(#gProfit)" name="Net Profit" />
        </AreaChart>
      </ChartCard>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
        <div className="card" style={{ background: '#0f1117', border: '1px solid #1a1d2a', borderRadius: 12, padding: '18px 16px' }}>
          <div style={{ fontSize: 11, color: '#9ca3af', fontFamily: "'DM Mono',monospace", marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Expense Breakdown · P&L</div>
          {categories.length === 0 ? (
            <div style={{ fontSize: 12, color: '#4b5563', textAlign: 'center', padding: '20px 0' }}>No expense data for this period</div>
          ) : categories.map(e => (
            <div key={e.name} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>{e.name}</span>
                <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                  <span style={{ fontSize: 12, color: e.color, fontFamily: "'DM Mono',monospace" }}>{fmt(e.amount)}</span>
                  <span style={{ fontSize: 10, color: '#4b5563', fontFamily: "'DM Mono',monospace" }}>{e.pct.toFixed(1)}%</span>
                </div>
              </div>
              <div style={{ height: 4, background: '#1a1d2a', borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${e.pct}%`, borderRadius: 2, background: e.color }} />
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

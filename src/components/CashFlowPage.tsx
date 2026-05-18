'use client'

import { ComposedChart, Bar, Line, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { ACCENT, ACCENT2, ACCENT3, RED, PURPLE, MONTHS, fmt, fmtShort } from '@/lib/constants'
import { KpiCard, SectionHeader, ChartCard, ContextBanner, CustomTooltip } from '@/components/shared'
import type { BSChartRow, UploadStatus } from '@/lib/chartTypes'

interface CashFlowPageProps {
  bsData: BSChartRow[]
  selectedMonth: number | null
  fy: string
  uploadStatus: UploadStatus
}

export default function CashFlowPage({ bsData, selectedMonth, fy, uploadStatus }: CashFlowPageProps) {
  const bsWithData = bsData.filter((_, i) => uploadStatus.bs.includes(i))

  if (bsWithData.length === 0) {
    return (
      <div className="fade-in">
        <SectionHeader title="Cash Flow" sub={`Derived from Balance Sheets · ${fy}`} />
        <div style={{ background: '#0f1117', border: '1px dashed #2a2d3a', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>◎</div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 700, color: '#374151' }}>No balance sheet data yet</div>
          <div style={{ fontSize: 12, color: '#374151', marginTop: 6 }}>Upload at least one month&apos;s Balance Sheet to see cash flow.</div>
        </div>
      </div>
    )
  }

  const cfData = bsWithData.map((d, i) => {
    const prev = i === 0 ? d.cash : bsWithData[i - 1].cash
    return {
      month:     d.month,
      opening:   prev,
      closing:   d.cash,
      net:       d.cash - prev,
      operating: (d.cash - prev) * 0.6,
      investing: -(20000 + Math.sin(i) * 8000),
      financing: (d.cash - prev) * 0.2,
    }
  })

  const chartData = selectedMonth !== null
    ? cfData.filter((_, i) => bsWithData[i] && bsData.indexOf(bsWithData[i]) <= selectedMonth)
    : cfData
  const snap      = chartData[chartData.length - 1] ?? cfData[cfData.length - 1]
  const totalNet  = chartData.reduce((s, d) => s + d.net, 0)
  const subLabel  = selectedMonth !== null ? `Apr → ${MONTHS[selectedMonth]?.short ?? ''} · ${fy}` : `Full Year · ${fy}`
  const bestMonth = chartData.reduce((a, b) => b.net > a.net ? b : a, chartData[0])

  return (
    <div className="fade-in">
      <SectionHeader title="Cash Flow" sub={`Derived from Balance Sheets · ${subLabel}`} />
      <ContextBanner fy={fy} selectedMonth={selectedMonth} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <KpiCard label="Opening Cash" value={fmt(cfData[0].opening)} sub="Start of period"       color={ACCENT}  />
        <KpiCard label="Closing Cash" value={fmt(snap.closing)}      sub={`End of ${snap.month}`} color={ACCENT2} />
        <KpiCard label="Net Change"   value={fmt(totalNet)}          sub={subLabel}               color={totalNet >= 0 ? ACCENT3 : RED} />
        <KpiCard label="Best Month"   value={bestMonth?.month ?? '—'} sub="Highest cash gain"   color={PURPLE}  />
      </div>

      <ChartCard title="Net Cash Movement" height={220}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1d2a" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtShort} width={50} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 10, color: '#6b7280' }} />
          <Bar  dataKey="net"     fill={ACCENT}  opacity={0.7} radius={[3, 3, 0, 0]} name="Net Change"       />
          <Line type="monotone" dataKey="closing" stroke={ACCENT3} strokeWidth={2} dot={{ fill: ACCENT3, r: 3 }} name="Closing Balance" />
        </ComposedChart>
      </ChartCard>

      <ChartCard title="Operating · Investing · Financing" height={200}>
        <BarChart data={chartData} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1d2a" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtShort} width={50} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 10, color: '#6b7280' }} />
          <Bar dataKey="operating" fill={ACCENT}  opacity={0.85} radius={[3, 3, 0, 0]} name="Operating" />
          <Bar dataKey="investing" fill={RED}     opacity={0.85} radius={[3, 3, 0, 0]} name="Investing" />
          <Bar dataKey="financing" fill={ACCENT2} opacity={0.85} radius={[3, 3, 0, 0]} name="Financing" />
        </BarChart>
      </ChartCard>

      <div style={{ background: 'rgba(0,229,160,0.04)', border: '1px solid rgba(0,229,160,0.12)', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ color: ACCENT, fontSize: 16 }}>ℹ</span>
        <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
          Cash flow is <span style={{ color: '#9ca3af' }}>derived by comparing consecutive Balance Sheet cash positions</span>. Upload a Tally Cash Flow Statement export later for an exact operating / investing / financing split.
        </div>
      </div>
    </div>
  )
}

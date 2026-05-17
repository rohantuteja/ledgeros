'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { ACCENT, MONTHS, NAV_ITEMS, FY_LIST, RED } from '@/lib/constants'
import type { PLChartRow, BSChartRow, UploadStatus } from '@/lib/chartTypes'
import type { PLSummary, BSSummary } from '@/lib/types'
import FilterBar   from '@/components/FilterBar'
import Overview    from '@/components/Overview'
import PLPage      from '@/components/PLPage'
import BalancePage from '@/components/BalancePage'
import CashFlowPage from '@/components/CashFlowPage'
import UploadPage  from '@/components/UploadPage'

// ── SSR-safe window width hook ────────────────────────────
function useWindowWidth() {
  const [w, setW] = useState(1200)
  useEffect(() => {
    setW(window.innerWidth)
    const h = () => setW(window.innerWidth)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return w
}

// ── Loading skeleton ──────────────────────────────────────
function LoadingSkeleton({ isMobile }: { isMobile: boolean }) {
  const bar = (w: string, h = 12) => (
    <div style={{ width: w, height: h, background: '#1a1d2a', borderRadius: 4 }} />
  )
  return (
    <div style={{ padding: isMobile ? '18px 14px' : '28px 36px' }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}.skel{animation:pulse 1.5s infinite}`}</style>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="skel" style={{ background: '#0f1117', border: '1px solid #1a1d2a', borderRadius: 12, padding: '16px 18px' }}>
            {bar('55%', 10)}<div style={{ height: 8 }} />{bar('80%', 22)}<div style={{ height: 6 }} />{bar('45%', 10)}
          </div>
        ))}
      </div>
      <div className="skel" style={{ background: '#0f1117', border: '1px solid #1a1d2a', borderRadius: 12, padding: '18px 14px', marginBottom: 14 }}>
        {bar('28%', 11)}<div style={{ height: 14 }} />
        <div style={{ height: 200, background: '#0a0d15', borderRadius: 8 }} />
      </div>
    </div>
  )
}

// ── Error state ───────────────────────────────────────────
function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{ textAlign: 'center', maxWidth: 360 }}>
        <div style={{ fontSize: 36, marginBottom: 16, color: RED }}>⚠</div>
        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Failed to load data</div>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 24, lineHeight: 1.6 }}>{error}</div>
        <button onClick={onRetry} style={{ background: ACCENT, color: '#000', border: 'none', borderRadius: 8, padding: '10px 28px', fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          Retry
        </button>
      </div>
    </div>
  )
}

// ── Root dashboard ────────────────────────────────────────
export default function Dashboard() {
  const width    = useWindowWidth()
  const isMobile = width < 768

  const [active,        setActive]        = useState('overview')
  const [drawerOpen,    setDrawerOpen]    = useState(false)
  const [fy,            setFy]            = useState(FY_LIST[0])
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)

  const [rawPL,    setRawPL]    = useState<PLSummary[]>([])
  const [rawBS,    setRawBS]    = useState<BSSummary[]>([])
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({ pl: [], bs: [] })
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/data?fy=${encodeURIComponent(fy)}`)
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const json = await res.json()
      setUploadStatus(json.uploadStatus ?? { pl: [], bs: [] })
      setRawPL(json.plData ?? [])
      setRawBS(json.bsData ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [fy])

  useEffect(() => { fetchData() }, [fetchData])

  // Transform raw DB rows → 12-slot chart arrays
  const plData = useMemo<PLChartRow[]>(() =>
    MONTHS.map(m => {
      const row = rawPL.find(d => d.month_index === m.idx)
      return {
        month:       m.short,
        revenue:     row?.trading_sales    ?? 0,
        directCosts: row?.trading_costs    ?? 0,
        grossProfit: row?.gross_profit     ?? 0,
        operatingExp:row?.indirect_expenses?? 0,
        netProfit:   row?.net_profit       ?? 0,
      }
    }), [rawPL])

  const bsData = useMemo<BSChartRow[]>(() =>
    MONTHS.map(m => {
      const row       = rawBS.find(d => d.month_index === m.idx)
      const cash      = row?.cash_and_bank ?? 0
      const debtors   = row?.debtors       ?? 0
      const inventory = row?.inventory     ?? 0
      const fixedAssets = row?.fixed_assets?? 0
      const creditors = row?.creditors     ?? 0
      const loans     = (row?.secured_loans ?? 0) + (row?.unsecured_loans ?? 0)
      const equity    = (row?.share_capital ?? 0) + (row?.reserves ?? 0) + (row?.profit_and_loss ?? 0)
      return {
        month: m.short,
        cash, debtors, inventory, fixedAssets, creditors, loans, equity,
        totalAssets:      cash + debtors + inventory + fixedAssets,
        totalLiabilities: creditors + loans,
      }
    }), [rawBS])

  const handleFyChange = (newFy: string) => {
    setFy(newFy)
    setSelectedMonth(null)
  }

  const pages: Record<string, React.ReactNode> = {
    overview: <Overview     isMobile={isMobile} plData={plData} bsData={bsData} selectedMonth={selectedMonth} fy={fy} />,
    pl:       <PLPage       plData={plData} selectedMonth={selectedMonth} fy={fy} uploadStatus={uploadStatus} />,
    balance:  <BalancePage  bsData={bsData} selectedMonth={selectedMonth} fy={fy} uploadStatus={uploadStatus} />,
    cashflow: <CashFlowPage bsData={bsData} selectedMonth={selectedMonth} fy={fy} uploadStatus={uploadStatus} />,
    upload:   <UploadPage   fy={fy} selectedMonth={selectedMonth} uploadStatus={uploadStatus} onDataRefresh={fetchData} />,
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', maxWidth: '100vw', background: '#080b12', color: '#e2e8f0', fontFamily: "'DM Sans',sans-serif", overflow: 'hidden' }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:#0f1117}
        ::-webkit-scrollbar-thumb{background:#2a2d3a;border-radius:2px}
        .pill-strip::-webkit-scrollbar{display:none}
        .nav-item{transition:all 0.2s ease;cursor:pointer}
        .nav-item:hover{background:rgba(0,229,160,0.06)!important}
        .card{transition:transform 0.18s ease,box-shadow 0.18s ease}
        .card:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,0.4)!important}
        .upload-zone{transition:all 0.25s ease}
        .upload-zone:hover{border-color:#00e5a0!important;background:rgba(0,229,160,0.04)!important}
        .bnav-btn{display:flex;flex-direction:column;align-items:center;gap:3px;flex:1;padding:9px 4px 8px;cursor:pointer;border:none;background:transparent;position:relative}
        .overlay{position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:350}
        button{outline:none}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}
        .fade-in{animation:fadeIn 0.3s ease forwards}
        .slide-in{animation:slideIn 0.25s ease forwards}
      `}</style>

      {/* Desktop sidebar */}
      {!isMobile && (
        <div style={{ width: 220, background: '#0a0d15', borderRight: '1px solid #1a1d2a', display: 'flex', flexDirection: 'column', padding: '28px 0', flexShrink: 0 }}>
          <div style={{ padding: '0 20px 32px' }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, color: '#fff', letterSpacing: -0.5 }}>LEDGER<span style={{ color: ACCENT }}>OS</span></div>
            <div style={{ fontSize: 10, color: '#4b5563', fontFamily: "'DM Mono',monospace", marginTop: 4 }}>{fy}</div>
          </div>
          <nav style={{ flex: 1 }}>
            {NAV_ITEMS.map(item => {
              const on = active === item.id
              return (
                <div key={item.id} className="nav-item" onClick={() => setActive(item.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', margin: '2px 10px', borderRadius: 8, background: on ? 'rgba(0,229,160,0.08)' : 'transparent', borderLeft: on ? `2px solid ${ACCENT}` : '2px solid transparent', color: on ? ACCENT : '#6b7280', fontSize: 13.5, fontWeight: on ? 500 : 400 }}
                >
                  <span style={{ fontSize: 16 }}>{item.icon}</span>{item.label}
                </div>
              )
            })}
          </nav>
          <div style={{ padding: '0 20px', borderTop: '1px solid #1a1d2a', paddingTop: 20 }}>
            <div style={{ fontSize: 10, color: '#374151', fontFamily: "'DM Mono',monospace" }}>SELECTED PERIOD</div>
            <div style={{ fontSize: 11, color: '#4b5563', marginTop: 4 }}>
              {selectedMonth !== null ? `${MONTHS[selectedMonth]?.full ?? ''} · ${fy}` : `All months · ${fy}`}
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 10, color: ACCENT, fontFamily: "'DM Mono',monospace" }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT, animation: 'pulse 2s infinite', display: 'inline-block' }} />LIVE
            </div>
          </div>
        </div>
      )}

      {/* Mobile drawer */}
      {isMobile && drawerOpen && (
        <>
          <div className="overlay" onClick={() => setDrawerOpen(false)} />
          <div className="slide-in" style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 240, background: '#0a0d15', borderRight: '1px solid #1a1d2a', display: 'flex', flexDirection: 'column', padding: '24px 0', zIndex: 400 }}>
            <div style={{ padding: '0 18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 17, color: '#fff' }}>LEDGER<span style={{ color: ACCENT }}>OS</span></div>
                <div style={{ fontSize: 10, color: '#4b5563', fontFamily: "'DM Mono',monospace", marginTop: 3 }}>{fy}</div>
              </div>
              <div onClick={() => setDrawerOpen(false)} style={{ color: '#4b5563', cursor: 'pointer', fontSize: 18, padding: 4 }}>✕</div>
            </div>
            <nav style={{ flex: 1 }}>
              {NAV_ITEMS.map(item => {
                const on = active === item.id
                return (
                  <div key={item.id} className="nav-item" onClick={() => { setActive(item.id); setDrawerOpen(false) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', margin: '2px 10px', borderRadius: 8, background: on ? 'rgba(0,229,160,0.08)' : 'transparent', borderLeft: on ? `2px solid ${ACCENT}` : '2px solid transparent', color: on ? ACCENT : '#6b7280', fontSize: 14, fontWeight: on ? 500 : 400 }}
                  >
                    <span style={{ fontSize: 18 }}>{item.icon}</span>{item.label}
                  </div>
                )
              })}
            </nav>
          </div>
        </>
      )}

      {/* Main column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Mobile top bar */}
        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', background: '#0a0d15', borderBottom: '1px solid #1a1d2a', flexShrink: 0 }}>
            <div onClick={() => setDrawerOpen(true)} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4, padding: 4 }}>
              <div style={{ width: 20, height: 2, background: '#6b7280', borderRadius: 1 }} />
              <div style={{ width: 14, height: 2, background: '#6b7280', borderRadius: 1 }} />
              <div style={{ width: 20, height: 2, background: '#6b7280', borderRadius: 1 }} />
            </div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16, color: '#fff' }}>LEDGER<span style={{ color: ACCENT }}>OS</span></div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, color: ACCENT, fontFamily: "'DM Mono',monospace" }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT, animation: 'pulse 2s infinite', display: 'inline-block' }} />LIVE
            </div>
          </div>
        )}

        <FilterBar fy={fy} setFy={handleFyChange} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} isMobile={isMobile} uploadStatus={uploadStatus} />

        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '18px 14px 88px' : '28px 36px' }}>
          {loading ? (
            <LoadingSkeleton isMobile={isMobile} />
          ) : error ? (
            <ErrorState error={error} onRetry={fetchData} />
          ) : (
            pages[active]
          )}
        </div>

        {/* Mobile bottom nav */}
        {isMobile && (
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#0a0d15', borderTop: '1px solid #1a1d2a', display: 'flex', zIndex: 300 }}>
            {NAV_ITEMS.map(item => {
              const on = active === item.id
              return (
                <button key={item.id} className="bnav-btn" onClick={() => setActive(item.id)} style={{ color: on ? ACCENT : '#4b5563' }}>
                  {on && <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 22, height: 2, background: ACCENT, borderRadius: '0 0 2px 2px' }} />}
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <span style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", letterSpacing: 0.5, textTransform: 'uppercase' }}>{item.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

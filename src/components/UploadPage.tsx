'use client'

import { useState, useEffect, useRef } from 'react'
import { ACCENT, ACCENT2, ACCENT3, RED, MONTHS } from '@/lib/constants'
import { SectionHeader } from '@/components/shared'
import type { UploadStatus } from '@/lib/chartTypes'

type UploadState = 'idle' | 'dragging' | 'staged' | 'confirming' | 'confirm-delete' | 'synced'

interface FileZoneProps {
  type: 'pl' | 'bs'
  label: string
  tag: string
  colorRgb: string
  hint: string
  existingDate: string
  state: UploadState
  setState: (s: UploadState) => void
  fileName: string
  isExisting: boolean
  onFile: (file: File) => void
  onConfirm: () => void
  onCancel: () => void
  onDelete: () => void
  targetMonth: { full: string; short: string } | null
  fy: string
}

function FileZone({ type, label, tag, colorRgb, hint, existingDate, state, setState, fileName, isExisting, onFile, onConfirm, onCancel, onDelete, targetMonth, fy }: FileZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const color    = `rgb(${colorRgb})`

  const handleDrop = (file: File) => {
    onFile(file)
  }

  return (
    <div className="card" style={{ background: '#0f1117', border: `1px solid ${state === 'staged' ? color : '#1a1d2a'}`, borderRadius: 12, padding: '20px 18px', transition: 'border-color 0.2s ease' }}>
      <input ref={inputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleDrop(f); e.target.value = '' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14 }}>{label}</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {isExisting && state !== 'staged' && (
            <span style={{ fontSize: 9, background: 'rgba(245,158,11,0.1)', color: ACCENT3, border: '1px solid rgba(245,158,11,0.25)', borderRadius: 4, padding: '2px 7px', fontFamily: "'DM Mono',monospace" }}>
              UPLOADED {existingDate}
            </span>
          )}
          {state === 'staged' && (
            <span style={{ fontSize: 9, background: `rgba(${colorRgb},0.08)`, color, border: `1px solid rgba(${colorRgb},0.2)`, borderRadius: 4, padding: '2px 7px', fontFamily: "'DM Mono',monospace" }}>
              {isExisting ? 'REPLACING' : 'NEW'}
            </span>
          )}
          {isExisting && state === 'idle' && (
            <button
              onClick={() => setState('confirm-delete')}
              style={{ fontSize: 9, background: 'rgba(248,113,113,0.08)', color: RED, border: '1px solid rgba(248,113,113,0.25)', borderRadius: 4, padding: '2px 8px', fontFamily: "'DM Mono',monospace", cursor: 'pointer' }}
            >DELETE</button>
          )}
          <span style={{ fontSize: 9, background: `rgba(${colorRgb},0.08)`, color, border: `1px solid rgba(${colorRgb},0.2)`, borderRadius: 5, padding: '3px 9px', fontFamily: "'DM Mono',monospace" }}>{tag}</span>
        </div>
      </div>

      <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 12, fontFamily: "'DM Mono',monospace" }}>{hint}</div>

      {state === 'confirming' && (
        <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14 }}>
            <span style={{ color: ACCENT3, fontSize: 18, flexShrink: 0 }}>⚠</span>
            <div>
              <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500, marginBottom: 4 }}>Replace existing data?</div>
              <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.6 }}>
                {label} data for <span style={{ color: ACCENT3, fontFamily: "'DM Mono',monospace" }}>{targetMonth?.full} · {fy}</span> already exists. Replacing it will overwrite all previously synced figures for this month.
              </div>
              <div style={{ fontSize: 11, color: '#4b5563', fontFamily: "'DM Mono',monospace", marginTop: 6 }}>File: {fileName}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onConfirm} style={{ flex: 1, background: ACCENT3, color: '#000', border: 'none', borderRadius: 7, padding: '9px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Syne',sans-serif" }}>Yes, Replace</button>
            <button onClick={onCancel}  style={{ flex: 1, background: 'transparent', color: '#6b7280', border: '1px solid #2a2d3a', borderRadius: 7, padding: '9px', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Mono',monospace" }}>Cancel</button>
          </div>
        </div>
      )}

      {state === 'confirm-delete' && (
        <div style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14 }}>
            <span style={{ color: RED, fontSize: 18, flexShrink: 0 }}>⚠</span>
            <div>
              <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500, marginBottom: 4 }}>Delete uploaded data?</div>
              <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.6 }}>
                This will permanently delete the {label} data for <span style={{ color: RED, fontFamily: "'DM Mono',monospace" }}>{targetMonth?.full} · {fy}</span>. This cannot be undone.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onDelete} style={{ flex: 1, background: RED, color: '#000', border: 'none', borderRadius: 7, padding: '9px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Syne',sans-serif" }}>Yes, Delete</button>
            <button onClick={() => setState('idle')} style={{ flex: 1, background: 'transparent', color: '#6b7280', border: '1px solid #2a2d3a', borderRadius: 7, padding: '9px', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Mono',monospace" }}>Cancel</button>
          </div>
        </div>
      )}

      {(state === 'idle' || state === 'dragging') && (
        <div
          className="upload-zone"
          onDragOver={e => { e.preventDefault(); setState('dragging') }}
          onDragLeave={() => setState('idle')}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleDrop(f) }}
          onClick={() => inputRef.current?.click()}
          style={{ border: `2px dashed ${state === 'dragging' ? color : isExisting ? 'rgba(245,158,11,0.4)' : '#2a2d3a'}`, borderRadius: 12, padding: '24px 20px', textAlign: 'center', cursor: 'pointer', background: state === 'dragging' ? `rgba(${colorRgb},0.04)` : '#0a0d15' }}
        >
          {isExisting ? (
            <>
              <div style={{ fontSize: 22, marginBottom: 8 }}>↺</div>
              <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 4 }}>Drop new file to replace existing data</div>
              <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 14 }}>Current data from {existingDate} will be overwritten after confirmation</div>
              <div style={{ display: 'inline-block', background: 'rgba(245,158,11,0.12)', color: ACCENT3, border: '1px solid rgba(245,158,11,0.3)', borderRadius: 7, padding: '7px 20px', fontSize: 12, fontWeight: 600 }}>Browse to Replace</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 28, marginBottom: 8 }}>⊕</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 14 }}>Drop JSON file or click to browse</div>
              <div style={{ display: 'inline-block', background: color, color: '#000', borderRadius: 7, padding: '8px 22px', fontSize: 12, fontWeight: 600 }}>Browse File</div>
            </>
          )}
        </div>
      )}

      {state === 'staged' && (
        <div style={{ background: '#0a0d15', border: `1px solid ${color}`, borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22, color }}>✓</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color, fontFamily: "'Syne',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</div>
              <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>{isExisting ? 'Ready to replace existing data' : 'Parsed · Ready to sync'}</div>
            </div>
            <button onClick={() => setState('idle')} style={{ fontSize: 11, color: '#4b5563', cursor: 'pointer', fontFamily: "'DM Mono',monospace", background: 'transparent', border: '1px solid #2a2d3a', borderRadius: 5, padding: '4px 10px' }}>Change</button>
          </div>
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #1a1d2a', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[
              { k: 'Period', v: type === 'pl' ? `${targetMonth?.full} only` : `1 Apr → ${targetMonth?.full} end` },
              { k: 'FY',     v: fy },
              { k: 'Action', v: isExisting ? 'Overwrite' : 'New insert' },
            ].map(r => (
              <div key={r.k}>
                <div style={{ fontSize: 9, color: '#374151', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: 1 }}>{r.k}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{r.v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {state === 'synced' && (
        <div style={{ background: 'rgba(0,229,160,0.06)', border: '1px solid rgba(0,229,160,0.2)', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 22, color: ACCENT, marginBottom: 4 }}>✓</div>
          <div style={{ fontSize: 13, color: ACCENT, fontFamily: "'Syne',sans-serif", fontWeight: 600 }}>Synced to Supabase</div>
        </div>
      )}
    </div>
  )
}

interface UploadPageProps {
  fy: string
  selectedMonth: number | null
  uploadStatus: UploadStatus
  onDataRefresh: () => void
}

export default function UploadPage({ fy, selectedMonth, uploadStatus, onDataRefresh }: UploadPageProps) {
  const [plState,      setPLState]      = useState<UploadState>('idle')
  const [bsState,      setBSState]      = useState<UploadState>('idle')
  const [plFile,       setPLFile]       = useState<File | null>(null)
  const [bsFile,       setBSFile]       = useState<File | null>(null)
  const [plFileName,   setPLFileName]   = useState('')
  const [bsFileName,   setBSFileName]   = useState('')
  const [confirmWhich, setConfirmWhich] = useState<'pl' | 'bs' | null>(null)
  const [uploading,    setUploading]    = useState(false)
  const [uploadError,  setUploadError]  = useState<string | null>(null)

  const targetMonth = selectedMonth !== null ? MONTHS[selectedMonth] : null
  const existingPL  = targetMonth ? uploadStatus.pl.includes(targetMonth.idx) : false
  const existingBS  = targetMonth ? uploadStatus.bs.includes(targetMonth.idx) : false

  useEffect(() => {
    setPLState('idle'); setBSState('idle')
    setPLFile(null);    setBSFile(null)
    setPLFileName('');  setBSFileName('')
    setConfirmWhich(null); setUploadError(null)
  }, [selectedMonth, fy])

  function handleFile(type: 'pl' | 'bs', file: File) {
    const isExisting = type === 'pl' ? existingPL : existingBS
    if (type === 'pl') {
      setPLFile(file); setPLFileName(file.name)
      if (isExisting) { setPLState('confirming'); setConfirmWhich('pl') } else setPLState('staged')
    } else {
      setBSFile(file); setBSFileName(file.name)
      if (isExisting) { setBSState('confirming'); setConfirmWhich('bs') } else setBSState('staged')
    }
  }

  function confirmReplace(type: 'pl' | 'bs') {
    if (type === 'pl') setPLState('staged'); else setBSState('staged')
    setConfirmWhich(null)
  }

  function cancelReplace(type: 'pl' | 'bs') {
    if (type === 'pl') { setPLState('idle'); setPLFile(null); setPLFileName('') }
    else               { setBSState('idle'); setBSFile(null); setBSFileName('') }
    setConfirmWhich(null)
  }

  async function handleDelete(type: 'pl' | 'bs') {
    if (!targetMonth) return
    setUploading(true)
    setUploadError(null)
    try {
      const res  = await fetch('/api/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ financialYear: fy, monthIndex: targetMonth.idx, type }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      if (type === 'pl') setPLState('idle'); else setBSState('idle')
      onDataRefresh()
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Delete failed')
      if (type === 'pl') setPLState('idle'); else setBSState('idle')
    } finally {
      setUploading(false)
    }
  }

  async function handleSync() {
    if (!targetMonth) return
    setUploading(true)
    setUploadError(null)
    try {
      if (plFile && plState === 'staged') {
        const fd = new FormData()
        fd.append('file', plFile)
        fd.append('financialYear', fy)
        fd.append('monthIndex', String(targetMonth.idx))
        fd.append('monthName', targetMonth.full)
        const res  = await fetch('/api/upload-pl', { method: 'POST', body: fd })
        const json = await res.json()
        if (!json.success) throw new Error(json.error)
        setPLState('synced')
      }
      if (bsFile && bsState === 'staged') {
        const fd = new FormData()
        fd.append('file', bsFile)
        fd.append('financialYear', fy)
        fd.append('monthIndex', String(targetMonth.idx))
        fd.append('monthName', targetMonth.full)
        const res  = await fetch('/api/upload-bs', { method: 'POST', body: fd })
        const json = await res.json()
        if (!json.success) throw new Error(json.error)
        setBSState('synced')
      }
      onDataRefresh()
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const bothReady   = plState === 'staged' && bsState === 'staged'
  const eitherReady = (plState === 'staged' || bsState === 'staged') && !uploading
  const confirming  = confirmWhich !== null

  return (
    <div className="fade-in">
      <SectionHeader
        title="Upload Data"
        sub={targetMonth ? `${targetMonth.full} · ${fy}` : `Select a month from the filter bar above · ${fy}`}
      />

      {!targetMonth && (
        <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '14px 16px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ color: ACCENT3, fontSize: 16 }}>⚠</span>
          <div>
            <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500, marginBottom: 3 }}>Select a month first</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Pick a specific month from the filter bar above before uploading.</div>
          </div>
        </div>
      )}

      {targetMonth && (
        <div style={{ background: 'rgba(0,229,160,0.04)', border: '1px solid rgba(0,229,160,0.12)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <span style={{ color: ACCENT, fontSize: 14 }}>◎</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>
              <span style={{ color: ACCENT, fontFamily: "'DM Mono',monospace", fontWeight: 600 }}>{targetMonth.full} · {fy}</span>
              {(existingPL || existingBS) && (
                <span style={{ marginLeft: 8, fontSize: 11, color: ACCENT3 }}>
                  — {existingPL && existingBS ? 'Both files already uploaded' : existingPL ? 'P&L already uploaded' : 'Balance Sheet already uploaded'}
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: '#4b5563', marginTop: 4, fontFamily: "'DM Mono',monospace" }}>
              P&L → {targetMonth.full} only &nbsp;·&nbsp; B/S → 1 Apr to {targetMonth.full} end
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14, marginBottom: 18, pointerEvents: targetMonth ? 'auto' : 'none', opacity: targetMonth ? 1 : 0.35 }}>
        <FileZone
          type="pl" label="P&L Statement" tag="MONTHLY" colorRgb="0,229,160"
          hint={targetMonth ? `${targetMonth.full} ${fy} · monthly P&L only` : 'Select a month first'}
          existingDate={targetMonth ? `${targetMonth.short} ${fy}` : ''}
          state={plState} setState={setPLState} fileName={plFileName} isExisting={existingPL}
          onFile={f => handleFile('pl', f)}
          onConfirm={() => confirmReplace('pl')} onCancel={() => cancelReplace('pl')}
          onDelete={() => handleDelete('pl')}
          targetMonth={targetMonth ?? null} fy={fy}
        />
        <FileZone
          type="bs" label="Balance Sheet" tag="CUMULATIVE" colorRgb="59,130,246"
          hint={targetMonth ? `1 Apr to ${targetMonth.full} end · ${fy}` : 'Select a month first'}
          existingDate={targetMonth ? `${targetMonth.short} ${fy}` : ''}
          state={bsState} setState={setBSState} fileName={bsFileName} isExisting={existingBS}
          onFile={f => handleFile('bs', f)}
          onConfirm={() => confirmReplace('bs')} onCancel={() => cancelReplace('bs')}
          onDelete={() => handleDelete('bs')}
          targetMonth={targetMonth ?? null} fy={fy}
        />
      </div>

      {targetMonth && (
        <>
          <button
            disabled={!eitherReady || confirming || uploading}
            onClick={handleSync}
            style={{ width: '100%', background: uploading ? '#1a1d2a' : bothReady ? ACCENT : eitherReady ? ACCENT2 : '#1a1d2a', color: eitherReady && !uploading ? '#000' : '#374151', border: 'none', borderRadius: 10, padding: '14px', fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, cursor: eitherReady && !uploading ? 'pointer' : 'default', transition: 'all 0.25s ease', marginBottom: 8 }}
          >
            {uploading
              ? '⟳  Syncing…'
              : bothReady
              ? `⊕  Sync Both · ${targetMonth.full} ${fy} to Supabase`
              : eitherReady
              ? `⊕  Sync ${plState === 'staged' ? 'P&L' : 'Balance Sheet'} · ${targetMonth.full} ${fy} to Supabase`
              : 'Upload at least one file to sync'}
          </button>
          {uploadError && (
            <div style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: RED, display: 'flex', gap: 8 }}>
              <span>⚠</span> {uploadError}
            </div>
          )}
        </>
      )}

      <div className="card" style={{ background: '#0f1117', border: '1px solid #1a1d2a', borderRadius: 12, overflow: 'hidden', marginTop: targetMonth ? 8 : 0 }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #1a1d2a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: '#9ca3af', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: 1 }}>{fy} — Upload Status</div>
          <div style={{ fontSize: 10, color: '#374151', fontFamily: "'DM Mono',monospace" }}>Click a month above to manage its files</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0 }}>
          {MONTHS.map((m, i) => {
            const mHasPL = uploadStatus.pl.includes(i)
            const mHasBS = uploadStatus.bs.includes(i)
            const both   = mHasPL && mHasBS
            const isSel  = selectedMonth === i
            return (
              <div key={m.idx} style={{ padding: '12px 14px', borderBottom: '1px solid #12151f', borderRight: '1px solid #12151f', background: isSel ? 'rgba(0,229,160,0.04)' : 'transparent', borderLeft: isSel ? `2px solid ${ACCENT}` : '2px solid transparent' }}>
                <div style={{ fontSize: 12, color: both ? '#e2e8f0' : '#374151', fontWeight: both ? 500 : 400 }}>{m.short}</div>
                <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                  <span style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", color: mHasPL ? ACCENT : '#2a2d3a', background: mHasPL ? 'rgba(0,229,160,0.08)' : 'transparent', borderRadius: 3, padding: '1px 5px', border: `1px solid ${mHasPL ? 'rgba(0,229,160,0.2)' : '#1a1d2a'}` }}>P&L</span>
                  <span style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", color: mHasBS ? ACCENT2 : '#2a2d3a', background: mHasBS ? 'rgba(59,130,246,0.08)' : 'transparent', borderRadius: 3, padding: '1px 5px', border: `1px solid ${mHasBS ? 'rgba(59,130,246,0.2)' : '#1a1d2a'}` }}>B/S</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

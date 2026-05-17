import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { parseBS } from '@/lib/parsers/bs-parser'

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    const financialYear = form.get('financialYear') as string | null
    const monthIndex = parseInt(form.get('monthIndex') as string, 10)
    const monthName = form.get('monthName') as string | null

    if (!file || !financialYear || isNaN(monthIndex) || !monthName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: file, financialYear, monthIndex, monthName' },
        { status: 400 }
      )
    }

    // Decode UTF-16 LE (Tally export format)
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const jsonText = buffer.slice(2).toString('utf16le') // strip BOM
    const jsonData = JSON.parse(jsonText)

    // ── Upsert upload record ──────────────────────────────────────
    const { data: uploadRow, error: uploadErr } = await supabaseAdmin
      .from('uploads')
      .upsert(
        {
          financial_year: financialYear,
          month_index: monthIndex,
          month_name: monthName,
          file_type: 'bs',
          file_name: file.name,
          storage_path: `${financialYear}/${monthIndex}/bs.json`,
        },
        { onConflict: 'financial_year,month_index,file_type' }
      )
      .select('id')
      .single()

    if (uploadErr) throw new Error(`Upload upsert failed: ${uploadErr.message}`)
    const uploadId = uploadRow.id

    // ── Parse ─────────────────────────────────────────────────────
    const { summary, lineItems } = parseBS(jsonData, financialYear, monthIndex, monthName, uploadId)

    // ── Upsert bs_summary ─────────────────────────────────────────
    const { error: summaryErr } = await supabaseAdmin
      .from('bs_summary')
      .upsert(
        {
          upload_id: uploadId,
          financial_year: financialYear,
          month_index: monthIndex,
          month_name: monthName,
          fixed_assets: summary.fixed_assets,
          investments: summary.investments,
          cash_and_bank: summary.cash_and_bank,
          debtors: summary.debtors,
          inventory: summary.inventory,
          other_current_assets: summary.other_current_assets,
          share_capital: summary.share_capital,
          reserves: summary.reserves,
          secured_loans: summary.secured_loans,
          unsecured_loans: summary.unsecured_loans,
          creditors: summary.creditors,
          other_current_liabilities: summary.other_current_liabilities,
          profit_and_loss: summary.profit_and_loss,
        },
        { onConflict: 'financial_year,month_index' }
      )

    if (summaryErr) throw new Error(`BS summary upsert failed: ${summaryErr.message}`)

    // ── Replace bs_line_items ─────────────────────────────────────
    const { error: deleteErr } = await supabaseAdmin
      .from('bs_line_items')
      .delete()
      .eq('financial_year', financialYear)
      .eq('month_index', monthIndex)

    if (deleteErr) throw new Error(`BS line items delete failed: ${deleteErr.message}`)

    if (lineItems.length > 0) {
      const rows = lineItems.map((li) => ({
        upload_id: li.upload_id,
        financial_year: li.financial_year,
        month_index: li.month_index,
        section: li.section,
        ledger_name: li.ledger_name,
        amount: li.amount,
      }))
      const { error: insertErr } = await supabaseAdmin.from('bs_line_items').insert(rows)
      if (insertErr) throw new Error(`BS line items insert failed: ${insertErr.message}`)
    }

    // ── Upload raw file to Storage ────────────────────────────────
    const storagePath = `${financialYear}/${monthIndex}/bs.json`
    await supabaseAdmin.storage
      .from('tally-exports')
      .upload(storagePath, buffer, { upsert: true, contentType: 'application/json' })

    return NextResponse.json({ success: true, summary })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

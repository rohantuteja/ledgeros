import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { parsePL } from '@/lib/parsers/pl-parser'

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
          file_type: 'pl',
          file_name: file.name,
          storage_path: `${financialYear}/${monthIndex}/pl.json`,
        },
        { onConflict: 'financial_year,month_index,file_type' }
      )
      .select('id')
      .single()

    if (uploadErr) throw new Error(`Upload upsert failed: ${uploadErr.message}`)
    const uploadId = uploadRow.id

    // ── Parse ─────────────────────────────────────────────────────
    const { summary, lineItems } = parsePL(jsonData, financialYear, monthIndex, monthName, uploadId)

    // ── Upsert pl_summary ─────────────────────────────────────────
    const { error: summaryErr } = await supabaseAdmin
      .from('pl_summary')
      .upsert(
        {
          upload_id: uploadId,
          financial_year: financialYear,
          month_index: monthIndex,
          month_name: monthName,
          trading_sales: summary.trading_sales,
          trading_costs: summary.trading_costs,
          gross_profit: summary.gross_profit,
          indirect_income: summary.indirect_income,
          indirect_expenses: summary.indirect_expenses,
          net_profit: summary.net_profit,
        },
        { onConflict: 'financial_year,month_index' }
      )

    if (summaryErr) throw new Error(`PL summary upsert failed: ${summaryErr.message}`)

    // ── Replace pl_line_items ─────────────────────────────────────
    const { error: deleteErr } = await supabaseAdmin
      .from('pl_line_items')
      .delete()
      .eq('financial_year', financialYear)
      .eq('month_index', monthIndex)

    if (deleteErr) throw new Error(`PL line items delete failed: ${deleteErr.message}`)

    if (lineItems.length > 0) {
      const rows = lineItems.map((li) => ({
        upload_id: li.upload_id,
        financial_year: li.financial_year,
        month_index: li.month_index,
        section: li.section,
        ledger_name: li.ledger_name,
        amount: li.amount,
      }))
      const { error: insertErr } = await supabaseAdmin.from('pl_line_items').insert(rows)
      if (insertErr) throw new Error(`PL line items insert failed: ${insertErr.message}`)
    }

    // ── Upload raw file to Storage ────────────────────────────────
    const storagePath = `${financialYear}/${monthIndex}/pl.json`
    await supabaseAdmin.storage
      .from('tally-exports')
      .upload(storagePath, buffer, { upsert: true, contentType: 'application/json' })

    return NextResponse.json({ success: true, summary })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// "FY 25-26" → "FY 24-25"
function getPrevFy(fy: string): string {
  const m = fy.match(/^FY (\d{2})-(\d{2})$/)
  if (!m) return ''
  const s = parseInt(m[1]) - 1
  const e = parseInt(m[2]) - 1
  return `FY ${s < 10 ? '0' + s : s}-${e < 10 ? '0' + e : e}`
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const fy = searchParams.get('fy')

    if (!fy) {
      return NextResponse.json(
        { success: false, error: 'Missing required query param: fy' },
        { status: 400 }
      )
    }

    const prevFy = getPrevFy(fy)

    const [
      uploadsResult,
      plResult,
      bsResult,
      expenseItemsResult,
      bsItemsResult,
      prevMarchBsResult,
      prevMarchBsItemsResult,
    ] = await Promise.all([
      supabaseAdmin
        .from('uploads')
        .select('month_index, file_type')
        .eq('financial_year', fy),
      supabaseAdmin
        .from('pl_summary')
        .select('*')
        .eq('financial_year', fy)
        .order('month_index', { ascending: true }),
      supabaseAdmin
        .from('bs_summary')
        .select('*')
        .eq('financial_year', fy)
        .order('month_index', { ascending: true }),
      supabaseAdmin
        .from('pl_line_items')
        .select('month_index, ledger_name, amount, section')
        .eq('financial_year', fy),
      supabaseAdmin
        .from('bs_line_items')
        .select('month_index, ledger_name, amount, section')
        .eq('financial_year', fy),
      // Previous FY's March (month_index=11) for cash flow opening balance
      prevFy
        ? supabaseAdmin
            .from('bs_summary')
            .select('*')
            .eq('financial_year', prevFy)
            .eq('month_index', 11)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      prevFy
        ? supabaseAdmin
            .from('bs_line_items')
            .select('ledger_name, amount, section')
            .eq('financial_year', prevFy)
            .eq('month_index', 11)
        : Promise.resolve({ data: [], error: null }),
    ])

    if (uploadsResult.error) throw new Error(`Uploads fetch failed: ${uploadsResult.error.message}`)
    if (plResult.error) throw new Error(`PL fetch failed: ${plResult.error.message}`)
    if (bsResult.error) throw new Error(`BS fetch failed: ${bsResult.error.message}`)
    if (expenseItemsResult.error) throw new Error(`Expense items fetch failed: ${expenseItemsResult.error.message}`)
    if (bsItemsResult.error) throw new Error(`BS items fetch failed: ${bsItemsResult.error.message}`)

    const uploads = uploadsResult.data ?? []
    const uploadStatus = {
      pl: uploads.filter((u) => u.file_type === 'pl').map((u) => u.month_index),
      bs: uploads.filter((u) => u.file_type === 'bs').map((u) => u.month_index),
    }

    return NextResponse.json({
      uploadStatus,
      plData: plResult.data ?? [],
      bsData: bsResult.data ?? [],
      expenseItems: expenseItemsResult.data ?? [],
      bsItems: bsItemsResult.data ?? [],
      prevMarchBsRow: prevMarchBsResult.data ?? null,
      prevMarchBsItems: prevMarchBsItemsResult.data ?? [],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

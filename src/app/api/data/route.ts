import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

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

    const [uploadsResult, plResult, bsResult, expenseItemsResult] = await Promise.all([
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
        .eq('financial_year', fy)
        .in('section', ['indirect_expenses', 'direct_expenses', 'trading_costs']),
    ])

    if (uploadsResult.error) throw new Error(`Uploads fetch failed: ${uploadsResult.error.message}`)
    if (plResult.error) throw new Error(`PL fetch failed: ${plResult.error.message}`)
    if (bsResult.error) throw new Error(`BS fetch failed: ${bsResult.error.message}`)
    if (expenseItemsResult.error) throw new Error(`Expense items fetch failed: ${expenseItemsResult.error.message}`)

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
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

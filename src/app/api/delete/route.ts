import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { financialYear, monthIndex, type } = await req.json()

    if (!financialYear || monthIndex === undefined || !type) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    if (type === 'pl') {
      await supabaseAdmin.from('pl_line_items').delete().eq('financial_year', financialYear).eq('month_index', monthIndex)
      await supabaseAdmin.from('pl_summary').delete().eq('financial_year', financialYear).eq('month_index', monthIndex)
    } else {
      await supabaseAdmin.from('bs_line_items').delete().eq('financial_year', financialYear).eq('month_index', monthIndex)
      await supabaseAdmin.from('bs_summary').delete().eq('financial_year', financialYear).eq('month_index', monthIndex)
    }

    const { error: uploadErr } = await supabaseAdmin
      .from('uploads')
      .delete()
      .eq('financial_year', financialYear)
      .eq('month_index', monthIndex)
      .eq('file_type', type)

    if (uploadErr) throw new Error(`Upload delete failed: ${uploadErr.message}`)

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

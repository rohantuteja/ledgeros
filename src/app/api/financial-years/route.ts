import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('financial_years')
    .select('name')
    .order('name', { ascending: false })
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  return NextResponse.json({ fyList: (data ?? []).map(r => r.name) })
}

export async function POST(req: NextRequest) {
  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 })
  const { error } = await supabaseAdmin.from('financial_years').insert({ name: name.trim() })
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const { name } = await req.json()
  if (!name) return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 })

  const [a, b, c, d, e] = await Promise.all([
    supabaseAdmin.from('pl_line_items').delete().eq('financial_year', name),
    supabaseAdmin.from('pl_summary').delete().eq('financial_year', name),
    supabaseAdmin.from('bs_line_items').delete().eq('financial_year', name),
    supabaseAdmin.from('bs_summary').delete().eq('financial_year', name),
    supabaseAdmin.from('uploads').delete().eq('financial_year', name),
  ])
  const err = a.error || b.error || c.error || d.error || e.error
  if (err) return NextResponse.json({ success: false, error: err.message }, { status: 500 })

  const { error } = await supabaseAdmin.from('financial_years').delete().eq('name', name)
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

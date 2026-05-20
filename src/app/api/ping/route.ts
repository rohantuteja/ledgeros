import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Keep-alive endpoint — called by Vercel cron every 3 days to prevent
// Supabase free-tier project from being paused due to inactivity.
export async function GET() {
  const { error } = await supabaseAdmin
    .from('financial_years')
    .select('name')
    .limit(1)

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, ts: new Date().toISOString() })
}

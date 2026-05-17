/* eslint-disable @typescript-eslint/no-explicit-any */
import type { BSSummary, BSLineItem } from '@/lib/types'

function getMainAmt(amtArr: any[]): number {
  if (!Array.isArray(amtArr) || !amtArr[0]) return 0
  return amtArr[0].bsmainamt ?? 0
}

function getSubAmt(amtArr: any[]): number {
  if (!Array.isArray(amtArr) || !amtArr[0]) return 0
  return amtArr[0].bssubamt ?? amtArr[0].bsmainamt ?? 0
}

function getGroupName(detail: any): string {
  return detail?.bsname?.dspaccname?.dspdispname ?? ''
}

function extractSubItems(
  group: any,
  section: string,
  uploadId: string,
  financialYear: string,
  monthIndex: number,
  flipSign: boolean
): BSLineItem[] {
  const items: BSLineItem[] = []
  const subDetails = group?.bsgrpexplosion?.bsdetail
  if (!Array.isArray(subDetails)) return items

  for (const d of subDetails) {
    const rawAmt = getSubAmt(d.bsamt ?? [])
    if (rawAmt === 0) continue
    items.push({
      id: '',
      upload_id: uploadId,
      financial_year: financialYear,
      month_index: monthIndex,
      section,
      ledger_name: getGroupName(d),
      amount: flipSign ? -rawAmt : rawAmt,
      created_at: '',
    })
  }
  return items
}

function parseCapitalGroup(
  group: any
): { share_capital: number; reserves: number } {
  let share_capital = 0
  let reserves = 0
  const subDetails = group?.bsgrpexplosion?.bsdetail ?? []

  for (const d of subDetails) {
    const name = getGroupName(d).toLowerCase()
    const amt = getSubAmt(d.bsamt ?? [])
    if (amt === 0) continue

    // "Issued and Subscribed Capital" → share capital
    if (name.includes('issued') || name.includes('subscribed')) {
      share_capital += amt
    } else {
      // Reserve & Surplus, Share Premium, Convertible Notes, etc.
      reserves += amt
    }
  }

  // Fallback: if no sub-items parsed, use the group total as share_capital
  if (share_capital === 0 && reserves === 0) {
    share_capital = getMainAmt(group?.bsamt ?? [])
  }

  return { share_capital, reserves }
}

function parseLoanGroup(
  group: any
): { secured_loans: number; unsecured_loans: number } {
  let secured_loans = 0
  let unsecured_loans = 0
  const subDetails = group?.bsgrpexplosion?.bsdetail ?? []

  for (const d of subDetails) {
    const name = getGroupName(d).toLowerCase()
    const amt = getSubAmt(d.bsamt ?? [])
    if (amt === 0) continue

    if (name.includes('secured') && !name.includes('unsecured')) {
      secured_loans += amt
    } else {
      unsecured_loans += amt
    }
  }

  if (secured_loans === 0 && unsecured_loans === 0) {
    unsecured_loans = getMainAmt(group?.bsamt ?? [])
  }

  return { secured_loans, unsecured_loans }
}

function parseCurrentLiabGroup(
  group: any
): { creditors: number; other_current_liabilities: number } {
  let creditors = 0
  let other_current_liabilities = 0
  const subDetails = group?.bsgrpexplosion?.bsdetail ?? []

  for (const d of subDetails) {
    const name = getGroupName(d).toLowerCase()
    const amt = getSubAmt(d.bsamt ?? [])
    if (amt === 0) continue

    if (name.includes('creditor')) {
      creditors += amt
    } else {
      other_current_liabilities += amt
    }
  }

  if (creditors === 0 && other_current_liabilities === 0) {
    other_current_liabilities = getMainAmt(group?.bsamt ?? [])
  }

  return { creditors, other_current_liabilities }
}

function parseCurrentAssetGroup(group: any): {
  cash_and_bank: number
  debtors: number
  inventory: number
  other_current_assets: number
} {
  let cash_and_bank = 0
  let debtors = 0
  let inventory = 0
  let other_current_assets = 0
  const subDetails = group?.bsgrpexplosion?.bsdetail ?? []

  for (const d of subDetails) {
    const name = getGroupName(d).toLowerCase()
    const rawAmt = getSubAmt(d.bsamt ?? [])
    if (rawAmt === 0) continue
    const amt = -rawAmt // assets are negative in Tally → flip to positive

    if (name.includes('stock') || name.includes('inventory')) {
      inventory += amt
    } else if (name.includes('debtor')) {
      debtors += amt
    } else if (name.includes('cash') || name.includes('bank')) {
      cash_and_bank += amt
    } else {
      other_current_assets += amt
    }
  }

  return { cash_and_bank, debtors, inventory, other_current_assets }
}

export function parseBS(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jsonData: any,
  financialYear: string,
  monthIndex: number,
  monthName: string,
  uploadId: string
): { summary: BSSummary; lineItems: BSLineItem[] } {
  const bsinfo = jsonData?.bsbody?.bsinfo ?? {}
  const sources: any[] = bsinfo.bssources?.bsdetail ?? []
  const apps: any[] = bsinfo.bsapp?.bsdetail ?? []
  const lineItems: BSLineItem[] = []

  // ── Liabilities (bssources) ───────────────────────────────────
  let share_capital = 0
  let reserves = 0
  let secured_loans = 0
  let unsecured_loans = 0
  let creditors = 0
  let other_current_liabilities = 0
  let profit_and_loss = 0

  for (const group of sources) {
    const name = getGroupName(group).toLowerCase()

    if (name.includes('capital') && !name.includes('liability')) {
      const parsed = parseCapitalGroup(group)
      share_capital += parsed.share_capital
      reserves += parsed.reserves
      lineItems.push(...extractSubItems(group, 'capital', uploadId, financialYear, monthIndex, false))
    } else if (name.includes('loan')) {
      const parsed = parseLoanGroup(group)
      secured_loans += parsed.secured_loans
      unsecured_loans += parsed.unsecured_loans
      lineItems.push(...extractSubItems(group, 'loans', uploadId, financialYear, monthIndex, false))
    } else if (name.includes('current liabilit')) {
      const parsed = parseCurrentLiabGroup(group)
      creditors += parsed.creditors
      other_current_liabilities += parsed.other_current_liabilities
      lineItems.push(...extractSubItems(group, 'current_liabilities', uploadId, financialYear, monthIndex, false))
    } else if (name.includes('profit') || name.includes('p&l') || name.includes('p & l')) {
      // Store as-is: positive = profit, negative = loss
      profit_and_loss = getMainAmt(group.bsamt ?? [])
    }
    // Suspense and other unrecognised groups are ignored for summary
  }

  // ── Assets (bsapp) ────────────────────────────────────────────
  let fixed_assets = 0
  let investments = 0
  let cash_and_bank = 0
  let debtors = 0
  let inventory = 0
  let other_current_assets = 0

  for (const group of apps) {
    const name = getGroupName(group).toLowerCase()

    if (name.includes('fixed asset')) {
      fixed_assets = -getMainAmt(group.bsamt ?? []) // flip negative → positive
      lineItems.push(...extractSubItems(group, 'fixed_assets', uploadId, financialYear, monthIndex, true))
    } else if (name.includes('investment')) {
      investments = -getMainAmt(group.bsamt ?? []) // flip
      lineItems.push(...extractSubItems(group, 'investments', uploadId, financialYear, monthIndex, true))
    } else if (name.includes('current asset')) {
      const parsed = parseCurrentAssetGroup(group)
      cash_and_bank = parsed.cash_and_bank
      debtors = parsed.debtors
      inventory = parsed.inventory
      other_current_assets = parsed.other_current_assets
      lineItems.push(...extractSubItems(group, 'current_assets', uploadId, financialYear, monthIndex, true))
    }
  }

  const summary: BSSummary = {
    id: '',
    upload_id: uploadId,
    financial_year: financialYear,
    month_index: monthIndex,
    month_name: monthName,
    fixed_assets,
    investments,
    cash_and_bank,
    debtors,
    inventory,
    other_current_assets,
    share_capital,
    reserves,
    secured_loans,
    unsecured_loans,
    creditors,
    other_current_liabilities,
    profit_and_loss,
    created_at: '',
  }

  return { summary, lineItems }
}

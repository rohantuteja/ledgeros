/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PLSummary, PLLineItem } from '@/lib/types'

function getMainAmt(amtArr: any[]): number {
  if (!Array.isArray(amtArr) || !amtArr[0]) return 0
  return amtArr[0].bsmainamt ?? 0
}

function getSubAmt(amtArr: any[]): number {
  if (!Array.isArray(amtArr) || !amtArr[0]) return 0
  return amtArr[0].bssubamt ?? amtArr[0].plsubamt ?? 0
}

function getLedgerName(item: any): string {
  return (
    item?.bsname?.dspaccname?.dspdispname ??
    item?.dspaccname?.dspdispname ??
    'Unknown'
  )
}

function extractExplosionItems(
  item: any,
  section: string,
  uploadId: string,
  financialYear: string,
  monthIndex: number,
  flipSign: boolean
): PLLineItem[] {
  const items: PLLineItem[] = []
  const details = item?.bsgrpexplosion?.bsdetail
  if (!Array.isArray(details)) return items

  for (const d of details) {
    const rawAmt = getSubAmt(d.bsamt ?? [])
    if (rawAmt === 0 && !d.bsamt?.[0]?.bssubamt) continue
    items.push({
      id: '',
      upload_id: uploadId,
      financial_year: financialYear,
      month_index: monthIndex,
      section,
      ledger_name: getLedgerName(d),
      amount: flipSign ? -rawAmt : rawAmt,
      created_at: '',
    })
  }
  return items
}

function extractTradingCostItems(
  costofsales: any,
  uploadId: string,
  financialYear: string,
  monthIndex: number
): PLLineItem[] {
  const items: PLLineItem[] = []
  if (!costofsales) return items

  const push = (name: string, rawAmt: number) => {
    items.push({
      id: '',
      upload_id: uploadId,
      financial_year: financialYear,
      month_index: monthIndex,
      section: 'trading_costs',
      ledger_name: name,
      amount: -rawAmt, // flip: Tally negatives → positive cost
      created_at: '',
    })
  }

  // Opening stock, purchases, closing stock are scalar entries
  const opStock = costofsales.plopstock
  if (opStock) {
    const amt = getSubAmt(opStock.plamt ?? [])
    if (amt !== 0) push(getLedgerName(opStock), amt)
  }

  const purchase = costofsales.plpurchase
  if (purchase) {
    const amt = getSubAmt(purchase.plamt ?? [])
    if (amt !== 0) push(getLedgerName(purchase), amt)
  }

  const clStock = costofsales.plclstock
  if (clStock) {
    const amt = getSubAmt(clStock.plamt ?? [])
    if (amt !== 0) push(getLedgerName(clStock), amt)
  }

  // Direct expenses may explode into sub-items
  const dirExpenses = costofsales.pldirexpenses
  if (Array.isArray(dirExpenses)) {
    for (const dirExp of dirExpenses) {
      const subDetails = dirExp?.bsgrpexplosion?.bsdetail
      if (Array.isArray(subDetails)) {
        for (const d of subDetails) {
          const rawAmt = getSubAmt(d.bsamt ?? [])
          if (rawAmt === 0) continue
          items.push({
            id: '',
            upload_id: uploadId,
            financial_year: financialYear,
            month_index: monthIndex,
            section: 'trading_costs',
            ledger_name: getLedgerName(d),
            amount: -rawAmt,
            created_at: '',
          })
        }
      } else {
        // No explosion — use the group total
        const amt = getSubAmt(dirExp?.plamt ?? [])
        if (amt !== 0) push(getLedgerName(dirExp), amt)
      }
    }
  }

  return items
}

export function parsePL(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jsonData: any,
  financialYear: string,
  monthIndex: number,
  monthName: string,
  uploadId: string
): { summary: PLSummary; lineItems: PLLineItem[] } {
  const plbody = jsonData?.plbody ?? {}
  const lineItems: PLLineItem[] = []

  // ── Trading Sales ─────────────────────────────────────────────
  const salesSection = plbody.pltradingsales?.pldetail?.[0]
  const tradingSales = getMainAmt(salesSection?.plamt ?? [])
  lineItems.push(
    ...extractExplosionItems(
      salesSection,
      'trading_sales',
      uploadId,
      financialYear,
      monthIndex,
      false // sales are already positive
    )
  )

  // ── Trading Costs ─────────────────────────────────────────────
  const costSection = plbody.pltradingcost?.pldetail?.[0]
  const tradingCostsRaw = getMainAmt(costSection?.plamt ?? [])
  const tradingCosts = -tradingCostsRaw // Tally stores as negative

  lineItems.push(
    ...extractTradingCostItems(
      costSection?.plcostofsales,
      uploadId,
      financialYear,
      monthIndex
    )
  )

  // ── Indirect Income ───────────────────────────────────────────
  const incomeSection = plbody.plincomestmt?.pldetail?.[0]
  const indirectIncome = getMainAmt(incomeSection?.plamt ?? [])
  lineItems.push(
    ...extractExplosionItems(
      incomeSection,
      'indirect_income',
      uploadId,
      financialYear,
      monthIndex,
      false
    )
  )

  // ── Indirect Expenses ─────────────────────────────────────────
  const expenseSection = plbody.plexpensestmt?.pldetail?.[0]
  const indirectExpensesRaw = getMainAmt(expenseSection?.plamt ?? [])
  const indirectExpenses = -indirectExpensesRaw // Tally stores as negative
  lineItems.push(
    ...extractExplosionItems(
      expenseSection,
      'indirect_expenses',
      uploadId,
      financialYear,
      monthIndex,
      true // flip to positive
    )
  )

  const grossProfit = tradingSales - tradingCosts
  const netProfit = grossProfit + indirectIncome - indirectExpenses

  const summary: PLSummary = {
    id: '',
    upload_id: uploadId,
    financial_year: financialYear,
    month_index: monthIndex,
    month_name: monthName,
    trading_sales: tradingSales,
    trading_costs: tradingCosts,
    gross_profit: grossProfit,
    indirect_income: indirectIncome,
    indirect_expenses: indirectExpenses,
    net_profit: netProfit,
    created_at: '',
  }

  return { summary, lineItems }
}

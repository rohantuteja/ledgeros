export interface PLChartRow {
  month: string
  revenue: number
  directCosts: number
  grossProfit: number
  operatingExp: number
  netProfit: number
}

export interface BSChartRow {
  month: string
  cash: number
  debtors: number
  inventory: number
  fixedAssets: number
  creditors: number
  loans: number
  equity: number
  totalAssets: number
  totalLiabilities: number
}

export interface UploadStatus {
  pl: number[]
  bs: number[]
}

export interface ExpenseLineItem {
  month_index: number
  ledger_name: string
  amount: number
  section: string
}

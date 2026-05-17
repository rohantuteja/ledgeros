export interface Upload {
  id: string
  financial_year: string
  month_index: number
  month_name: string
  file_type: 'pl' | 'bs'
  file_name: string
  storage_path: string | null
  uploaded_at: string
}

export interface PLSummary {
  id: string
  upload_id: string | null
  financial_year: string
  month_index: number
  month_name: string
  trading_sales: number
  trading_costs: number
  gross_profit: number
  indirect_income: number
  indirect_expenses: number
  net_profit: number
  created_at: string
}

export interface PLLineItem {
  id: string
  upload_id: string | null
  financial_year: string
  month_index: number
  section: string
  ledger_name: string
  amount: number
  created_at: string
}

export interface BSSummary {
  id: string
  upload_id: string | null
  financial_year: string
  month_index: number
  month_name: string
  fixed_assets: number
  investments: number
  cash_and_bank: number
  debtors: number
  inventory: number
  other_current_assets: number
  share_capital: number
  reserves: number
  secured_loans: number
  unsecured_loans: number
  creditors: number
  other_current_liabilities: number
  profit_and_loss: number
  created_at: string
}

export interface BSLineItem {
  id: string
  upload_id: string | null
  financial_year: string
  month_index: number
  section: string
  ledger_name: string
  amount: number
  created_at: string
}

export const ACCENT  = '#00e5a0'
export const ACCENT2 = '#3b82f6'
export const ACCENT3 = '#f59e0b'
export const RED     = '#f87171'
export const PURPLE  = '#a78bfa'

export const FY_LIST = ['FY 26-27', 'FY 25-26', 'FY 24-25', 'FY 23-24']

export interface MonthEntry { short: string; full: string; idx: number }

export const MONTHS: MonthEntry[] = [
  { short: 'Apr', full: 'April',     idx: 0  },
  { short: 'May', full: 'May',       idx: 1  },
  { short: 'Jun', full: 'June',      idx: 2  },
  { short: 'Jul', full: 'July',      idx: 3  },
  { short: 'Aug', full: 'August',    idx: 4  },
  { short: 'Sep', full: 'September', idx: 5  },
  { short: 'Oct', full: 'October',   idx: 6  },
  { short: 'Nov', full: 'November',  idx: 7  },
  { short: 'Dec', full: 'December',  idx: 8  },
  { short: 'Jan', full: 'January',   idx: 9  },
  { short: 'Feb', full: 'February',  idx: 10 },
  { short: 'Mar', full: 'March',     idx: 11 },
]

export const NAV_ITEMS = [
  { id: 'overview', icon: '⬡', label: 'Overview' },
  { id: 'pl',       icon: '◈', label: 'P&L'       },
  { id: 'balance',  icon: '⊞', label: 'Balance'   },
  { id: 'cashflow', icon: '◎', label: 'Cash Flow' },
  { id: 'ledger',   icon: '≡', label: 'Ledger'    },
  { id: 'upload',   icon: '⊕', label: 'Upload'    },
]

export const fmt = (n: number): string => {
  const sign = n < 0 ? '-' : ''
  const abs  = Math.abs(n)
  const formatted = abs.toLocaleString('en-IN', { maximumFractionDigits: 2 })
  return `${sign}₹${formatted}`
}

export const fmtShort = (n: number): string => {
  const abs  = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(1)}Cr`
  if (abs >= 100000)   return `${sign}₹${(abs / 100000).toFixed(1)}L`
  return `${sign}₹${(abs / 1000).toFixed(0)}K`
}

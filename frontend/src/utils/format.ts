export function fmtMYR(val: number | null | undefined, currency = 'MYR'): string {
  if (val == null) return '-'
  return `${currency} ${val.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function fmtPct(val: number | null | undefined): string {
  if (val == null) return '-'
  const sign = val > 0 ? '+' : ''
  return `${sign}${val.toFixed(2)}%`
}

export function fmtChange(val: number | null | undefined): string {
  if (val == null) return '-'
  const sign = val > 0 ? '+' : ''
  return `${sign}${fmtMYR(val)}`
}

export function changeColor(val: number | null | undefined): string {
  if (val == null || val === 0) return 'inherit'
  return val > 0 ? '#52c41a' : '#ff4d4f'
}

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  current: 'Current 活期',
  savings: 'Savings 储蓄',
  fd: 'Fixed Deposit 定期',
  other: 'Other 其他',
}

export const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  finance_manager: 'Finance Manager',
  finance_staff: 'Finance Staff',
  view_only: 'View Only',
}

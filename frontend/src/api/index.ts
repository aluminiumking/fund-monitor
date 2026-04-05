import client from './client'

// Auth
export const login = (username: string, password: string) =>
  client.post('/auth/login', { username, password }).then((r) => r.data)

// Users
export const getMe = () => client.get('/users/me').then((r) => r.data)
export const listUsers = () => client.get('/users/').then((r) => r.data)
export const createUser = (data: any) => client.post('/users/', data).then((r) => r.data)
export const updateUser = (id: number, data: any) => client.put(`/users/${id}`, data).then((r) => r.data)

// Companies
export const listCompanies = () => client.get('/companies/').then((r) => r.data)
export const createCompany = (data: any) => client.post('/companies/', data).then((r) => r.data)
export const updateCompany = (id: number, data: any) => client.put(`/companies/${id}`, data).then((r) => r.data)

// Bank Accounts
export const listBankAccounts = (params?: any) => client.get('/bank-accounts/', { params }).then((r) => r.data)
export const createBankAccount = (data: any) => client.post('/bank-accounts/', data).then((r) => r.data)
export const updateBankAccount = (id: number, data: any) => client.put(`/bank-accounts/${id}`, data).then((r) => r.data)

// Balance Snapshots
export const listSnapshots = (params?: any) => client.get('/balance-snapshots/', { params }).then((r) => r.data)
export const createSnapshot = (data: any) => client.post('/balance-snapshots/', data).then((r) => r.data)
export const updateSnapshot = (id: number, data: any) => client.put(`/balance-snapshots/${id}`, data).then((r) => r.data)
export const auditSnapshots = (ids: number[]) => client.post('/balance-snapshots/audit', { snapshot_ids: ids }).then((r) => r.data)

// Exchange Rates
export const listRates = (params?: any) => client.get('/exchange-rates/', { params }).then((r) => r.data)
export const getLatestRate = (currency: string) => client.get(`/exchange-rates/latest/${currency}`).then((r) => r.data)
export const createRate = (data: any) => client.post('/exchange-rates/', data).then((r) => r.data)
export const updateRate = (id: number, data: any) => client.put(`/exchange-rates/${id}`, data).then((r) => r.data)

// Fund Notes
export const listFundNotes = (params?: any) => client.get('/fund-notes/', { params }).then((r) => r.data)
export const createFundNote = (data: any) => client.post('/fund-notes/', data).then((r) => r.data)
export const updateFundNote = (id: number, data: any) => client.put(`/fund-notes/${id}`, data).then((r) => r.data)
export const deleteFundNote = (id: number) => client.delete(`/fund-notes/${id}`)

// Dashboard
export const getDashboardKPI = () => client.get('/dashboard/kpi').then((r) => r.data)
export const getCompanyBreakdown = () => client.get('/dashboard/company-breakdown').then((r) => r.data)
export const getWeeklyTrend = (weeks = 12) => client.get('/dashboard/weekly-trend', { params: { weeks } }).then((r) => r.data)
export const getMonthlyTrend = (months = 12) => client.get('/dashboard/monthly-trend', { params: { months } }).then((r) => r.data)
export const getAccountBreakdown = () => client.get('/dashboard/account-breakdown').then((r) => r.data)
export const getAlerts = () => client.get('/dashboard/alerts').then((r) => r.data)

// Reports
export const getWeeklyReport = (report_date?: string) => client.get('/reports/weekly', { params: { report_date } }).then((r) => r.data)
export const getMonthlyReport = (year: number, month: number) => client.get('/reports/monthly', { params: { year, month } }).then((r) => r.data)
export const getYearlyReport = (year: number) => client.get('/reports/yearly', { params: { year } }).then((r) => r.data)
export const getAccountReport = (params?: any) => client.get('/reports/accounts', { params }).then((r) => r.data)

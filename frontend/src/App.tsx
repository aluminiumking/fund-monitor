import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AppLayout from './components/Layout/AppLayout'
import LoginPage from './pages/Login'
import DashboardPage from './pages/Dashboard'
import CompaniesPage from './pages/Companies'
import BankAccountsPage from './pages/BankAccounts'
import BalanceSnapshotsPage from './pages/BalanceSnapshots'
import ExchangeRatesPage from './pages/ExchangeRates'
import FundNotesPage from './pages/FundNotes'
import ReportsPage from './pages/Reports'
import UsersPage from './pages/Users'

dayjs.locale('zh-cn')

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="companies" element={<CompaniesPage />} />
        <Route path="bank-accounts" element={<BankAccountsPage />} />
        <Route path="balance-snapshots" element={<BalanceSnapshotsPage />} />
        <Route path="exchange-rates" element={<ExchangeRatesPage />} />
        <Route path="fund-notes" element={<FundNotesPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="users" element={<UsersPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ConfigProvider locale={zhCN} theme={{
      algorithm: theme.defaultAlgorithm,
      token: {
        colorPrimary: '#8B5E3C',
        colorLink: '#8B5E3C',
        colorSuccess: '#6B8C5A',
        colorWarning: '#C49A3C',
        colorError: '#A0443A',
        colorBgLayout: '#F5F0E8',
        colorBgContainer: '#FDFAF5',
        colorBorder: '#D4B896',
        colorBorderSecondary: '#E8DDD0',
        colorText: '#3D2B1F',
        colorTextSecondary: '#7A5C44',
        borderRadius: 8,
        fontFamily: "'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
      },
    }}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  )
}

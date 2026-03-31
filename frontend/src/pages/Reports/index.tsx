import React, { useEffect, useState } from 'react'
import { Tabs, Card, Table, Select, DatePicker, Button, Row, Col } from 'antd'
import { getWeeklyReport, getMonthlyReport, getYearlyReport, getAccountReport } from '../../api'
import { fmtMYR, fmtPct, changeColor } from '../../utils/format'
import dayjs, { Dayjs } from 'dayjs'

const changeCol = (title: string, dataIndex: string, pctIndex?: string) => ({
  title,
  dataIndex,
  key: dataIndex,
  align: 'right' as const,
  width: 140,
  render: (v: number, r: any) => (
    <span style={{ color: changeColor(v) }}>
      {fmtMYR(v)}{pctIndex && r[pctIndex] != null ? ` (${fmtPct(r[pctIndex])})` : ''}
    </span>
  ),
})

export default function ReportsPage() {
  const [weekDate, setWeekDate] = useState<Dayjs>(dayjs())
  const [monthDate, setMonthDate] = useState<Dayjs>(dayjs())
  const [year, setYear] = useState<number>(dayjs().year())
  const [weekData, setWeekData] = useState<any[]>([])
  const [monthData, setMonthData] = useState<any[]>([])
  const [yearData, setYearData] = useState<any[]>([])
  const [accountData, setAccountData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const loadWeekly = () => { setLoading(true); getWeeklyReport(weekDate.format('YYYY-MM-DD')).then(setWeekData).finally(() => setLoading(false)) }
  const loadMonthly = () => { setLoading(true); getMonthlyReport(monthDate.year(), monthDate.month() + 1).then(setMonthData).finally(() => setLoading(false)) }
  const loadYearly = () => { setLoading(true); getYearlyReport(year).then(setYearData).finally(() => setLoading(false)) }
  const loadAccounts = () => { setLoading(true); getAccountReport().then(setAccountData).finally(() => setLoading(false)) }

  useEffect(loadWeekly, [weekDate])
  useEffect(loadMonthly, [monthDate])
  useEffect(loadYearly, [year])
  useEffect(loadAccounts, [])

  const weekColumns = [
    { title: '公司', dataIndex: 'company_name', key: 'company_name', width: 160 },
    { title: '上周余额', dataIndex: 'prev_balance', key: 'prev_balance', align: 'right' as const, width: 140, render: fmtMYR },
    { title: '本周余额', dataIndex: 'curr_balance', key: 'curr_balance', align: 'right' as const, width: 140, render: fmtMYR },
    changeCol('变化', 'change', 'change_pct'),
    { title: '可动用', dataIndex: 'liquid_myr', key: 'liquid_myr', align: 'right' as const, width: 140, render: fmtMYR },
    { title: '定期', dataIndex: 'fixed_myr', key: 'fixed_myr', align: 'right' as const, width: 140, render: fmtMYR },
  ]

  const monthColumns = [
    { title: '公司', dataIndex: 'company_name', key: 'company_name', width: 160 },
    { title: '月初余额', dataIndex: 'month_start_balance', key: 'month_start_balance', align: 'right' as const, width: 140, render: fmtMYR },
    { title: '月末余额', dataIndex: 'month_end_balance', key: 'month_end_balance', align: 'right' as const, width: 140, render: fmtMYR },
    changeCol('月度变化', 'change', 'change_pct'),
  ]

  const yearColumns = [
    { title: '公司', dataIndex: 'company_name', key: 'company_name', width: 160 },
    { title: '年初余额', dataIndex: 'year_start_balance', key: 'year_start_balance', align: 'right' as const, width: 140, render: fmtMYR },
    { title: '当前余额', dataIndex: 'current_balance', key: 'current_balance', align: 'right' as const, width: 140, render: fmtMYR },
    changeCol('年度变化', 'change', 'change_pct'),
    { title: '最高', dataIndex: 'max_balance', key: 'max_balance', align: 'right' as const, width: 140, render: fmtMYR },
    { title: '最低', dataIndex: 'min_balance', key: 'min_balance', align: 'right' as const, width: 140, render: fmtMYR },
  ]

  const accountColumns = [
    { title: '公司', dataIndex: 'company_name', key: 'company_name', width: 120 },
    { title: '账户', dataIndex: 'account_display', key: 'account_display', width: 160 },
    { title: '银行', dataIndex: 'bank_name', key: 'bank_name', width: 120 },
    { title: '币种', dataIndex: 'currency', key: 'currency', width: 70 },
    { title: '类型', dataIndex: 'account_type', key: 'account_type', width: 80 },
    { title: '上期余额', dataIndex: 'prev_balance_myr', key: 'prev_balance_myr', align: 'right' as const, width: 140, render: fmtMYR },
    { title: '当前余额', dataIndex: 'curr_balance_myr', key: 'curr_balance_myr', align: 'right' as const, width: 140, render: fmtMYR },
    changeCol('变化', 'change', 'change_pct'),
    { title: '最后更新', dataIndex: 'last_snapshot_date', key: 'last_snapshot_date', width: 110 },
    { title: '距今(天)', dataIndex: 'days_since_update', key: 'days_since_update', width: 90, render: (v: number) => v != null ? v : '-' },
  ]

  const tabItems = [
    {
      key: 'weekly',
      label: '每周对比',
      children: (
        <div>
          <Row style={{ marginBottom: 16 }}>
            <Col><DatePicker value={weekDate} onChange={(d) => d && setWeekDate(d)} /></Col>
          </Row>
          <Table dataSource={weekData} columns={weekColumns} rowKey="company_id" loading={loading} size="small" scroll={{ x: 800 }} pagination={false} />
        </div>
      ),
    },
    {
      key: 'monthly',
      label: '每月对比',
      children: (
        <div>
          <Row style={{ marginBottom: 16 }}>
            <Col><DatePicker.MonthPicker value={monthDate} onChange={(d) => d && setMonthDate(d)} /></Col>
          </Row>
          <Table dataSource={monthData} columns={monthColumns} rowKey="company_id" loading={loading} size="small" scroll={{ x: 700 }} pagination={false} />
        </div>
      ),
    },
    {
      key: 'yearly',
      label: '每年对比',
      children: (
        <div>
          <Row style={{ marginBottom: 16 }}>
            <Col>
              <Select value={year} onChange={setYear} style={{ width: 120 }}
                options={Array.from({ length: 5 }, (_, i) => dayjs().year() - i).map((y) => ({ value: y, label: String(y) }))} />
            </Col>
          </Row>
          <Table dataSource={yearData} columns={yearColumns} rowKey="company_id" loading={loading} size="small" scroll={{ x: 900 }} pagination={false} />
        </div>
      ),
    },
    {
      key: 'accounts',
      label: '账户层级',
      children: (
        <div>
          <Row style={{ marginBottom: 16 }}>
            <Col><Button onClick={loadAccounts}>刷新</Button></Col>
          </Row>
          <Table dataSource={accountData} columns={accountColumns} rowKey="account_id" loading={loading} size="small" scroll={{ x: 1100 }} />
        </div>
      ),
    },
  ]

  return (
    <Card title="对比分析报表">
      <Tabs items={tabItems} />
    </Card>
  )
}

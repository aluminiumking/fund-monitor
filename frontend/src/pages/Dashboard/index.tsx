import React, { useEffect, useState, useMemo } from 'react'
import { Row, Col, Card, Statistic, Alert, Tag, Spin, Table, Tabs, Radio } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined, WarningOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { Line, Pie } from '@ant-design/charts'
import { getDashboardKPI, getCompanyBreakdown, getWeeklyTrend, getMonthlyTrend, getAlerts, getAccountBreakdown } from '../../api'
import { fmtMYR, fmtPct, changeColor } from '../../utils/format'

export default function DashboardPage() {
  const [kpi, setKpi] = useState<any>(null)
  const [breakdown, setBreakdown] = useState<any[]>([])
  const [accountBreakdown, setAccountBreakdown] = useState<any[]>([])
  const [weeklyTrend, setWeeklyTrend] = useState<any[]>([])
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [selectedCompany, setSelectedCompany] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  useEffect(() => {
    Promise.all([
      getDashboardKPI(), getCompanyBreakdown(), getAccountBreakdown(), getWeeklyTrend(12), getMonthlyTrend(12), getAlerts()
    ]).then(([k, b, ab, wt, mt, a]) => {
      setKpi(k); setBreakdown(b); setAccountBreakdown(ab); setWeeklyTrend(wt); setMonthlyTrend(mt); setAlerts(a)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const companyOptions = useMemo(() => {
    const seen = new Set<string>()
    const opts: { label: string; value: string }[] = [{ label: '全部', value: 'all' }]
    accountBreakdown.forEach((r: any) => {
      if (!seen.has(r.company_short)) {
        seen.add(r.company_short)
        opts.push({ label: r.company_short, value: r.company_short })
      }
    })
    return opts
  }, [accountBreakdown])

  const filteredAccounts = useMemo(() =>
    accountBreakdown.filter((r: any) =>
      (selectedCompany === 'all' || r.company_short === selectedCompany) &&
      (selectedType === 'all' || r.account_type === selectedType)
    ),
    [accountBreakdown, selectedCompany, selectedType]
  )

  if (loading || !kpi) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>

  const statCard = (title: string, value: number, change: number | null, pct: number | null, prefix = 'MYR') => (
    <Card>
      <Statistic
        title={title}
        value={value}
        prefix={prefix}
        precision={2}
        formatter={(v) => Number(v).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
      />
      {change != null && (
        <div style={{ marginTop: 8, fontSize: 12, color: changeColor(change) }}>
          {change >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          {' '}{fmtMYR(Math.abs(change))} ({fmtPct(pct)})
        </div>
      )}
    </Card>
  )

  const trendData = weeklyTrend.map((d: any) => ({ ...d, series: '周余额' }))
  const monthlyData = monthlyTrend.map((d: any) => ({ ...d, series: '月余额' }))

  const pieData = breakdown.map((c: any) => ({ type: c.company_short, value: c.total_myr }))

  const companyColumns = [
    { title: '公司', dataIndex: 'company_name', key: 'company_name' },
    { title: '总余额 (MYR)', dataIndex: 'total_myr', key: 'total_myr', render: (v: number) => fmtMYR(v), align: 'right' as const },
    { title: '可动用', dataIndex: 'liquid_myr', key: 'liquid_myr', render: (v: number) => fmtMYR(v), align: 'right' as const },
    { title: '定期', dataIndex: 'fixed_myr', key: 'fixed_myr', render: (v: number) => fmtMYR(v), align: 'right' as const },
  ]

  const accountColumns = [
    { title: '公司', dataIndex: 'company_short', key: 'company_short', width: 90 },
    { title: '账户', dataIndex: 'account_name', key: 'account_name', width: 140 },
    ...(!isMobile ? [{ title: '银行', dataIndex: 'bank_name', key: 'bank_name', width: 130 }] : []),
    {
      title: '类型', dataIndex: 'account_type', key: 'account_type', width: 70,
      render: (v: string) => <Tag color={v === 'fd' ? 'orange' : 'blue'}>{v === 'fd' ? '定期' : '活期'}</Tag>
    },
    { title: '币种', dataIndex: 'currency', key: 'currency', width: 60 },
    { title: '原币余额', dataIndex: 'balance_original', key: 'balance_original', align: 'right' as const, width: 130, render: (v: number, r: any) => fmtMYR(v, r.currency) },
    { title: '折算 MYR', dataIndex: 'balance_myr', key: 'balance_myr', align: 'right' as const, width: 130, render: (v: number) => fmtMYR(v) },
    ...(!isMobile ? [{ title: '更新日期', dataIndex: 'snapshot_date', key: 'snapshot_date', width: 105 }] : []),
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>资金总览 Dashboard</h2>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {alerts.slice(0, 3).map((a: any, i: number) => (
            <Alert key={i} message={a.message} type={a.severity === 'warning' ? 'warning' : 'info'}
              icon={a.severity === 'warning' ? <WarningOutlined /> : <InfoCircleOutlined />}
              showIcon style={{ marginBottom: 8 }} />
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>{statCard('集团总资金', kpi.total_myr, null, null)}</Col>
        <Col xs={24} sm={12} lg={6}>{statCard('可动用资金', kpi.liquid_myr, null, null)}</Col>
        <Col xs={24} sm={12} lg={6}>{statCard('定期资金', kpi.fixed_myr, null, null)}</Col>
        <Col xs={24} sm={12} lg={6}>{statCard('USD 余额', kpi.usd_original, null, null, 'USD')}</Col>
        <Col xs={24} sm={12} lg={8}>{statCard('本周变化', Math.abs(kpi.week_change), kpi.week_change, kpi.week_change_pct)}</Col>
        <Col xs={24} sm={12} lg={8}>{statCard('本月变化', Math.abs(kpi.month_change), kpi.month_change, kpi.month_change_pct)}</Col>
        <Col xs={24} sm={12} lg={8}>{statCard('本年变化', Math.abs(kpi.year_change), kpi.year_change, kpi.year_change_pct)}</Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="资金趋势">
            <Tabs items={[
              {
                key: 'weekly', label: '近12周',
                children: <Line
                  data={trendData}
                  xField="label"
                  yField="total_myr"
                  smooth
                  height={260}
                  axis={{
                    x: {
                      label: true,
                      labelSpacing: 4,
                      style: { labelTransform: 'rotate(-35)', fontSize: 11 },
                    },
                    y: {
                      label: true,
                      labelFormatter: (v: string) => `${(+v / 1000).toFixed(0)}K`,
                    },
                  }}
                  tooltip={{ channel: 'y', valueFormatter: (v: number) => fmtMYR(v) }}
                  point={{ size: 4, style: { fill: '#8B5E3C' } }}
                  style={{ stroke: '#8B5E3C' }}
                />
              },
              {
                key: 'monthly', label: '近12月',
                children: <Line
                  data={monthlyData}
                  xField="label"
                  yField="total_myr"
                  smooth
                  height={260}
                  axis={{
                    x: {
                      label: true,
                      labelSpacing: 4,
                      style: { labelTransform: 'rotate(-35)', fontSize: 11 },
                    },
                    y: {
                      label: true,
                      labelFormatter: (v: string) => `${(+v / 1000).toFixed(0)}K`,
                    },
                  }}
                  tooltip={{ channel: 'y', valueFormatter: (v: number) => fmtMYR(v) }}
                  point={{ size: 4, style: { fill: '#8B5E3C' } }}
                  style={{ stroke: '#8B5E3C' }}
                />
              },
            ]} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="公司资金占比" style={{ height: '100%' }}>
            <Pie data={pieData} angleField="value" colorField="type" radius={0.8} height={280}
              label={{ text: 'type', style: { fontSize: 12 } }} />
          </Card>
        </Col>
      </Row>

      {/* Account breakdown table */}
      <Card
        title="各账户余额明细"
        style={{ marginBottom: 16 }}
        extra={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Radio.Group
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              size="small"
              optionType="button"
              buttonStyle="solid"
              options={[
                { label: '全部', value: 'all' },
                { label: '活期', value: 'current' },
                { label: '定期', value: 'fd' },
              ]}
            />
            <Radio.Group
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              size="small"
              optionType="button"
              buttonStyle="solid"
              options={companyOptions}
            />
          </div>
        }
      >
        <Table
          dataSource={filteredAccounts}
          columns={accountColumns}
          rowKey="account_id"
          pagination={false}
          size="small"
          scroll={{ x: 'max-content' }}
          summary={(rows) => {
            const total = rows.reduce((s, r) => s + r.balance_myr, 0)
            return (
              <Table.Summary.Row style={{ fontWeight: 700 }}>
                <Table.Summary.Cell index={0} colSpan={isMobile ? 4 : 6}>合计</Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">{fmtMYR(total)}</Table.Summary.Cell>
                {!isMobile && <Table.Summary.Cell index={2} />}
              </Table.Summary.Row>
            )
          }}
        />
      </Card>

      {/* Company breakdown table */}
      <Card title="各公司资金汇总">
        <Table
          dataSource={breakdown}
          columns={companyColumns}
          rowKey="company_id"
          pagination={false}
          size="small"
          summary={(rows) => {
            const total = rows.reduce((s, r) => s + r.total_myr, 0)
            const liquid = rows.reduce((s, r) => s + r.liquid_myr, 0)
            const fixed = rows.reduce((s, r) => s + r.fixed_myr, 0)
            return (
              <Table.Summary.Row style={{ fontWeight: 700 }}>
                <Table.Summary.Cell index={0}>合计</Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">{fmtMYR(total)}</Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">{fmtMYR(liquid)}</Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">{fmtMYR(fixed)}</Table.Summary.Cell>
              </Table.Summary.Row>
            )
          }}
        />
      </Card>
    </div>
  )
}

import React, { useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Button, Badge, theme } from 'antd'
import {
  DashboardOutlined, BankOutlined, BuildOutlined, SnippetsOutlined,
  BarChartOutlined, DollarOutlined, MessageOutlined, TeamOutlined,
  LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined, BellOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const { Header, Sider, Content } = Layout

const NAV_ITEMS = [
  { key: '/', label: 'Dashboard', icon: <DashboardOutlined /> },
  { key: '/companies', label: '公司管理', icon: <BuildOutlined /> },
  { key: '/bank-accounts', label: '银行账户', icon: <BankOutlined /> },
  { key: '/balance-snapshots', label: '余额录入', icon: <SnippetsOutlined /> },
  { key: '/exchange-rates', label: '汇率管理', icon: <DollarOutlined /> },
  { key: '/fund-notes', label: '变动备注', icon: <MessageOutlined /> },
  { key: '/reports', label: '对比分析', icon: <BarChartOutlined /> },
  { key: '/users', label: '用户管理', icon: <TeamOutlined />, adminOnly: true },
]

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout, can } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { token } = theme.useToken()

  const items = NAV_ITEMS
    .filter((item) => !item.adminOnly || can('super_admin'))
    .map(({ key, label, icon }) => ({ key, label, icon }))

  const userMenu = [
    { key: 'logout', label: '退出登录', icon: <LogoutOutlined />, onClick: () => { logout(); navigate('/login') } },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        breakpoint="lg"
        onBreakpoint={(broken) => setCollapsed(broken)}
        style={{ position: 'fixed', height: '100vh', left: 0, top: 0, bottom: 0, zIndex: 100, background: '#2C1A0E' }}
        theme="dark"
      >
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4B896', fontWeight: 700, fontSize: collapsed ? 14 : 16, borderBottom: '1px solid rgba(212,184,150,0.2)', background: '#2C1A0E', letterSpacing: 1 }}>
          {collapsed ? '💰' : '💰 Fund Monitor'}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={items}
          onClick={({ key }) => navigate(key)}
          style={{ marginTop: 8, background: '#2C1A0E', borderRight: 'none' }}
          theme="dark"
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'margin-left 0.2s' }}>
        <Header style={{ padding: '0 16px', background: '#FDFAF5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E8DDD0', position: 'sticky', top: 0, zIndex: 99 }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={0} size="small">
              <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
            </Badge>
            <Dropdown menu={{ items: userMenu }} trigger={['click']}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar size="small" style={{ backgroundColor: token.colorPrimary }}>
                  {(user?.full_name || user?.username || 'U')[0].toUpperCase()}
                </Avatar>
                <span style={{ fontSize: 13 }}>{user?.full_name || user?.username}</span>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content style={{ margin: '16px', minHeight: 'calc(100vh - 96px)', background: 'transparent' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

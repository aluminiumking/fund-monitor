import React, { useState, useEffect } from 'react'
import { Layout, Menu, Avatar, Dropdown, Button, Badge, theme, Drawer } from 'antd'
import {
  DashboardOutlined, BankOutlined, BuildOutlined, SnippetsOutlined,
  BarChartOutlined, DollarOutlined, MessageOutlined, TeamOutlined,
  LogoutOutlined, MenuOutlined, BellOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined,
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

const SIDEBAR_BG = '#2C1A0E'

function NavMenu({ selectedKey, onNavigate }: { selectedKey: string; onNavigate: (key: string) => void }) {
  return (
    <Menu
      mode="inline"
      selectedKeys={[selectedKey]}
      items={NAV_ITEMS.map(({ key, label, icon }) => ({ key, label, icon }))}
      onClick={({ key }) => onNavigate(key)}
      style={{ marginTop: 8, background: SIDEBAR_BG, borderRight: 'none' }}
      theme="dark"
    />
  )
}

function Logo({ collapsed }: { collapsed?: boolean }) {
  return (
    <div style={{
      height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#D4B896', fontWeight: 700, fontSize: collapsed ? 14 : 16,
      borderBottom: '1px solid rgba(212,184,150,0.2)', background: SIDEBAR_BG, letterSpacing: 1,
    }}>
      {collapsed ? '💰' : '💰 Fund Monitor'}
    </div>
  )
}

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const { user, logout, can } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { token } = theme.useToken()

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const filteredItems = NAV_ITEMS.filter((item) => !item.adminOnly || can('super_admin'))

  const userMenu = [
    { key: 'logout', label: '退出登录', icon: <LogoutOutlined />, onClick: () => { logout(); navigate('/login') } },
  ]

  const handleNavigate = (key: string) => {
    navigate(key)
    if (isMobile) setDrawerOpen(false)
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Desktop sidebar */}
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          trigger={null}
          style={{ position: 'fixed', height: '100vh', left: 0, top: 0, bottom: 0, zIndex: 100, background: SIDEBAR_BG }}
          theme="dark"
        >
          <Logo collapsed={collapsed} />
          <NavMenu selectedKey={location.pathname} onNavigate={handleNavigate} />
        </Sider>
      )}

      {/* Mobile drawer */}
      {isMobile && (
        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={220}
          styles={{ body: { padding: 0, background: SIDEBAR_BG }, header: { display: 'none' } }}
        >
          <Logo />
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={filteredItems.map(({ key, label, icon }) => ({ key, label, icon }))}
            onClick={({ key }) => handleNavigate(key)}
            style={{ background: SIDEBAR_BG, borderRight: 'none' }}
            theme="dark"
          />
        </Drawer>
      )}

      <Layout style={{ marginLeft: isMobile ? 0 : (collapsed ? 80 : 200), transition: 'margin-left 0.2s' }}>
        <Header style={{
          padding: '0 12px', background: '#FDFAF5', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', borderBottom: '1px solid #E8DDD0',
          position: 'sticky', top: 0, zIndex: 99,
        }}>
          <Button
            type="text"
            icon={isMobile
              ? <MenuOutlined />
              : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)
            }
            onClick={() => isMobile ? setDrawerOpen(true) : setCollapsed(!collapsed)}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Badge count={0} size="small">
              <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
            </Badge>
            <Dropdown menu={{ items: userMenu }} trigger={['click']}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <Avatar size="small" style={{ backgroundColor: token.colorPrimary }}>
                  {(user?.full_name || user?.username || 'U')[0].toUpperCase()}
                </Avatar>
                {!isMobile && <span style={{ fontSize: 13 }}>{user?.full_name || user?.username}</span>}
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content style={{ margin: isMobile ? '12px 8px' : '16px', minHeight: 'calc(100vh - 96px)', background: 'transparent' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

import React, { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, Tag, Card } from 'antd'
import { PlusOutlined, EditOutlined } from '@ant-design/icons'
import { listUsers, createUser, updateUser } from '../../api'
import { ROLE_LABELS } from '../../utils/format'

const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([k, v]) => ({ value: k, label: v }))

export default function UsersPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form] = Form.useForm()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const load = () => { setLoading(true); listUsers().then(setData).finally(() => setLoading(false)) }
  useEffect(load, [])

  const openAdd = () => { setEditing(null); form.resetFields(); form.setFieldsValue({ role: 'finance_staff', status: 'active' }); setModalOpen(true) }
  const openEdit = (r: any) => { setEditing(r); form.setFieldsValue(r); setModalOpen(true) }

  const onSave = async () => {
    const values = await form.validateFields()
    if (editing) await updateUser(editing.id, values)
    else await createUser(values)
    setModalOpen(false)
    load()
  }

  const columns = [
    { title: '用户名', dataIndex: 'username', key: 'username', width: 110 },
    ...(!isMobile ? [
      { title: '姓名', dataIndex: 'full_name', key: 'full_name', width: 130 },
      { title: 'Email', dataIndex: 'email', key: 'email' },
    ] : []),
    { title: '角色', dataIndex: 'role', key: 'role', width: isMobile ? 100 : 150, render: (v: string) => <Tag color="blue">{ROLE_LABELS[v] || v}</Tag> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 70, render: (v: string) => <Tag color={v === 'active' ? 'green' : 'red'}>{v === 'active' ? '启用' : '停用'}</Tag> },
    {
      title: '操作', key: 'action', width: 70,
      render: (_: any, r: any) => <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
    },
  ]

  return (
    <Card
      title="用户权限管理"
      styles={{ body: { padding: isMobile ? 8 : 24 } }}
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>新增用户</Button>}
    >
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} size="small" scroll={{ x: 'max-content' }} />
      <Modal
        title={editing ? '编辑用户' : '新增用户'}
        open={modalOpen} onOk={onSave} onCancel={() => setModalOpen(false)}
        width={isMobile ? '95vw' : 420} style={isMobile ? { top: 20 } : {}}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="username" label="用户名" rules={[{ required: true }]}><Input disabled={!!editing} /></Form.Item>
          <Form.Item name="full_name" label="姓名"><Input /></Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
          <Form.Item name="password" label={editing ? '新密码（留空不修改）' : '密码'} rules={editing ? [] : [{ required: true, min: 6 }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]}>
            <Select options={ROLE_OPTIONS} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select options={[{ value: 'active', label: '启用' }, { value: 'inactive', label: '停用' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

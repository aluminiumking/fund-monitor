import React, { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, Tag, Card } from 'antd'
import { PlusOutlined, EditOutlined } from '@ant-design/icons'
import { listCompanies, createCompany, updateCompany } from '../../api'
import { useAuth } from '../../contexts/AuthContext'

export default function CompaniesPage() {
  const { can } = useAuth()
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

  const load = () => { setLoading(true); listCompanies().then(setData).finally(() => setLoading(false)) }
  useEffect(load, [])

  const openAdd = () => { setEditing(null); form.resetFields(); form.setFieldsValue({ default_currency: 'MYR', status: 'active' }); setModalOpen(true) }
  const openEdit = (record: any) => { setEditing(record); form.setFieldsValue(record); setModalOpen(true) }

  const onSave = async () => {
    const values = await form.validateFields()
    if (editing) await updateCompany(editing.id, values)
    else await createCompany(values)
    setModalOpen(false)
    load()
  }

  const columns = [
    { title: '公司名称', dataIndex: 'name', key: 'name', width: 180 },
    { title: '简称', dataIndex: 'short_name', key: 'short_name', width: 90 },
    ...(!isMobile ? [
      { title: '代码', dataIndex: 'code', key: 'code', width: 90 },
      { title: 'SSM No.', dataIndex: 'ssm_no', key: 'ssm_no', width: 140 },
      { title: '本位币', dataIndex: 'default_currency', key: 'default_currency', width: 75 },
      { title: '备注', dataIndex: 'notes', key: 'notes', ellipsis: true },
    ] : []),
    { title: '状态', dataIndex: 'status', key: 'status', width: 75, render: (v: string) => <Tag color={v === 'active' ? 'green' : 'red'}>{v === 'active' ? '启用' : '停用'}</Tag> },
    can('finance_manager') ? {
      title: '操作', key: 'action', width: 75,
      render: (_: any, r: any) => <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
    } : null,
  ].filter(Boolean) as any[]

  return (
    <Card
      title="公司管理"
      styles={{ body: { padding: isMobile ? 8 : 24 } }}
      extra={can('finance_manager') && <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>新增公司</Button>}
    >
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} size="small" scroll={{ x: 'max-content' }} />
      <Modal
        title={editing ? '编辑公司' : '新增公司'}
        open={modalOpen} onOk={onSave} onCancel={() => setModalOpen(false)}
        width={isMobile ? '95vw' : 520} style={isMobile ? { top: 20 } : {}}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="公司名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="short_name" label="简称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="code" label="公司代码" rules={[{ required: true }]}><Input disabled={!!editing} /></Form.Item>
          <Form.Item name="ssm_no" label="SSM No."><Input /></Form.Item>
          <Form.Item name="default_currency" label="本位币">
            <Select options={[{ value: 'MYR', label: 'MYR' }, { value: 'USD', label: 'USD' }]} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select options={[{ value: 'active', label: '启用' }, { value: 'inactive', label: '停用' }]} />
          </Form.Item>
          <Form.Item name="notes" label="备注"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

import React, { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, Switch, DatePicker, InputNumber, Tag, Card } from 'antd'
import { PlusOutlined, EditOutlined } from '@ant-design/icons'
import { listBankAccounts, createBankAccount, updateBankAccount, listCompanies } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { ACCOUNT_TYPE_LABELS } from '../../utils/format'
import dayjs from 'dayjs'

export default function BankAccountsPage() {
  const { can } = useAuth()
  const [data, setData] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form] = Form.useForm()
  const [filterCompany, setFilterCompany] = useState<number | undefined>()

  const load = () => {
    setLoading(true)
    Promise.all([listBankAccounts(filterCompany ? { company_id: filterCompany } : {}), listCompanies()])
      .then(([accs, comps]) => { setData(accs); setCompanies(comps) })
      .finally(() => setLoading(false))
  }
  useEffect(load, [filterCompany])

  const openAdd = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ currency: 'MYR', account_type: 'current', is_liquid: true, status: 'active' })
    setModalOpen(true)
  }
  const openEdit = (record: any) => {
    setEditing(record)
    form.setFieldsValue({
      ...record,
      fd_maturity_date: record.fd_maturity_date ? dayjs(record.fd_maturity_date) : null,
      open_date: record.open_date ? dayjs(record.open_date) : null,
    })
    setModalOpen(true)
  }

  const onSave = async () => {
    const values = await form.validateFields()
    const payload = {
      ...values,
      fd_maturity_date: values.fd_maturity_date?.format('YYYY-MM-DD'),
      open_date: values.open_date?.format('YYYY-MM-DD'),
    }
    if (editing) await updateBankAccount(editing.id, payload)
    else await createBankAccount(payload)
    setModalOpen(false)
    load()
  }

  const columns = [
    { title: '公司', dataIndex: 'company_name', key: 'company_name', width: 120 },
    { title: '显示名称', dataIndex: 'display_name', key: 'display_name', width: 160 },
    { title: '银行', dataIndex: 'bank_name', key: 'bank_name', width: 120 },
    { title: '账号', dataIndex: 'account_number', key: 'account_number', width: 140 },
    { title: '币种', dataIndex: 'currency', key: 'currency', width: 70 },
    {
      title: '类型', dataIndex: 'account_type', key: 'account_type', width: 100,
      render: (v: string) => ACCOUNT_TYPE_LABELS[v] || v
    },
    {
      title: '可动用', dataIndex: 'is_liquid', key: 'is_liquid', width: 80,
      render: (v: boolean) => <Tag color={v ? 'green' : 'orange'}>{v ? '是' : '否'}</Tag>
    },
    { title: 'FD到期日', dataIndex: 'fd_maturity_date', key: 'fd_maturity_date', width: 110 },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (v: string) => <Tag color={v === 'active' ? 'green' : 'red'}>{v === 'active' ? '启用' : '停用'}</Tag>
    },
    can('finance_manager') ? {
      title: '操作', key: 'action', width: 80,
      render: (_: any, r: any) => <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
    } : null
  ].filter(Boolean) as any[]

  return (
    <Card
      title="银行账户管理"
      extra={
        <div style={{ display: 'flex', gap: 8 }}>
          <Select
            placeholder="筛选公司" allowClear style={{ width: 160 }}
            options={companies.map((c) => ({ value: c.id, label: c.short_name }))}
            onChange={(v) => setFilterCompany(v)}
          />
          {can('finance_manager') && <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>新增账户</Button>}
        </div>
      }
    >
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} size="small" scroll={{ x: 900 }} />

      <Modal title={editing ? '编辑账户' : '新增账户'} open={modalOpen} onOk={onSave} onCancel={() => setModalOpen(false)} width={580}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="company_id" label="所属公司" rules={[{ required: true }]}>
            <Select disabled={!!editing} options={companies.map((c) => ({ value: c.id, label: c.name }))} />
          </Form.Item>
          <Form.Item name="bank_name" label="银行名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="account_name" label="账户名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="account_number" label="账户号码" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="display_name" label="显示简称"><Input /></Form.Item>
          <Form.Item name="currency" label="币种">
            <Select options={[{ value: 'MYR', label: 'MYR' }, { value: 'USD', label: 'USD' }]} />
          </Form.Item>
          <Form.Item name="account_type" label="账户类型">
            <Select options={Object.entries(ACCOUNT_TYPE_LABELS).map(([k, v]) => ({ value: k, label: v }))} />
          </Form.Item>
          <Form.Item name="is_liquid" label="可动用" valuePropName="checked">
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>
          <Form.Item name="open_date" label="开户日期"><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="fd_maturity_date" label="定期到期日"><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="interest_rate" label="利率 (%)"><InputNumber style={{ width: '100%' }} precision={2} min={0} max={100} /></Form.Item>
          <Form.Item name="status" label="状态">
            <Select options={[{ value: 'active', label: '启用' }, { value: 'inactive', label: '停用' }]} />
          </Form.Item>
          <Form.Item name="notes" label="备注"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

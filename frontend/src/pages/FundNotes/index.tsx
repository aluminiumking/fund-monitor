import React, { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, DatePicker, InputNumber, Tag, Card, Space, Popconfirm, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined, MinusOutlined } from '@ant-design/icons'
import { listFundNotes, createFundNote, updateFundNote, deleteFundNote, listCompanies, listBankAccounts } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { fmtMYR } from '../../utils/format'
import dayjs from 'dayjs'

const DIRECTION_CONFIG: any = {
  increase: { color: 'green', icon: <ArrowUpOutlined />, label: '增加' },
  decrease: { color: 'red', icon: <ArrowDownOutlined />, label: '减少' },
  neutral: { color: 'default', icon: <MinusOutlined />, label: '无明显变化' },
}

export default function FundNotesPage() {
  const { can } = useAuth()
  const [data, setData] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
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

  const load = () => {
    setLoading(true)
    Promise.all([listFundNotes(), listCompanies(), listBankAccounts()])
      .then(([notes, comps, accs]) => { setData(notes); setCompanies(comps); setAccounts(accs) })
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const openAdd = () => { setEditing(null); form.resetFields(); form.setFieldsValue({ period_date: dayjs(), currency: 'MYR' }); setModalOpen(true) }
  const openEdit = (r: any) => { setEditing(r); form.setFieldsValue({ ...r, period_date: dayjs(r.period_date) }); setModalOpen(true) }

  const onSave = async () => {
    const values = await form.validateFields()
    const payload = { ...values, period_date: values.period_date.format('YYYY-MM-DD') }
    if (editing) await updateFundNote(editing.id, payload)
    else await createFundNote(payload)
    setModalOpen(false)
    load()
  }

  const onDelete = async (id: number) => {
    await deleteFundNote(id)
    message.success('已删除')
    load()
  }

  const columns = [
    { title: '日期', dataIndex: 'period_date', key: 'period_date', width: 100 },
    ...(!isMobile ? [
      { title: '公司', dataIndex: 'company_name', key: 'company_name', width: 110 },
      { title: '账户', dataIndex: 'account_display', key: 'account_display', width: 130 },
    ] : []),
    {
      title: '变化', dataIndex: 'direction', key: 'direction', width: 90,
      render: (v: string) => v ? (
        <Tag color={DIRECTION_CONFIG[v]?.color} icon={DIRECTION_CONFIG[v]?.icon}>
          {DIRECTION_CONFIG[v]?.label}
        </Tag>
      ) : '-'
    },
    ...(!isMobile ? [
      { title: '变化金额', dataIndex: 'amount_change', key: 'amount_change', width: 130, align: 'right' as const, render: (v: number, r: any) => v != null ? fmtMYR(v, r.currency) : '-' },
    ] : []),
    { title: '备注', dataIndex: 'notes', key: 'notes', ellipsis: true },
    ...(!isMobile ? [{ title: '录入人', dataIndex: 'creator_name', key: 'creator_name', width: 90 }] : []),
    can('finance_staff') ? {
      title: '操作', key: 'action', width: 80,
      render: (_: any, r: any) => (
        <Space size={4}>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm title="确认删除？" onConfirm={() => onDelete(r.id)}>
            <Button size="small" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      )
    } : null,
  ].filter(Boolean) as any[]

  return (
    <Card
      title="资金变动备注"
      styles={{ body: { padding: isMobile ? 8 : 24 } }}
      extra={can('finance_staff') && <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>新增备注</Button>}
    >
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} size="small" scroll={{ x: 'max-content' }} />
      <Modal
        title={editing ? '编辑备注' : '新增变动备注'}
        open={modalOpen} onOk={onSave} onCancel={() => setModalOpen(false)}
        width={isMobile ? '95vw' : 520} style={isMobile ? { top: 20 } : {}}
        styles={isMobile ? { body: { maxHeight: '70vh', overflowY: 'auto' } } : {}}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="period_date" label="日期" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="company_id" label="公司" rules={[{ required: true }]}>
            <Select options={companies.map((c) => ({ value: c.id, label: c.name }))} />
          </Form.Item>
          <Form.Item name="bank_account_id" label="银行账户（可选）">
            <Select allowClear options={accounts.map((a) => ({ value: a.id, label: `${a.company_name} - ${a.display_name || a.account_name}` }))} />
          </Form.Item>
          <Form.Item name="direction" label="变化方向">
            <Select allowClear options={Object.entries(DIRECTION_CONFIG).map(([k, v]: any) => ({ value: k, label: v.label }))} />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Form.Item name="amount_change" label="变化金额" style={{ marginBottom: 12 }}>
              <InputNumber style={{ width: '100%' }} precision={2} />
            </Form.Item>
            <Form.Item name="currency" label="币种" style={{ marginBottom: 12 }}>
              <Select options={[{ value: 'MYR', label: 'MYR' }, { value: 'USD', label: 'USD' }]} />
            </Form.Item>
          </div>
          <Form.Item name="notes" label="原因备注" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="例：本周减少 RM120,000，因支付大批材料款" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

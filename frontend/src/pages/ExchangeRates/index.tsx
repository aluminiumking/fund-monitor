import React, { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, DatePicker, InputNumber, Switch, Card } from 'antd'
import { PlusOutlined, EditOutlined } from '@ant-design/icons'
import { listRates, createRate, updateRate } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import dayjs from 'dayjs'

export default function ExchangeRatesPage() {
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

  const load = () => { setLoading(true); listRates().then(setData).finally(() => setLoading(false)) }
  useEffect(load, [])

  const openAdd = () => { setEditing(null); form.resetFields(); form.setFieldsValue({ date: dayjs(), currency: 'USD', is_default: false }); setModalOpen(true) }
  const openEdit = (r: any) => { setEditing(r); form.setFieldsValue({ ...r, date: dayjs(r.date) }); setModalOpen(true) }

  const onSave = async () => {
    const values = await form.validateFields()
    const payload = { ...values, date: values.date.format('YYYY-MM-DD') }
    if (editing) await updateRate(editing.id, payload)
    else await createRate(payload)
    setModalOpen(false)
    load()
  }

  const columns = [
    { title: '日期', dataIndex: 'date', key: 'date', width: 110, sorter: (a: any, b: any) => a.date.localeCompare(b.date), defaultSortOrder: 'descend' as const },
    { title: '币种', dataIndex: 'currency', key: 'currency', width: 70 },
    { title: '对 MYR 汇率', dataIndex: 'rate_to_myr', key: 'rate_to_myr', width: 120, render: (v: number) => Number(v).toFixed(6) },
    ...(!isMobile ? [
      { title: '默认', dataIndex: 'is_default', key: 'is_default', width: 70, render: (v: boolean) => v ? '✓' : '' },
      { title: '备注', dataIndex: 'notes', key: 'notes', ellipsis: true },
    ] : []),
    can('finance_manager') ? {
      title: '操作', key: 'action', width: 75,
      render: (_: any, r: any) => <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
    } : null,
  ].filter(Boolean) as any[]

  return (
    <Card
      title="汇率管理"
      styles={{ body: { padding: isMobile ? 8 : 24 } }}
      extra={can('finance_manager') && <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>录入汇率</Button>}
    >
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} size="small" scroll={{ x: 'max-content' }} />
      <Modal
        title={editing ? '编辑汇率' : '录入汇率'}
        open={modalOpen} onOk={onSave} onCancel={() => setModalOpen(false)}
        width={isMobile ? '95vw' : 420} style={isMobile ? { top: 20 } : {}}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="date" label="日期" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="currency" label="币种" rules={[{ required: true }]}>
            <Select options={[{ value: 'USD', label: 'USD' }, { value: 'SGD', label: 'SGD' }, { value: 'CNY', label: 'CNY' }]} />
          </Form.Item>
          <Form.Item name="rate_to_myr" label="对 MYR 汇率" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} precision={6} min={0} />
          </Form.Item>
          <Form.Item name="is_default" label="设为默认" valuePropName="checked"><Switch /></Form.Item>
          <Form.Item name="notes" label="备注"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

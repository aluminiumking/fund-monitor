import React, { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, DatePicker, InputNumber, Tag, Card, Space, message, Divider } from 'antd'
import { PlusOutlined, EditOutlined, CheckCircleOutlined, DeleteOutlined } from '@ant-design/icons'
import { listSnapshots, createSnapshot, updateSnapshot, auditSnapshots, listCompanies, listBankAccounts, listRates } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { fmtMYR } from '../../utils/format'
import dayjs from 'dayjs'

const DATA_SOURCE_OPTIONS = [
  { value: 'bank_app', label: '银行 App' },
  { value: 'statement', label: 'Statement' },
  { value: 'manual', label: '手工录入' },
]

const isMobileScreen = () => window.innerWidth < 768

export default function BalanceSnapshotsPage() {
  const { can } = useAuth()
  const [data, setData] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([])
  const [batchForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [filterCompany, setFilterCompany] = useState<number>()
  const [isMobile, setIsMobile] = useState(isMobileScreen())

  useEffect(() => {
    const onResize = () => setIsMobile(isMobileScreen())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const load = () => {
    setLoading(true)
    Promise.all([listSnapshots(filterCompany ? { company_id: filterCompany } : {}), listCompanies(), listBankAccounts()])
      .then(([snaps, comps, accs]) => { setData(snaps); setCompanies(comps); setAccounts(accs) })
      .finally(() => setLoading(false))
  }
  useEffect(load, [filterCompany])

  const openAdd = () => {
    batchForm.resetFields()
    batchForm.setFieldsValue({
      snapshot_date: dayjs(),
      data_source: 'manual',
      rows: [{ bank_account_id: undefined, currency: '', balance_original: null, exchange_rate: 1, balance_myr: null, notes: '' }],
    })
    setModalOpen(true)
  }

  const addRow = () => {
    const rows = batchForm.getFieldValue('rows') || []
    batchForm.setFieldsValue({ rows: [...rows, { bank_account_id: undefined, currency: '', balance_original: null, exchange_rate: 1, balance_myr: null, notes: '' }] })
  }

  const removeRow = (index: number) => {
    const rows = batchForm.getFieldValue('rows') || []
    if (rows.length <= 1) return
    batchForm.setFieldsValue({ rows: rows.filter((_: any, i: number) => i !== index) })
  }

  const onRowAccountChange = async (accountId: number, index: number) => {
    const acc = accounts.find((a) => a.id === accountId)
    if (!acc) return
    let rate = 1
    if (acc.currency !== 'MYR') {
      try {
        const rates = await listRates({ currency: acc.currency })
        if (rates.length > 0) rate = Number(rates[0].rate_to_myr)
      } catch {}
    }
    const rows = batchForm.getFieldValue('rows')
    rows[index] = { ...rows[index], currency: acc.currency, exchange_rate: rate, balance_myr: rows[index].balance_original ? +(rows[index].balance_original * rate).toFixed(2) : null }
    batchForm.setFieldsValue({ rows })
  }

  const recalcRow = (index: number) => {
    const rows = batchForm.getFieldValue('rows')
    const row = rows[index]
    if (row?.balance_original != null && row?.exchange_rate) {
      rows[index] = { ...row, balance_myr: +(row.balance_original * row.exchange_rate).toFixed(2) }
      batchForm.setFieldsValue({ rows })
    }
  }

  const onBatchSave = async () => {
    try { await batchForm.validateFields() } catch { return }
    const values = batchForm.getFieldsValue()
    const date = values.snapshot_date.format('YYYY-MM-DD')
    const rows: any[] = values.rows || []
    setSaving(true)
    let successCount = 0
    const errors: string[] = []
    for (const row of rows) {
      if (!row.bank_account_id || row.balance_original == null) continue
      try {
        await createSnapshot({
          snapshot_date: date,
          bank_account_id: row.bank_account_id,
          currency: row.currency,
          balance_original: row.balance_original,
          exchange_rate: row.exchange_rate || 1,
          balance_myr: row.balance_myr ?? row.balance_original,
          data_source: values.data_source,
          notes: row.notes || '',
        })
        successCount++
      } catch (err: any) {
        const acc = accounts.find((a) => a.id === row.bank_account_id)
        const name = acc?.display_name || acc?.account_name || row.bank_account_id
        if (err.response?.status === 409) errors.push(`${name}：该日期已有记录`)
        else errors.push(`${name}：保存失败`)
      }
    }
    setSaving(false)
    if (successCount > 0) message.success(`成功保存 ${successCount} 条记录`)
    if (errors.length > 0) message.warning(errors.join('；'))
    if (successCount > 0) { setModalOpen(false); load() }
  }

  const openEdit = (record: any) => {
    setEditing(record)
    editForm.setFieldsValue({ ...record, snapshot_date: dayjs(record.snapshot_date) })
    setEditModal(true)
  }

  const recalcEdit = () => {
    const orig = editForm.getFieldValue('balance_original')
    const rate = editForm.getFieldValue('exchange_rate') || 1
    if (orig != null) editForm.setFieldsValue({ balance_myr: +(orig * rate).toFixed(2) })
  }

  const onEditSave = async () => {
    const values = await editForm.validateFields()
    try {
      await updateSnapshot(editing.id, { ...values, snapshot_date: values.snapshot_date.format('YYYY-MM-DD') })
      setEditModal(false)
      load()
    } catch (err: any) {
      if (err.response?.status === 409) message.warning(err.response.data.detail)
    }
  }

  const onAudit = async () => {
    await auditSnapshots(selectedRowKeys)
    message.success(`已审核 ${selectedRowKeys.length} 条记录`)
    setSelectedRowKeys([])
    load()
  }

  const columns = [
    { title: '日期', dataIndex: 'snapshot_date', key: 'snapshot_date', width: 110, sorter: (a: any, b: any) => a.snapshot_date.localeCompare(b.snapshot_date) },
    { title: '公司', dataIndex: 'company_name', key: 'company_name', width: 130 },
    { title: '账户', dataIndex: 'account_display', key: 'account_display', width: 160 },
    { title: '币种', dataIndex: 'currency', key: 'currency', width: 70 },
    { title: '原币余额', dataIndex: 'balance_original', key: 'balance_original', align: 'right' as const, width: 140, render: (v: number, r: any) => fmtMYR(v, r.currency) },
    { title: '汇率', dataIndex: 'exchange_rate', key: 'exchange_rate', width: 80, render: (v: number) => +v === 1 ? '-' : v },
    { title: '折算 MYR', dataIndex: 'balance_myr', key: 'balance_myr', align: 'right' as const, width: 140, render: (v: number) => fmtMYR(v) },
    { title: '来源', dataIndex: 'data_source', key: 'data_source', width: 90 },
    { title: '审核', dataIndex: 'is_audited', key: 'is_audited', width: 80, render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? '已审核' : '未审核'}</Tag> },
    { title: '录入人', dataIndex: 'creator_name', key: 'creator_name', width: 100 },
    {
      title: '操作', key: 'action', width: 80,
      render: (_: any, r: any) => can('finance_staff') && !r.is_audited
        ? <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
        : null
    },
  ]

  const activeAccounts = accounts.filter((a) => a.status === 'active')

  return (
    <Card
      title="余额快照录入"
      styles={{ body: { padding: isMobile ? 8 : 24 } }}
      extra={
        <Space wrap>
          <Select placeholder="筛选公司" allowClear style={{ width: isMobile ? 120 : 160 }}
            options={companies.map((c) => ({ value: c.id, label: c.short_name }))}
            onChange={(v) => setFilterCompany(v)} />
          {can('finance_manager') && selectedRowKeys.length > 0 && (
            <Button icon={<CheckCircleOutlined />} onClick={onAudit}>审核 ({selectedRowKeys.length})</Button>
          )}
          {can('finance_staff') && <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>录入余额</Button>}
        </Space>
      }
    >
      <Table
        dataSource={data} columns={columns} rowKey="id" loading={loading} size="small"
        scroll={{ x: 1000 }}
        rowSelection={can('finance_manager') ? {
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys as number[]),
          getCheckboxProps: (r) => ({ disabled: r.is_audited }),
        } : undefined}
      />

      {/* ── Batch Entry Modal ── */}
      <Modal
        title="录入余额"
        open={modalOpen}
        onOk={onBatchSave}
        onCancel={() => setModalOpen(false)}
        okText="全部保存"
        confirmLoading={saving}
        width={isMobile ? '95vw' : 1020}
        style={isMobile ? { top: 10, margin: '0 auto' } : {}}
        styles={isMobile ? { body: { maxHeight: '75vh', overflowY: 'auto', padding: '12px 8px' } } : {}}
      >
        <Form form={batchForm} layout="vertical" style={{ marginTop: 8 }}>
          {/* Shared header */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
            <Form.Item name="snapshot_date" label="记录日期" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
              <DatePicker style={{ width: isMobile ? 140 : 150 }} />
            </Form.Item>
            <Form.Item name="data_source" label="数据来源" style={{ marginBottom: 0 }}>
              <Select options={DATA_SOURCE_OPTIONS} style={{ width: isMobile ? 120 : 130 }} />
            </Form.Item>
          </div>

          <Divider style={{ margin: '0 0 12px' }} />

          {/* Desktop column headers */}
          {!isMobile && (
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 160px 95px 135px 115px 28px', gap: 8, padding: '0 4px', marginBottom: 4 }}>
              {['银行账户', '余额（原币）', '汇率', '折算 MYR', '备注', ''].map((h, i) => (
                <span key={i} style={{ fontSize: 12, color: '#7A5C44', fontWeight: 600 }}>{h}</span>
              ))}
            </div>
          )}

          <Form.List name="rows">
            {(fields) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 8 }}>
                {fields.map(({ key, name }) => {
                  const rowCurrency = batchForm.getFieldValue(['rows', name, 'currency']) || ''
                  if (isMobile) {
                    // Mobile: card-style vertical layout per row
                    return (
                      <div key={key} style={{ border: '1px solid #D4B896', borderRadius: 8, padding: 10, background: '#FDFAF5', position: 'relative' }}>
                        <Button
                          type="text" danger size="small" icon={<DeleteOutlined />}
                          onClick={() => removeRow(name)}
                          disabled={fields.length <= 1}
                          style={{ position: 'absolute', top: 6, right: 6 }}
                        />
                        <Form.Item name={[name, 'bank_account_id']} label="银行账户" rules={[{ required: true, message: '请选择账户' }]} style={{ marginBottom: 8 }}>
                          <Select
                            showSearch optionFilterProp="label" placeholder="选择账户"
                            options={activeAccounts.map((a) => ({ value: a.id, label: `${a.company_name} · ${a.display_name || a.account_name} (${a.currency})` }))}
                            onChange={(v) => onRowAccountChange(v, name)}
                          />
                        </Form.Item>
                        <Form.Item name={[name, 'currency']} hidden><Input /></Form.Item>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <Form.Item label={`余额 ${rowCurrency ? `(${rowCurrency})` : ''}`} name={[name, 'balance_original']} rules={[{ required: true, message: '必填' }]} style={{ marginBottom: 8 }}>
                            <InputNumber style={{ width: '100%' }} precision={2} placeholder="0.00" onChange={() => recalcRow(name)} />
                          </Form.Item>
                          <Form.Item label="汇率" name={[name, 'exchange_rate']} style={{ marginBottom: 8 }}>
                            <InputNumber style={{ width: '100%' }} precision={6} min={0} onChange={() => recalcRow(name)} />
                          </Form.Item>
                          <Form.Item label="折算 MYR" name={[name, 'balance_myr']} style={{ marginBottom: 8 }}>
                            <InputNumber style={{ width: '100%' }} precision={2} placeholder="自动计算" />
                          </Form.Item>
                          <Form.Item label="备注" name={[name, 'notes']} style={{ marginBottom: 8 }}>
                            <Input placeholder="选填" />
                          </Form.Item>
                        </div>
                      </div>
                    )
                  }
                  // Desktop: grid row
                  return (
                    <div key={key} style={{ display: 'grid', gridTemplateColumns: '3fr 160px 95px 135px 115px 28px', gap: 8, alignItems: 'center' }}>
                      <Form.Item name={[name, 'bank_account_id']} rules={[{ required: true, message: '请选择' }]} style={{ marginBottom: 0 }}>
                        <Select
                          showSearch optionFilterProp="label" placeholder="选择账户"
                          options={activeAccounts.map((a) => ({ value: a.id, label: `${a.company_name} · ${a.display_name || a.account_name} (${a.currency})` }))}
                          onChange={(v) => onRowAccountChange(v, name)}
                        />
                      </Form.Item>
                      <Form.Item name={[name, 'currency']} hidden><Input /></Form.Item>
                      <Form.Item name={[name, 'balance_original']} rules={[{ required: true, message: '必填' }]} style={{ marginBottom: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #D4B896', borderRadius: 6, overflow: 'hidden' }}>
                          <span style={{ padding: '0 8px', background: '#F5F0E8', color: '#7A5C44', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', borderRight: '1px solid #D4B896', lineHeight: '30px' }}>
                            {rowCurrency || '—'}
                          </span>
                          <Form.Item name={[name, 'balance_original']} rules={[{ required: true, message: '必填' }]} style={{ marginBottom: 0, flex: 1 }} noStyle>
                            <InputNumber style={{ width: '100%', border: 'none', boxShadow: 'none' }} precision={2} placeholder="0.00" onChange={() => recalcRow(name)} />
                          </Form.Item>
                        </div>
                      </Form.Item>
                      <Form.Item name={[name, 'exchange_rate']} style={{ marginBottom: 0 }}>
                        <InputNumber style={{ width: '100%' }} precision={6} min={0} onChange={() => recalcRow(name)} />
                      </Form.Item>
                      <Form.Item name={[name, 'balance_myr']} style={{ marginBottom: 0 }}>
                        <InputNumber style={{ width: '100%' }} precision={2} placeholder="自动计算" />
                      </Form.Item>
                      <Form.Item name={[name, 'notes']} style={{ marginBottom: 0 }}>
                        <Input placeholder="备注（选填）" />
                      </Form.Item>
                      <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => removeRow(name)} disabled={fields.length <= 1} />
                    </div>
                  )
                })}
              </div>
            )}
          </Form.List>

          <Button type="dashed" icon={<PlusOutlined />} onClick={addRow} style={{ marginTop: 12, width: '100%' }}>
            添加一行
          </Button>
        </Form>
      </Modal>

      {/* ── Single Edit Modal ── */}
      <Modal
        title="修改余额快照" open={editModal} onOk={onEditSave} onCancel={() => setEditModal(false)}
        width={isMobile ? '95vw' : 480}
        style={isMobile ? { top: 10 } : {}}
      >
        <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="snapshot_date" label="记录日期" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="balance_original" label="余额（原币）" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} precision={2} onChange={recalcEdit} />
          </Form.Item>
          <Form.Item name="exchange_rate" label="汇率（对 MYR）" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} precision={6} min={0} onChange={recalcEdit} />
          </Form.Item>
          <Form.Item name="balance_myr" label="折算 MYR" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} precision={2} />
          </Form.Item>
          <Form.Item name="data_source" label="数据来源">
            <Select options={DATA_SOURCE_OPTIONS} />
          </Form.Item>
          <Form.Item name="notes" label="备注"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

import { useState, useEffect } from "react";
import { Card, Collapse, Table, Button, Modal, Form, Input, Select, InputNumber, Tag, Space, Typography, Popconfirm, message } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import api from "../../api";

const { Title } = Typography;
const DIM_LABELS = { customer: "客户风险", product: "产品/业务风险", channel: "渠道风险", geography: "地域风险" };
const DIM_COLORS = { customer: "#4a90e2", product: "#e67e22", channel: "#7b68ee", geography: "#2ecc71" };

export default function Indicators() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await api.get("/aml/items?preset_id=preset_securities");
      setItems(res.data.items || []);
    } catch (e) { /* */ }
    setLoading(false);
  };

  useEffect(() => { loadItems(); }, []);

  const grouped = {};
  items.forEach(i => { if (!grouped[i.dimension]) grouped[i.dimension] = []; grouped[i.dimension].push(i); });

  const handleSave = async () => {
    const values = await form.validateFields();
    try {
      if (editing) {
        await api.put(`/aml/items/${editing.item_key}`, values);
        message.success("指标已更新");
      } else {
        // Auto-generate item_key
        const itemKey = `${values.dimension}_${Date.now()}`;
        await api.post("/aml/items", { ...values, item_key: itemKey, preset_id: "preset_securities" });
        message.success("指标已创建");
      }
      setModalOpen(false);
      loadItems();
    } catch (e) {
      message.error(e.response?.data?.detail || "操作失败，请检查填写内容");
    }
  };

  const handleDelete = async (itemKey) => {
    await api.delete(`/aml/items/${itemKey}`);
    message.success("指标已禁用");
    loadItems();
  };

  const openEdit = (item) => {
    setEditing(item);
    form.setFieldsValue(item);
    setModalOpen(true);
  };

  const openCreate = (dim) => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ dimension: dim, category: "data_driven", severity: "中", weight: 20, sort_order: 99 });
    setModalOpen(true);
  };

  const columns = [
    { title: "指标名称", dataIndex: "name", key: "name", width: 200 },
    { title: "类别", dataIndex: "category", key: "cat", width: 100,
      render: v => v === "data_driven" ? <Tag>数据驱动</Tag> : <Tag color="purple">框架评估</Tag> },
    { title: "高阈值", dataIndex: "threshold_high", key: "th", width: 80, render: v => v ? `${(v*100).toFixed(0)}%` : "-" },
    { title: "权重", dataIndex: "weight", key: "wt", width: 70, render: v => `${(v*100).toFixed(0)}%` },
    { title: "操作", key: "action", width: 120,
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm title="禁用该指标？" onConfirm={() => handleDelete(r.item_key)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )},
  ];

  return (
    <div>
      <Title level={4}>📋 评估指标</Title>
      <Typography.Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
        共 {items.length} 项指标 · {Object.keys(grouped).length} 个维度
      </Typography.Text>

      {Object.entries(DIM_LABELS).map(([key, label]) => (
        <Card key={key} size="small" style={{ marginBottom: 12 }}
          title={<span style={{ color: DIM_COLORS[key] }}>{label}（{grouped[key]?.length || 0}项）</span>}
          extra={<Button size="small" icon={<PlusOutlined />} onClick={() => openCreate(key)}>新增</Button>}>
          <Table dataSource={grouped[key] || []} columns={columns} rowKey="item_key"
            size="small" pagination={false} loading={loading} />
        </Card>
      ))}

      <Modal title={editing ? "编辑评估指标" : "新增评估指标"} open={modalOpen}
        onOk={handleSave} onCancel={() => setModalOpen(false)} width={560}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="指标名称" rules={[{ required: true }]}>
            <Input placeholder="如：高风险职业客户" />
          </Form.Item>
          <Form.Item name="dimension" label="所属维度" rules={[{ required: true }]}>
            <Select options={Object.entries(DIM_LABELS).map(([k, v]) => ({ value: k, label: v }))} />
          </Form.Item>
          <Form.Item name="category" label="评估类别">
            <Select options={[{ value: "data_driven", label: "数据驱动" }, { value: "framework", label: "框架评估" }]} />
          </Form.Item>
          <Form.Item name="description" label="描述"><Input.TextArea rows={2} /></Form.Item>
          <Space>
            <Form.Item name="weight" label="权重(%)"><InputNumber min={1} max={100} /></Form.Item>
            <Form.Item name="severity" label="严重级别">
              <Select options={[{ value: "高", label: "高" }, { value: "中", label: "中" }, { value: "低", label: "低" }]} />
            </Form.Item>
          </Space>
          <Form.Item name="threshold_high" label="高风险阈值（比例/数值）"><InputNumber min={0} max={1} step={0.05} /></Form.Item>
          <Form.Item name="threshold_mid" label="中风险阈值"><InputNumber min={0} max={1} step={0.05} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

import { useState, useRef } from "react";
import { Card, Table, Button, Space, Tag, Typography, Select, message, Popconfirm } from "antd";
import { UploadOutlined, DeleteOutlined, CheckCircleOutlined, InboxOutlined } from "@ant-design/icons";
import api from "../../api";

const { Title, Text } = Typography;
const TABLE_KEYS = ["customer", "account", "trans_record", "product"];
const TABLE_NAMES = { customer: "客户表", account: "账户表", trans_record: "交易表", product: "产品表" };

export default function ImportPreview() {
  const [files, setFiles] = useState({});
  const [preview, setPreview] = useState(null);
  const [previewTable, setPreviewTable] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedTable, setSelectedTable] = useState("customer");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const doUpload = async (file) => {
    const table = selectedTable;
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      // Use fetch instead of axios to avoid Content-Type: application/json override
      const response = await fetch(`/api/import/upload?table=${table}`, {
        method: "POST",
        body: form,
      });
      const data = await response.json();
      if (data.status === "ok") {
        const p = data.preview;
        setFiles(prev => ({ ...prev, [table]: { name: file.name, rows: p.total_rows, valid: p.validation.valid_count, invalid: p.validation.invalid_count } }));
        setPreview(p);
        setPreviewTable(table);
        message.success(`${TABLE_NAMES[table]} 上传成功`);
      } else {
        message.error(`${TABLE_NAMES[table]} 上传失败: ${data.detail || "未知错误"}`);
      }
    } catch (e) {
      message.error(`${TABLE_NAMES[table]} 上传失败: ${e.message || "网络错误"}`);
    }
    setUploading(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) doUpload(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) doUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const removeFile = (table) => {
    setFiles(prev => { const n = { ...prev }; delete n[table]; return n; });
    if (previewTable === table) { setPreview(null); setPreviewTable(null); }
  };

  const confirmImport = async () => {
    try {
      await api.post("/import/confirm");
      message.success("数据导入成功！");
    } catch (e) {
      message.error("导入失败");
    }
  };

  const clearAll = async () => {
    try {
      await api.post("/import/clear");
      setFiles({});
      setPreview(null);
      setPreviewTable(null);
      message.success("数据已清空");
    } catch (e) {
      message.error("清空失败");
    }
  };

  const previewColumns = preview ? (preview.columns || []).map(c => ({
    title: c, dataIndex: c, key: c, ellipsis: true, width: 120,
    render: v => v === null || v === "" ? <Text type="secondary" italic>(空)</Text> : String(v).substring(0, 30),
  })) : [];

  return (
    <div>
      <Title level={4}>📥 预览调整</Title>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
          <Text strong>选择数据表：</Text>
          <Select value={selectedTable} onChange={setSelectedTable} style={{ width: 160 }}
            options={TABLE_KEYS.map(k => ({ value: k, label: TABLE_NAMES[k] }))} />
          {Object.keys(files).length > 0 && (
            <Text type="secondary">已上传 {Object.keys(files).length}/4 个表</Text>
          )}
        </div>

        {/* Native file input (hidden) */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          style={{ display: "none" }}
          onChange={handleFileSelect}
        />

        {/* Custom drag/drop + click area */}
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{
            border: `2px dashed ${dragOver ? "#4a90d9" : "#d9d9d9"}`,
            borderRadius: 8,
            padding: "32px 16px",
            textAlign: "center",
            cursor: uploading ? "not-allowed" : "pointer",
            background: dragOver ? "#f0f5ff" : "#fafafa",
            transition: "all 0.2s",
            opacity: uploading ? 0.6 : 1,
          }}>
          <p style={{ fontSize: 36, marginBottom: 8 }}>
            <InboxOutlined style={{ color: dragOver ? "#4a90d9" : "#999" }} />
          </p>
          <p style={{ fontWeight: 600 }}>
            {uploading ? "上传中..." : "拖拽 CSV 文件到此处，或点击选择"}
          </p>
          <Text type="secondary">
            当前选择：{TABLE_NAMES[selectedTable]} · 支持 UTF-8 / GBK 编码，单文件不超过 10 万行
          </Text>
        </div>
      </Card>

      {Object.keys(files).length > 0 && (
        <Card title="已上传文件" size="small" style={{ marginBottom: 16 }}>
          {TABLE_KEYS.map(t => files[t] ? (
            <div key={t} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
              <Space>
                <CheckCircleOutlined style={{ color: "#52c41a" }} />
                <Text strong>{TABLE_NAMES[t]}</Text>
                <Text type="secondary">{files[t].name} · {files[t].rows} 行</Text>
                {files[t].invalid > 0 && <Tag color="warning">⚠ {files[t].invalid} 异常</Tag>}
              </Space>
              <Space>
                <Button size="small" onClick={() => { setPreviewTable(t); setPreview({ ...preview, table: t }); }}>查看</Button>
                <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeFile(t)} />
              </Space>
            </div>
          ) : null)}
        </Card>
      )}

      {preview && previewTable && (
        <Card title={`预览: ${TABLE_NAMES[previewTable]}（前 20 行 / 共 ${preview.total_rows} 行）`} style={{ marginBottom: 16 }}>
          <Table columns={previewColumns} dataSource={(preview.rows || []).map((r, i) => ({ ...r, key: i }))}
            size="small" scroll={{ x: true }} pagination={false} />
          <div style={{ marginTop: 12 }}>
            <Space>
              <Tag color="success">✅ {preview.validation.valid_count} 行正常</Tag>
              {preview.validation.invalid_count > 0 && <Tag color="warning">⚠️ {preview.validation.invalid_count} 行异常</Tag>}
            </Space>
          </div>
        </Card>
      )}

      <Card>
        <Space>
          <Popconfirm title="确认导入数据？" onConfirm={confirmImport}>
            <Button type="primary" icon={<CheckCircleOutlined />} disabled={Object.keys(files).length === 0}>
              确认导入
            </Button>
          </Popconfirm>
          <Popconfirm title="清空所有数据？" onConfirm={clearAll}>
            <Button danger disabled={Object.keys(files).length === 0}>🗑 清空全部</Button>
          </Popconfirm>
        </Space>
      </Card>
    </div>
  );
}

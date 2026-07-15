import { useState, useEffect } from "react";
import { Table, Button, Card, Modal, Tag, Space, Popconfirm, message, Spin, Typography } from "antd";
import { FileWordOutlined, EyeOutlined, DeleteOutlined, DownloadOutlined } from "@ant-design/icons";
import api from "../../api";

const { Title } = Typography;

export default function ReportHistory() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const fetch = () => {
    setLoading(true);
    api.get("/report/history").then((r) => setData(r.data.history || [])).finally(() => setLoading(false));
  };
  useEffect(() => { fetch(); }, []);

  const viewReport = async (id) => {
    setViewModal(true); setViewLoading(true);
    try {
      const r = await api.get(`/report/history/${id}`);
      setViewRecord(r.data.record);
    } catch (e) {
      message.error("加载失败");
    } finally {
      setViewLoading(false);
    }
  };

  const downloadWord = async (record) => {
    try {
      const res = await api.get(`/report/history/${record.id}/export`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a"); a.href = url;
      a.download = `${record.title}_${record.date}.docx`;
      a.click();
      window.URL.revokeObjectURL(url);
      message.success("下载成功");
    } catch (e) {
      message.error("下载失败");
    }
  };

  const delReport = async (id) => {
    try {
      await api.delete(`/report/history/${id}`);
      message.success("已删除");
      fetch();
    } catch (e) {
      message.error("删除失败");
    }
  };

  const columns = [
    { title: "日期", dataIndex: "date", key: "date", width: 110 },
    { title: "报告标题", dataIndex: "title", key: "title" },
    { title: "编号", dataIndex: "report_no", key: "no", width: 140 },
    { title: "编制人", dataIndex: "author", key: "author", width: 100 },
    { title: "模板", dataIndex: "template_id", key: "tpl", width: 100, render: (v) => <Tag>{v}</Tag> },
    { title: "保存时间", dataIndex: "created_at", key: "time", width: 170 },
    {
      title: "操作", key: "action", width: 200,
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => viewReport(r.id)}>查看</Button>
          <Button size="small" icon={<DownloadOutlined />} onClick={() => downloadWord(r)}>下载</Button>
          <Popconfirm title="确定删除？" onConfirm={() => delReport(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Title level={4} style={{ marginBottom: 0 }}>📄 历史报告</Title>
      </div>

      <Card>
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading}
          locale={{ emptyText: "暂无保存的报告，请先到「报告生成」页面生成并保存" }} />
      </Card>

      <Modal title={viewRecord?.title || "查看报告"} open={viewModal}
        onCancel={() => { setViewModal(false); setViewRecord(null); }}
        footer={<Button icon={<FileWordOutlined />} onClick={() => viewRecord && downloadWord(viewRecord)}>下载Word</Button>}
        width={800}>
        {viewLoading ? <Spin /> : viewRecord && (
          <div>
            <p style={{ color: "#999", marginBottom: 16 }}>
              编号：{viewRecord.report_no}  编制人：{viewRecord.author}  日期：{viewRecord.date}
            </p>
            {(viewRecord.content_json?.sections || []).map((sec, i) => (
              <div key={i} style={{ marginBottom: 20 }}>
                <h4 style={{ color: "#1a1f3a", borderBottom: "1px solid #f0f0f0", paddingBottom: 6 }}>{sec.title}</h4>
                <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: "0.88rem", lineHeight: 1.7, color: "#333" }}>{sec.content}</pre>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

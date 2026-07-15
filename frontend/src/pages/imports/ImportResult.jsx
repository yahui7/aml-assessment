import { useState, useEffect } from "react";
import { Card, Statistic, Row, Col, Button, Table, Tag, Typography, Spin, Empty } from "antd";
import { ReloadOutlined, DeleteOutlined } from "@ant-design/icons";
import api from "../../api";

const { Title, Text } = Typography;
const TABLE_NAMES = { customer: "客户", account: "账户", trans_record: "交易", product: "产品" };
const TABLE_ICONS = { customer: "👤", account: "💳", trans_record: "💸", product: "📦" };

export default function ImportResult() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get("/import/status");
      setStatus(res.data);
    } catch (e) { /* empty */ }
    setLoading(false);
  };

  useEffect(() => { loadStatus(); }, []);

  const clearData = async () => {
    await api.post("/import/clear");
    loadStatus();
  };

  if (loading) return <Spin style={{ display: "block", margin: "80px auto" }} />;

  const hasData = status?.has_data;

  return (
    <div>
      <Title level={4}>📥 导入结果</Title>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          {Object.entries(TABLE_NAMES).map(([key, name]) => (
            <Col xs={12} sm={6} key={key}>
              <Card size="small" style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28 }}>{TABLE_ICONS[key]}</div>
                <Statistic title={name} value={status?.counts?.[key] || 0} />
                {hasData && <Tag color="success" style={{ marginTop: 4 }}>✅ 正常</Tag>}
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Card>
        {hasData ? (
          <>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <Tag color="success" style={{ fontSize: 14, padding: "4px 16px" }}>🟢 数据就绪，可执行评估</Tag>
            </div>
            <Table dataSource={Object.entries(TABLE_NAMES).map(([k, v]) => ({
              key: k, table: v, icon: TABLE_ICONS[k], count: status.counts?.[k] || 0,
            }))} pagination={false} size="small"
              columns={[
                { title: "表名", dataIndex: "table", key: "table", render: (v, r) => <>{r.icon} {v}</> },
                { title: "记录数", dataIndex: "count", key: "count" },
                { title: "状态", key: "status", render: () => <Tag color="success">正常</Tag> },
              ]} />
            <div style={{ marginTop: 16 }}>
              <Button icon={<ReloadOutlined />} onClick={loadStatus}>刷新</Button>
              <Button danger icon={<DeleteOutlined />} onClick={clearData} style={{ marginLeft: 8 }}>清空数据</Button>
            </div>
          </>
        ) : (
          <Empty description="暂无导入数据">
            <Text type="secondary">请先到"下载模板"和"预览调整"页面准备数据</Text>
          </Empty>
        )}
      </Card>
    </div>
  );
}

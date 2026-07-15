import { Card, Row, Col, Button, Typography, Space, message } from "antd";
import { DownloadOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const TEMPLATES = [
  { key: "customer", icon: "👤", name: "客户表", fields: 12, desc: "客户基本信息、证件、风险评估" },
  { key: "account", icon: "💳", name: "账户表", fields: 9, desc: "账户类型、余额、状态" },
  { key: "trans_record", icon: "💸", name: "交易表", fields: 10, desc: "交易流水、金额、渠道" },
  { key: "product", icon: "📦", name: "产品表", fields: 8, desc: "产品信息、风险等级、发行人" },
];

export default function ImportTemplates() {
  const download = (key) => {
    const a = document.createElement("a");
    a.href = `/api/import/templates/${key}`;
    a.download = "";
    a.click();
    message.success(`${TEMPLATES.find(t => t.key === key)?.name}模板下载中`);
  };

  return (
    <div>
      <Title level={4}>📥 下载 CSV 模板</Title>
      <Text type="secondary" style={{ display: "block", marginBottom: 24 }}>
        请先下载模板，按格式准备数据后，到"预览调整"页面上传
      </Text>
      <Row gutter={[16, 16]}>
        {TEMPLATES.map(t => (
          <Col xs={24} sm={12} md={6} key={t.key}>
            <Card hoverable style={{ textAlign: "center" }} onClick={() => download(t.key)}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>{t.icon}</div>
              <Title level={5}>{t.name}</Title>
              <Text type="secondary">{t.fields} 个字段</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>{t.desc}</Text>
              <div style={{ marginTop: 12 }}>
                <Button type="primary" icon={<DownloadOutlined />}>下载</Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
      <Card style={{ marginTop: 16, background: "#f6f8ff" }}>
        <Text type="secondary">💡 提示：模板第一行为表头，第二行为示例数据，请参考格式填写。支持 UTF-8 / GBK 编码。</Text>
      </Card>
    </div>
  );
}

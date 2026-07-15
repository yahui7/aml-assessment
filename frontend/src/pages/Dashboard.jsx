import { useState, useEffect } from "react";
import { Row, Col, Card, Table, Tag, Typography, Spin, Empty, Button } from "antd";
import { useNavigate } from "react-router-dom";
import { ArrowRightOutlined } from "@ant-design/icons";
import ReactECharts from "echarts-for-react";
import api from "../api";

const { Title, Text } = Typography;
const DIM_KEYS = ["customer", "product", "channel", "geography"];
const DIM_LABELS = { customer: "客户风险", product: "产品/业务风险", channel: "渠道风险", geography: "地域风险" };
const DIM_COLORS = { customer: "#4a90e2", product: "#e67e22", channel: "#7b68ee", geography: "#2ecc71" };

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/aml/dashboard").then((res) => {
      setData(res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ textAlign: "center", padding: "120px 0" }}>
      <Spin size="large" />
    </div>
  );

  if (!data?.has_data) {
    return (
      <div>
        <h2 className="page-title">📊 AML 洗钱风险 Dashboard</h2>
        <Empty description={data?.message || "暂无评估数据"}>
          <Text type="secondary">请先在"数据导入"页面导入数据，再在"执行评估"页面执行评估</Text>
        </Empty>
      </div>
    );
  }

  const latest = data.latest;
  const levelColor = { 低: "green", 中: "orange", 高: "red", 最高: "#cf1322" };
  const scoreColorVal = (levelColor[latest.risk_level] || "#333")
    .replace("green", "#52c41a").replace("orange", "#faad14").replace("red", "#e74c3c");

  const scoreCards = [
    { label: "综合评分", value: latest.overall_score, unit: "分",
      color: scoreColorVal, icon: "📊" },
    { label: "风险等级", value: latest.risk_level_name, unit: "",
      color: scoreColorVal, icon: "🏷️" },
    { label: "客户维度", value: latest.dimension_scores.customer, unit: "分",
      color: DIM_COLORS.customer, icon: "👤" },
    { label: "产品维度", value: latest.dimension_scores.product, unit: "分",
      color: DIM_COLORS.product, icon: "📦" },
    { label: "渠道维度", value: latest.dimension_scores.channel, unit: "分",
      color: DIM_COLORS.channel, icon: "🔗" },
    { label: "地域维度", value: latest.dimension_scores.geography, unit: "分",
      color: DIM_COLORS.geography, icon: "🌍" },
  ];

  // Radar chart
  const radarOption = {
    radar: {
      indicator: DIM_KEYS.map(k => ({ name: DIM_LABELS[k], max: 100 })),
      center: ["50%", "55%"],
      radius: "65%",
    },
    series: [{
      type: "radar",
      data: [{
        value: DIM_KEYS.map(k => latest.dimension_scores[k] || 0),
        name: "本次评估",
        areaStyle: { color: "rgba(74,144,226,0.12)" },
        lineStyle: { color: "#4a90e2", width: 2 },
      }],
      symbol: "circle",
      symbolSize: 6,
      itemStyle: { color: "#4a90e2" },
    }],
  };

  // High risk table columns
  const highRiskColumns = [
    { title: "维度", dataIndex: "dimension_label", key: "dim", width: 110,
      render: (v, r) => <Tag color={DIM_COLORS[r.dimension]?.replace("#", "")}>{v}</Tag> },
    { title: "指标名称", dataIndex: "name", key: "name", width: 180 },
    { title: "风险", dataIndex: "risk", key: "risk", width: 60,
      render: (v) => <Tag color="red">{v}</Tag> },
    { title: "数据详情", dataIndex: "detail", key: "detail", ellipsis: true },
    { title: "说明", dataIndex: "remark", key: "remark", width: 160, render: v => v || "-" },
  ];

  const ds = latest.data_summary;

  return (
    <div>
      <h2 className="page-title">📊 AML 洗钱风险 Dashboard</h2>
      <Text type="secondary" style={{ display: "block", marginBottom: 20, marginTop: -12 }}>
        最新评估：{latest.assess_date} · 共完成 {data.total_assessments} 次评估 · 生成 {data.total_reports} 份报告
      </Text>

      {/* Score Cards */}
      <div className="score-row" style={{ gridTemplateColumns: "repeat(6, 1fr)", marginBottom: 20 }}>
        {scoreCards.map((s, i) => (
          <div key={i} className="score-card">
            <div className="label">{s.icon} {s.label}</div>
            <div className="value" style={{ color: s.color, fontSize: s.label === "风险等级" ? "1.6rem" : "2.4rem" }}>
              {s.value}{s.unit && <span style={{ fontSize: "0.9rem", marginLeft: 2 }}>{s.unit}</span>}
            </div>
            <div className="bar"><div className="fill" style={{ width: "60%", background: s.color }} /></div>
          </div>
        ))}
      </div>

      {/* Data Overview + Radar Chart */}
      <Row gutter={20} style={{ marginBottom: 20 }}>
        <Col xs={24} md={12}>
          <div className="chart-panel" style={{ height: 340 }}>
            <h3 style={{ marginBottom: 16 }}>数据概览</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 10 }}>
              {[
                { icon: "👤", label: "客户", value: ds.customers, color: DIM_COLORS.customer },
                { icon: "💳", label: "账户", value: ds.accounts, color: "#52c41a" },
                { icon: "💸", label: "交易", value: ds.transactions, color: "#fa8c16" },
                { icon: "📦", label: "产品", value: ds.products, color: "#722ed1" },
              ].map((item, i) => (
                <div key={i} style={{
                  textAlign: "center", padding: "14px 8px",
                  background: "#fafafa", borderRadius: 8,
                  borderTop: `3px solid ${item.color}`,
                }}>
                  <div style={{ fontSize: "0.75rem", color: "#999", marginBottom: 6 }}>
                    {item.icon} {item.label}
                  </div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 700, color: item.color }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
            <div style={{
              textAlign: "center", padding: "14px 8px",
              background: "#fff1f0", borderRadius: 8,
              border: "1px solid #ffa39e",
            }}>
              <div style={{ fontSize: "0.75rem", color: "#999", marginBottom: 6 }}>
                ⚠ 高风险指标
              </div>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#e74c3c" }}>
                {data.high_risk_items?.length || 0}
              </div>
            </div>
            <div style={{ marginTop: 20, textAlign: "center" }}>
              <Button type="link" icon={<ArrowRightOutlined />}
                onClick={() => navigate("/assessment/history")}>
                查看评估趋势与历史
              </Button>
            </div>
          </div>
        </Col>
        <Col xs={24} md={12}>
          <div className="chart-panel" style={{ height: 340 }}>
            <h3 style={{ marginBottom: 8 }}>四维风险雷达</h3>
            <ReactECharts option={radarOption} style={{ height: 280 }} />
          </div>
        </Col>
      </Row>

      {/* High Risk Items */}
      <div className="chart-panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>⚠ 高风险指标</h3>
          <Button type="link" icon={<ArrowRightOutlined />}
            onClick={() => navigate("/assessment/current")}>
            执行评估查看详情
          </Button>
        </div>
        {data.high_risk_items?.length > 0 ? (
          <Table
            columns={highRiskColumns}
            dataSource={data.high_risk_items}
            rowKey={(r, i) => `${r.dimension}_${i}`}
            size="small"
            pagination={false}
          />
        ) : (
          <div style={{ textAlign: "center", padding: 40, color: "#52c41a" }}>
            <div style={{ fontSize: "2rem", marginBottom: 8 }}>✅</div>
            <Text type="secondary">恭喜，本次评估无高风险指标</Text>
          </div>
        )}
      </div>
    </div>
  );
}

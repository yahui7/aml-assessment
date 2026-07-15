import { useState, useEffect } from "react";
import { Card, Table, Tag, Button, Select, Row, Col, Typography, Space, Spin, Empty, Descriptions } from "antd";
import { SwapOutlined, HistoryOutlined } from "@ant-design/icons";
import ReactECharts from "echarts-for-react";
import api from "../../api";

const { Title, Text } = Typography;

export default function AssessmentHistory() {
  const [history, setHistory] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);

  // 对比
  const [compareA, setCompareA] = useState(null);
  const [compareB, setCompareB] = useState(null);
  const [compareResult, setCompareResult] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [hRes, tRes] = await Promise.all([
        api.get("/aml/history?limit=50"),
        api.get("/aml/history/trend?limit=30"),
      ]);
      setHistory(hRes.data.history || []);
      setTrend(tRes.data.trend || []);
    } catch (e) { /* */ }
    setLoading(false);
  };

  const runCompare = async () => {
    if (!compareA || !compareB) return;
    try {
      const res = await api.get(`/aml/compare?id1=${compareA}&id2=${compareB}`);
      setCompareResult(res.data);
    } catch (e) { /* */ }
  };

  const levelColor = { 低: "green", 中: "orange", 高: "red", 最高: "#cf1322" };
  const trendOption = {
    tooltip: { trigger: "axis" },
    legend: { data: ["综合", "客户", "产品", "渠道", "地域"], bottom: 0 },
    grid: { left: 40, right: 20, top: 20, bottom: 40 },
    xAxis: { type: "category", data: trend.map(d => d.date?.slice(0, 10)), axisLabel: { rotate: 30, fontSize: 10 } },
    yAxis: { type: "value", min: 0, max: 100 },
    series: [
      { name: "综合", type: "line", data: trend.map(d => d.overall), lineStyle: { width: 3, color: "#1a1f3a" }, symbol: "circle", symbolSize: 3 },
      { name: "客户", type: "line", data: trend.map(d => d.customer), lineStyle: { color: "#4a90e2" }, symbol: "none" },
      { name: "产品", type: "line", data: trend.map(d => d.product), lineStyle: { color: "#e67e22" }, symbol: "none" },
      { name: "渠道", type: "line", data: trend.map(d => d.channel), lineStyle: { color: "#7b68ee" }, symbol: "none" },
      { name: "地域", type: "line", data: trend.map(d => d.geography), lineStyle: { color: "#2ecc71" }, symbol: "none" },
    ],
  };

  const columns = [
    { title: "日期", dataIndex: "assess_date", key: "date", width: 120 },
    { title: "评分", dataIndex: "overall_score", key: "score", width: 80, render: v => <Text strong>{v}</Text> },
    { title: "等级", dataIndex: "risk_level", key: "level", width: 80,
      render: v => <Tag color={levelColor[v]}>{v}风险</Tag> },
    { title: "客户", dataIndex: "customer_count", key: "cust", width: 70 },
    { title: "交易", dataIndex: "trans_count", key: "txn", width: 70 },
    { title: "操作", key: "action", width: 80,
      render: (_, r) => <Button size="small" onClick={() => setExpandedRow(expandedRow === r.id ? null : r.id)}>详情</Button> },
  ];

  const compareOption = compareResult ? {
    radar: { indicator: [
      { name: "客户风险", max: 100 }, { name: "产品风险", max: 100 }, { name: "渠道风险", max: 100 }, { name: "地域风险", max: 100 },
    ], center: ["50%", "55%"], radius: "65%" },
    series: [
      { type: "radar", name: compareResult.assessment_a.date, data: [{ value: [compareResult.comparison.customer?.value > 0 ? 70 : 50, 50, 50, 50], name: "A" }],
        lineStyle: { color: "#4a90e2" }, symbol: "circle", symbolSize: 4, itemStyle: { color: "#4a90e2" } },
    ],
  } : {};

  return (
    <div>
      <Title level={4}>📊 历史结果</Title>

      {trend.length > 0 && (
        <Card title={<><HistoryOutlined /> 评估趋势</>} style={{ marginBottom: 16 }}>
          <ReactECharts option={trendOption} style={{ height: 350 }} />
        </Card>
      )}

      <Card title={<><SwapOutlined /> 对比分析</>} size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={10}>
            <Text style={{ marginRight: 8 }}>基准 A：</Text>
            <Select placeholder="选择评估" style={{ width: "100%" }} onChange={setCompareA}
              options={history.map(h => ({ value: h.id, label: `#${h.id} ${h.assess_date} (${h.overall_score}分)` }))} />
          </Col>
          <Col span={2} style={{ textAlign: "center" }}><Text type="secondary">VS</Text></Col>
          <Col span={10}>
            <Text style={{ marginRight: 8 }}>对比 B：</Text>
            <Select placeholder="选择评估" style={{ width: "100%" }} onChange={setCompareB}
              options={history.map(h => ({ value: h.id, label: `#${h.id} ${h.assess_date} (${h.overall_score}分)` }))} />
          </Col>
          <Col span={2}><Button type="primary" onClick={runCompare} disabled={!compareA || !compareB}>对比</Button></Col>
        </Row>

        {compareResult && (
          <Card size="small" style={{ marginTop: 16, background: "#fafafa" }}>
            <Row gutter={16} style={{ textAlign: "center" }}>
              <Col span={12}>
                <Text type="secondary">{compareResult.assessment_a.date}</Text>
                <div style={{ fontSize: 36, fontWeight: 700 }}>{compareResult.assessment_a.overall_score}</div>
                <Tag color={levelColor[compareResult.assessment_a.risk_level]}>{compareResult.assessment_a.risk_level}</Tag>
              </Col>
              <Col span={12}>
                <Text type="secondary">{compareResult.assessment_b.date}</Text>
                <div style={{ fontSize: 36, fontWeight: 700 }}>{compareResult.assessment_b.overall_score}</div>
                <Tag color={levelColor[compareResult.assessment_b.risk_level]}>{compareResult.assessment_b.risk_level}</Tag>
              </Col>
            </Row>
            <Row gutter={[8, 8]} style={{ marginTop: 16 }}>
              {Object.entries(compareResult.comparison || {}).map(([k, v]) => {
                const color = v.direction === "up" ? "#e74c3c" : v.direction === "down" ? "#52c41a" : "#999";
                return (
                  <Col span={12} key={k}>
                    <Card size="small"><Text type="secondary">{k}</Text>
                      <Text strong style={{ color, fontSize: 16, marginLeft: 8 }}>{v.label}</Text>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </Card>
        )}
      </Card>

      <Card title="历史记录">
        <Table loading={loading} dataSource={history} columns={columns} rowKey="id" size="small"
          expandable={{
            expandedRowRender: (r) => <ExpandedDetail id={r.id} />,
            expandedRowKeys: expandedRow ? [expandedRow] : [],
            onExpand: (expanded, r) => setExpandedRow(expanded ? r.id : null),
          }}
          pagination={{ pageSize: 10 }} />
        {history.length === 0 && !loading && <Empty description="暂无评估记录" />}
      </Card>
    </div>
  );
}

function ExpandedDetail({ id }) {
  const [detail, setDetail] = useState(null);
  useEffect(() => {
    api.get(`/aml/history/${id}`).then(res => {
      if (res.data.status === "ok") setDetail(res.data.record);
    });
  }, [id]);

  if (!detail) return <Spin />;
  const DIM_LABELS = { customer: "客户风险", product: "产品风险", channel: "渠道风险", geography: "地域风险" };
  const DIM_COLORS = { customer: "#4a90e2", product: "#e67e22", channel: "#7b68ee", geography: "#2ecc71" };

  return (
    <Row gutter={8}>
      {Object.entries(DIM_LABELS).map(([k, label]) => (
        <Col span={6} key={k}>
          <Card size="small" style={{ borderLeft: `3px solid ${DIM_COLORS[k]}` }}>
            <div style={{ fontSize: 12, color: "#999" }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{detail.scores?.[k] || 0}</div>
            <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>
              {(detail.dimensions?.[k]?.items || []).slice(0, 3).map(it => `· ${it.name}: ${it.risk}`).join("\n")}
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );
}

import { useState, useEffect } from "react";
import { Card, Button, Row, Col, Statistic, Tag, Collapse, Table, Typography, Spin, Empty, message } from "antd";
import ReactECharts from "echarts-for-react";
import api from "../../api";

const { Title, Text } = Typography;
const DIM_KEYS = ["customer", "product", "channel", "geography"];
const DIM_LABELS = { customer: "客户风险", product: "产品/业务风险", channel: "渠道风险", geography: "地域风险" };
const DIM_COLORS = { customer: "#4a90e2", product: "#e67e22", channel: "#7b68ee", geography: "#2ecc71" };

export default function AssessmentCurrent() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(null);

  useEffect(() => { loadLatest(); }, []);

  const loadLatest = async () => {
    try {
      const res = await api.get("/aml/history?limit=1");
      if (res.data.history?.length > 0) {
        const detail = await api.get(`/aml/history/${res.data.history[0].id}`);
        if (detail.data.status === "ok") {
          const r = detail.data.record;
          setHistory({
            status: "ok", assessment_time: r.assess_date, preset_id: r.preset_id,
            overall_score: r.overall_score, risk_level: r.risk_level,
            risk_level_name: { 低: "低风险", 中: "中风险", 高: "高风险", 最高: "最高风险" }[r.risk_level] || r.risk_level,
            data_summary: r.data_summary, dimensions: r.dimensions, recommendations: r.recommendations,
          });
        }
      }
    } catch (e) { /* */ }
  };

  const runAssessment = async () => {
    setLoading(true);
    try {
      const res = await api.post("/aml/assess?preset_id=preset_securities");
      if (res.data.status === "ok") {
        setResult(res.data);
        message.success("评估完成！");
        loadLatest();
      }
    } catch (e) { message.error("评估失败"); }
    setLoading(false);
  };

  const display = result || history;

  const dims = display?.dimensions || {};
  const radarOption = display ? {
    radar: { indicator: DIM_KEYS.map(k => ({ name: DIM_LABELS[k], max: 100 })),
      center: ["50%", "55%"], radius: "65%" },
    series: [{ type: "radar", data: [{ value: DIM_KEYS.map(k => dims[k]?.score || 0), name: "本次评估",
      areaStyle: { color: "rgba(74,144,226,0.12)" }, lineStyle: { color: "#4a90e2", width: 2 } }],
      symbol: "circle", symbolSize: 6, itemStyle: { color: "#4a90e2" } }],
  } : {};

  const levelColor = { 低: "green", 中: "orange", 高: "red", 最高: "#cf1322" };
  const scoreColor = (levelColor[display?.risk_level] || "#333")
    .replace("green", "#52c41a").replace("orange", "#faad14").replace("red", "#e74c3c");

  const dimColumns = [
    { title: "评估项", dataIndex: "name", key: "name", width: 200 },
    { title: "风险", dataIndex: "risk", key: "risk", width: 70,
      render: v => <Tag color={v === "高" ? "red" : v === "中" ? "orange" : "green"}>{v}</Tag> },
    { title: "数据详情", dataIndex: "detail", key: "detail" },
    { title: "说明", dataIndex: "remark", key: "remark", width: 200 },
  ];

  // Card height: match the radar chart (300px chart + 48px title area)
  const panelHeight = 380;

  return (
    <div>
      <Title level={4}>📊 评估现状</Title>

      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            {display ? (
              <Text type="secondary">
                上次执行时间：<Text strong>{display.assessment_time}</Text>
              </Text>
            ) : (
              <Text type="secondary">暂无评估记录</Text>
            )}
          </Col>
          <Col>
            <Button type="primary" size="large" onClick={runAssessment} loading={loading}>
              🔍 执行评估
            </Button>
          </Col>
        </Row>
      </Card>

      {display ? (
        <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            {/* 综合风险评分 */}
            <Col xs={24} md={6}>
              <Card style={{ height: panelHeight, display: "flex", flexDirection: "column" }}
                bodyStyle={{ display: "flex", flexDirection: "column", height: "100%", paddingBottom: 8 }}>
                <div style={{ textAlign: "center", flex: "0 0 auto" }}>
                  <Text type="secondary">综合风险评分</Text>
                  <div style={{ fontSize: 60, fontWeight: 700, color: scoreColor, lineHeight: 1.1 }}>
                    {display.overall_score}
                  </div>
                  <Tag color={levelColor[display.risk_level]} style={{ fontSize: 14, padding: "2px 14px" }}>
                    {display.risk_level_name}
                  </Tag>
                </div>

                {display.data_summary && (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", marginTop: 8 }}>
                    <Row gutter={[6, 6]}>
                      <Col span={12}>
                        <div style={{ textAlign: "center", padding: "8px 4px", background: "#f0f5ff", borderRadius: 6 }}>
                          <div style={{ fontSize: 18, fontWeight: 700, color: "#4a90e2" }}>
                            {display.data_summary.customers}
                          </div>
                          <div style={{ fontSize: 11, color: "#999" }}>👤 客户</div>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ textAlign: "center", padding: "8px 4px", background: "#f6ffed", borderRadius: 6 }}>
                          <div style={{ fontSize: 18, fontWeight: 700, color: "#52c41a" }}>
                            {display.data_summary.accounts}
                          </div>
                          <div style={{ fontSize: 11, color: "#999" }}>💳 账户</div>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ textAlign: "center", padding: "8px 4px", background: "#fff7e6", borderRadius: 6 }}>
                          <div style={{ fontSize: 18, fontWeight: 700, color: "#fa8c16" }}>
                            {display.data_summary.transactions}
                          </div>
                          <div style={{ fontSize: 11, color: "#999" }}>💸 交易</div>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ textAlign: "center", padding: "8px 4px", background: "#f9f0ff", borderRadius: 6 }}>
                          <div style={{ fontSize: 18, fontWeight: 700, color: "#722ed1" }}>
                            {display.data_summary.products}
                          </div>
                          <div style={{ fontSize: 11, color: "#999" }}>📦 产品</div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                )}
              </Card>
            </Col>

            {/* 四维风险雷达 */}
            <Col xs={24} md={12}>
              <Card title="四维风险雷达" style={{ height: panelHeight }}
                bodyStyle={{ paddingTop: 0 }}>
                <ReactECharts option={radarOption} style={{ height: 300 }} />
              </Card>
            </Col>

            {/* 关键发现 */}
            <Col xs={24} md={6}>
              <Card title="关键发现" size="small" style={{ height: panelHeight }}
                bodyStyle={{ height: panelHeight - 57, overflow: "auto" }}>
                {(() => {
                  let all = []; DIM_KEYS.forEach(k => { all = all.concat(dims[k]?.items || []); });
                  const high = all.filter(i => i.risk === "高").length;
                  const mid = all.filter(i => i.risk === "中").length;
                  const low = all.filter(i => i.risk === "低").length;
                  const topHigh = all.filter(i => i.risk === "高").slice(0, 3);
                  return <>
                    <div style={{ marginBottom: 12 }}>
                      <Text style={{ color: "#e74c3c", fontSize: 28, fontWeight: 700 }}>{high}</Text>
                      <Text type="secondary" style={{ marginLeft: 4 }}>项高风险</Text>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <Text style={{ color: "#faad14", fontSize: 28, fontWeight: 700 }}>{mid}</Text>
                      <Text type="secondary" style={{ marginLeft: 4 }}>项中风险</Text>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <Text style={{ color: "#52c41a", fontSize: 28, fontWeight: 700 }}>{low}</Text>
                      <Text type="secondary" style={{ marginLeft: 4 }}>项低风险</Text>
                    </div>
                    {topHigh.length > 0 && (
                      <div style={{ marginTop: 16, borderTop: "1px solid #f0f0f0", paddingTop: 12 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>高风险指标：</Text>
                        {topHigh.map((item, i) => (
                          <Tag color="red" key={i} style={{ marginTop: 4, display: "block" }}>
                            ⚠ {item.name}
                          </Tag>
                        ))}
                      </div>
                    )}
                  </>;
                })()}
              </Card>
            </Col>
          </Row>

          {DIM_KEYS.map((k) => {
            const dim = dims[k];
            if (!dim) return null;
            return (
              <Card key={k} size="small" style={{ marginBottom: 12 }}
                title={<span style={{ color: DIM_COLORS[k] }}>{DIM_LABELS[k]} · {dim.score} 分 · {dim.summary}</span>}>
                <Table dataSource={dim.items || []} columns={dimColumns} rowKey="name" size="small" pagination={false} />
                {dim.recommendations?.length > 0 && (
                  <div style={{ marginTop: 12, padding: 12, background: "#f6f8ff", borderRadius: 8 }}>
                    <Text strong>💡 建议：</Text>
                    <ul style={{ margin: "4px 0 0 16px" }}>
                      {dim.recommendations.map((r, j) => <li key={j}><Text type="secondary">{r}</Text></li>)}
                    </ul>
                  </div>
                )}
              </Card>
            );
          })}

          {display.recommendations?.length > 0 && (
            <Card title="🛡️ 整改建议汇总" size="small">
              <ol style={{ paddingLeft: 20 }}>
                {display.recommendations.map((r, i) => <li key={i} style={{ padding: "4px 0" }}><Text>{r}</Text></li>)}
              </ol>
            </Card>
          )}
        </>
      ) : (
        <Empty description="暂无评估结果">
          <Text type="secondary">请先导入数据，然后点击"执行评估"</Text>
        </Empty>
      )}
    </div>
  );
}

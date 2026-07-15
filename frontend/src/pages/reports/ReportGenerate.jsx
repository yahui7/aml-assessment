import { useState, useEffect, useRef } from "react";
import { Card, Input, Button, message, Spin, Row, Col, Tag, Select, Typography, Result } from "antd";
import { FileWordOutlined, CopyOutlined, SaveOutlined } from "@ant-design/icons";
import api from "../../api";

const { Title } = Typography;

const TEMPLATE_VARS = [
  { key: "{{公司名称}}", label: "公司名称" },
  { key: "{{评估日期}}", label: "评估日期" },
  { key: "{{编制部门}}", label: "编制部门" },
];

export default function ReportGenerate() {
  const [templates, setTemplates] = useState([]);
  const [history, setHistory] = useState([]);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
  const [pageError, setPageError] = useState(null);
  const [selectedTpl, setSelectedTpl] = useState("tpl_standard");
  const [title, setTitle] = useState("反洗钱风险评估报告");
  const [reportNo, setReportNo] = useState("AML-RPT-" + new Date().toISOString().slice(0, 7));
  const [author, setAuthor] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [company, setCompany] = useState("");
  const [assessmentId, setAssessmentId] = useState(undefined);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [wordLoading, setWordLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const activeTARef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get("/report/templates"),
      api.get("/aml/history?limit=20"),
    ]).then(([tplRes, histRes]) => {
      if (cancelled) return;
      setTemplates(tplRes.data.templates || []);
      setHistory(histRes.data.history || []);
      setTemplatesLoaded(true);
    }).catch((e) => {
      if (cancelled) return;
      setPageError("加载数据失败，请刷新页面重试");
      setTemplatesLoaded(true);
    });
    return () => { cancelled = true; };
  }, []);

  const handleTplChange = (tplId) => {
    setSelectedTpl(tplId);
    const tpl = templates.find((t) => t.id === tplId);
    if (tpl) setTitle(tpl.name);
  };

  const generate = async () => {
    setGenerateError(null);
    if (!templatesLoaded || templates.length === 0) {
      setGenerateError("报告模板尚未加载完成，请稍后再试");
      return;
    }
    const tpl = templates.find((t) => t.id === selectedTpl);
    if (!tpl) {
      setGenerateError("请先选择报告模板");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/report/generate", {
        title, report_no: reportNo, author, date, company,
        template_id: selectedTpl, assessment_id: assessmentId || null,
      });
      if (res.data.status === "ok") {
        setReport(res.data.report);
        message.success("报告生成成功");
        setTimeout(() => {
          document.getElementById("previewPanel")?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        const errMsg = String(res.data.message || "报告生成失败");
        setGenerateError(errMsg);
      }
    } catch (e) {
      const detail = e.response?.data?.detail;
      const errMsg = typeof detail === "string" ? detail : (
        Array.isArray(detail) ? detail.map(d => d.msg || "").join("; ") : "报告生成失败，请检查数据"
      );
      setGenerateError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const downloadWord = async () => {
    if (!report) return;
    setWordLoading(true);
    try {
      const sections = report.sections.map((s) => ({ ...s }));
      const res = await api.post("/report/export-word", {
        title, report_no: reportNo, author, date, template_id: selectedTpl, sections,
      }, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a"); a.href = url; a.download = `${title}_${date}.docx`;
      a.click(); window.URL.revokeObjectURL(url);
      message.success("下载成功");
    } catch (e) {
      message.error("下载失败");
    } finally {
      setWordLoading(false);
    }
  };

  const copyReport = () => {
    if (!report) return;
    let text = `${report.title}\n报告编号：${report.report_no}  编制人：${report.author}  日期：${report.date}\n\n`;
    report.sections.forEach((s) => { text += `${s.title}\n${s.content}\n\n`; });
    navigator.clipboard.writeText(text).then(() => message.success("已复制到剪贴板"));
  };

  const saveHistory = async () => {
    if (!report) return;
    setSaving(true);
    try {
      await api.post("/report/history", {
        title, report_no: reportNo, author, date, template_id: selectedTpl,
        content_json: { sections: report.sections },
      });
      message.success("报告已保存到历史");
    } catch (e) {
      message.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const onSectionEdit = (idx, content) => {
    const updated = [...report.sections];
    updated[idx] = { ...updated[idx], content };
    setReport({ ...report, sections: updated });
  };

  const insertVar = (v) => {
    const ta = activeTARef.current?.resizableTextArea?.textArea;
    if (!ta) return;
    const start = ta.selectionStart;
    ta.value = ta.value.slice(0, start) + v + ta.value.slice(ta.selectionEnd);
    ta.focus(); ta.selectionStart = ta.selectionEnd = start + v.length;
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  };

  // Page-level error state
  if (pageError) {
    return (
      <div>
        <Title level={4}>📄 报告生成</Title>
        <Result status="error" title="加载失败" subTitle={pageError}
          extra={<Button type="primary" onClick={() => window.location.reload()}>刷新页面</Button>} />
      </div>
    );
  }

  return (
    <div>
      <Title level={4}>📄 报告生成</Title>

      {!templatesLoaded && (
        <Card style={{ marginBottom: 20, textAlign: "center", padding: 40 }}>
          <Spin size="large" />
          <div style={{ marginTop: 12, color: "#999" }}>正在加载模板...</div>
        </Card>
      )}

      {templatesLoaded && (
        <Card size="small" style={{ marginBottom: 20 }}>
          <Row gutter={[12, 8]} align="middle">
            <Col xs={24} sm={12} md={6}>
              <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>模板：</span>
              <Select value={selectedTpl} onChange={handleTplChange} style={{ width: "100%" }}
                options={templates.map((t) => ({ label: (t.preset ? "📋 " : "📝 ") + t.name, value: t.id }))} />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>报告标题：</span>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>编号：</span>
              <Input value={reportNo} onChange={(e) => setReportNo(e.target.value)} />
            </Col>
            <Col xs={12} sm={8} md={3}>
              <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>编制人：</span>
              <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="王亚慧" />
            </Col>
            <Col xs={12} sm={8} md={3}>
              <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>日期：</span>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Col>
          </Row>
          <Row gutter={[12, 8]} style={{ marginTop: 8 }}>
            <Col xs={24} sm={12} md={6}>
              <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>机构：</span>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="如：XX基金管理公司" />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>评估记录：</span>
              <Select value={assessmentId} onChange={setAssessmentId} allowClear
                placeholder={history.length === 0 ? "暂无评估记录" : "选择历史评估（可选）"}
                disabled={history.length === 0}
                style={{ width: "100%" }}
                options={history.map((h) => ({ value: h.id, label: `#${h.id} ${h.assess_date} (${h.overall_score}分 ${h.risk_level})` }))} />
            </Col>
            <Col xs={24} sm={24} md={12} style={{ display: "flex", alignItems: "flex-end", gap: 8, flexWrap: "wrap" }}>
              <Button type="primary" style={{ background: "#1a1f3a" }} onClick={generate} loading={loading}>🚀 生成报告</Button>
              <Button icon={<FileWordOutlined />} onClick={downloadWord} loading={wordLoading} disabled={!report}>下载Word</Button>
              <Button icon={<CopyOutlined />} onClick={copyReport} disabled={!report}>复制全文</Button>
              <Button icon={<SaveOutlined />} onClick={saveHistory} loading={saving} disabled={!report}>保存到历史</Button>
              <Select value={undefined} placeholder="插入变量..." style={{ width: 130, marginLeft: "auto" }}
                onChange={(v) => { if (v) insertVar(v); }}
                options={TEMPLATE_VARS.map((v) => ({ label: v.label, value: v.key }))} />
            </Col>
          </Row>
        </Card>
      )}

      {generateError && (
        <Card style={{ marginBottom: 16, borderColor: "#ff4d4f" }}
          title={<span style={{ color: "#ff4d4f" }}>⚠ 生成失败</span>}
          extra={<Button size="small" onClick={() => setGenerateError(null)}>关闭</Button>}>
          <Typography.Text type="danger">{generateError}</Typography.Text>
        </Card>
      )}

      {loading && (
        <Card style={{ textAlign: "center", padding: 60 }}>
          <Spin size="large" />
          <div style={{ marginTop: 12, color: "#999" }}>正在生成报告...</div>
        </Card>
      )}

      <div id="previewPanel">
        {report && !loading && (
          <Card title={report.title}>
            <p style={{ color: "#999", marginBottom: 20, textAlign: "center" }}>
              报告编号：{report.report_no}　　编制人：{report.author}　　日期：{report.date}
            </p>
            {report.sections.map((sec, i) => (
              <div key={i} style={{ marginBottom: 24, border: "1px solid #f0f0f0", borderRadius: 8, overflow: "hidden" }}>
                <div style={{ background: "#fafafa", padding: "10px 16px", fontWeight: 600, fontSize: "0.9rem", color: "#1a1f3a", borderBottom: "1px solid #f0f0f0" }}>
                  {sec.title}
                  <Tag color="blue" style={{ marginLeft: 8, fontSize: "0.7rem" }}>自动填充</Tag>
                </div>
                <Input.TextArea
                  value={sec.content} onChange={(e) => onSectionEdit(i, e.target.value)}
                  rows={Math.min(Math.max((sec.content || "").split("\n").length + 2, 4), 22)}
                  style={{ border: "none", fontFamily: "inherit", fontSize: "0.88rem", lineHeight: 1.7, resize: "vertical" }}
                  onFocus={(e) => { activeTARef.current = { resizableTextArea: { textArea: e.target } }; }} />
              </div>
            ))}
          </Card>
        )}

        {!report && !loading && !generateError && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#bbb" }}>
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>📄</div>
            <div>配置报告参数并点击「生成报告」，即可预览和编辑</div>
            {history.length === 0 && templatesLoaded && (
              <div style={{ marginTop: 8, color: "#faad14" }}>
                提示：暂无评估记录，请先在「执行评估」页面执行评估
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { Card, Input, Button, message, Tag, Space, Popconfirm, Select, List, Typography, Modal } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined } from "@ant-design/icons";
import api from "../../api";

const { Title } = Typography;

const TEMPLATE_VARS = [
  { key: "{{公司名称}}", label: "公司名称" },
  { key: "{{评估日期}}", label: "评估日期" },
  { key: "{{报告编号}}", label: "报告编号" },
  { key: "{{编制部门}}", label: "编制部门" },
  { key: "{{评估概要}}", label: "评估概要" },
  { key: "{{综合评分}}", label: "综合评分" },
  { key: "{{风险等级}}", label: "风险等级" },
  { key: "{{客户数}}", label: "客户数" },
  { key: "{{账户数}}", label: "账户数" },
  { key: "{{交易数}}", label: "交易数" },
  { key: "{{产品数}}", label: "产品数" },
  { key: "{{四维评分}}", label: "四维评分" },
  { key: "{{客户评分}}", label: "客户评分" },
  { key: "{{产品评分}}", label: "产品评分" },
  { key: "{{渠道评分}}", label: "渠道评分" },
  { key: "{{地域评分}}", label: "地域评分" },
  { key: "{{客户风险详情}}", label: "客户风险详情" },
  { key: "{{产品风险详情}}", label: "产品风险详情" },
  { key: "{{渠道风险详情}}", label: "渠道风险详情" },
  { key: "{{地域风险详情}}", label: "地域风险详情" },
  { key: "{{全维度详情}}", label: "全维度详情" },
  { key: "{{高风险汇总}}", label: "高风险汇总" },
  { key: "{{整改建议}}", label: "整改建议" },
  { key: "{{结论}}", label: "结论" },
];

export default function ReportTemplates() {
  const [templates, setTemplates] = useState([]);
  const [editingTpl, setEditingTpl] = useState(null);
  const [editTplName, setEditTplName] = useState("");
  const [editSections, setEditSections] = useState([]);
  const [saving, setSaving] = useState(false);
  const activeTARef = useRef(null);

  useEffect(() => { load(); }, []);

  const load = () => {
    api.get("/report/templates").then((r) => setTemplates(r.data.templates || [])).catch(() => {});
  };

  const openNew = () => {
    setEditingTpl(null); setEditTplName(""); setEditSections([{ title: "", content: "" }]);
  };

  const openEdit = async (tpl) => {
    if (tpl.preset) {
      // Auto-copy preset to a new custom template for editing
      const newName = tpl.name + " (副本)";
      const newSections = tpl.sections.map((s) => ({ title: s.title, content: s.content || "" }));
      try {
        const res = await api.post("/report/templates", { id: null, name: newName, sections: newSections });
        message.success("已自动复制模板，可自由编辑");
        load();
        setEditingTpl(res.data.template.id);
        setEditTplName(newName);
        setEditSections(newSections);
      } catch (e) {
        message.error("复制模板失败");
      }
      return;
    }
    setEditingTpl(tpl.id);
    setEditTplName(tpl.name);
    setEditSections(tpl.sections.map((s) => ({ title: s.title, content: s.content || "" })));
  };

  const addSection = () => setEditSections([...editSections, { title: "", content: "" }]);
  const removeSection = (i) => setEditSections(editSections.filter((_, idx) => idx !== i));
  const updateSection = (i, field, val) => {
    const u = [...editSections];
    u[i] = { ...u[i], [field]: val };
    setEditSections(u);
  };

  const insertVarToSection = (i, v) => {
    const section = editSections[i];
    const textarea = document.querySelector(`[data-section-idx="${i}"] textarea`);
    if (textarea) {
      const start = textarea.selectionStart;
      const before = section.content.slice(0, start);
      const after = section.content.slice(textarea.selectionEnd);
      const newContent = before + v + after;
      updateSection(i, "content", newContent);
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + v.length;
      }, 50);
    } else {
      updateSection(i, "content", section.content + v);
    }
  };

  const saveTpl = async () => {
    if (!editTplName.trim()) {
      message.warning("请输入模板名称", 2);
      return;
    }
    const sections = editSections.filter((s) => s.title.trim());
    if (!sections.length) {
      message.warning("至少需要一个章节（章节标题不能为空）", 3);
      return;
    }
    setSaving(true);
    try {
      await api.post("/report/templates", { id: editingTpl, name: editTplName, sections });
      message.success("模板已保存", 2);
      setEditingTpl(null); setEditSections([]);
      load();
    } catch (e) {
      message.error("保存失败: " + (e.response?.data?.detail || e.message), 3);
    } finally {
      setSaving(false);
    }
  };

  const copyTpl = async (tpl) => {
    try {
      await api.post("/report/templates", { id: null, name: tpl.name + " (副本)", sections: tpl.sections.map((s) => ({ title: s.title, content: s.content || "" })) });
      load();
      message.success("模板已复制", 2);
    } catch (e) {
      message.error("复制失败", 2);
    }
  };

  const delTpl = async (id) => {
    try {
      await api.delete(`/report/templates/${id}`);
      load();
      message.success("已删除", 2);
    } catch (e) {
      message.error("删除失败", 2);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Title level={4} style={{ marginBottom: 0 }}>📄 报告模板管理</Title>
        <Button icon={<PlusOutlined />} style={{ background: "#1a1f3a", color: "#fff" }} onClick={openNew}>新建模板</Button>
      </div>

      <Card>
        <List dataSource={templates} renderItem={(t) => (
          <List.Item actions={[
            <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(t)} key="edit">编辑</Button>,
            <Button type="link" icon={<CopyOutlined />} onClick={() => copyTpl(t)} key="copy">复制</Button>,
            !t.preset && <Popconfirm key="del" title="确定删除？" onConfirm={() => delTpl(t.id)}><Button type="link" danger icon={<DeleteOutlined />}>删除</Button></Popconfirm>,
          ].filter(Boolean)}>
            <List.Item.Meta
              title={<span>{t.name} {t.preset ? <Tag color="blue" style={{ marginLeft: 8 }}>系统预设</Tag> : <Tag>自定义</Tag>}</span>}
              description={`${t.sections?.length || 0} 个章节`}
            />
          </List.Item>
        )} />

        {editSections.length > 0 && (
          <Card size="small" title={editingTpl ? `编辑模板` : "新建模板"} style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 600 }}>名称：</span>
              <Input value={editTplName} onChange={(e) => setEditTplName(e.target.value)} placeholder="模板名称" style={{ width: 280 }} />
              <span style={{ fontSize: "0.78rem", color: "#999" }}>章节内容中可使用 {"{{变量名}}"}，点击下方变量下拉选择插入</span>
            </div>
            {editSections.map((s, i) => (
              <div key={i} style={{ marginBottom: 12, border: "1px solid #f0f0f0", borderRadius: 8, padding: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ color: "#999", minWidth: 20 }}>{i + 1}.</span>
                  <Input placeholder="章节标题" value={s.title} onChange={(e) => updateSection(i, "title", e.target.value)} style={{ flex: 1 }} />
                  <Select value={undefined} placeholder="插入变量" style={{ width: 130 }}
                    onChange={(v) => {
                      if (v) { insertVarToSection(i, v); }
                    }}
                    options={TEMPLATE_VARS.map((v) => ({ label: v.label, value: v.key }))} />
                  <Button danger size="small" onClick={() => removeSection(i)}>×</Button>
                </div>
                <div data-section-idx={i}>
                  <Input.TextArea placeholder="章节内容，可使用 {{变量名}}" value={s.content}
                    onChange={(e) => updateSection(i, "content", e.target.value)} rows={4} style={{ fontFamily: "inherit" }} />
                </div>
              </div>
            ))}
            <Space style={{ marginTop: 12 }}>
              <Button icon={<PlusOutlined />} onClick={addSection}>添加章节</Button>
              <Button type="primary" loading={saving} style={{ background: "#1a1f3a" }} onClick={saveTpl}>保存模板</Button>
              <Button onClick={() => setEditSections([])}>取消</Button>
            </Space>
          </Card>
        )}
      </Card>
    </div>
  );
}

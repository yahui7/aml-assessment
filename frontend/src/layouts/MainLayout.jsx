import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Layout, Menu, Button } from "antd";
import { HomeOutlined } from "@ant-design/icons";

const { Header, Sider, Content } = Layout;

const boldLabel = (text) => <span style={{ fontWeight: 700 }}>{text}</span>;

const menuItems = [
  { key: "/dashboard", icon: "📊", label: boldLabel("Dashboard") },
  { key: "/imports", icon: "📥", label: boldLabel("数据导入"),
    children: [
      { key: "/imports/templates", label: "下载模板" },
      { key: "/imports/preview", label: "预览调整" },
      { key: "/imports/result", label: "导入结果" },
    ]},
  { key: "/indicators", icon: "📋", label: boldLabel("评估指标") },
  { key: "/assessment", icon: "📊", label: boldLabel("执行评估"),
    children: [
      { key: "/assessment/current", label: "评估现状" },
      { key: "/assessment/history", label: "历史结果" },
    ]},
  { key: "/reports", icon: "📄", label: boldLabel("报告管理"),
    children: [
      { key: "/reports/templates", label: "模板管理" },
      { key: "/reports/generate", label: "报告生成" },
      { key: "/reports/history", label: "历史报告" },
    ]},
];

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // 计算选中的菜单 key
  const path = location.pathname;
  const selectedKey = "/" + location.pathname.split("/").slice(1, 3).join("/");

  // 计算展开的菜单组
  const openKeys = ["/" + location.pathname.split("/")[1]];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header className="bcm-header">
        <span className="brand">🔐 洗钱风险评估系统</span>
        <div className="header-right">
          <Button type="text" icon={<HomeOutlined />}
            onClick={() => window.open("http://localhost", "_self")}
            style={{ color: "#7eb8da" }}>门户</Button>
        </div>
      </Header>
      <Layout>
        <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} width={220} className="bcm-sider">
          <Menu mode="inline" selectedKeys={[selectedKey]} defaultOpenKeys={openKeys}
            items={menuItems} onClick={({ key }) => navigate(key)} style={{ marginTop: 8 }} />
        </Sider>
        <Content style={{ padding: 24, overflow: "auto", minHeight: "calc(100vh - 56px)" }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

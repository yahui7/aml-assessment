import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import MainLayout from "./layouts/MainLayout";
import theme from "./theme";

// Dashboard
import Dashboard from "./pages/Dashboard";
// 数据导入
import ImportTemplates from "./pages/imports/ImportTemplates";
import ImportPreview from "./pages/imports/ImportPreview";
import ImportResult from "./pages/imports/ImportResult";
// 评估指标
import Indicators from "./pages/indicators/Indicators";
// 执行评估
import AssessmentCurrent from "./pages/assessment/AssessmentCurrent";
import AssessmentHistory from "./pages/assessment/AssessmentHistory";
// 报告管理
import ReportTemplates from "./pages/reports/ReportTemplates";
import ReportGenerate from "./pages/reports/ReportGenerate";
import ReportHistory from "./pages/reports/ReportHistory";

export default function App() {
  return (
    <ConfigProvider theme={theme} locale={zhCN}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/imports/templates" element={<ImportTemplates />} />
            <Route path="/imports/preview" element={<ImportPreview />} />
            <Route path="/imports/result" element={<ImportResult />} />
            <Route path="/indicators" element={<Indicators />} />
            <Route path="/assessment/current" element={<AssessmentCurrent />} />
            <Route path="/assessment/history" element={<AssessmentHistory />} />
            <Route path="/reports/templates" element={<ReportTemplates />} />
            <Route path="/reports/generate" element={<ReportGenerate />} />
            <Route path="/reports/history" element={<ReportHistory />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

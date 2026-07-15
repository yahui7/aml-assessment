import axios from "axios"; import { message } from "antd";
const api = axios.create({ baseURL: "/api", timeout: 15000, headers: { "Content-Type": "application/json" } });
api.interceptors.response.use((res) => res, (err) => { message.error(err.response?.data?.detail || err.message || "请求失败"); return Promise.reject(err); });
export default api;

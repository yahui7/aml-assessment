"""
洗钱风险评估系统 — 后端主应用
FastAPI + SQLite · 端口 8003
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from backend.database import init_db
from backend.aml_assessment.router import router as aml_router
from backend.data_import.router import router as import_router
from backend.report_generator.router import router as report_router

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(BASE_DIR, "frontend", "dist")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    print("[OK] 洗钱风险评估系统启动完成 · 端口 8003")
    yield


app = FastAPI(
    title="洗钱风险评估系统",
    description="公司层面四维评估 · 雷达图 · 整改建议",
    version="1.0.0",
    lifespan=lifespan,
)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.include_router(aml_router, prefix="/api/aml", tags=["AML评估"])
app.include_router(import_router, prefix="/api/import", tags=["数据导入"])
app.include_router(report_router, prefix="/api/report", tags=["报告管理"])


@app.get("/api/health")
async def health():
    return {"status": "ok", "message": "洗钱风险评估系统运行中 · 端口 8003"}


# SPA 回退：非 API 路径 → 静态资源 → index.html（React Router 接管）
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    safe_path = os.path.normpath(full_path)
    if safe_path.startswith(".."):
        return {"detail": "Invalid path"}

    file_path = os.path.join(DIST_DIR, safe_path) if safe_path else os.path.join(DIST_DIR, "index.html")
    if os.path.isfile(file_path):
        return FileResponse(file_path)

    index_path = os.path.join(DIST_DIR, "index.html")
    if os.path.isfile(index_path):
        return FileResponse(index_path)

    return {"detail": "Frontend not built. Run: cd frontend && npm run build"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)

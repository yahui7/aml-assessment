"""
报告生成 API 路由 — AML 反洗钱风险评估
"""
import json
from urllib.parse import quote

from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional

from . import templates
from .engine import ReportEngine

router = APIRouter()


# ── 模板管理 ──

@router.get("/templates")
async def list_templates():
    return {"status": "ok", "templates": templates.list_templates()}


@router.get("/templates/{tpl_id}")
async def get_template(tpl_id: str):
    tpl = templates.get_template(tpl_id)
    if not tpl:
        return {"status": "error", "message": "模板不存在"}
    return {"status": "ok", "template": tpl}


@router.post("/templates")
async def save_template(data: dict):
    result = templates.save_template(data)
    return {"status": "ok", "template": result}


@router.delete("/templates/{tpl_id}")
async def delete_template(tpl_id: str):
    ok = templates.delete_template(tpl_id)
    if not ok:
        return {"status": "error", "message": "预设模板不可删除"}
    return {"status": "ok"}


# ── 报告生成 ──

class ReportInfo(BaseModel):
    title: str = "洗钱风险评估报告"
    report_no: str = ""
    author: str = ""
    date: str = ""
    company: str = ""
    template_id: str = "tpl_standard"
    assessment_id: int = None


class ExportInfo(BaseModel):
    title: str = "报告"
    report_no: str = ""
    author: str = ""
    date: str = ""
    template_id: str = "tpl_standard"
    sections: list = []


@router.post("/generate")
async def generate_report(info: ReportInfo):
    tpl = templates.get_template(info.template_id)
    if not tpl:
        return {"status": "error", "message": "模板不存在"}

    engine = ReportEngine()
    report = engine.generate(tpl, info.model_dump())
    return {"status": "ok", "report": report}


@router.post("/export-word")
async def export_word(data: ExportInfo):
    try:
        tpl = templates.get_template(data.template_id)
        if not tpl:
            return {"status": "error", "message": "模板不存在"}

        info = {"title": data.title, "report_no": data.report_no, "author": data.author, "date": data.date}
        engine = ReportEngine()
        report = {
            "title": data.title,
            "report_no": data.report_no,
            "author": data.author,
            "date": data.date,
            "sections": data.sections,
        }

        if not report["sections"]:
            report = engine.generate(tpl, info)

        buf = engine.export_word(report)
        safe_name = quote(data.title.replace(" ", "_")[:20])
        filename = f"{data.date}_{safe_name}.docx"

        return StreamingResponse(
            buf,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f"attachment; filename*=UTF-8''{filename}"},
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}


# ── 历史报告 ──

from backend.database import get_connection


@router.get("/history")
async def list_history():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, report_no, author, date, template_id, created_at FROM report_history ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return {"status": "ok", "history": [dict(r) for r in rows]}


@router.get("/history/{history_id}")
async def get_history(history_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM report_history WHERE id = ?", (history_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return {"status": "error", "message": "记录不存在"}
    record = dict(row)
    record["content_json"] = json.loads(record["content_json"])
    return {"status": "ok", "record": record}


@router.post("/history")
async def save_history(data: dict):
    conn = get_connection()
    cursor = conn.cursor()
    content_json = json.dumps(data.get("content_json", {}), ensure_ascii=False)
    cursor.execute(
        "INSERT INTO report_history (title, report_no, author, date, template_id, content_json) VALUES (?, ?, ?, ?, ?, ?)",
        (data.get("title", ""), data.get("report_no", ""), data.get("author", ""),
         data.get("date", ""), data.get("template_id", ""), content_json),
    )
    conn.commit()
    hid = cursor.lastrowid
    conn.close()
    return {"status": "ok", "id": hid, "message": "报告已保存"}


@router.delete("/history/{history_id}")
async def delete_history(history_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM report_history WHERE id = ?", (history_id,))
    conn.commit()
    conn.close()
    return {"status": "ok", "message": "已删除"}


@router.get("/history/{history_id}/export")
async def export_history(history_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM report_history WHERE id = ?", (history_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return {"status": "error", "message": "记录不存在"}

    content = json.loads(row["content_json"])
    engine = ReportEngine()
    buf = engine.export_word({
        "title": row["title"],
        "report_no": row["report_no"],
        "author": row["author"],
        "date": row["date"],
        "sections": content.get("sections", []),
    })

    safe_name = quote(row["title"].replace(" ", "_")[:20])
    filename = f"{row['date']}_{safe_name}.docx"
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{filename}"},
    )

"""
数据导入 API 路由
"""
import os
import csv
import io
from urllib.parse import quote
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse

router = APIRouter()

# CSV 模板定义
CSV_TEMPLATES = {
    "customer": {
        "filename": "客户表模板.csv",
        "headers": ["customer_id", "name", "id_type", "id_number", "id_expiry_date",
                    "nationality", "birth_date", "occupation", "risk_level",
                    "phone", "email", "address"],
        "example": ["CUST00001", "张三", "身份证", "420106199003151234",
                    "2030-06-15", "中国", "1990-03-15", "企业员工", "低",
                    "13800138000", "zhangsan@email.com", "湖北省武汉市武昌区"],
    },
    "account": {
        "filename": "账户表模板.csv",
        "headers": ["account_id", "customer_id", "product_id", "account_type",
                    "status", "balance", "currency", "open_date", "close_date"],
        "example": ["ACCT000001", "CUST00001", "PRD0001", "活期",
                    "正常", "500000.00", "CNY", "2024-01-15", ""],
    },
    "trans_record": {
        "filename": "交易表模板.csv",
        "headers": ["transaction_id", "account_id", "customer_id", "transaction_type",
                    "amount", "currency", "counterparty_info", "transaction_date",
                    "channel", "purpose"],
        "example": ["TXN00000001", "ACCT000001", "CUST00001", "申购",
                    "100000.00", "CNY", "对手方-XX公司", "2025-06-15 10:30:00",
                    "手机银行", "投资理财"],
    },
    "product": {
        "filename": "产品表模板.csv",
        "headers": ["product_id", "product_name", "product_type", "risk_level",
                    "issuer", "status", "launch_date", "maturity_date"],
        "example": ["PRD0001", "安信成长1号", "公募-股票型", "中",
                    "华中证券", "存续", "2023-01-01", "2028-01-01"],
    },
}


@router.get("/status")
async def get_import_status():
    """检查数据是否已导入"""
    from backend.database import get_connection
    conn = get_connection()
    cursor = conn.cursor()
    counts = {}
    for table in ["customer", "account", "trans_record", "product"]:
        try:
            cursor.execute(f"SELECT COUNT(*) AS cnt FROM {table}")
            counts[table] = cursor.fetchone()["cnt"]
        except Exception:
            counts[table] = 0
    conn.close()
    has_data = any(v > 0 for v in counts.values())
    return {"status": "ok", "has_data": has_data, "counts": counts}


@router.get("/templates/{table_name}")
async def download_template(table_name: str):
    """下载CSV模板文件"""
    tmpl = CSV_TEMPLATES.get(table_name)
    if not tmpl:
        raise HTTPException(status_code=404, detail=f"未知模板: {table_name}")

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(tmpl["headers"])
    writer.writerow(tmpl["example"])
    content = output.getvalue()

    return StreamingResponse(
        io.BytesIO(content.encode("utf-8-sig")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{quote(tmpl['filename'])}"},
    )


# 内存中暂存上传的数据，等待确认后写入
_uploaded_data = {}  # { table_name: [rows] }


@router.post("/upload")
async def upload_csv(table: str = "", file: UploadFile = File(...)):
    """上传CSV文件，返回预览数据（不立即写入数据库）"""
    global _uploaded_data

    content = await file.read()
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    rows = list(reader)

    if not rows:
        raise HTTPException(status_code=400, detail="CSV文件为空")

    table_name = table or os.path.splitext(file.filename)[0]
    columns = list(rows[0].keys())

    # 基本校验
    valid_count = 0
    invalid_count = 0
    for row in rows:
        has_data = any(v for v in row.values() if v and str(v).strip())
        if has_data:
            valid_count += 1
        else:
            invalid_count += 1

    # 暂存数据
    _uploaded_data[table_name] = rows

    return {
        "status": "ok",
        "table": table_name,
        "preview": {
            "columns": columns,
            "rows": rows[:20],  # 前20行预览
            "total_rows": len(rows),
            "validation": {
                "valid_count": valid_count,
                "invalid_count": invalid_count,
            },
        },
    }


@router.post("/confirm")
async def confirm_import():
    """确认导入：将暂存数据写入数据库"""
    global _uploaded_data
    from backend.database import get_connection

    if not _uploaded_data:
        return {"status": "ok", "message": "无数据需要导入", "tables": []}

    conn = get_connection()
    cursor = conn.cursor()
    imported_tables = []

    for table_name, rows in _uploaded_data.items():
        if not rows:
            continue
        columns = list(rows[0].keys())
        cols = ", ".join(columns)
        placeholders = ", ".join(["?"] * len(columns))

        for row in rows:
            try:
                cursor.execute(
                    f"INSERT OR IGNORE INTO {table_name} ({cols}) VALUES ({placeholders})",
                    list(row.values()),
                )
            except Exception:
                pass

        imported_tables.append(table_name)

    conn.commit()
    conn.close()
    _uploaded_data = {}
    return {"status": "ok", "message": f"已导入 {len(imported_tables)} 个表", "tables": imported_tables}


@router.post("/clear")
async def clear_data():
    """清空所有已导入数据"""
    global _uploaded_data
    _uploaded_data = {}
    from backend.database import get_connection
    conn = get_connection()
    cursor = conn.cursor()
    for table in ["trans_record", "account", "customer", "product"]:
        try:
            cursor.execute(f"DELETE FROM {table}")
        except Exception:
            pass
    conn.commit()
    conn.close()
    return {"status": "ok", "message": "数据已清空"}

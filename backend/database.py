"""
洗钱风险评估系统 — 数据库初始化
"""
import sqlite3
import os
DB_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
DB_PATH = os.path.join(DB_DIR, "aml.db")

def get_connection():
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    os.makedirs(DB_DIR, exist_ok=True)
    conn = get_connection()
    cursor = conn.cursor()
    for table, sql in [
        ("customer", "CREATE TABLE IF NOT EXISTS customer (id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id VARCHAR(50) UNIQUE NOT NULL, name VARCHAR(100), id_type VARCHAR(20) DEFAULT '身份证', id_number VARCHAR(50), id_expiry_date DATE, nationality VARCHAR(50) DEFAULT '中国', birth_date DATE, occupation VARCHAR(100), risk_level VARCHAR(20) DEFAULT '低', phone VARCHAR(30), email VARCHAR(100), address VARCHAR(200), created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)"),
        ("account", "CREATE TABLE IF NOT EXISTS account (id INTEGER PRIMARY KEY AUTOINCREMENT, account_id VARCHAR(50) UNIQUE NOT NULL, customer_id VARCHAR(50), product_id VARCHAR(50), account_type VARCHAR(50), status VARCHAR(20) DEFAULT '正常', balance DECIMAL(18,2) DEFAULT 0, currency VARCHAR(10) DEFAULT 'CNY', open_date DATE, close_date DATE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)"),
        ("trans_record", "CREATE TABLE IF NOT EXISTS trans_record (id INTEGER PRIMARY KEY AUTOINCREMENT, transaction_id VARCHAR(50) UNIQUE NOT NULL, account_id VARCHAR(50), customer_id VARCHAR(50), transaction_type VARCHAR(50), amount DECIMAL(18,2), currency VARCHAR(10) DEFAULT 'CNY', counterparty_info VARCHAR(200), transaction_date DATETIME, channel VARCHAR(50), purpose VARCHAR(200), created_at DATETIME DEFAULT CURRENT_TIMESTAMP)"),
        ("product", "CREATE TABLE IF NOT EXISTS product (id INTEGER PRIMARY KEY AUTOINCREMENT, product_id VARCHAR(50) UNIQUE NOT NULL, product_name VARCHAR(100), product_type VARCHAR(50), risk_level VARCHAR(20), issuer VARCHAR(100), status VARCHAR(20) DEFAULT '存续', launch_date DATE, maturity_date DATE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)"),
        ("assessment_item", "CREATE TABLE IF NOT EXISTS assessment_item (id INTEGER PRIMARY KEY AUTOINCREMENT, item_key VARCHAR(50) UNIQUE NOT NULL, dimension VARCHAR(20) NOT NULL, name VARCHAR(100) NOT NULL, description TEXT, category VARCHAR(30) DEFAULT 'data_driven', data_source TEXT, default_risk VARCHAR(10), threshold_high DECIMAL(5,2), threshold_mid DECIMAL(5,2), score_high INTEGER DEFAULT 85, score_mid INTEGER DEFAULT 50, score_low INTEGER DEFAULT 15, weight DECIMAL(3,2) DEFAULT 0.20, sort_order INTEGER DEFAULT 0, enabled INTEGER DEFAULT 1, preset_id VARCHAR(50) DEFAULT 'preset_securities', severity VARCHAR(10) DEFAULT '中', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)"),
        ("assessment_history", "CREATE TABLE IF NOT EXISTS assessment_history (id INTEGER PRIMARY KEY AUTOINCREMENT, assess_date DATETIME DEFAULT CURRENT_TIMESTAMP, preset_id VARCHAR(50), overall_score DECIMAL(5,1), risk_level VARCHAR(10), customer_score DECIMAL(5,1), product_score DECIMAL(5,1), channel_score DECIMAL(5,1), geography_score DECIMAL(5,1), customer_count INTEGER, account_count INTEGER, trans_count INTEGER, product_count INTEGER, dimensions_json TEXT, recommendations_json TEXT, items_detail_json TEXT)"),
        ("report_history", "CREATE TABLE IF NOT EXISTS report_history (id INTEGER PRIMARY KEY AUTOINCREMENT, title VARCHAR(200), report_no VARCHAR(50), author VARCHAR(50), date VARCHAR(20), template_id VARCHAR(50), content_json TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)"),
    ]:
        cursor.execute(sql)
    conn.commit()
    conn.close()
    print(f"[OK] AML评估数据库已初始化: {DB_PATH}")

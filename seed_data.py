"""Seed assessment indicators into database"""
import sys
sys.path.insert(0, ".")
from backend.database import get_connection

SEED_ITEMS = [
    # Customer dimension
    {"item_key": "cust_high_risk_occupation", "dimension": "customer", "name": "高风险职业客户占比",
     "description": "来自高风险职业（如政治人物、赌场从业人员等）的客户比例", "category": "data_driven",
     "data_source": "customer.occupation", "default_risk": "中", "threshold_high": 0.10, "threshold_mid": 0.05,
     "score_high": 85, "score_mid": 50, "score_low": 15, "weight": 0.20, "sort_order": 1, "severity": "高", "preset_id": "preset_securities"},
    {"item_key": "cust_pep_ratio", "dimension": "customer", "name": "PEP客户比例",
     "description": "政治公众人物及其关联客户在总客户中的占比", "category": "data_driven",
     "data_source": "customer.pep_flag", "default_risk": "高", "threshold_high": 0.05, "threshold_mid": 0.02,
     "score_high": 90, "score_mid": 55, "score_low": 15, "weight": 0.25, "sort_order": 2, "severity": "高", "preset_id": "preset_securities"},
    {"item_key": "cust_high_risk_country", "dimension": "customer", "name": "高风险国家/地区客户",
     "description": "注册地或国籍为FATF高风险地区的客户占比", "category": "data_driven",
     "data_source": "customer.nationality", "default_risk": "高", "threshold_high": 0.08, "threshold_mid": 0.03,
     "score_high": 88, "score_mid": 52, "score_low": 12, "weight": 0.20, "sort_order": 3, "severity": "高", "preset_id": "preset_securities"},
    {"item_key": "cust_ubo_transparency", "dimension": "customer", "name": "收益所有人透明度",
     "description": "股权结构穿透后能完整识别最终受益人的客户比例", "category": "framework",
     "data_source": None, "default_risk": "中", "threshold_high": None, "threshold_mid": None,
     "score_high": 80, "score_mid": 50, "score_low": 20, "weight": 0.15, "sort_order": 4, "severity": "中", "preset_id": "preset_securities"},
    {"item_key": "cust_kyc_refresh_rate", "dimension": "customer", "name": "KYC信息更新及时率",
     "description": "在规定时间内完成KYC信息更新的客户占比", "category": "data_driven",
     "data_source": "customer.updated_at", "default_risk": "低", "threshold_high": None, "threshold_mid": 0.85,
     "score_high": 40, "score_mid": 60, "score_low": 85, "weight": 0.10, "sort_order": 5, "severity": "中", "preset_id": "preset_securities"},
    {"item_key": "cust_shell_company", "dimension": "customer", "name": "空壳公司风险识别",
     "description": "注册地与实际经营地分离、无实际业务痕迹的法人客户", "category": "framework",
     "data_source": None, "default_risk": "中", "threshold_high": None, "threshold_mid": None,
     "score_high": 82, "score_mid": 48, "score_low": 18, "weight": 0.10, "sort_order": 6, "severity": "中", "preset_id": "preset_securities"},
    # Product dimension
    {"item_key": "prod_structured_ratio", "dimension": "product", "name": "结构化产品占比",
     "description": "结构复杂、透明度低的产品（如多层嵌套资管产品）在总产品中的占比", "category": "data_driven",
     "data_source": "product.product_type", "default_risk": "高", "threshold_high": 0.15, "threshold_mid": 0.08,
     "score_high": 88, "score_mid": 52, "score_low": 15, "weight": 0.25, "sort_order": 1, "severity": "高", "preset_id": "preset_securities"},
    {"item_key": "prod_cross_border", "dimension": "product", "name": "跨境产品业务规模",
     "description": "涉及跨境交易的产品在总产品中的占比和交易量", "category": "data_driven",
     "data_source": "product.cross_border_flag", "default_risk": "高", "threshold_high": 0.12, "threshold_mid": 0.05,
     "score_high": 85, "score_mid": 50, "score_low": 12, "weight": 0.20, "sort_order": 2, "severity": "高", "preset_id": "preset_securities"},
    {"item_key": "prod_private_placement", "dimension": "product", "name": "私募产品合规管理",
     "description": "私募基金的合格投资者审查、资金来源核查等合规措施完备度", "category": "framework",
     "data_source": None, "default_risk": "中", "threshold_high": None, "threshold_mid": None,
     "score_high": 78, "score_mid": 48, "score_low": 18, "weight": 0.20, "sort_order": 3, "severity": "中", "preset_id": "preset_securities"},
    {"item_key": "prod_new_product_review", "dimension": "product", "name": "新产品洗钱风险评估",
     "description": "新产品上线前的反洗钱风险评估覆盖率和完备度", "category": "framework",
     "data_source": None, "default_risk": "低", "threshold_high": None, "threshold_mid": None,
     "score_high": 75, "score_mid": 45, "score_low": 15, "weight": 0.15, "sort_order": 4, "severity": "中", "preset_id": "preset_securities"},
    {"item_key": "prod_client_asset_mix", "dimension": "product", "name": "客户资产配置复杂度",
     "description": "客户投资组合中涉及高风险产品的资产比例", "category": "data_driven",
     "data_source": "account.product_id", "default_risk": "中", "threshold_high": 0.20, "threshold_mid": 0.10,
     "score_high": 80, "score_mid": 50, "score_low": 18, "weight": 0.10, "sort_order": 5, "severity": "中", "preset_id": "preset_securities"},
    {"item_key": "prod_redemption_freq", "dimension": "product", "name": "短期频繁申赎监控",
     "description": "跟踪短期内大额申购后快速赎回的行为模式", "category": "data_driven",
     "data_source": "trans_record.transaction_type", "default_risk": "中", "threshold_high": 0.08, "threshold_mid": 0.03,
     "score_high": 82, "score_mid": 50, "score_low": 15, "weight": 0.10, "sort_order": 6, "severity": "中", "preset_id": "preset_securities"},
    # Channel dimension
    {"item_key": "chan_online_ratio", "dimension": "channel", "name": "线上非面对面交易占比",
     "description": "通过互联网、移动端等非面对面渠道进行的交易比例", "category": "data_driven",
     "data_source": "trans_record.channel", "default_risk": "高", "threshold_high": 0.60, "threshold_mid": 0.30,
     "score_high": 85, "score_mid": 50, "score_low": 15, "weight": 0.25, "sort_order": 1, "severity": "高", "preset_id": "preset_securities"},
    {"item_key": "chan_third_party", "dimension": "channel", "name": "第三方代销渠道风险",
     "description": "通过银行、第三方理财平台等外部渠道销售产品的反洗钱尽职调查质量", "category": "framework",
     "data_source": None, "default_risk": "中", "threshold_high": None, "threshold_mid": None,
     "score_high": 80, "score_mid": 50, "score_low": 18, "weight": 0.20, "sort_order": 2, "severity": "中", "preset_id": "preset_securities"},
    {"item_key": "chan_cross_institution", "dimension": "channel", "name": "跨机构交易监控",
     "description": "同一客户跨多机构交易行为的跟踪和异常识别能力", "category": "framework",
     "data_source": None, "default_risk": "中", "threshold_high": None, "threshold_mid": None,
     "score_high": 82, "score_mid": 50, "score_low": 16, "weight": 0.15, "sort_order": 3, "severity": "中", "preset_id": "preset_securities"},
    {"item_key": "chan_cash_intensive", "dimension": "channel", "name": "现金密集交易监测",
     "description": "大额现金存取、现金密集型交易在总交易中的占比", "category": "data_driven",
     "data_source": "trans_record.channel", "default_risk": "高", "threshold_high": 0.05, "threshold_mid": 0.02,
     "score_high": 88, "score_mid": 52, "score_low": 12, "weight": 0.15, "sort_order": 4, "severity": "高", "preset_id": "preset_securities"},
    {"item_key": "chan_virtual_asset", "dimension": "channel", "name": "虚拟资产关联交易",
     "description": "涉及虚拟货币、数字资产等新兴渠道的交易监控覆盖度", "category": "framework",
     "data_source": None, "default_risk": "高", "threshold_high": None, "threshold_mid": None,
     "score_high": 88, "score_mid": 52, "score_low": 15, "weight": 0.15, "sort_order": 5, "severity": "高", "preset_id": "preset_securities"},
    {"item_key": "chan_auth_strength", "dimension": "channel", "name": "渠道身份认证强度",
     "description": "不同渠道客户身份认证手段的强度", "category": "framework",
     "data_source": None, "default_risk": "低", "threshold_high": None, "threshold_mid": None,
     "score_high": 72, "score_mid": 42, "score_low": 12, "weight": 0.10, "sort_order": 6, "severity": "中", "preset_id": "preset_securities"},
    # Geography dimension
    {"item_key": "geo_high_risk_region", "dimension": "geography", "name": "高风险地区业务占比",
     "description": "客户或交易涉及FATF或人行指定的高风险地区的业务比例", "category": "data_driven",
     "data_source": "customer.address", "default_risk": "高", "threshold_high": 0.10, "threshold_mid": 0.04,
     "score_high": 88, "score_mid": 50, "score_low": 12, "weight": 0.25, "sort_order": 1, "severity": "高", "preset_id": "preset_securities"},
    {"item_key": "geo_cross_border_flow", "dimension": "geography", "name": "跨境资金流动规模",
     "description": "跨境交易金额和频次的综合评估", "category": "data_driven",
     "data_source": "trans_record", "default_risk": "高", "threshold_high": 0.15, "threshold_mid": 0.08,
     "score_high": 85, "score_mid": 50, "score_low": 15, "weight": 0.20, "sort_order": 2, "severity": "高", "preset_id": "preset_securities"},
    {"item_key": "geo_sanction_compliance", "dimension": "geography", "name": "制裁合规覆盖度",
     "description": "联合国/OFAC/中国制裁名单筛查的覆盖范围和更新及时性", "category": "framework",
     "data_source": None, "default_risk": "高", "threshold_high": None, "threshold_mid": None,
     "score_high": 92, "score_mid": 55, "score_low": 15, "weight": 0.20, "sort_order": 3, "severity": "高", "preset_id": "preset_securities"},
    {"item_key": "geo_tax_haven", "dimension": "geography", "name": "避税天堂关联度",
     "description": "客户或交易与避税天堂/离岸金融中心的关联程度", "category": "data_driven",
     "data_source": "customer.nationality", "default_risk": "中", "threshold_high": 0.08, "threshold_mid": 0.03,
     "score_high": 82, "score_mid": 50, "score_low": 16, "weight": 0.15, "sort_order": 4, "severity": "中", "preset_id": "preset_securities"},
    {"item_key": "geo_regional_concentration", "dimension": "geography", "name": "区域集中度风险",
     "description": "客户和业务在地域分布上的集中程度", "category": "data_driven",
     "data_source": "customer.address", "default_risk": "低", "threshold_high": 0.70, "threshold_mid": 0.40,
     "score_high": 75, "score_mid": 42, "score_low": 12, "weight": 0.10, "sort_order": 5, "severity": "低", "preset_id": "preset_securities"},
    {"item_key": "geo_regulatory_env", "dimension": "geography", "name": "所在地监管环境评估",
     "description": "分支机构所在地反洗钱监管的严格程度及执法力度", "category": "framework",
     "data_source": None, "default_risk": "低", "threshold_high": None, "threshold_mid": None,
     "score_high": 70, "score_mid": 40, "score_low": 12, "weight": 0.10, "sort_order": 6, "severity": "低", "preset_id": "preset_securities"},
]

def seed():
    conn = get_connection()
    cursor = conn.cursor()
    inserted = 0
    skipped = 0
    for item in SEED_ITEMS:
        cursor.execute("SELECT id FROM assessment_item WHERE item_key = ?", (item["item_key"],))
        if cursor.fetchone():
            skipped += 1
            continue
        cursor.execute("""
            INSERT INTO assessment_item
                (item_key, dimension, name, description, category, data_source,
                 default_risk, threshold_high, threshold_mid,
                 score_high, score_mid, score_low,
                 weight, sort_order, preset_id, severity, enabled)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        """, (
            item["item_key"], item["dimension"], item["name"], item["description"],
            item["category"], item["data_source"], item["default_risk"],
            item["threshold_high"], item["threshold_mid"],
            item["score_high"], item["score_mid"], item["score_low"],
            item["weight"], item["sort_order"], item["preset_id"], item["severity"],
        ))
        inserted += 1
    conn.commit()
    conn.close()
    print(f"[OK] Seed indicators: {inserted} inserted, {skipped} skipped")

if __name__ == "__main__":
    seed()

"""
报告模板管理 — AML 反洗钱风险评估专用
- 系统预设模板 + 用户自定义模板
- 存储为 JSON 文件
"""
import os
import json
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TEMPLATES_DIR = os.path.join(BASE_DIR, "data", "report_templates")

DATA_SOURCES = [
    {"key": "aml_assessment", "name": "AML 评估数据"},
    {"key": "manual", "name": "手动填写"},
]

PRESET_TEMPLATES = [
    {
        "id": "tpl_standard",
        "name": "标准洗钱风险评估报告",
        "preset": True,
        "sections": [
            {
                "title": "一、评估概要",
                "content": "评估机构：{{公司名称}}\n评估日期：{{评估日期}}\n编制部门：{{编制部门}}\n报告编号：{{报告编号}}\n\n本次反洗钱风险评估依据中国人民银行《法人金融机构洗钱和恐怖融资风险评估指引》，从客户风险、产品/业务风险、渠道风险和地域风险四个维度对公司洗钱风险状况进行全面评估。\n\n{{评估概要}}"
            },
            {
                "title": "二、综合评估结果",
                "content": "综合风险评分：{{综合评分}} 分\n风险等级：{{风险等级}}\n\n数据概览：\n- 客户数：{{客户数}}\n- 账户数：{{账户数}}\n- 交易数：{{交易数}}\n- 产品数：{{产品数}}\n\n{{四维评分}}"
            },
            {
                "title": "三、客户风险评估",
                "content": "客户风险维度得分：{{客户评分}} 分\n\n{{客户风险详情}}"
            },
            {
                "title": "四、产品/业务风险评估",
                "content": "产品/业务风险维度得分：{{产品评分}} 分\n\n{{产品风险详情}}"
            },
            {
                "title": "五、渠道风险评估",
                "content": "渠道风险维度得分：{{渠道评分}} 分\n\n{{渠道风险详情}}"
            },
            {
                "title": "六、地域风险评估",
                "content": "地域风险维度得分：{{地域评分}} 分\n\n{{地域风险详情}}"
            },
            {
                "title": "七、整改建议与结论",
                "content": "根据本次评估结果，提出以下整改建议：\n\n{{整改建议}}\n\n结论：{{结论}}"
            },
        ],
    },
    {
        "id": "tpl_detailed",
        "name": "详细洗钱风险评估报告",
        "preset": True,
        "sections": [
            {
                "title": "一、评估背景与目的",
                "content": "评估机构：{{公司名称}}\n评估日期：{{评估日期}}\n编制部门：{{编制部门}}\n\n依据《中华人民共和国反洗钱法》及中国人民银行相关监管要求，对{{公司名称}}的洗钱风险管理状况进行定期自评估。本报告基于基金模板评估指标体系，涵盖4个维度、多项评估指标。"
            },
            {
                "title": "二、数据基础",
                "content": "本次评估基于以下业务数据：\n- 客户总数：{{客户数}}\n- 账户总数：{{账户数}}\n- 交易记录数：{{交易数}}\n- 产品数量：{{产品数}}\n\n数据截止日期：{{评估日期}}"
            },
            {
                "title": "三、综合评分与风险等级",
                "content": "经综合评估：\n- 综合风险评分：{{综合评分}} 分\n- 风险等级：{{风险等级}}\n\n四维评分明细：\n{{四维评分}}"
            },
            {
                "title": "四、各维度详细分析",
                "content": "{{全维度详情}}"
            },
            {
                "title": "五、高风险指标汇总",
                "content": "{{高风险汇总}}"
            },
            {
                "title": "六、整改措施与建议",
                "content": "{{整改建议}}"
            },
            {
                "title": "七、结论与后续计划",
                "content": "{{结论}}\n\n下一步工作计划：\n1. 针对高风险指标制定专项整改方案\n2. 完善反洗钱内控制度和操作流程\n3. 加强员工反洗钱培训\n4. 定期进行复评估，跟踪风险变化趋势"
            },
        ],
    },
    {
        "id": "tpl_regulatory",
        "name": "监管报送评估报告",
        "preset": True,
        "sections": [
            {
                "title": "一、机构基本信息",
                "content": "机构名称：{{公司名称}}\n评估期间：{{评估日期}}\n报告编号：{{报告编号}}\n编制部门：{{编制部门}}"
            },
            {
                "title": "二、自评估概述",
                "content": "{{评估概要}}"
            },
            {
                "title": "三、评估结果",
                "content": "综合评分：{{综合评分}} 分\n风险等级：{{风险等级}}\n\n{{四维评分}}"
            },
            {
                "title": "四、风险状况分析",
                "content": "{{全维度详情}}"
            },
            {
                "title": "五、整改措施及计划",
                "content": "{{整改建议}}\n\n{{结论}}"
            },
        ],
    },
]


def _ensure_dir():
    os.makedirs(TEMPLATES_DIR, exist_ok=True)
    for tpl in PRESET_TEMPLATES:
        path = os.path.join(TEMPLATES_DIR, f"{tpl['id']}.json")
        if not os.path.exists(path):
            with open(path, "w", encoding="utf-8") as f:
                json.dump(tpl, f, ensure_ascii=False, indent=2)


def list_templates():
    _ensure_dir()
    templates = []
    for fname in os.listdir(TEMPLATES_DIR):
        if fname.endswith(".json"):
            with open(os.path.join(TEMPLATES_DIR, fname), "r", encoding="utf-8") as f:
                templates.append(json.load(f))
    return sorted(templates, key=lambda t: (not t.get("preset", False), t["name"]))


def get_template(tpl_id):
    path = os.path.join(TEMPLATES_DIR, f"{tpl_id}.json")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None


def save_template(data):
    _ensure_dir()
    tpl_id = data.get("id") or f"tpl_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    data["id"] = tpl_id
    data["preset"] = False
    path = os.path.join(TEMPLATES_DIR, f"{tpl_id}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return data


def delete_template(tpl_id):
    path = os.path.join(TEMPLATES_DIR, f"{tpl_id}.json")
    if not os.path.exists(path):
        return False
    tpl = json.load(open(path, "r", encoding="utf-8"))
    if tpl.get("preset"):
        return False
    os.remove(path)
    return True


def get_data_sources():
    return DATA_SOURCES

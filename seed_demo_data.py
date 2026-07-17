"""Seed demo data: customers, products, accounts, transactions"""
import random
import sqlite3
from datetime import datetime, timedelta

DB = "data/aml.db"

SURNAMES = ["王","李","张","刘","陈","杨","黄","赵","周","吴","徐","孙","马","胡","朱","郭","何","林","罗","高"]
GIVEN = ["伟","芳","娜","敏","静","丽","强","磊","洋","勇","艳","涛","明","超","秀英","建华","文","斌","玲","辉"]
HIGH_RISK_OCCUPATIONS = ["政治人物","赌场经理","贵金属交易商","离岸公司董事","军火贸易商"]
NORMAL_OCCUPATIONS = ["教师","医生","工程师","程序员","销售经理","会计师","律师","公务员","企业主管","个体户"]
HIGH_RISK_COUNTRIES = ["朝鲜","伊朗","叙利亚","也门","缅甸","海地"]
NORMAL_COUNTRIES = ["中国","美国","英国","日本","新加坡","德国","法国","韩国","澳大利亚","加拿大"]
CITIES = ["北京","上海","深圳","广州","杭州","成都","武汉","南京","天津","重庆","西安","苏州"]
PRODUCT_TYPES = [
    ("股票型基金","股票型"),("债券型基金","债券型"),("混合型基金","混合型"),
    ("货币市场基金","货币型"),("私募股权基金","结构化"),("QDII基金","跨境"),
    ("FOF组合基金","结构化"),("REITs不动产基金","另类"),("ETF指数基金","被动型"),
    ("量化对冲基金","结构化")
]
CHANNELS = ["线上APP","网银","柜台","第三方平台","手机银行","ATM","电话银行","微信小程序"]
PURPOSES = ["投资理财","日常消费","购房款","工资发放","分红收益","还款","企业转账","贸易结算","学费","医疗费"]
ACCOUNT_TYPES = ["个人储蓄账户","个人结算账户","企业基本户","企业一般户","保证金账户","理财账户"]

random.seed(42)

def seed():
    conn = sqlite3.connect(DB)
    cur = conn.cursor()

    # Products
    print("Seeding products...")
    cur.execute("DELETE FROM product")
    products = []
    for i in range(30):
        ptype, pcat = random.choice(PRODUCT_TYPES)
        launch = datetime(2018, 1, 1) + timedelta(days=random.randint(0, 2500))
        maturity = launch + timedelta(days=random.randint(365, 365*5))
        risk = random.choices(["低","中","高"], weights=[30,50,20])[0]
        issuer = random.choice(["华夏基金","易方达基金","嘉实基金","南方基金","广发基金","招商基金"])
        pid = f"PRD{1000+i:04d}"
        products.append({"id": pid, "name": f"{issuer}-{ptype}", "type": pcat, "risk": risk, "issuer": issuer})
        cur.execute("""
            INSERT INTO product (product_id, product_name, product_type, risk_level, issuer, status, launch_date, maturity_date, created_at)
            VALUES (?, ?, ?, ?, ?, 'active', ?, ?, datetime('now'))
        """, (pid, f"{issuer}-{ptype}", pcat, risk, issuer, launch.strftime("%Y-%m-%d"), maturity.strftime("%Y-%m-%d")))
    print(f"  {len(products)} products inserted")

    # Customers
    print("Seeding customers...")
    cur.execute("DELETE FROM customer")
    customers = []
    for i in range(200):
        surname = random.choice(SURNAMES)
        given = random.choice(GIVEN) + (random.choice(GIVEN) if random.random() < 0.5 else "")
        name = surname + given
        # ~8% PEP
        pep = 1 if random.random() < 0.08 else 0
        # ~12% high-risk country
        nationality = random.choice(HIGH_RISK_COUNTRIES) if random.random() < 0.12 else random.choice(NORMAL_COUNTRIES)
        # occupation
        if pep:
            occupation = random.choice(HIGH_RISK_OCCUPATIONS)
        else:
            occupation = random.choice(NORMAL_OCCUPATIONS + HIGH_RISK_OCCUPATIONS)
        risk = "高" if (pep or nationality in HIGH_RISK_COUNTRIES) else random.choice(["低","中"])
        cid = f"CUST{100000+i:06d}"
        # Some customers have old KYC
        kyc_date = datetime.now() - timedelta(days=random.randint(30, 800))
        addr = f"{random.choice(CITIES)}{random.choice(['区','新区','开发区'])}{random.randint(1,200)}号"
        customers.append({"id": cid, "name": name, "pep": pep, "nationality": nationality, "occupation": occupation, "risk": risk, "address": addr})
        cur.execute("""
            INSERT INTO customer (customer_id, name, id_type, id_number, id_expiry_date, nationality, birth_date, occupation, risk_level, phone, email, address, created_at, updated_at)
            VALUES (?, ?, '身份证', ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
        """, (
            cid, name,
            f"{random.randint(110000,659000)}{random.randint(1980,2005)}{random.randint(1000,9999)}",
            (datetime.now() + timedelta(days=random.randint(365,365*10))).strftime("%Y-%m-%d"),
            nationality,
            f"{random.randint(1950,2005)}-{random.randint(1,12):02d}-{random.randint(1,28):02d}",
            occupation, risk,
            f"1{random.randint(30,99)}{random.randint(10000000,99999999)}",
            f"{name.lower()}{random.randint(1,99)}@email.com",
            addr,
            kyc_date.strftime("%Y-%m-%d %H:%M:%S")
        ))
    print(f"  {len(customers)} customers inserted (PEP: {sum(1 for c in customers if c['pep'])})")

    # Accounts
    print("Seeding accounts...")
    cur.execute("DELETE FROM account")
    accounts = []
    for i in range(300):
        cust = random.choice(customers)
        prod = random.choice(products)
        acc_type = random.choice(ACCOUNT_TYPES)
        balance = round(random.uniform(1000, 5000000), 2)
        currency = random.choices(["CNY","USD","HKD"], weights=[80,15,5])[0]
        open_date = (datetime.now() - timedelta(days=random.randint(30, 1500))).strftime("%Y-%m-%d")
        aid = f"ACCT{2000000+i:08d}"
        accounts.append({"id": aid, "customer_id": cust["id"], "product_id": prod["id"], "balance": balance})
        cur.execute("""
            INSERT INTO account (account_id, customer_id, product_id, account_type, status, balance, currency, open_date, created_at, updated_at)
            VALUES (?, ?, ?, ?, 'active', ?, ?, ?, datetime('now'), datetime('now'))
        """, (aid, cust["id"], prod["id"], acc_type, balance, currency, open_date))
    print(f"  {len(accounts)} accounts inserted")

    # Transactions
    print("Seeding transactions...")
    cur.execute("DELETE FROM trans_record")
    tx_count = 0
    for i in range(800):
        acct = random.choice(accounts)
        cust_id = acct["customer_id"]
        tx_type = random.choices(["申购","赎回","转入","转出","分红","手续费"], weights=[35,30,10,10,10,5])[0]
        amount = round(random.uniform(100, 2000000), 2)
        # ~10% large amount
        if random.random() < 0.10:
            amount = round(random.uniform(500000, 5000000), 2)
        currency = random.choices(["CNY","USD"], weights=[85,15])[0]
        channel = random.choices(CHANNELS, weights=[30,15,8,12,10,5,2,18])[0]
        purpose = random.choice(PURPOSES)
        cparty = f"{random.choice(SURNAMES)}{random.choice(GIVEN)}" if random.random() < 0.7 else f"{random.choice(['ABC','XYZ','TradeCo','Global'])} {random.choice(['Ltd','Inc','LLC','Group'])}"
        tx_date = (datetime.now() - timedelta(days=random.randint(1, 365))).strftime("%Y-%m-%d")
        tid = f"TXN{3000000+i:08d}"
        tx_count += 1
        cur.execute("""
            INSERT INTO trans_record (transaction_id, account_id, customer_id, transaction_type, amount, currency, counterparty_info, transaction_date, channel, purpose, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        """, (tid, acct["id"], cust_id, tx_type, amount, currency, cparty, tx_date, channel, purpose))
    print(f"  {tx_count} transactions inserted")

    conn.commit()
    conn.close()
    print(f"\n[OK] Demo data seeded successfully!")
    print(f"  Dashboard now shows: 200 customers, 300 accounts, {tx_count} transactions, 30 products")
    print(f"  Ready for risk assessment!")

if __name__ == "__main__":
    seed()

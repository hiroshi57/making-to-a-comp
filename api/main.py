"""
FastAPI Backend — making-to-a-comp
ダッシュボードへのデータAPIと、マーケティングパイプライン実行エンドポイント

起動: uvicorn api.main:app --reload --port 8000
"""

from __future__ import annotations

import json
import os
import sys
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Optional

import csv
import io
import uuid

from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

from api.auth import authenticate, create_token, decode_token, change_password

app = FastAPI(title="making-to-a-comp API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Paths ─────────────────────────────────────────
EMPLOYEES_FILE = ROOT / "company" / "employees.json"
LOGS_DIR       = ROOT / "logs"
DATA_DIR       = ROOT / "data"
ORDERS_FILE    = DATA_DIR / "orders.json"
SETTINGS_FILE  = DATA_DIR / "settings.json"
LOGS_DIR.mkdir(exist_ok=True)
DATA_DIR.mkdir(exist_ok=True)


# ── Helpers ───────────────────────────────────────
def load_employees() -> dict:
    return json.loads(EMPLOYEES_FILE.read_text(encoding="utf-8"))


def load_orders() -> list[dict]:
    if not ORDERS_FILE.exists():
        return []
    return json.loads(ORDERS_FILE.read_text(encoding="utf-8"))


def save_orders(orders: list[dict]) -> None:
    ORDERS_FILE.write_text(json.dumps(orders, ensure_ascii=False, indent=2), encoding="utf-8")


def load_settings() -> dict:
    if not SETTINGS_FILE.exists():
        return {"company_name": "TBD Inc.", "company_name_ja": "", "location": "東京都渋谷区"}
    return json.loads(SETTINGS_FILE.read_text(encoding="utf-8"))


def save_settings(s: dict) -> None:
    SETTINGS_FILE.write_text(json.dumps(s, ensure_ascii=False, indent=2), encoding="utf-8")


def load_pipeline_logs() -> list[dict]:
    logs = []
    for f in sorted(LOGS_DIR.glob("pipeline_*.json"), reverse=True)[:20]:
        try:
            logs.append(json.loads(f.read_text(encoding="utf-8")))
        except Exception:
            pass
    return logs


# ── Mock data (same as dashboard/data.js) ─────────
def mock_kpi() -> dict:
    return {
        "revenue":   {"value": 12_840_000, "prev": 10_200_000, "unit": "¥", "label": "累計売上"},
        "orders":    {"value": 47,          "prev": 38,          "unit": "件", "label": "受注件数"},
        "costs":     {"value": 5_320_000,   "prev": 4_890_000,   "unit": "¥", "label": "総コスト"},
        "profit":    {"value": 7_520_000,   "prev": 5_310_000,   "unit": "¥", "label": "利益"},
        "clients":   {"value": 23,          "prev": 17,          "unit": "社", "label": "取引先数"},
        "agentRuns": {"value": len(load_pipeline_logs()) + 184, "prev": 97, "unit": "回", "label": "AI実行数"},
    }


MOCK_ORDERS = [
    {"id":"ORD-047","client":"株式会社テックスタート","amount":1_200_000,"date":"2026-04-09","status":"受注","agent":"CMO"},
    {"id":"ORD-046","client":"グリーンウェイ合同会社","amount":850_000,"date":"2026-04-08","status":"請求済","agent":"Sales"},
    {"id":"ORD-045","client":"フューチャーネット株式会社","amount":2_400_000,"date":"2026-04-05","status":"入金済","agent":"CMO"},
    {"id":"ORD-044","client":"クリエイティブラボ","amount":680_000,"date":"2026-04-03","status":"入金済","agent":"Sales"},
    {"id":"ORD-043","client":"マーケットプラス株式会社","amount":1_550_000,"date":"2026-03-28","status":"入金済","agent":"CMO"},
]

def mock_orders() -> list[dict]:
    saved = load_orders()
    return saved if saved else MOCK_ORDERS


def mock_monthly() -> dict:
    return {
        "labels":  ["4月","5月","6月","7月","8月","9月","10月","11月","12月","1月","2月","3月"],
        "revenue": [620,780,850,1020,940,1180,1050,1240,1380,1520,1640,1870],
        "costs":   [310,380,400,450,420,510,470,530,560,610,640,680],
        "orders":  [2,3,3,4,3,5,4,5,5,6,7,8],
    }


def mock_forecast() -> dict:
    return {
        "labels":  ["4月","5月","6月","7月","8月","9月"],
        "revenue": [2050,2230,2410,2580,2750,2920],
        "lower":   [1820,1970,2100,2240,2380,2510],
        "upper":   [2280,2490,2720,2920,3120,3330],
        "source":  "mock",
    }


def mock_snga() -> dict:
    return {
        "total":   {"value": 4_180_000, "prev": 3_920_000, "unit": "¥", "label": "販管費合計"},
        "ratio":   {"value": 32.6,       "prev": 38.4,       "unit": "%", "label": "売上比率"},
        "breakdown": [
            {"label":"人件費",       "amount":2_100_000,"color":"#5856d6","pct":50.2},
            {"label":"広告宣伝費",   "amount":620_000,  "color":"#007aff","pct":14.8},
            {"label":"賃借料",       "amount":480_000,  "color":"#30d158","pct":11.5},
            {"label":"外注費",       "amount":380_000,  "color":"#ff9500","pct": 9.1},
            {"label":"通信費",       "amount":210_000,  "color":"#af52de","pct": 5.0},
            {"label":"旅費交通費",   "amount":180_000,  "color":"#ff2d55","pct": 4.3},
            {"label":"消耗品・その他","amount":210_000,  "color":"#8e8e93","pct": 5.0},
        ],
        "monthly": {
            "labels":    ["4月","5月","6月","7月","8月","9月","10月","11月","12月","1月","2月","3月"],
            "personnel": [190,195,200,205,205,210,210,215,215,205,208,210],
            "ad":        [40,52,58,70,62,80,72,85,92,100,108,120],
            "rent":      [48,48,48,48,48,48,48,48,48,48,48,48],
            "other":     [32,38,42,48,44,55,50,60,65,72,76,80],
        },
    }


# ── Endpoints: Data ───────────────────────────────

@app.get("/api/kpi")
def get_kpi():
    return mock_kpi()


@app.get("/api/orders")
def get_orders():
    return mock_orders()


@app.get("/api/monthly")
def get_monthly():
    return mock_monthly()


@app.get("/api/forecast")
def get_forecast():
    """TimesFM 予測。モデルが使えない場合はモックデータを返す"""
    try:
        from forecasting.forecast import Forecaster
        history = mock_monthly()["revenue"]
        fc = Forecaster()
        result = fc.predict(history, horizon=6)
        return {**result.to_dict(), "source": "timesfm" if fc._available else "linear_fallback"}
    except Exception as e:
        return {**mock_forecast(), "error": str(e)}


@app.get("/api/snga")
def get_snga():
    return mock_snga()


@app.get("/api/employees")
def get_employees():
    data = load_employees()
    return data["employees"]


@app.get("/api/company")
def get_company():
    settings = load_settings()
    data = load_employees()
    company = data["company"]
    # settings で上書き
    if settings.get("company_name"):
        company["name"] = settings["company_name"]
    if settings.get("company_name_ja"):
        company["name_ja"] = settings["company_name_ja"]
    return company


# ── Settings ──────────────────────────────────────

class SettingsIn(BaseModel):
    company_name:    Optional[str] = None
    company_name_ja: Optional[str] = None
    location:        Optional[str] = None
    fiscal_year_start: Optional[str] = None


@app.get("/api/settings")
def get_settings():
    return load_settings()


@app.put("/api/settings")
def put_settings(body: SettingsIn):
    s = load_settings()
    for k, v in body.model_dump(exclude_none=True).items():
        s[k] = v
    save_settings(s)
    # employees.json の会社名も同期
    if body.company_name:
        emp_data = load_employees()
        emp_data["company"]["name"] = body.company_name
        if body.company_name_ja:
            emp_data["company"]["name_ja"] = body.company_name_ja
        EMPLOYEES_FILE.write_text(
            json.dumps(emp_data, ensure_ascii=False, indent=2), encoding="utf-8"
        )
    return s


# ── Orders CRUD ───────────────────────────────────

class OrderIn(BaseModel):
    client: str
    amount: int
    date:   Optional[str] = None
    status: Optional[str] = "受注"
    agent:  Optional[str] = "Sales"
    note:   Optional[str] = ""


@app.post("/api/orders", status_code=201)
def create_order(body: OrderIn):
    orders = load_orders()
    if not orders:
        orders = list(MOCK_ORDERS)  # モックを初期データとして採用
    # 次の注文IDを生成
    nums = [int(o["id"].split("-")[1]) for o in orders if o["id"].startswith("ORD-")]
    next_num = max(nums) + 1 if nums else 1
    order = {
        "id":     f"ORD-{next_num:03d}",
        "client": body.client,
        "amount": body.amount,
        "date":   body.date or datetime.now().strftime("%Y-%m-%d"),
        "status": body.status,
        "agent":  body.agent,
        "note":   body.note,
    }
    orders.insert(0, order)
    save_orders(orders)
    return order


@app.patch("/api/orders/{order_id}")
def update_order_status(order_id: str, status: str):
    orders = load_orders()
    if not orders:
        orders = list(MOCK_ORDERS)
    for o in orders:
        if o["id"] == order_id:
            o["status"] = status
            save_orders(orders)
            return o
    raise HTTPException(404, f"order {order_id} not found")


@app.delete("/api/orders/{order_id}", status_code=204)
def delete_order(order_id: str):
    orders = load_orders()
    new_orders = [o for o in orders if o["id"] != order_id]
    if len(new_orders) == len(orders):
        raise HTTPException(404, f"order {order_id} not found")
    save_orders(new_orders)


# ── CSV Import ────────────────────────────────────

@app.post("/api/import/orders-csv")
async def import_orders_csv(file: UploadFile = File(...)):
    """
    CSVフォーマット（ヘッダー必須）:
    client,amount,date,status,agent,note
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(400, "CSV ファイルのみ対応しています")

    content = await file.read()
    try:
        text = content.decode("utf-8-sig")  # BOM付きUTF-8にも対応
    except UnicodeDecodeError:
        text = content.decode("shift_jis", errors="replace")

    reader = csv.DictReader(io.StringIO(text))
    required = {"client", "amount"}
    if not required.issubset(set(reader.fieldnames or [])):
        raise HTTPException(400, f"必須列が不足しています: {required}")

    orders = load_orders()
    if not orders:
        orders = list(MOCK_ORDERS)

    nums = [int(o["id"].split("-")[1]) for o in orders if o["id"].startswith("ORD-")]
    next_num = max(nums) + 1 if nums else 1

    imported = []
    for row in reader:
        try:
            amount = int(str(row.get("amount", "0")).replace(",", "").replace("¥", "").strip())
        except ValueError:
            continue
        order = {
            "id":     f"ORD-{next_num:03d}",
            "client": row.get("client", "").strip(),
            "amount": amount,
            "date":   row.get("date", datetime.now().strftime("%Y-%m-%d")).strip(),
            "status": row.get("status", "受注").strip() or "受注",
            "agent":  row.get("agent", "Sales").strip() or "Sales",
            "note":   row.get("note", "").strip(),
        }
        orders.insert(0, order)
        imported.append(order)
        next_num += 1

    save_orders(orders)
    return {"imported": len(imported), "orders": imported}


# ── Pipeline: API key check ───────────────────────

@app.get("/api/pipeline/check")
def pipeline_check():
    key = os.environ.get("ANTHROPIC_API_KEY", "")
    has_key = bool(key and key.startswith("sk-"))
    return {
        "ready":   has_key,
        "message": "APIキー設定済み" if has_key else "ANTHROPIC_API_KEY が未設定です。.env ファイルに追加してください",
        "model":   os.environ.get("CLAUDE_MODEL", "claude-sonnet-4-6"),
    }


@app.get("/api/agent-logs")
def get_agent_logs():
    """実際に pipeline.py を実行したログを返す。なければモックを返す"""
    logs = load_pipeline_logs()
    if logs:
        return [
            {
                "ts":     l.get("ts", "")[:16].replace("T", " "),
                "task":   l.get("task", ""),
                "agents": l.get("agents", []),
                "status": l.get("status", "unknown"),
                "score":  round(sum(1 for a in l.get("agents",[]) if a) / max(len(l.get("agents",[])),1), 2),
                "elapsed": l.get("elapsed_sec"),
            }
            for l in logs
        ]
    # モック
    return [
        {"ts":"2026-04-10 14:32","task":"競合分析レポート","agents":["Planner","MarketAnalyst","Integrator"],"status":"completed","score":0.91},
        {"ts":"2026-04-10 11:18","task":"SNS広告プラン作成","agents":["Planner","InsightAgent","StrategyAgent","Integrator"],"status":"completed","score":0.88},
        {"ts":"2026-04-09 16:45","task":"ターゲットセグメント定義","agents":["Planner","MarketAnalyst","InsightAgent"],"status":"completed","score":0.85},
        {"ts":"2026-04-09 09:20","task":"Q2 KPI設定","agents":["Planner","StrategyAgent","Integrator"],"status":"completed","score":0.93},
        {"ts":"2026-04-08 17:10","task":"新規顧客向けコンテンツ戦略","agents":["Planner","InsightAgent","StrategyAgent","Integrator"],"status":"completed","score":0.79},
        {"ts":"2026-04-08 13:55","task":"メールキャンペーン設計","agents":["Planner","StrategyAgent"],"status":"failed","score":0.42},
        {"ts":"2026-04-07 10:30","task":"市場規模推定","agents":["Planner","MarketAnalyst"],"status":"completed","score":0.96},
    ]


# ── Endpoint: Pipeline execution ──────────────────

class PipelineRequest(BaseModel):
    task: str
    model: Optional[str] = None


class PipelineJob(BaseModel):
    job_id: str
    status: str
    task: str
    started_at: str


_running_jobs: dict[str, dict] = {}


@app.post("/api/pipeline/run", response_model=PipelineJob)
async def run_pipeline(req: PipelineRequest, background_tasks: BackgroundTasks):
    if not req.task.strip():
        raise HTTPException(400, "task is required")

    job_id = datetime.now().strftime("%Y%m%d_%H%M%S")
    _running_jobs[job_id] = {"status": "running", "task": req.task, "result": None}

    async def _run():
        try:
            from agents.pipeline import run_pipeline as _pipe
            loop = asyncio.get_event_loop()
            log = await loop.run_in_executor(None, _pipe, req.task)
            _running_jobs[job_id]["status"] = "completed"
            _running_jobs[job_id]["result"] = log
        except Exception as e:
            _running_jobs[job_id]["status"] = "failed"
            _running_jobs[job_id]["error"] = str(e)

    background_tasks.add_task(_run)

    return PipelineJob(
        job_id=job_id,
        status="running",
        task=req.task,
        started_at=datetime.now().isoformat(),
    )


@app.get("/api/pipeline/status/{job_id}")
def pipeline_status(job_id: str):
    job = _running_jobs.get(job_id)
    if not job:
        raise HTTPException(404, "job not found")
    return job


@app.get("/api/pipeline/jobs")
def pipeline_jobs():
    return [
        {"job_id": jid, "status": j["status"], "task": j["task"]}
        for jid, j in _running_jobs.items()
    ]


# ── Auth ──────────────────────────────────────────

bearer = HTTPBearer(auto_error=False)


def current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)) -> Optional[dict]:
    """トークンからユーザー情報を取得。未認証時は None"""
    if not creds:
        return None
    return decode_token(creds.credentials)


def require_user(user: Optional[dict] = Depends(current_user)) -> dict:
    """認証必須。未認証時は 401"""
    if not user:
        raise HTTPException(401, "認証が必要です")
    return user


class LoginIn(BaseModel):
    email:    str
    password: str


class PasswordChangeIn(BaseModel):
    email:       str
    old_password: str
    new_password: str


@app.post("/api/auth/login")
def login(body: LoginIn):
    emp = authenticate(body.email.strip().lower(), body.password)
    if not emp:
        raise HTTPException(401, "メールアドレスまたはパスワードが違います")
    token = create_token(emp)
    return {
        "token":   token,
        "emp_id":  emp["id"],
        "name":    emp["name"],
        "role":    emp["role"],
        "role_ja": emp.get("role_ja") or emp.get("roleJa", ""),
        "email":   emp["email"],
    }


@app.get("/api/auth/me")
def me(user: dict = Depends(require_user)):
    return user


@app.post("/api/auth/change-password")
def change_pw(body: PasswordChangeIn):
    ok = change_password(body.email.strip().lower(), body.old_password, body.new_password)
    if not ok:
        raise HTTPException(400, "現在のパスワードが違います")
    return {"message": "パスワードを変更しました"}


@app.get("/health")
def health():
    return {"status": "ok", "ts": datetime.now().isoformat()}


# ── Static: ルートで dashboard を配信（APIルートの後に置く） ──
# /api/* はすべて上のルートが処理し、それ以外は dashboard/ を返す
DASHBOARD_DIR = ROOT / "dashboard"
app.mount("/", StaticFiles(directory=str(DASHBOARD_DIR), html=True), name="root")

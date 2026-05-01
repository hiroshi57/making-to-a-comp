"""
JWT認証ユーティリティ — making-to-a-comp
"""
from __future__ import annotations

import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

ROOT        = Path(__file__).parent.parent
CREDS_FILE  = ROOT / "data" / "credentials.json"
EMP_FILE    = ROOT / "company" / "employees.json"

SECRET_KEY  = os.environ.get("JWT_SECRET", "make-to-a-comp-dev-secret-change-in-prod")
ALGORITHM   = "HS256"
EXPIRE_HOURS = 8

pwd_ctx = CryptContext(schemes=["sha256_crypt"])


def _load_creds() -> dict:
    if not CREDS_FILE.exists():
        return {}
    return json.loads(CREDS_FILE.read_text(encoding="utf-8"))


def _load_employees() -> list[dict]:
    data = json.loads(EMP_FILE.read_text(encoding="utf-8"))
    return data.get("employees", [])


def authenticate(email: str, password: str) -> Optional[dict]:
    """メールアドレスとパスワードで認証。成功時は社員情報を返す"""
    creds = _load_creds()
    entry = creds.get(email.lower())
    if not entry:
        return None
    if not pwd_ctx.verify(password, entry["hash"]):
        return None
    # 社員情報を付加して返す
    emp_id = entry["emp_id"]
    employees = _load_employees()
    emp = next((e for e in employees if e["id"] == emp_id), None)
    return emp


def create_token(emp: dict) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=EXPIRE_HOURS)
    payload = {
        "sub":   emp["email"],
        "id":    emp["id"],
        "role":  emp["role"],
        "name":  emp["name"],
        "exp":   expire,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


def change_password(email: str, old_pw: str, new_pw: str) -> bool:
    """パスワード変更。成功時 True"""
    if not authenticate(email, old_pw):
        return False
    creds = _load_creds()
    creds[email]["hash"] = pwd_ctx.hash(new_pw)
    CREDS_FILE.write_text(json.dumps(creds, indent=2), encoding="utf-8")
    return True

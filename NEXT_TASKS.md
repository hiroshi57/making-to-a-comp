# NEXT_TASKS.md — 次回再開用

最終更新: 2026-04-10

## 完了済み ✅

- A: 環境セットアップ（TimesFM / AutoAgent / プロジェクト venv）
- B: ダッシュボード（白テーマ / 全セクションアクティブ / 販管費 / 社員詳細）
- C: マーケティングパイプライン（agents/pipeline.py — Claude API）
- D: 統合アーキテクチャ（TimesFM / AutoAgent 設定）
- E: FastAPI バックエンド（api/main.py）
- F: dashboard/app.js — API フェッチ + static fallback
- G: 受注フォーム・ステータス更新・CSVインポート
- H: 会社名設定パネル・Claude APIキー確認UI
- I: ユーザー認証（JWT / sha256_crypt）
  - POST /api/auth/login — ログイン
  - GET  /api/auth/me    — 自分の情報
  - POST /api/auth/change-password — パスワード変更
  - dashboard/login.html — ログインページ
  - app.js に Auth guard 追加
- J: TimesFM HF_TOKEN 対応（.env の HF_TOKEN を自動読み込み）

---

## 残タスク

### ユーザー依存（設定が必要）
- [ ] **会社名**の確定 → ダッシュボードの⚙設定から変更可能
- [ ] **HF_TOKEN** を `.env` に追加 → TimesFM 実モデルが使えるようになる
  - https://huggingface.co/settings/tokens でトークン発行

### 次フェーズ候補（実装可能）
- [ ] パスワード変更UI（設定パネルに追加）
- [ ] AutoAgent Docker セットアップ（Docker Desktop が必要）
- [ ] KPIの実データ入力・編集機能
- [ ] メール通知（受注時・入金時）
- [ ] 月次レポート自動生成（Claude API）

---

## 起動方法

```powershell
cd C:\Users\hiroshi_takizawa\making-to-a-comp
.venv\Scripts\Activate.ps1
uvicorn api.main:app --reload --port 8000
```

ブラウザで `http://localhost:8000/login.html` を開く

| 社員 | メール | 初期PW |
|------|--------|--------|
| 田中 誠（CEO）| ceo@company.jp | EMP001 |
| 山田 花子（CMO）| marketing@company.jp | EMP002 |
| 鈴木 一郎（Sales）| sales@company.jp | EMP003 |
| 高橋 健（CTO）| dev@company.jp | EMP005 |

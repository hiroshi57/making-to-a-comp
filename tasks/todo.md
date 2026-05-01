# tasks/todo.md

## Phase A: 環境セットアップ ✅
- [x] TimesFM: uv venv + pip install -e .[torch]
- [x] AutoAgent: uv sync
- [x] pyproject.toml 作成
- [x] .env.example 作成

## Phase B: ダッシュボード ✅
- [x] dashboard/index.html — KPI/チャート/受注/社員/エージェントログ
- [x] dashboard/data.js   — モックデータ（TimesFM予測含む）
- [ ] ブラウザで動作確認（ユーザー手動）

## Phase C: マーケティングエージェントパイプライン ✅
- [x] agents/pipeline.py — 5エージェントパイプライン（Claude API）
- [x] 構文チェック通過

## Phase D: 統合アーキテクチャ ✅
- [x] forecasting/forecast.py — TimesFM 2.5 ラッパー
- [x] autoagent/program.md   — マーケティング特化設定
- [x] autoagent/agent.py     — SYSTEM_PROMPT 更新
- [x] autoagent/tasks/       — サンプルタスク作成

## Next（未着手）
- [ ] .env に ANTHROPIC_API_KEY 設定 → pipeline.py 実行テスト
- [ ] 会社名確定 → employees.json / dashboard 更新
- [ ] FastAPI バックエンド → ダッシュボード実データ接続
- [ ] AutoAgent Docker セットアップ

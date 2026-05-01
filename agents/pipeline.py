"""
Marketing Agent Pipeline — making-to-a-comp
Claude API ベースの5ステップマーケティングパイプライン

Usage:
    python agents/pipeline.py "新しいSaaS製品のマーケティング戦略を立てたい"
"""

import os
import sys
import json
import time
from datetime import datetime
from dotenv import load_dotenv
import anthropic
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich import print as rprint

load_dotenv()

console = Console()
client  = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
MODEL   = os.environ.get("CLAUDE_MODEL", "claude-sonnet-4-6")

AGENTS = {
    "Planner": {
        "emoji": "🧭",
        "system": """あなたはマーケティング戦略のPlannerエージェントです。
ユーザーの課題を分析し、どのエージェントを何の順序で使うか決定してください。

出力はJSON形式で:
{
  "problem_summary": "課題の要約（1文）",
  "selected_agents": ["MarketAnalyst", "InsightAgent", "StrategyAgent"],
  "rationale": "選択理由",
  "context": {
    "industry": "業界",
    "target_guess": "推定ターゲット",
    "key_challenge": "中心課題"
  }
}""",
    },
    "MarketAnalyst": {
        "emoji": "📊",
        "system": """あなたは市場分析エージェントです。
前エージェントのコンテキストを引き継ぎ、以下を分析してください：
- 市場規模・成長率の推定
- 競合プレイヤーとポジショニング
- ターゲットセグメントの定義
- 市場のトレンドと機会

実務レベルで具体的に。抽象的な説明は禁止。""",
    },
    "InsightAgent": {
        "emoji": "💡",
        "system": """あなたはインサイト抽出エージェントです。
市場分析を受け取り、以下を抽出してください：
- ターゲットの深層心理・ペインポイント
- 購買決定の本質的な動機
- 競合が捉えられていない「空白」
- コミュニケーションに使えるインサイト3つ

インサイトは「なぜ？」を3回掘り下げた結論で。""",
    },
    "StrategyAgent": {
        "emoji": "🎯",
        "system": """あなたは戦略・KPI設計エージェントです。
前エージェントの分析・インサイトを統合し、以下を設計してください：
- マーケティング戦略（1文のコアメッセージ）
- 施策リスト（最低5つ、実行可能な具体策）
- KPI定義（各施策に数値目標を設定）
- 優先順位と実行タイムライン

戦略 → 施策 → KPI の整合性を必ず保つこと。""",
    },
    "Integrator": {
        "emoji": "📋",
        "system": """あなたは統合レポート作成エージェントです。
全エージェントの出力を統合し、最終マーケティングプランを作成してください。

構成：
1. エグゼクティブサマリー（3行）
2. 市場・ターゲット定義
3. コアインサイト
4. 戦略とコアメッセージ
5. 施策ロードマップ（優先順位付き）
6. KPIダッシュボード
7. 次のアクション（3つ）

実務担当者が即日使えるレベルで書く。""",
    },
}


def run_agent(name: str, task: str, context: str = "") -> str:
    """単一エージェントを実行する"""
    agent = AGENTS[name]
    console.print(f"\n  {agent['emoji']} [bold]{name}[/bold] 実行中...", style="dim")

    prompt = task
    if context:
        prompt = f"【前エージェントからの引き継ぎ情報】\n{context}\n\n【新しいタスク】\n{task}"

    response = client.messages.create(
        model=MODEL,
        max_tokens=2048,
        system=agent["system"],
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text


def run_pipeline(user_task: str) -> dict:
    """マーケティングパイプラインを実行する"""
    start = time.time()
    log = {
        "ts": datetime.now().isoformat(),
        "task": user_task,
        "agents": [],
        "outputs": {},
    }

    console.rule("[bold magenta]Marketing Agent Pipeline[/bold magenta]")
    console.print(f"\n[bold]課題:[/bold] {user_task}\n")

    # ── Step 1: Planner ──────────────────────────────────────
    console.print(Panel("Step 1 / 5 — 課題分析・エージェント選択", style="blue"))
    plan_raw = run_agent("Planner", user_task)
    log["agents"].append("Planner")
    log["outputs"]["Planner"] = plan_raw

    try:
        plan = json.loads(plan_raw)
        selected = plan.get("selected_agents", ["MarketAnalyst", "InsightAgent", "StrategyAgent"])
        context  = json.dumps(plan, ensure_ascii=False, indent=2)
        console.print(f"\n  選択エージェント: {' → '.join(selected)}")
    except json.JSONDecodeError:
        selected = ["MarketAnalyst", "InsightAgent", "StrategyAgent"]
        context  = plan_raw

    # ── Step 2-4: 選択エージェントを順次実行 ─────────────────
    for i, agent_name in enumerate(selected, 2):
        if agent_name not in AGENTS:
            continue
        console.print(Panel(f"Step {i} / {len(selected)+2} — {agent_name}", style="blue"))
        output = run_agent(agent_name, user_task, context)
        log["agents"].append(agent_name)
        log["outputs"][agent_name] = output
        context += f"\n\n【{agent_name}の出力】\n{output}"

    # ── Step 5: Integrator ───────────────────────────────────
    console.print(Panel(f"Step {len(selected)+2} / {len(selected)+2} — 最終プラン統合", style="blue"))
    final = run_agent("Integrator", user_task, context)
    log["agents"].append("Integrator")
    log["outputs"]["Integrator"] = final

    elapsed = time.time() - start
    log["elapsed_sec"] = round(elapsed, 1)
    log["status"] = "completed"

    return log


def display_result(log: dict) -> None:
    """パイプライン結果を表示する"""
    console.rule("[bold green]最終マーケティングプラン[/bold green]")
    console.print(log["outputs"]["Integrator"])
    console.print(f"\n[dim]実行時間: {log['elapsed_sec']}秒 | エージェント: {' → '.join(log['agents'])}[/dim]")


if __name__ == "__main__":
    task = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else input("マーケティング課題を入力: ")
    if not task.strip():
        console.print("[red]課題を入力してください[/red]")
        sys.exit(1)

    log = run_pipeline(task)
    display_result(log)

    # ログ保存
    log_dir = os.path.join(os.path.dirname(__file__), "..", "logs")
    os.makedirs(log_dir, exist_ok=True)
    log_path = os.path.join(log_dir, f"pipeline_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
    with open(log_path, "w", encoding="utf-8") as f:
        json.dump(log, f, ensure_ascii=False, indent=2)
    console.print(f"\n[dim]ログ保存: {log_path}[/dim]")

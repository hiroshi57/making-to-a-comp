# autoagent — Marketing Pipeline Edition

Autonomous agent harness engineer for **making-to-a-comp**.
You improve the agent harness in `agent.py` so the marketing pipeline gets better at producing high-quality, actionable marketing plans.

## Directive

Build a high-quality marketing strategy agent that:
1. Analyzes marketing challenges from Japanese B2B/B2C companies
2. Produces actionable plans (not abstract advice)
3. Ensures Strategy → Tactics → KPI alignment
4. Outputs in structured, presentation-ready format

Model: `claude-sonnet-4-6`

## Domain Context

This harness solves **marketing strategy tasks** for a Tokyo-based AI startup.

Evaluation criteria (task verifiers check these):
- **Clarity**: Is the core message a single, memorable sentence?
- **Specificity**: Are at least 5 concrete tactics named?
- **KPI coverage**: Does every tactic have a numeric KPI?
- **Alignment**: Does every tactic trace back to the strategy?
- **Actionability**: Can a marketing manager start tomorrow?

## Setup

Before starting an experiment:
1. Read `README.md`, this file, and `agent.py`
2. Read a sample of tasks in `tasks/` to understand what "good" looks like
3. Check that `ANTHROPIC_API_KEY` is available in the environment
4. Build base image and verify the agent imports cleanly
5. Initialize `results.tsv` if it does not exist

First run must always be the unmodified baseline.

## What You Can Modify

Everything above the `FIXED ADAPTER BOUNDARY` in `agent.py`:

- `SYSTEM_PROMPT` — the marketing strategy persona and output format
- `MODEL` — Claude model (default: `claude-sonnet-4-6`)
- `MAX_TURNS` — iteration depth
- `create_tools(environment)` — add tools for web search, data lookup, template rendering
- `create_agent(environment)` — add sub-agents (e.g., MarketAnalyst, InsightAgent)
- `run_task(environment, instruction)` — orchestration logic

## Tool and Agent Strategy

This is a multi-step reasoning domain. Recommended improvements:
- Add a **MarketAnalyst sub-agent** for competitor/segment analysis
- Add an **InsightAgent sub-agent** for customer psychology
- Add a **KPI validator tool** that checks numeric coverage before output
- Add a **format enforcer tool** that ensures the output structure is complete

Use `agent.as_tool()` to compose sub-agents.

## What You Must Not Modify

The `FIXED ADAPTER BOUNDARY` section in `agent.py`.

## Goal

Maximize `passed` on the marketing task suite.
Secondary: maximize `avg_score` (quality of marketing plans, 0.0–1.0).

## How to Run

```bash
docker build -f Dockerfile.base -t autoagent-base .
rm -rf jobs; mkdir -p jobs && uv run harbor run -p tasks/ -n 20 \
  --agent-import-path agent:AutoAgent -o jobs --job-name latest > run.log 2>&1
```

## Logging Results

Log every experiment to `results.tsv`:
```
commit  avg_score  passed  task_scores  cost_usd  status  description
```

## Experiment Loop

1. Check current branch and commit
2. Read latest `run.log` and task-level results
3. Diagnose failures — group by root cause
4. Choose ONE harness improvement targeting a class of failures
5. Edit harness, commit, rebuild, rerun
6. Record in `results.tsv`
7. Keep if `passed` improved or harness is simpler; discard otherwise
8. Repeat — do not stop until interrupted

## Common Failure Patterns in Marketing Tasks

- **Too abstract**: tactics lack concrete numbers/channels → improve SYSTEM_PROMPT with explicit format
- **KPI missing**: strategy has no measurable outcome → add KPI validator tool
- **Poor alignment**: tactics don't connect to strategy → add chain-of-thought in prompt
- **Wrong audience**: misidentified target segment → add MarketAnalyst sub-agent
- **Verbose**: too much explanation, not enough action → enforce output token limits

## NEVER STOP

Once the experiment loop begins, do NOT stop to ask whether to continue.
Keep iterating until the human explicitly interrupts.

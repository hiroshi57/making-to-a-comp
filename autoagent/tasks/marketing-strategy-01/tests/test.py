"""
Marketing plan quality verifier.
Checks structural completeness of the agent's output.
Score: 0.0 – 1.0
"""
import re
import sys


def score_plan(text: str) -> float:
    checks = {
        "core_message":    bool(re.search(r"コアメッセージ", text)),
        "tactics_table":   len(re.findall(r"\|.*\|", text)) >= 5,
        "kpi_numeric":     len(re.findall(r"\d+[%万円件回]", text)) >= 5,
        "target_defined":  bool(re.search(r"ターゲット|セグメント", text)),
        "action_items":    bool(re.search(r"次のアクション|アクションリスト", text)),
        "mrr_path":        bool(re.search(r"MRR|売上", text)),
    }
    passed = sum(checks.values())
    total  = len(checks)
    return round(passed / total, 3)


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "/logs/output.txt"
    try:
        with open(path, encoding="utf-8") as f:
            text = f.read()
    except FileNotFoundError:
        print("0.0")
        sys.exit(0)

    s = score_plan(text)
    print(s)

    # Harbor reads /logs/reward.txt
    with open("/logs/reward.txt", "w") as f:
        f.write(str(s))

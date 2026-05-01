## ⚡ セッション開始時の必須ルール（最優先・例外なし）

ユーザーの最初のメッセージを受け取ったら、NEXT_TASKS.md の確認より先に、必ず以下を実行すること。

### ステップ0: 当日確認済みチェック（最初に必ず確認）

memory の `update_checker_last_run` を確認する。

- **日付部分（YYYY-MM-DD）が今日と一致する → 即スキップ**
  以下の1行だけ出力して次のタスクへ進む:
  `✅ 本日確認済み（[前回確認時刻]）— スキップ`

- **今日と異なる、または存在しない → ステップ1へ進む**

---

### ステップ1: アップデート情報を取得（当日未確認の場合のみ）

以下の3URLから web_fetch で取得する:

1. `https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md`
2. `https://docs.anthropic.com/en/release-notes/overview`
3. `https://docs.anthropic.com/en/release-notes/claude-apps`

取得失敗時は web_search で代替取得する。

### ステップ2: プレビュー提示

前回確認日時以降の新着のみ抽出し、以下の形式で出力する:

```
🔍 アップデート確認（前回: [日時] / 新着: [件数]件）
・Code: [バージョン] — [一行要点]
・API: [一行要点 or 変更なし]
・Apps: [一行要点 or 変更なし]
⚠️ 破壊的変更: [あれば件数、なければ「なし」]
```

新着ゼロの場合も「変更なし」と1行出して次に進む。

### ステップ3: Yes/No確認

「詳細を見て記録しますか？ (Yes/No)」とユーザーに確認する。

- **Yes** → 詳細レポートを出力し、`update_checker_last_run` に現在日時を記録
- **No** → 「スキップ。次回起動時に再確認」と出力し、記録はしない

### ステップ4: ユーザーの本来の質問へ進む

上記が完了してから、NEXT_TASKS.md の確認やその他の作業を開始する。

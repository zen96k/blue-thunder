#! /usr/bin/env bash
# Stop フックで、Claude と Codex の利用制限を表示する

# フックから起動した claude がこのフックを再び呼ばないようにする
[ -n "${USAGE_HOOK_RUNNING:-}" ] && exit 0
export USAGE_HOOK_RUNNING=1

# claude の実行ファイル。PATH になければ、VS Code 拡張機能の同梱版を使う
claude_bin=$(command -v claude || ls -d "$HOME"/.vscode-server/extensions/anthropic.claude-code-*/resources/native-binary/claude 2>/dev/null | sort -V | tail -1)

# Claude: /usage の「Current session: 4% used · resets Sep 23, 12:30am (Asia/Tokyo)」を1行ずつ JSON にする
# 応答が止まっても表示を待たせすぎないよう、タイムアウトを付ける（終了しなければ2秒後に強制終了）
# 出力はファイルに書かせる。パイプだと、残った子プロセスがパイプを閉じるまで待たされるため
usage_json=$(mktemp)
trap 'rm -f "$usage_json"' EXIT
timeout -k 2 15 "$claude_bin" -p /usage --no-session-persistence --output-format json </dev/null >"$usage_json" 2>/dev/null
claude=$(jq -r '.result // empty' "$usage_json" 2>/dev/null \
  | sed -nE 's/^Current (.+): ([0-9]+)% used · resets (.+) \((.+)\)$/\1|\2|\3|\4/p' \
  | while IFS='|' read -r name pct reset tz; do
      # 「Sep 29, 1am」を date が読める「Sep 29 1:00 am」にし、表示されたタイムゾーンで解釈する
      reset=$(echo "$reset" | sed -E 's/,//; s/([0-9])(am|pm)$/\1 \2/; s/ ([0-9]+) (am|pm)$/ \1:00 \2/')
      at=$(TZ=$tz date -d "$reset" +%s 2>/dev/null) || at=null
      # 年が書かれていないので、今から半年以上ずれていれば年をまたいだとみなす（リセットは長くても7日先）
      if [ "$at" != null ]; then
        if [ "$at" -lt $(($(date +%s) - 15552000)) ]; then
          at=$(TZ=$tz date -d "$reset +1 year" +%s)
        elif [ "$at" -gt $(($(date +%s) + 15552000)) ]; then
          at=$(TZ=$tz date -d "$reset -1 year" +%s)
        fi
      fi
      case "$name" in
        session) label=5h ;;
        "week (all models)") label=7d ;;
        "week ("*) label="7d ${name#week (}"; label=${label%)} ;;
        *) label=$name ;;
      esac
      jq -nc --arg label "$label" --argjson pct "$pct" --argjson at "$at" '{label: $label, pct: $pct, at: $at}'
    done | jq -sc .)

# Codex: 直近8日（週の枠 + 1日）に更新されたセッションログ（アーカイブ済みも含む）から、
# 制限の種類（limit_id）ごとに最新のスナップショットを使う
# ファイルの更新時刻ではなく各行の timestamp で比べ、書きかけの行は読み飛ばす
codex_home=${CODEX_HOME:-$HOME/.codex}
codex=$(find "$codex_home/sessions" "$codex_home/archived_sessions" -name '*.jsonl' -mtime -8 -exec grep -h '"token_count"' {} + 2>/dev/null \
  | jq -Rc 'fromjson? | select(.payload.rate_limits) | {timestamp, snapshot: .payload.rate_limits}' \
  | jq -sc 'group_by(.snapshot.limit_id // "codex") | map(max_by(.timestamp).snapshot)
     | map(. as $s | (.primary, .secondary) | select(.)
       | {label: ((if ($s.limit_id // "codex") == "codex" then "" else "\($s.limit_name // $s.limit_id) " end)
            + (.window_minutes | if . == 300 then "5h" elif . == 10080 then "7d" elif . then "\(.)m" else "?" end)),
          pct: (.used_percent | round), at: .resets_at})')

# 1ツール1行で、「5h 4% (→00:30)」の形に揃える。80% 以上は ⚠️、リセット済みは reset
jq -nr --argjson claude "${claude:-[]}" --argjson codex "${codex:-[]}" '
  def item:
    if .at != null and .at < now then "\(.label) reset"
    else (if .pct >= 80 then "⚠️ " else "" end) + "\(.label) \(.pct)%"
      + (if .at == null then "" elif .at - now < 86400 then " (→\(.at | strflocaltime("%H:%M")))"
         else " (→\(.at | strflocaltime("%-m/%-d %H:%M")))" end)
    end;
  def line($name; $items): "\($name): " + (if ($items | length) == 0 then "-" else ($items | map(item) | join(" · ")) end);
  {systemMessage: (line("Claude"; $claude) + "\n" + line("Codex"; $codex))}'

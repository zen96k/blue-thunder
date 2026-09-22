#! /usr/bin/env bash
# SessionStart フックで、30日より古い Codex のセッションを削除する
# Claude は cleanupPeriodDays（初期値30日）で自動削除されるが、Codex のセッションは自動では消えない
# usage.sh が直近8日の Codex のログを読むので、8日より短くしないこと
# SessionStart の標準出力は Claude のコンテキストに入るので、何も出力しない

# usage.sh から起動した claude では実行しない
[ -n "${USAGE_HOOK_RUNNING:-}" ] && exit 0

codex_bin=$(command -v codex || echo "$HOME/.local/share/mise/shims/codex")
codex_home=${CODEX_HOME:-$HOME/.codex}
cutoff=$(($(date +%s) - 30 * 86400))

# セッションのログ（アーカイブ済み、圧縮済みの .jsonl.zst も含む）
rollouts() {
  find "$codex_home/sessions" "$codex_home/archived_sessions" -type f \
    \( -name "rollout-*$1*.jsonl" -o -name "rollout-*$1*.jsonl.zst" \) "${@:2}" 2>/dev/null
}

# スレッドごとの最終更新時刻。巻き戻すと1スレッドに「rollout-<時刻>-<スレッドID>_<ID>.jsonl」が増えるので、
# 時刻の直後の UUID をスレッド ID とし、そのスレッドのどのファイルも30日以上更新されていなければ削除する
rollouts '' -printf '%T@ %f\n' \
  | sed -nE 's/^([0-9]+)[.0-9]* rollout-[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}-[0-9]{2}-[0-9]{2}-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}).*/\2 \1/p' \
  | awk '{ if ($2 > latest[$1]) latest[$1] = $2 } END { for (id in latest) print id, latest[id] }' \
  | while read -r id latest; do
      [ "$latest" -lt "$cutoff" ] || continue
      # 削除までの間に再開されていないか、直前にもう一度確かめる
      [ -z "$(rollouts "$id" -newermt "@$cutoff")" ] || continue
      # 公式の削除コマンドを使う（スレッドのすべてのログと、内部データベースの記録が消える）
      "$codex_bin" delete --force "$id" </dev/null >/dev/null 2>&1
    done

exit 0

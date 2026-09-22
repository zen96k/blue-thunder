import { expandConfig } from "@libsql/core/config"
import { mkdirSync } from "node:fs"
import { dirname } from "node:path"

/**
 * 接続先を環境変数から読み、libSQL に渡す形にする。
 * drizzle.config.ts（マイグレーション）と client.ts（実行時）の両方から使う。
 *
 * TURSO_DATABASE_URL が `file:` で始まる場合は開発環境とみなし、
 * 親フォルダーを作ってから返す（libSQL はフォルダーを作らないため）。
 *
 * @returns libSQL の接続設定。TURSO_AUTH_TOKEN が空のときは authToken を含めない
 * @throws TURSO_DATABASE_URL が未設定の場合
 * @throws CI 環境で `file:` の URL が指定された場合（手元のファイルに書いて成功扱いになるのを防ぐ）
 */
export const resolveDatabaseConfig = () => {
  const url = process.env.TURSO_DATABASE_URL
  if (!url) {
    throw new Error("TURSO_DATABASE_URL が設定されていません")
  }

  // libSQL と同じ解釈で URL を読む（大文字の FILE: や %20 などのエンコードも扱える）
  const { scheme, path } = expandConfig({ url }, false)

  if (scheme === "file") {
    // CI で手元のファイルに書いて成功扱いになるのを防ぐ
    if (process.env.CI) {
      throw new Error("CI では file: の TURSO_DATABASE_URL は使えません")
    }
    // libSQL は親フォルダーを作らないので、先に作る
    mkdirSync(dirname(path), { recursive: true })
  }

  const authToken = process.env.TURSO_AUTH_TOKEN
  // 空文字列だと drizzle-kit が「未設定」と判断して失敗するので、その場合は項目ごと省く
  return { url, ...(authToken ? { authToken } : {}) }
}

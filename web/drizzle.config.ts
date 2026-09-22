import { expandConfig } from "@libsql/core/config"
import { defineConfig } from "drizzle-kit"
import { mkdirSync } from "node:fs"
import { dirname } from "node:path"

const url = process.env.TURSO_DATABASE_URL
if (!url) {
  throw new Error("TURSO_DATABASE_URL が設定されていません")
}

// libSQL と同じ解釈で URL を読む（大文字の FILE: や %20 などのエンコードも扱える）
const { scheme, path } = expandConfig({ url }, false)

// 開発環境の SQLite ファイル（file:.data/dev.db など）
if (scheme === "file") {
  // CI で手元のファイルに書いて成功扱いになるのを防ぐ
  if (process.env.CI) {
    throw new Error("CI では file: の TURSO_DATABASE_URL は使えません")
  }
  // libSQL は親フォルダーを作らないので、先に作る
  mkdirSync(dirname(path), { recursive: true })
}

export default defineConfig({
  dialect: "turso",
  schema: "./server/db/schema.ts",
  out: "./server/db/migrations",
  dbCredentials: { url, authToken: process.env.TURSO_AUTH_TOKEN },
})

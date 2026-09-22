import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import { resolveDatabaseConfig } from "./config.ts"

/**
 * データベースに接続する。接続先は TURSO_DATABASE_URL で決まる
 * （本番は Turso の `libsql://`、開発は手元の SQLite ファイル `file:.data/dev.db`）。
 *
 * @returns `client`（使い終わったら `close()` すること）と、クエリを書くための `db`
 * @throws 接続先が設定されていない場合や、CI で `file:` を指定した場合
 *
 * @example
 * ```ts
 * const { client, db } = createDb()
 * try {
 *   await db.select().from(articles)
 * } finally {
 *   client.close()
 * }
 * ```
 */
export const createDb = () => {
  const client = createClient(resolveDatabaseConfig())
  return { client, db: drizzle({ client }) }
}

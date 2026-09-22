import { sql } from "drizzle-orm"
import type { createDb } from "../../db/client.ts"
import { articles } from "../../db/schema.ts"
import type { SaveArticles } from "../core/types.ts"

type Db = ReturnType<typeof createDb>["db"]

/**
 * 記事を articles テーブルに保存する関数を作る。
 *
 * 同じ記事（platform と providerKey が同じ）は上書きする。URL も新しい値に更新する。
 * `created_at` は最初に保存したときの値のままで、
 * `updated_at` は保存のたびに更新される（その記事を最後に見つけた時刻の目安になる）。
 *
 * 記事が 1 件以上あるとき、1 回の呼び出しは 1 つの SQL 文になるので、途中まで保存された状態にはならない。
 * ただし SQLite のパラメーター数には上限があり、1 回に数千件を超えると分割が必要になる。
 * 分割するときは、原子性を保つためにトランザクションで囲むこと。
 *
 * @param db Drizzle のインスタンス
 * @returns core が使う {@link SaveArticles} の形をした関数
 */
export const createSaveArticles = (db: Db): SaveArticles => {
  return async (rows) => {
    if (rows.length === 0) return

    await db
      .insert(articles)
      .values(rows)
      .onConflictDoUpdate({
        // URL は変わりうるので、掲載元での ID で同じ記事かどうかを判定する
        target: [articles.platform, articles.providerKey],
        set: {
          url: sql`excluded.url`,
          title: sql`excluded.title`,
          author: sql`excluded.author`,
          publishedAt: sql`excluded.published_at`,
          updatedAt: new Date(),
        },
      })
  }
}

import { sql } from "drizzle-orm"
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

/** Qiita / Zenn の人気記事 */
export const articles = sqliteTable(
  "articles",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    /** 記事の掲載元 */
    platform: text("platform", { enum: ["qiita", "zenn"] }).notNull(),
    /** 記事の URL（計測用のパラメーターは取り除く）。重複の判定に使う */
    url: text("url").notNull().unique(),
    title: text("title").notNull(),
    /** 作成者のユーザー ID */
    author: text("author").notNull(),
    /** 記事が公開された日時 */
    publishedAt: integer("published_at", { mode: "timestamp" }).notNull(),
    /** この行を作った日時（= この記事を最初に取得した日時） */
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    /** この行を最後に更新した日時（取得のたびに更新する） */
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [index("articles_published_at_idx").on(table.publishedAt)],
)

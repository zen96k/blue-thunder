import { sql } from "drizzle-orm"
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core"

/** Qiita / Zenn の人気記事 */
export const articles = sqliteTable(
  "articles",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    /** 記事の掲載元 */
    platform: text("platform", { enum: ["qiita", "zenn"] }).notNull(),
    /**
     * 掲載元での記事の ID。重複の判定に使う。
     * - Qiita: URL 末尾の 20 桁（ユーザー名を変更しても変わらない）
     * - Zenn: slug（公開後は変更できないと公式に明記されている）
     */
    providerKey: text("provider_key").notNull(),
    /**
     * 記事の URL（計測用のパラメーターは取り除く）。
     * ユーザー名の変更や Publication への移動で変わるため、判定には使わず最新の値を保持する
     */
    url: text("url").notNull(),
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
  (table) => [
    uniqueIndex("articles_platform_provider_key_idx").on(
      table.platform,
      table.providerKey,
    ),
    index("articles_published_at_idx").on(table.publishedAt),
  ],
)

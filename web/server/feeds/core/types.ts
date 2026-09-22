/** 記事の掲載元 */
export type Platform = "qiita" | "zenn"

/**
 * 取得元によらない、記事の形。
 * 保存の都合（主キーや日時の自動設定）は含めず、取得できる情報だけを持つ。
 */
export type Article = {
  platform: Platform
  /**
   * 掲載元での記事の ID。重複の判定に使う。
   * - Qiita: URL 末尾の 20 桁（ユーザー名を変更しても変わらない）
   * - Zenn: slug（公開後は変更できないと公式に明記されている）
   */
  providerKey: string
  /** 記事の URL（計測用のパラメーターは取り除く） */
  url: string
  title: string
  /** 作成者のユーザー ID */
  author: string
  /** 記事が公開された日時 */
  publishedAt: Date
}

/**
 * 記事の取得元。外側（adapters/qiita.ts、adapters/zenn.ts）がこの形に合わせる。
 *
 * @example
 * ```ts
 * export const qiita: Source = { name: "qiita", fetch: async () => [...] }
 * ```
 */
export type Source = {
  /** 取得元の名前。ログの表示と、記事の platform に使う */
  name: Platform
  /**
   * 記事を取得して、共通の形に変換する。
   *
   * @returns 取得できた記事。0件でもよい
   * @throws 取得や解析に失敗した場合。同期・非同期のどちらで投げてもよい
   */
  fetch: () => Promise<Article[]>
}

/**
 * 記事の保存先。外側（adapters/repository.ts）がこの形に合わせる。
 *
 * @param rows 保存する記事。0件の場合は何もしない
 * @throws 保存に失敗した場合
 */
export type SaveArticles = (rows: Article[]) => Promise<void>

/** 取得元ごとの実行結果 */
export type SyncResult = {
  /** 取得元の名前 */
  name: Platform
  /**
   * 結果の種類。
   * - `saved`: 取得も保存も成功した
   * - `fetch-failed`: 取得または解析に失敗した（保存は行っていない）
   * - `save-failed`: 取得はできたが、保存に失敗した
   */
  status: "saved" | "fetch-failed" | "save-failed"
  /** 保存した記事の件数。失敗した場合は 0 */
  count: number
  /** 失敗したときに投げられた値。Error とは限らない */
  error?: unknown
}

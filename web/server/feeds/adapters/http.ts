/** 取得元に対して名乗る名前。問い合わせ先としてリポジトリの URL も入れる */
const USER_AGENT = "blue-thunder (+https://github.com/zen96k/blue-thunder)"

/**
 * すべての取得元で共通して使う ofetch の設定。
 *
 * - `timeout`: 応答がないときに待ち続けないよう 15 秒で打ち切る
 * - `retry` / `retryDelay`: 一時的な失敗のために 1 秒あけて 2 回まで再試行する
 *   （最悪の場合、1 つの取得元に約 3 回 × 15 秒かかる）
 */
export const FETCH_OPTIONS = {
  headers: { "user-agent": USER_AGENT },
  timeout: 15_000,
  retry: 2,
  retryDelay: 1_000,
} as const

/**
 * 記事の URL から、クエリとフラグメントを取り除く。
 *
 * articles テーブルは URL で重複を判定するため、Qiita のフィードに付く計測用のパラメーター
 * （`?utm_campaign=popular_items` など）が残っていると、同じ記事が別の行として保存されてしまう。
 *
 * @param url 取得元から受け取った URL
 * @returns クエリとフラグメントを取り除いた URL
 *
 * @example
 * ```ts
 * normalizeUrl("https://qiita.com/u/items/a?utm_source=feed")
 * // => "https://qiita.com/u/items/a"
 * ```
 */
export const normalizeUrl = (url: string) => {
  const parsed = new URL(url)
  parsed.search = ""
  parsed.hash = ""
  return parsed.toString()
}

/**
 * 記事の URL から、掲載元での記事の ID を取り出す。
 *
 * Qiita は `https://qiita.com/{ユーザー}/items/{ID}`、
 * Zenn は `https://zenn.dev/{ユーザーまたは Publication}/articles/{slug}` の形。
 * ユーザー名の変更や Publication への移動で URL の前半は変わるが、この部分は変わらない。
 *
 * 想定した形以外は、誤った値を ID として保存しないように例外にする
 * （`/items/` で終わる URL やコメントへのリンクなどを取り違えないため）。
 *
 * @param url 正規化済みの記事の URL
 * @param expected 期待するホスト名と、URL の 2 番目の部分（`items` / `articles`）
 * @returns 掲載元での記事の ID（パーセントエンコードは元に戻す）
 * @throws ホスト名や形が想定と違う場合
 *
 * @example
 * ```ts
 * extractProviderKey("https://qiita.com/u/items/ed4c760f616cf3c0a958", {
 *   host: "qiita.com",
 *   collection: "items",
 * }) // => "ed4c760f616cf3c0a958"
 * ```
 */
export const extractProviderKey = (
  url: string,
  expected: { host: string; collection: string },
) => {
  const { hostname, pathname } = new URL(url)
  // /{ユーザーまたは Publication}/{items|articles}/{ID} だけを受け付ける。
  // 空の部分や末尾のスラッシュも弾くため、分割ではなく全体の形で判定する
  const pattern = new RegExp(`^/([^/]+)/${expected.collection}/([^/]+)$`)
  const matched = pattern.exec(pathname)

  if (hostname !== expected.host || !matched) {
    throw new Error(`想定しない形式の URL です: ${url}`)
  }

  const key = decodeURIComponent(matched[2]!)
  // %2F のようにデコードで区切り文字が現れる場合も弾く
  if (!/^[\w.-]+$/.test(key)) {
    throw new Error(`記事の ID として扱えません: ${url}`)
  }

  return key
}

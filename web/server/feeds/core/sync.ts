import type { Article, SaveArticles, Source, SyncResult } from "./types.ts"

/** 取得元1つ分の取得結果。取得元の名前と結果を組にして、後の処理で取り違えないようにする */
type Fetched =
  | { ok: true; name: Source["name"]; articles: Article[] }
  | { ok: false; name: Source["name"]; error: unknown }

/**
 * 1つの取得元から記事を取得する。失敗しても投げ返さず、結果として返す。
 *
 * `fetch()` の呼び出しと await を try/catch で囲むので、同期的に投げた例外も Promise の拒否も
 * ここで受け止められる。取得元を増やしたときに、失敗が他の取得元へ波及しないようにするため。
 *
 * @param source 取得元
 * @returns 成功なら `{ ok: true, articles }`、失敗なら `{ ok: false, error }`
 */
const fetchSource = async (source: Source): Promise<Fetched> => {
  try {
    return { ok: true, name: source.name, articles: await source.fetch() }
  } catch (error) {
    return { ok: false, name: source.name, error }
  }
}

/**
 * 取得元から記事を集めて保存する。
 *
 * 取得はすべての取得元を並行して行い、保存は取得元ごとに順番に行う。
 * 取得も保存も取得元ごとに独立しているので、片方が失敗しても、もう片方は最後まで進む。
 * 外部とのやり取り（HTTP、DB）は引数で受け取るため、この関数は HTTP にも DB にも依存しない。
 * そのため、偽の取得元と保存先を渡せば、ネットワークにも DB にもつながずにテストできる。
 *
 * 失敗は例外として投げず、戻り値に含める。表示と終了コードの決定は呼び出し側の責務。
 *
 * @param sources 取得元の一覧
 * @param save 記事の保存先。取得に成功した取得元ごとに1回ずつ呼ばれる（記事が0件でも呼ぶ）
 * @returns 取得元ごとの結果。並び順は `sources` と同じ
 *
 * @example
 * ```ts
 * const results = await syncArticles([qiita, zenn], createSaveArticles(db))
 * // => [{ name: "qiita", status: "saved", count: 30 }, ...]
 * ```
 */
export const syncArticles = async (
  sources: Source[],
  save: SaveArticles,
): Promise<SyncResult[]> => {
  const fetched = await Promise.all(
    sources.map((source) => fetchSource(source)),
  )
  const results: SyncResult[] = []

  for (const item of fetched) {
    if (!item.ok) {
      results.push({
        name: item.name,
        status: "fetch-failed",
        count: 0,
        error: item.error,
      })
      continue
    }

    try {
      await save(item.articles)
      results.push({
        name: item.name,
        status: "saved",
        count: item.articles.length,
      })
    } catch (error) {
      results.push({ name: item.name, status: "save-failed", count: 0, error })
    }
  }

  return results
}

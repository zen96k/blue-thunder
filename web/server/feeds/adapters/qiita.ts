import { parseFeed } from "@rowanmanning/feed-parser"
import { ofetch } from "ofetch"
import type { Article, Source } from "../core/types.ts"
import { extractProviderKey, FETCH_OPTIONS, normalizeUrl } from "./http.ts"

const FEED_URL = "https://qiita.com/popular-items/feed"
const HOST_AND_COLLECTION = { host: "qiita.com", collection: "items" }

/**
 * Qiita の人気記事を取得する取得元（Atom フィード）。
 *
 * 1 回で取れるのは最新の 30 件程度で、過去の記事はさかのぼれない。
 * 項目が欠けている記事は、その 1 件だけを飛ばす（取得元ごと失敗にはしない）。
 * 記事の URL には計測用のパラメーターが付くので、normalizeUrl で取り除く。
 */
export const qiita: Source = {
  name: "qiita",
  fetch: async (): Promise<Article[]> => {
    const xml = await ofetch<string, "text">(FEED_URL, {
      ...FETCH_OPTIONS,
      responseType: "text",
    })

    return parseFeed(xml).items.flatMap((item) => {
      const author = item.authors[0]?.name
      if (!item.url || !item.title || !author || !item.published) {
        console.warn(`qiita: 項目が足りないので飛ばす: ${item.url ?? item.id}`)
        return []
      }
      const url = normalizeUrl(item.url)
      const providerKey = extractProviderKey(url, HOST_AND_COLLECTION)
      return {
        platform: "qiita",
        providerKey,
        url,
        title: item.title,
        author,
        publishedAt: item.published,
      }
    })
  },
}

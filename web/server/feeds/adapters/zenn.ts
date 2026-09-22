import { ofetch } from "ofetch"
import { z } from "zod"
import type { Article, Source } from "../core/types.ts"
import { extractProviderKey, FETCH_OPTIONS, normalizeUrl } from "./http.ts"

const API_URL = "https://zenn.dev/api/articles?order=trending"
const HOST_AND_COLLECTION = { host: "zenn.dev", collection: "articles" }

/**
 * 応答の形を確かめるための定義。
 *
 * Zenn には公開された API がないため、サイトが内部で使っている API を読んでいる。
 * 予告なく形が変わりうるので、保存する前に検証して、違っていればこの取得元だけを失敗させる。
 */
const response = z.object({
  articles: z.array(
    z.object({
      path: z.string(),
      title: z.string(),
      published_at: z.iso.datetime({ offset: true }),
      user: z.object({ username: z.string() }),
    }),
  ),
})

/**
 * Zenn のトレンド記事を取得する取得元（JSON）。
 *
 * 1 回で取れるのは 48 件程度。RSS（20 件）と違い、作成者のユーザー ID を取得できる。
 * Publication の記事は URL の先頭が Publication 名になるため、URL からは作成者を判断できない。
 */
export const zenn: Source = {
  name: "zenn",
  fetch: async (): Promise<Article[]> => {
    const json = await ofetch(API_URL, FETCH_OPTIONS)

    return response.parse(json).articles.map((article) => {
      const url = normalizeUrl(
        new URL(article.path, "https://zenn.dev").toString(),
      )
      return {
        platform: "zenn",
        providerKey: extractProviderKey(url, HOST_AND_COLLECTION),
        url,
        title: article.title,
        author: article.user.username,
        publishedAt: new Date(article.published_at),
      }
    })
  },
}

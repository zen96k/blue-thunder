/**
 * Qiita と Zenn の人気記事を取得して保存する（GitHub Actions から 1 時間ごとに実行する想定。ワークフローは未実装）。
 *
 * 実際の取得元（adapters）と保存先（repository）を、ここで組み合わせる。
 * 取得元ごとの結果を表示し、1 つでも失敗していれば終了コード 1 で終わる。
 *
 * 使い方: web/ で `node --env-file-if-exists=.env server/scripts/fetch-feeds.ts`
 */
import { createDb } from "../db/client.ts"
import { qiita } from "../feeds/adapters/qiita.ts"
import { createSaveArticles } from "../feeds/adapters/repository.ts"
import { zenn } from "../feeds/adapters/zenn.ts"
import { syncArticles } from "../feeds/core/sync.ts"

const { client, db } = createDb()

try {
  const results = await syncArticles([qiita, zenn], createSaveArticles(db))

  for (const result of results) {
    switch (result.status) {
      case "saved":
        console.log(`${result.name}: ${result.count} 件を保存しました`)
        break
      case "fetch-failed":
        console.error(`${result.name}: 取得に失敗しました`, result.error)
        break
      case "save-failed":
        console.error(`${result.name}: 保存に失敗しました`, result.error)
        break
    }
  }

  if (results.some((result) => result.status !== "saved")) {
    process.exitCode = 1
  }
} finally {
  client.close()
}

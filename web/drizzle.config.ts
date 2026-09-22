import { defineConfig } from "drizzle-kit"
import { resolveDatabaseConfig } from "./server/db/config.ts"

export default defineConfig({
  dialect: "turso",
  schema: "./server/db/schema.ts",
  out: "./server/db/migrations",
  dbCredentials: resolveDatabaseConfig(),
})

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/eslint"],
  // Nitro は Node.js 24 以降でビルドしても Vercel の関数を nodejs22.x にするので、明示する
  nitro: { vercel: { functions: { runtime: "nodejs24.x" } } },
})

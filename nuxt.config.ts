// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  css: ["~/assets/css/globals.css"],
  modules: ["@nuxtjs/tailwindcss"],
  tailwindcss: {
    configPath: "tailwind.config.ts",
  },
  nitro: {
    storage: {
      kv: {
        driver: "memory",
      },
    },
  },
  runtimeConfig: {
    mongodbUri: process.env.MONGODB_URI || "",
    r2Endpoint: process.env.R2_ENDPOINT || "",
    r2AccessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    r2BucketName: process.env.R2_BUCKET_NAME || "",
    r2PublicUrl: process.env.R2_PUBLIC_URL || "",
  },
})

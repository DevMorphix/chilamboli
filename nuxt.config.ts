export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  css: ["~/assets/css/globals.css"],
  modules: ["@nuxtjs/tailwindcss"],
  tailwindcss: {
    configPath: "tailwind.config.ts",
  },
  runtimeConfig: {
    mongodbUri: process.env.MONGODB_URI || "",
  },
})

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vuetify({ autoImport: true })],
  server: {
    // Honour a PORT env var when one is provided (e.g. by tooling), otherwise
    // fall back to Vite's default.
    port: process.env.PORT ? Number(process.env.PORT) : undefined,
  },
})

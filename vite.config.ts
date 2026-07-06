import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vuetify({ autoImport: true })],
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : undefined,
  },
  optimizeDeps: {
    include: [
      'vuetify/components/VApp',
      'vuetify/components/VMain',
      'vuetify/components/VSnackbar',
      'vuetify/components/VAppBar',
      'vuetify/components/VIcon',
      'vuetify/components/VChip',
      'vuetify/components/VBtn',
      'vuetify/components/VDivider',
      'vuetify/components/VMenu',
      'vuetify/components/VList',
      'vuetify/components/VCard',
      'vuetify/components/VBottomNavigation',
      'vuetify/components/VImg',
      'vuetify/components/transitions',
      'vuetify/components/VSelect',
      'vuetify/components/VTextField',
      'vuetify/components/VTextarea',
      'vuetify/components/VSlider',
      'cropperjs',
    ],
  },
})

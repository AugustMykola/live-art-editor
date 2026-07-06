<script setup lang="ts">
import { useUiStore } from './stores/ui'
import AppToolbar from './components/AppToolbar.vue'

const ui = useUiStore()
</script>

<template>
  <v-app>
    <AppToolbar />
    <v-main>
      <router-view />
    </v-main>

    <v-snackbar
      :model-value="!!ui.toast"
      :color="ui.toast?.color"
      timeout="4000"
      @update:model-value="ui.dismissToast()"
    >
      {{ ui.toast?.message }}
    </v-snackbar>
  </v-app>
</template>

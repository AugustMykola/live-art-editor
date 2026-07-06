<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useUiStore } from '../stores/ui'

const ui = useUiStore()
const isFullscreen = ref(false)

function syncFullscreen() {
  isFullscreen.value = document.fullscreenElement !== null
}
onMounted(() => document.addEventListener('fullscreenchange', syncFullscreen))
onBeforeUnmount(() => document.removeEventListener('fullscreenchange', syncFullscreen))

async function toggleFullscreen(event: MouseEvent) {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
      return
    }
    const area = (event.currentTarget as HTMLElement).closest('.editor-desktop__canvas, .editor-mobile__canvas')
    await (area as HTMLElement | null)?.requestFullscreen?.()
  } catch {
    return
  }
}
</script>

<template>
  <div class="canvas-zoom-bar d-flex align-center justify-center ga-1 pa-1">
    <v-btn icon="mdi-minus" size="small" variant="text" @click="ui.zoomOut()" />
    <span class="text-caption zoom-label">{{ Math.round(ui.zoom * 100) }}%</span>
    <v-btn icon="mdi-plus" size="small" variant="text" @click="ui.zoomIn()" />
    <v-btn size="small" variant="text" class="text-caption" @click="ui.zoomToFit()">Fit</v-btn>
    <v-btn
      :icon="isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
      size="small"
      variant="text"
      @click="toggleFullscreen"
    />
  </div>
</template>

<style scoped>
.canvas-zoom-bar {
  border-radius: 20px;
  background-color: rgba(var(--v-theme-surface), 0.9);
  width: fit-content;
  margin-inline: auto;
}
.zoom-label {
  min-width: 42px;
  text-align: center;
}
</style>

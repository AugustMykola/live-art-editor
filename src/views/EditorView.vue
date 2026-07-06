<script setup lang="ts">
import { useDisplay } from 'vuetify'
import { useUiStore } from '../stores/ui'
import ImageCanvas from '../components/ImageCanvas.vue'
import CanvasZoomBar from '../components/CanvasZoomBar.vue'
import SettingsPanel from '../components/SettingsPanel.vue'
import OperationsStrip from '../components/OperationsStrip.vue'
import MobileBottomNav from '../components/MobileBottomNav.vue'
import DocumentActionButtons from '../components/DocumentActionButtons.vue'

const ui = useUiStore()
const { mdAndUp } = useDisplay()
</script>

<template>
  <div v-if="mdAndUp" class="editor-desktop">
    <div class="editor-desktop__center">
      <div class="editor-desktop__canvas">
        <ImageCanvas />
        <CanvasZoomBar class="editor-desktop__zoom" />
      </div>
      <OperationsStrip />
    </div>
    <SettingsPanel class="editor-desktop__panel" />
  </div>

  <div v-else class="editor-mobile">
    <div class="editor-mobile__canvas">
      <ImageCanvas />
      <CanvasZoomBar class="editor-mobile__zoom" />
    </div>

    <v-expand-transition>
      <div v-if="ui.mobilePanel" class="editor-mobile__sheet">
        <div v-if="ui.mobilePanel === 'tools'">
          <SettingsPanel />
        </div>
        <OperationsStrip v-else-if="ui.mobilePanel === 'operations'" />
        <div v-else-if="ui.mobilePanel === 'export'" class="pa-4">
          <DocumentActionButtons layout="stack" />
        </div>
      </div>
    </v-expand-transition>

    <MobileBottomNav />
  </div>
</template>

<style scoped>
.editor-desktop {
  display: flex;
  height: 100%;
}
.editor-desktop__center {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.editor-desktop__canvas {
  flex: 1;
  position: relative;
  min-height: 0;
}
.editor-desktop__zoom {
  position: absolute;
  left: 50%;
  bottom: 16px;
  transform: translateX(-50%);
}
.editor-desktop__panel {
  width: 320px;
  flex-shrink: 0;
  border-left: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  overflow-y: auto;
}

.editor-mobile {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.editor-mobile__canvas {
  flex: 1;
  position: relative;
  min-height: 0;
}
.editor-mobile__zoom {
  position: absolute;
  left: 50%;
  bottom: 12px;
  transform: translateX(-50%);
}
.editor-mobile__sheet {
  max-height: 45vh;
  overflow-y: auto;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>

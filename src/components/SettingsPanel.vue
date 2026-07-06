<script setup lang="ts">
import { computed, defineAsyncComponent, type Component } from 'vue'
import { useUiStore } from '../stores/ui'
import { useEditorStore } from '../stores/editor'
import { TOOLS, PANEL_TOOL_IDS, type ToolId } from '../types/tool'
import ComingSoonPanel from './tools/ComingSoonPanel.vue'

const CropPanel = defineAsyncComponent(() => import('./tools/CropPanel.vue'))
const RotatePanel = defineAsyncComponent(() => import('./tools/RotatePanel.vue'))
const FlipPanel = defineAsyncComponent(() => import('./tools/FlipPanel.vue'))
const AdjustPanel = defineAsyncComponent(() => import('./tools/AdjustPanel.vue'))
const FilterPanel = defineAsyncComponent(() => import('./tools/FilterPanel.vue'))
const TextPanel = defineAsyncComponent(() => import('./tools/TextPanel.vue'))
const LocalAreaPanel = defineAsyncComponent(() => import('./tools/LocalAreaPanel.vue'))

const ui = useUiStore()
const editor = useEditorStore()

const panelTools = computed(() => TOOLS.filter((tool) => PANEL_TOOL_IDS.includes(tool.id)))

const PANEL_COMPONENTS: Partial<Record<ToolId, Component>> = {
  crop: CropPanel,
  rotate: RotatePanel,
  flip: FlipPanel,
  adjust: AdjustPanel,
  filter: FilterPanel,
  text: TextPanel,
  'local-area': LocalAreaPanel,
}

function panelComponent(id: ToolId): Component {
  return PANEL_COMPONENTS[id] ?? ComingSoonPanel
}

const activeTool = computed<ToolId | null>(() =>
  ui.activeTool && panelTools.value.some((tool) => tool.id === ui.activeTool) ? ui.activeTool : null,
)

const activeToolLabel = computed(() => panelTools.value.find((tool) => tool.id === activeTool.value)?.label ?? '')

function selectTool(id: ToolId) {
  if (!editor.hasImage) return
  ui.setActiveTool(id)
}
</script>

<template>
  <div class="settings-panel d-flex flex-column fill-height">
    <div class="tool-tabs d-flex">
      <button
        v-for="tool in panelTools"
        :key="tool.id"
        type="button"
        class="tool-tab"
        :class="{ 'tool-tab--active': activeTool === tool.id }"
        :disabled="!editor.hasImage"
        @click="selectTool(tool.id)"
      >
        <v-icon :icon="tool.icon" size="20" />
        <span class="tool-tab__label">{{ tool.label }}</span>
      </button>
    </div>

    <v-divider />

    <div class="flex-grow-1 overflow-y-auto pa-4">
      <component :is="panelComponent(activeTool)" v-if="activeTool" :label="activeToolLabel" />
      <div v-else class="tool-empty text-body-2 text-medium-emphasis text-center">
        <v-icon icon="mdi-gesture-tap-button" size="34" class="mb-3" />
        <div>Pick a tool above to start editing.</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-tabs {
  flex-shrink: 0;
}
.tool-tab {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 10px 2px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  color: rgba(var(--v-theme-on-surface), 0.65);
  transition: color 0.15s, border-color 0.15s, background-color 0.15s;
}
.tool-tab:hover:not(:disabled) {
  background: rgba(var(--v-theme-on-surface), 0.05);
  color: rgba(var(--v-theme-on-surface), 0.9);
}
.tool-tab:disabled {
  opacity: 0.4;
  cursor: default;
}
.tool-tab--active {
  color: rgb(var(--v-theme-primary));
  border-bottom-color: rgb(var(--v-theme-primary));
}
.tool-tab__label {
  font-size: 11px;
  line-height: 1.1;
  text-align: center;
}
.tool-empty {
  padding-top: 48px;
}
</style>

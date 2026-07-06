<script setup lang="ts">
import { useUiStore } from '../stores/ui'

type PanelTab = 'tools' | 'operations' | 'export'

const ui = useUiStore()

const items: { panel: PanelTab; label: string; icon: string }[] = [
  { panel: 'tools', label: 'Tools', icon: 'mdi-wrench-outline' },
  { panel: 'operations', label: 'Operations', icon: 'mdi-format-list-bulleted' },
  { panel: 'export', label: 'Export', icon: 'mdi-export-variant' },
]
</script>

<template>
  <v-bottom-navigation :model-value="ui.mobilePanel ?? undefined" grow height="60">
    <v-btn
      v-for="item in items"
      :key="item.panel"
      :value="item.panel"
      :active="ui.mobilePanel === item.panel"
      @click="ui.openMobilePanel(item.panel)"
    >
      <v-icon :icon="item.icon" />
      <span class="text-caption">{{ item.label }}</span>
    </v-btn>
  </v-bottom-navigation>
</template>

<script setup lang="ts">
import { useEditorStore } from '../stores/editor'
import { useEditDocumentActions } from '../composables/useEditDocumentActions'
import JsonFormatHelp from './JsonFormatHelp.vue'

withDefaults(defineProps<{ layout?: 'row' | 'stack' }>(), { layout: 'stack' })

const editor = useEditorStore()
const { importInputRef, handleExportPng, handleExportJson, openImportPicker, handleImportJsonChange } =
  useEditDocumentActions()
void importInputRef
</script>

<template>
  <div :class="layout === 'row' ? 'd-flex align-center ga-2' : 'd-flex flex-column ga-2'">
    <v-btn
      :block="layout === 'stack'"
      color="primary"
      prepend-icon="mdi-image-outline"
      :disabled="!editor.hasImage"
      @click="handleExportPng"
    >
      Export PNG
    </v-btn>
    <v-btn
      :block="layout === 'stack'"
      variant="outlined"
      prepend-icon="mdi-code-json"
      :disabled="!editor.hasImage"
      @click="handleExportJson"
    >
      Export JSON
    </v-btn>
    <div class="d-flex align-center ga-1">
      <v-btn
        :class="{ 'flex-grow-1': layout === 'stack' }"
        variant="text"
        prepend-icon="mdi-tray-arrow-down"
        @click="openImportPicker"
      >
        Import JSON
      </v-btn>
      <JsonFormatHelp />
    </div>
    <input
      ref="importInputRef"
      type="file"
      accept="application/json,.json"
      class="d-none"
      @change="handleImportJsonChange"
    />
  </div>
</template>

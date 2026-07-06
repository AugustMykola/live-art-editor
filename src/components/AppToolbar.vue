<script setup lang="ts">
import { useDisplay } from 'vuetify'
import { useEditorStore } from '../stores/editor'
import { useUiStore } from '../stores/ui'
import { useImagePicker } from '../composables/useImagePicker'
import { useEditDocumentActions } from '../composables/useEditDocumentActions'
import DocumentActionButtons from './DocumentActionButtons.vue'

const editor = useEditorStore()
const ui = useUiStore()
const { mdAndUp } = useDisplay()
const { inputRef, openPicker, handleChange } = useImagePicker(async (file) => {
  try {
    await editor.loadImage(file)
  } catch (err) {
    ui.notify(err instanceof Error ? err.message : 'Could not load this image.', 'error')
  }
})
void inputRef
const { importInputRef, handleExportPng, handleExportJson, openImportPicker, handleImportJsonChange } =
  useEditDocumentActions()
void importInputRef
</script>

<template>
  <v-app-bar flat density="comfortable">
    <v-app-bar-title class="d-flex align-center">
      <v-icon icon="mdi-image-edit-outline" class="mr-2" />
      Live Art Editor
      <v-chip
        v-if="mdAndUp"
        size="small"
        variant="tonal"
        color="success"
        class="ml-3"
        prepend-icon="mdi-circle-medium"
      >
        Non-destructive editing
      </v-chip>
    </v-app-bar-title>

    <template v-if="editor.hasImage">
      <v-btn icon="mdi-undo" variant="text" :disabled="!editor.canUndo" @click="editor.undo()" />
      <v-btn icon="mdi-redo" variant="text" :disabled="!editor.canRedo" @click="editor.redo()" />

      <template v-if="mdAndUp">
        <v-divider vertical class="mx-2" />

        <v-btn
          :prepend-icon="ui.showOriginal ? 'mdi-eye' : 'mdi-eye-outline'"
          variant="text"
          @click="ui.toggleOriginal()"
        >
          Original
        </v-btn>
        <v-btn prepend-icon="mdi-restore" variant="text" :disabled="!editor.ops.length" @click="editor.reset()">
          Reset
        </v-btn>

        <v-divider vertical class="mx-2" />

        <DocumentActionButtons layout="row" />
      </template>

      <v-menu>
        <template #activator="{ props: menuProps }">
          <v-btn icon="mdi-dots-vertical" variant="text" v-bind="menuProps" class="ml-1" />
        </template>
        <v-list density="compact">
          <v-list-item prepend-icon="mdi-folder-open-outline" title="Replace image" @click="openPicker" />
          <template v-if="!mdAndUp">
            <v-list-item prepend-icon="mdi-tray-arrow-down" title="Import JSON" @click="openImportPicker" />
            <v-list-item
              :prepend-icon="ui.showOriginal ? 'mdi-eye' : 'mdi-eye-outline'"
              title="Toggle original"
              @click="ui.toggleOriginal()"
            />
            <v-list-item
              prepend-icon="mdi-restore"
              title="Reset"
              :disabled="!editor.ops.length"
              @click="editor.reset()"
            />
            <v-list-item prepend-icon="mdi-image-outline" title="Export PNG" @click="handleExportPng" />
            <v-list-item prepend-icon="mdi-code-json" title="Export JSON" @click="handleExportJson" />
          </template>
        </v-list>
      </v-menu>
      <input ref="inputRef" type="file" accept="image/*" class="d-none" @change="handleChange" />
      <input
        ref="importInputRef"
        type="file"
        accept="application/json,.json"
        class="d-none"
        @change="handleImportJsonChange"
      />
    </template>
  </v-app-bar>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useEditorStore } from '../stores/editor'
import { useUiStore } from '../stores/ui'
import { useImagePicker } from '../composables/useImagePicker'
import { useEditDocumentActions } from '../composables/useEditDocumentActions'
import JsonFormatHelp from '../components/JsonFormatHelp.vue'

const router = useRouter()
const editor = useEditorStore()
const ui = useUiStore()
const dragOver = ref(false)

async function loadImageSafely(file: File) {
  try {
    await editor.loadImage(file)
  } catch (err) {
    ui.notify(err instanceof Error ? err.message : 'Could not load this image.', 'error')
  }
}

const { inputRef, openPicker, handleChange } = useImagePicker(loadImageSafely)
void inputRef
const { importInputRef, openImportPicker, handleImportJsonChange, importJsonFile } = useEditDocumentActions()
void importInputRef

watch(
  () => editor.hasImage,
  (hasImage) => {
    if (hasImage) router.replace({ name: 'editor' })
  },
  { immediate: true },
)

function onDrop(event: DragEvent) {
  dragOver.value = false
  const file = event.dataTransfer?.files?.[0]
  if (!file) return
  if (file.type.startsWith('image/')) void loadImageSafely(file)
  else if (file.type === 'application/json' || file.name.endsWith('.json')) void importJsonFile(file)
}
</script>

<template>
  <div class="home-view">
    <div
      class="empty-state d-flex flex-column align-center justify-center"
      :class="{ 'drag-over': dragOver }"
      @dragover.prevent="dragOver = true"
      @dragleave.prevent="dragOver = false"
      @drop.prevent="onDrop"
    >
      <v-icon icon="mdi-image-plus" size="72" class="mb-4" color="primary" />
      <h2 class="text-h5 mb-2 text-center">Drop an image or project here</h2>
      <p class="text-medium-emphasis mb-6 text-center">or choose a file from your computer</p>
      <div class="home-actions d-flex flex-wrap align-center justify-center ga-2">
        <v-btn color="primary" prepend-icon="mdi-folder-open" @click="openPicker">Open image</v-btn>
        <div class="d-flex align-center ga-1">
          <v-btn variant="outlined" prepend-icon="mdi-code-json" @click="openImportPicker">Open project (JSON)</v-btn>
          <JsonFormatHelp />
        </div>
      </div>
      <input ref="inputRef" type="file" accept="image/*" class="d-none" @change="handleChange" />
      <input
        ref="importInputRef"
        type="file"
        accept="application/json,.json"
        class="d-none"
        @change="handleImportJsonChange"
      />
    </div>
  </div>
</template>

<style scoped>
.home-view {
  height: 100%;
  padding: 24px;
  box-sizing: border-box;
}
.empty-state {
  height: 100%;
  padding: 16px;
  border: 2px dashed rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
  transition: border-color 0.2s, background-color 0.2s;
}
.empty-state.drag-over {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.06);
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '../../stores/editor'
import type { TextAlign, TextFontFamily, TextOp } from '../../types/edit'

const editor = useEditorStore()

const op = computed<TextOp | null>(() => {
  const found = editor.ops.find((candidate) => candidate.id === editor.selectedOpId)
  return found?.type === 'text' ? found : null
})

const FONT_FAMILIES: { value: TextFontFamily; label: string }[] = [
  { value: 'sans-serif', label: 'Sans-serif' },
  { value: 'serif', label: 'Serif' },
  { value: 'monospace', label: 'Monospace' },
  { value: 'cursive', label: 'Cursive' },
]

const ALIGNMENTS: { value: TextAlign; icon: string }[] = [
  { value: 'left', icon: 'mdi-format-align-left' },
  { value: 'center', icon: 'mdi-format-align-center' },
  { value: 'right', icon: 'mdi-format-align-right' },
]

const FONT_SIZE_PRESETS = [12, 18, 24, 36, 48, 72]

function patch(patchValue: Partial<TextOp>) {
  if (!op.value) return
  editor.patchOpLive(op.value.id, patchValue)
}

function commit(patchValue: Partial<TextOp>) {
  if (!op.value) return
  editor.updateOp(op.value.id, patchValue)
}

function beginSession() {
  editor.beginDrag()
}

function endSession() {
  editor.endDrag()
}
</script>

<template>
  <div v-if="op" class="d-flex flex-column ga-4">
    <v-textarea
      :model-value="op.text"
      label="Text"
      rows="2"
      auto-grow
      density="compact"
      variant="outlined"
      hide-details
      @focus="beginSession"
      @update:model-value="patch({ text: $event })"
      @blur="endSession"
    />

    <div>
      <div class="text-caption text-medium-emphasis mb-1">Font size</div>
      <v-text-field
        :model-value="op.fontSize"
        type="number"
        density="compact"
        variant="outlined"
        hide-details
        suffix="px"
        min="1"
        @focus="beginSession"
        @update:model-value="patch({ fontSize: Number($event) })"
        @blur="endSession"
      />
      <div class="d-flex flex-wrap ga-2 mt-2">
        <v-btn
          v-for="preset in FONT_SIZE_PRESETS"
          :key="preset"
          size="small"
          :variant="op.fontSize === preset ? 'tonal' : 'outlined'"
          :color="op.fontSize === preset ? 'primary' : undefined"
          @click="commit({ fontSize: preset })"
        >
          {{ preset }}
        </v-btn>
      </div>
    </div>

    <div class="d-flex align-center ga-3">
      <span class="text-caption text-medium-emphasis">Color</span>
      <input
        type="color"
        :value="op.color"
        class="color-input"
        @focus="beginSession"
        @input="patch({ color: ($event.target as HTMLInputElement).value })"
        @change="endSession"
      />
    </div>

    <div>
      <div class="text-caption text-medium-emphasis mb-1">Font</div>
      <v-select
        :model-value="op.fontFamily"
        :items="FONT_FAMILIES"
        item-title="label"
        item-value="value"
        density="compact"
        variant="outlined"
        hide-details
        @update:model-value="commit({ fontFamily: $event })"
      />
    </div>

    <div class="d-flex ga-2">
      <v-btn
        v-for="alignment in ALIGNMENTS"
        :key="alignment.value"
        :icon="alignment.icon"
        size="small"
        :variant="op.align === alignment.value ? 'tonal' : 'text'"
        :color="op.align === alignment.value ? 'primary' : undefined"
        @click="commit({ align: alignment.value })"
      />
      <v-btn
        icon="mdi-format-bold"
        size="small"
        :variant="op.bold ? 'tonal' : 'text'"
        :color="op.bold ? 'primary' : undefined"
        @click="commit({ bold: !op.bold })"
      />
      <v-btn
        icon="mdi-format-italic"
        size="small"
        :variant="op.italic ? 'tonal' : 'text'"
        :color="op.italic ? 'primary' : undefined"
        @click="commit({ italic: !op.italic })"
      />
    </div>

    <div>
      <div class="text-caption text-medium-emphasis mb-1">Position</div>
      <div class="d-flex ga-2">
        <v-text-field
          :model-value="Math.round(op.x)"
          label="X"
          type="number"
          density="compact"
          variant="outlined"
          hide-details
          suffix="px"
          @focus="beginSession"
          @update:model-value="patch({ x: Number($event) })"
          @blur="endSession"
        />
        <v-text-field
          :model-value="Math.round(op.y)"
          label="Y"
          type="number"
          density="compact"
          variant="outlined"
          hide-details
          suffix="px"
          @focus="beginSession"
          @update:model-value="patch({ y: Number($event) })"
          @blur="endSession"
        />
      </div>
      <div class="text-caption text-medium-emphasis mt-2">Tip: drag the text directly on the image to move it.</div>
    </div>
  </div>

  <div v-else class="text-body-2 text-medium-emphasis">
    Add a Text operation to add a caption overlay.
  </div>
</template>

<style scoped>
.color-input {
  width: 36px;
  height: 32px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
}
</style>

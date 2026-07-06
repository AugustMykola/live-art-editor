<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '../../stores/editor'
import { Tone, type AdjustOp } from '../../types/edit'
import ToneSliders from './ToneSliders.vue'

type AdjustField = 'brightness' | 'contrast' | 'saturation'

const editor = useEditorStore()

const op = computed<AdjustOp | null>(() => {
  const found = editor.ops.find((candidate) => candidate.id === editor.selectedOpId)
  return found?.type === 'adjust' ? found : null
})

function update(field: AdjustField, value: number) {
  if (!op.value) return
  editor.patchOpLive(op.value.id, { [field]: value })
}

function beginDrag() {
  editor.beginDrag()
}

function endDrag() {
  editor.endDrag()
}

function reset() {
  if (!op.value) return
  editor.updateOp(op.value.id, { brightness: Tone.Neutral, contrast: Tone.Neutral, saturation: Tone.Neutral })
}
</script>

<template>
  <div v-if="op" class="d-flex flex-column ga-4">
    <ToneSliders
      :brightness="op.brightness"
      :contrast="op.contrast"
      :saturation="op.saturation"
      @patch="update"
      @start="beginDrag"
      @end="endDrag"
    />

    <v-btn variant="text" size="small" prepend-icon="mdi-restore" @click="reset">Reset adjustments</v-btn>
  </div>

  <div v-else class="text-body-2 text-medium-emphasis">
    Add an Adjust operation to change brightness, contrast, and saturation.
  </div>
</template>

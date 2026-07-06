<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '../../stores/editor'
import type { RotateOp } from '../../types/edit'

const editor = useEditorStore()

const op = computed<RotateOp | null>(() => {
  const found = editor.ops.find((candidate) => candidate.id === editor.selectedOpId)
  return found?.type === 'rotate' ? found : null
})

function rotateBy(delta: number) {
  if (!op.value) return
  const next = ((op.value.degrees + delta) % 360 + 360) % 360
  editor.updateOp(op.value.id, { degrees: next })
}

function reset() {
  if (!op.value) return
  editor.updateOp(op.value.id, { degrees: 0 })
}
</script>

<template>
  <div v-if="op" class="d-flex flex-column ga-2">
    <v-btn variant="tonal" prepend-icon="mdi-rotate-left" block @click="rotateBy(-90)">Rotate left</v-btn>
    <v-btn variant="tonal" prepend-icon="mdi-rotate-right" block @click="rotateBy(90)">Rotate right</v-btn>

    <div class="text-center text-body-2 text-medium-emphasis mt-2">Current angle: {{ op.degrees }}°</div>

    <v-btn variant="text" size="small" prepend-icon="mdi-restore" @click="reset">Reset rotation</v-btn>
  </div>

  <div v-else class="text-body-2 text-medium-emphasis">Add a Rotate operation to turn the image in 90° steps.</div>
</template>

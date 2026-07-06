<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '../../stores/editor'
import type { FlipOp } from '../../types/edit'

const editor = useEditorStore()

const op = computed<FlipOp | null>(() => {
  const found = editor.ops.find((candidate) => candidate.id === editor.selectedOpId)
  return found?.type === 'flip' ? found : null
})

function toggle(axis: 'horizontal' | 'vertical') {
  if (!op.value) return
  editor.updateOp(op.value.id, { [axis]: !op.value[axis] })
}
</script>

<template>
  <div v-if="op" class="d-flex flex-column ga-2">
    <v-btn
      :variant="op.horizontal ? 'tonal' : 'text'"
      :color="op.horizontal ? 'primary' : undefined"
      prepend-icon="mdi-flip-horizontal"
      block
      class="justify-start"
      @click="toggle('horizontal')"
    >
      Flip horizontal
    </v-btn>
    <v-btn
      :variant="op.vertical ? 'tonal' : 'text'"
      :color="op.vertical ? 'primary' : undefined"
      prepend-icon="mdi-flip-vertical"
      block
      class="justify-start"
      @click="toggle('vertical')"
    >
      Flip vertical
    </v-btn>
  </div>

  <div v-else class="text-body-2 text-medium-emphasis">Add a Flip operation to mirror the image.</div>
</template>

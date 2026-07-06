<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '../../stores/editor'
import { FILTER_OPTIONS, type FilterOp } from '../../types/edit'

const editor = useEditorStore()

const op = computed<FilterOp | null>(() => {
  const found = editor.ops.find((candidate) => candidate.id === editor.selectedOpId)
  return found?.type === 'filter' ? found : null
})

function select(kind: FilterOp['filter']) {
  if (!op.value) return
  editor.updateOp(op.value.id, { filter: kind })
}
</script>

<template>
  <div v-if="op" class="d-flex flex-column ga-2">
    <v-btn
      v-for="option in FILTER_OPTIONS"
      :key="option.value"
      :variant="op.filter === option.value ? 'tonal' : 'text'"
      :color="op.filter === option.value ? 'primary' : undefined"
      :prepend-icon="option.icon"
      block
      class="justify-start"
      @click="select(option.value)"
    >
      {{ option.label }}
    </v-btn>
  </div>

  <div v-else class="text-body-2 text-medium-emphasis">
    Add a Filter operation to apply a look to the image.
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEditorStore } from '../../stores/editor'
import { useUiStore } from '../../stores/ui'
import { ASPECT_RATIOS, aspectRatioToNumber, type AspectRatioValue } from '../../types/tool'
import type { CropOp } from '../../types/edit'

const editor = useEditorStore()
const ui = useUiStore()

const op = computed<CropOp | null>(() => {
  const found = editor.ops.find((candidate) => candidate.id === editor.selectedOpId)
  return found?.type === 'crop' ? found : null
})

const selectedRatio = ref<AspectRatioValue>('free')

function onRatioChange(value: AspectRatioValue) {
  selectedRatio.value = value
  const ratio = aspectRatioToNumber(value, editor.sourceWidth, editor.sourceHeight)
  ui.cropController?.setAspectRatio(ratio)
}

function onFieldChange(field: 'x' | 'y' | 'width' | 'height', value: number) {
  if (!op.value || Number.isNaN(value)) return
  editor.patchOpLive(op.value.id, { [field]: value })
  ui.cropController?.setData({ [field]: value })
}

function rotate(direction: -1 | 1) {
  const created = editor.addOp('rotate')
  if (created?.type === 'rotate') editor.patchOpLive(created.id, { degrees: direction * 90 })
}

function flip(axis: 'horizontal' | 'vertical') {
  const created = editor.addOp('flip')
  if (created?.type === 'flip') editor.patchOpLive(created.id, { [axis]: true })
}

function applyCrop() {
  if (!op.value) return
  editor.endDrag()
  ui.setActiveTool(null)
}
</script>

<template>
  <div v-if="op" class="d-flex flex-column ga-4">
    <div>
      <div class="text-caption text-medium-emphasis mb-1">Aspect ratio</div>
      <v-select
        :model-value="selectedRatio"
        :items="ASPECT_RATIOS"
        item-title="label"
        item-value="value"
        density="compact"
        variant="outlined"
        hide-details
        @update:model-value="onRatioChange"
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
          @update:model-value="onFieldChange('x', Number($event))"
        />
        <v-text-field
          :model-value="Math.round(op.y)"
          label="Y"
          type="number"
          density="compact"
          variant="outlined"
          hide-details
          suffix="px"
          @update:model-value="onFieldChange('y', Number($event))"
        />
      </div>
    </div>

    <div>
      <div class="text-caption text-medium-emphasis mb-1">Size</div>
      <div class="d-flex ga-2">
        <v-text-field
          :model-value="Math.round(op.width)"
          label="W"
          type="number"
          density="compact"
          variant="outlined"
          hide-details
          suffix="px"
          @update:model-value="onFieldChange('width', Number($event))"
        />
        <v-text-field
          :model-value="Math.round(op.height)"
          label="H"
          type="number"
          density="compact"
          variant="outlined"
          hide-details
          suffix="px"
          @update:model-value="onFieldChange('height', Number($event))"
        />
      </div>
    </div>

    <div class="d-flex ga-2">
      <v-btn icon="mdi-rotate-left" variant="tonal" size="small" @click="rotate(-1)" />
      <v-btn icon="mdi-rotate-right" variant="tonal" size="small" @click="rotate(1)" />
      <v-btn icon="mdi-flip-horizontal" variant="tonal" size="small" @click="flip('horizontal')" />
      <v-btn icon="mdi-flip-vertical" variant="tonal" size="small" @click="flip('vertical')" />
    </div>

    <v-btn block color="primary" @click="applyCrop">Apply Crop</v-btn>
  </div>

  <div v-else class="text-body-2 text-medium-emphasis">
    Add a Crop operation to start cropping.
  </div>
</template>

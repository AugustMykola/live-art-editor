<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '../../stores/editor'
import type { LocalAreaOp } from '../../types/edit'
import { SHAPE_KINDS, defaultShape, type CircleShape, type RectangleShape, type ShapeKind } from '../../types/shape'
import ToneSliders from './ToneSliders.vue'

const editor = useEditorStore()

const op = computed<LocalAreaOp | null>(() => {
  const found = editor.ops.find((candidate) => candidate.id === editor.selectedOpId)
  return found?.type === 'local-area' ? found : null
})

function beginSession() {
  editor.beginDrag()
}

function endSession() {
  editor.endDrag()
}

function patchTone(field: 'brightness' | 'contrast' | 'saturation', value: number) {
  if (!op.value) return
  editor.patchOpLive(op.value.id, { [field]: value })
}

function setShapeKind(kind: ShapeKind) {
  if (!op.value || op.value.shape.kind === kind) return
  editor.updateOp(op.value.id, { shape: defaultShape(kind, editor.sourceWidth, editor.sourceHeight) })
}

function patchRectangle(field: keyof RectangleShape, value: number) {
  if (!op.value || op.value.shape.kind !== 'rectangle') return
  editor.patchOpLive(op.value.id, { shape: { ...op.value.shape, [field]: value } })
}

function patchCircle(field: keyof CircleShape, value: number) {
  if (!op.value || op.value.shape.kind !== 'circle') return
  editor.patchOpLive(op.value.id, { shape: { ...op.value.shape, [field]: value } })
}
</script>

<template>
  <div v-if="op" class="d-flex flex-column ga-4">
    <div>
      <div class="text-caption text-medium-emphasis mb-1">Shape</div>
      <div class="d-flex flex-wrap ga-2">
        <v-btn
          v-for="kind in SHAPE_KINDS"
          :key="kind.value"
          :prepend-icon="kind.icon"
          size="small"
          :variant="op.shape.kind === kind.value ? 'tonal' : 'outlined'"
          :color="op.shape.kind === kind.value ? 'primary' : undefined"
          @click="setShapeKind(kind.value)"
        >
          {{ kind.label }}
        </v-btn>
      </div>
    </div>

    <div v-if="op.shape.kind === 'rectangle'">
      <div class="text-caption text-medium-emphasis mb-1">Position &amp; size</div>
      <div class="d-flex ga-2 mb-2">
        <v-text-field
          :model-value="Math.round(op.shape.x)"
          label="X"
          type="number"
          density="compact"
          variant="outlined"
          hide-details
          suffix="px"
          @focus="beginSession"
          @update:model-value="patchRectangle('x', Number($event))"
          @blur="endSession"
        />
        <v-text-field
          :model-value="Math.round(op.shape.y)"
          label="Y"
          type="number"
          density="compact"
          variant="outlined"
          hide-details
          suffix="px"
          @focus="beginSession"
          @update:model-value="patchRectangle('y', Number($event))"
          @blur="endSession"
        />
      </div>
      <div class="d-flex ga-2">
        <v-text-field
          :model-value="Math.round(op.shape.width)"
          label="W"
          type="number"
          density="compact"
          variant="outlined"
          hide-details
          suffix="px"
          @focus="beginSession"
          @update:model-value="patchRectangle('width', Number($event))"
          @blur="endSession"
        />
        <v-text-field
          :model-value="Math.round(op.shape.height)"
          label="H"
          type="number"
          density="compact"
          variant="outlined"
          hide-details
          suffix="px"
          @focus="beginSession"
          @update:model-value="patchRectangle('height', Number($event))"
          @blur="endSession"
        />
      </div>
    </div>

    <div v-else-if="op.shape.kind === 'circle'">
      <div class="text-caption text-medium-emphasis mb-1">Center &amp; radius</div>
      <div class="d-flex ga-2">
        <v-text-field
          :model-value="Math.round(op.shape.cx)"
          label="X"
          type="number"
          density="compact"
          variant="outlined"
          hide-details
          suffix="px"
          @focus="beginSession"
          @update:model-value="patchCircle('cx', Number($event))"
          @blur="endSession"
        />
        <v-text-field
          :model-value="Math.round(op.shape.cy)"
          label="Y"
          type="number"
          density="compact"
          variant="outlined"
          hide-details
          suffix="px"
          @focus="beginSession"
          @update:model-value="patchCircle('cy', Number($event))"
          @blur="endSession"
        />
        <v-text-field
          :model-value="Math.round(op.shape.radius)"
          label="R"
          type="number"
          density="compact"
          variant="outlined"
          hide-details
          suffix="px"
          @focus="beginSession"
          @update:model-value="patchCircle('radius', Number($event))"
          @blur="endSession"
        />
      </div>
    </div>

    <div v-else class="text-caption text-medium-emphasis">
      Drag the {{ op.shape.points.length }} curve points directly on the image to reshape the area.
    </div>

    <v-divider />

    <ToneSliders
      :brightness="op.brightness"
      :contrast="op.contrast"
      :saturation="op.saturation"
      @patch="patchTone"
      @start="beginSession"
      @end="endSession"
    />

    <div class="text-caption text-medium-emphasis">
      Tip: drag {{ op.shape.kind === 'bezier' ? 'the points' : 'the shape' }} directly on the image to reposition it.
    </div>
  </div>

  <div v-else class="text-body-2 text-medium-emphasis">
    Add a Local Area operation to adjust brightness, contrast, and saturation within a specific region.
  </div>
</template>

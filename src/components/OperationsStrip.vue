<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useEditorStore } from '../stores/editor'
import { useUiStore } from '../stores/ui'
import { OP_ICONS, OP_LABELS, describeOp, type EditOp, type EditOpType } from '../types/edit'

const editor = useEditorStore()
const ui = useUiStore()

const addableTypes: EditOpType[] = ['crop', 'rotate', 'flip', 'adjust', 'filter', 'text', 'local-area']
const THUMBNAIL_SIZE = 96

interface OperationCard {
  id: string
  label: string
  description: string
  icon: string
  thumbnail: string
  enabled: boolean
  isOriginal: boolean
}

const thumbnails = ref<Map<string, string>>(new Map())

function renderThumbnail(upTo: number): string {
  const canvas = editor.render(upTo)
  if (!canvas) return ''
  const scale = THUMBNAIL_SIZE / Math.max(canvas.width, canvas.height)
  const thumb = document.createElement('canvas')
  thumb.width = Math.max(1, Math.round(canvas.width * scale))
  thumb.height = Math.max(1, Math.round(canvas.height * scale))
  thumb.getContext('2d')?.drawImage(canvas, 0, 0, thumb.width, thumb.height)
  return thumb.toDataURL('image/png')
}

function refreshThumbnails() {
  if (!editor.hasImage) {
    thumbnails.value = new Map()
    return
  }
  const next = new Map<string, string>()
  next.set('original', renderThumbnail(0))
  editor.ops.forEach((op, index) => next.set(op.id, renderThumbnail(index + 1)))
  thumbnails.value = next
}

watch(
  () => [editor.sourceImage, editor.dragSnapshot === null, editor.ops.map((op) => JSON.stringify(op)).join('|')] as const,
  () => {
    if (editor.dragSnapshot === null) refreshThumbnails()
  },
  { immediate: true },
)

const cards = computed<OperationCard[]>(() => [
  {
    id: 'original',
    label: 'Original',
    description: editor.sourceWidth && editor.sourceHeight ? `${editor.sourceWidth}×${editor.sourceHeight}` : '',
    icon: 'mdi-image-outline',
    thumbnail: thumbnails.value.get('original') ?? '',
    enabled: true,
    isOriginal: true,
  },
  ...editor.ops.map(
    (op): OperationCard => ({
      id: op.id,
      label: OP_LABELS[op.type],
      description: describeOp(op),
      icon: OP_ICONS[op.type],
      thumbnail: thumbnails.value.get(op.id) ?? '',
      enabled: op.enabled,
      isOriginal: false,
    }),
  ),
])

function opTypeOf(id: string): EditOp['type'] | undefined {
  return editor.ops.find((op) => op.id === id)?.type
}

function isPanelType(type: EditOp['type']): type is 'crop' | 'rotate' | 'flip' | 'adjust' | 'filter' | 'text' | 'local-area' {
  return (
    type === 'crop' ||
    type === 'rotate' ||
    type === 'flip' ||
    type === 'adjust' ||
    type === 'filter' ||
    type === 'text' ||
    type === 'local-area'
  )
}

function selectCard(card: OperationCard) {
  if (card.isOriginal) {
    editor.selectOp(null)
    ui.toggleOriginal(true)
    return
  }
  ui.toggleOriginal(false)
  editor.selectOp(card.id)
  const type = opTypeOf(card.id)
  if (type && isPanelType(type)) ui.setActiveTool(type)
}

function addOp(type: EditOpType) {
  ui.toggleOriginal(false)
  const created = editor.addOp(type)
  if (!created) return
  if (isPanelType(type)) {
    ui.setActiveTool(type)
    if (ui.mobilePanel) ui.openMobilePanel('tools')
  }
}
</script>

<template>
  <div class="operations-strip d-flex align-stretch ga-3 pa-3 overflow-x-auto">
    <v-card
      v-for="card in cards"
      :key="card.id"
      class="operation-card flex-shrink-0"
      :class="{ 'operation-card--active': editor.selectedOpId === card.id || (card.isOriginal && ui.showOriginal) }"
      :variant="editor.selectedOpId === card.id || (card.isOriginal && ui.showOriginal) ? 'tonal' : 'outlined'"
      @click="selectCard(card)"
    >
      <div class="operation-card__thumb d-flex align-center justify-center" :class="{ 'opacity-40': !card.enabled }">
        <v-img v-if="card.thumbnail" :src="card.thumbnail" height="56" width="72" cover />
        <v-icon v-else :icon="card.icon" size="28" />
      </div>
      <div class="px-2 pb-1 pt-1">
        <div class="text-caption font-weight-medium text-truncate" style="max-width: 88px">{{ card.label }}</div>
        <div class="text-caption text-medium-emphasis text-truncate" style="max-width: 88px">
          {{ card.description }}
        </div>
      </div>
      <div v-if="!card.isOriginal" class="operation-card__actions d-flex">
        <v-btn
          :icon="card.enabled ? 'mdi-eye-outline' : 'mdi-eye-off-outline'"
          size="x-small"
          variant="text"
          density="comfortable"
          @click.stop="editor.toggleOp(card.id)"
        />
        <v-btn
          icon="mdi-delete-outline"
          size="x-small"
          variant="text"
          density="comfortable"
          @click.stop="editor.removeOp(card.id)"
        />
      </div>
    </v-card>

    <v-menu>
      <template #activator="{ props: menuProps }">
        <v-card
          class="operation-card operation-card--add flex-shrink-0 d-flex flex-column align-center justify-center"
          variant="outlined"
          :disabled="!editor.hasImage"
          v-bind="menuProps"
        >
          <v-icon icon="mdi-plus" size="24" />
          <span class="text-caption mt-1">Add Operation</span>
        </v-card>
      </template>
      <v-list density="compact">
        <v-list-item v-for="type in addableTypes" :key="type" @click="addOp(type)">
          <template #prepend>
            <v-icon :icon="OP_ICONS[type]" size="20" class="mr-2" />
          </template>
          <v-list-item-title>{{ OP_LABELS[type] }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<style scoped>
.operations-strip {
  min-height: 112px;
}
.operation-card {
  width: 110px;
  cursor: pointer;
}
.operation-card--active {
  border-color: rgb(var(--v-theme-primary));
}
.operation-card__thumb {
  height: 56px;
  background-color: rgba(var(--v-theme-on-surface), 0.06);
}
.operation-card__actions {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.operation-card--add {
  color: rgba(var(--v-theme-on-surface), 0.6);
}
</style>

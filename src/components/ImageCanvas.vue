<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useEditorStore } from '../stores/editor'
import { useUiStore } from '../stores/ui'
import { createCropController, type CropController } from '../lib/cropController'
import {
  buildShapePath,
  hitTestShape,
  shapeGrabOffset,
  transformShape,
  type Point,
  type Shape,
  type ShapeHandle,
} from '../types/shape'
import type { TextOp } from '../types/edit'

const editor = useEditorStore()
const ui = useUiStore()

const viewport = ref<HTMLDivElement | null>(null)
const displayCanvas = ref<HTMLCanvasElement | null>(null)
const cropImage = ref<HTMLImageElement | null>(null)
let controller: CropController | null = null

let contentCanvas: HTMLCanvasElement | null = null
const contentSize = ref({ w: 0, h: 0 })
const viewportSize = ref({ w: 0, h: 0 })
let resizeObserver: ResizeObserver | null = null

const panX = ref(0)
const panY = ref(0)

type DragTarget =
  | { kind: 'text'; opId: string }
  | { kind: 'shape'; opId: string; handle: ShapeHandle; grabOffset: Point; originShape: Shape }

let dragTarget: DragTarget | null = null
let dragBase: { index: number; canvas: HTMLCanvasElement } | null = null

const isPanning = ref(false)
let panStart = { clientX: 0, clientY: 0, panX: 0, panY: 0 }

const isCropMode = computed(() => ui.activeTool === 'crop' && editor.selectedOp?.type === 'crop')
const isTextMode = computed(() => ui.activeTool === 'text' && editor.selectedOp?.type === 'text')
const isLocalAreaMode = computed(() => ui.activeTool === 'local-area' && editor.selectedOp?.type === 'local-area')
const isDraggableMode = computed(() => isTextMode.value || isLocalAreaMode.value)

const currentScale = computed(() => {
  const { w: cw, h: ch } = contentSize.value
  const { w: vw, h: vh } = viewportSize.value
  if (!cw || !ch || !vw || !vh) return 1
  return Math.min(vw / cw, vh / ch) * ui.zoom
})

const overflowsViewport = computed(() => {
  const { w: cw, h: ch } = contentSize.value
  const { w: vw, h: vh } = viewportSize.value
  const s = currentScale.value
  return cw * s > vw + 1 || ch * s > vh + 1
})
const canPan = computed(() => overflowsViewport.value && !isCropMode.value && !isDraggableMode.value)

function origin(scale: number): Point {
  const { w: cw, h: ch } = contentSize.value
  const { w: vw, h: vh } = viewportSize.value
  return { x: (vw - cw * scale) / 2 + panX.value, y: (vh - ch * scale) / 2 + panY.value }
}

function clampPan() {
  const { w: cw, h: ch } = contentSize.value
  const { w: vw, h: vh } = viewportSize.value
  const s = currentScale.value
  const contentW = cw * s
  const contentH = ch * s
  if (contentW <= vw) {
    panX.value = 0
  } else {
    const centered = (vw - contentW) / 2
    panX.value = Math.min(0, Math.max(vw - contentW, centered + panX.value)) - centered
  }
  if (contentH <= vh) {
    panY.value = 0
  } else {
    const centered = (vh - contentH) / 2
    panY.value = Math.min(0, Math.max(vh - contentH, centered + panY.value)) - centered
  }
}

function draw() {
  const canvas = displayCanvas.value
  if (!canvas) return
  const { w: vw, h: vh } = viewportSize.value
  if (!vw || !vh) return
  const dpr = window.devicePixelRatio || 1
  const bw = Math.round(vw * dpr)
  const bh = Math.round(vh * dpr)
  if (canvas.width !== bw) canvas.width = bw
  if (canvas.height !== bh) canvas.height = bh

  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, vw, vh)

  const content = contentCanvas
  if (!content) return
  const s = currentScale.value
  const o = origin(s)

  ctx.save()
  ctx.translate(o.x, o.y)
  ctx.scale(s, s)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(content, 0, 0)

  const op = editor.selectedOp
  if (isTextMode.value && op?.type === 'text') drawTextOverlay(ctx, op, s)
  if (isLocalAreaMode.value && op?.type === 'local-area') drawShapeOverlay(ctx, op.shape, s)
  ctx.restore()
}

function renderContent() {
  if (isCropMode.value) return
  if (dragBase) {
    contentCanvas = editor.renderFrom(dragBase.canvas, dragBase.index)
  } else {
    contentCanvas = ui.showOriginal ? editor.render(0) : editor.render()
  }
  contentSize.value = contentCanvas ? { w: contentCanvas.width, h: contentCanvas.height } : { w: 0, h: 0 }
  clampPan()
  draw()
}

function teardownCropSession() {
  if (controller) {
    controller.destroy()
    controller = null
    ui.setCropController(null)
  }
  editor.endDrag()
}

async function setupCropSession() {
  teardownCropSession()
  const op = editor.selectedOp
  if (!op || op.type !== 'crop' || !editor.sourceImage) return

  const index = editor.ops.findIndex((candidate) => candidate.id === op.id)
  const inputCanvas = editor.render(index)
  if (!inputCanvas) return

  await nextTick()
  const img = cropImage.value
  if (!img) return

  img.onload = async () => {
    if (!isCropMode.value) return
    const created = await createCropController(img, {
      initial: { x: op.x, y: op.y, width: op.width, height: op.height },
      onChange: (rect) => editor.patchOpLive(op.id, rect),
    })
    if (!isCropMode.value || editor.selectedOpId !== op.id) {
      created.destroy()
      return
    }
    editor.beginDrag()
    controller = created
    ui.setCropController(created)
  }
  img.src = inputCanvas.toDataURL()
}

function beginOpDrag(opId: string) {
  editor.beginDrag()
  const index = editor.ops.findIndex((op) => op.id === opId)
  const base = index >= 0 ? editor.render(index) : null
  dragBase = base ? { index, canvas: base } : null
}

function toWorld(event: PointerEvent): Point | null {
  const canvas = displayCanvas.value
  if (!canvas || !contentCanvas) return null
  const rect = canvas.getBoundingClientRect()
  if (!rect.width || !rect.height) return null
  const s = currentScale.value
  const o = origin(s)
  return {
    x: Math.round((event.clientX - rect.left - o.x) / s),
    y: Math.round((event.clientY - rect.top - o.y) / s),
  }
}

function onCanvasPointerDown(event: PointerEvent) {
  if (canPan.value) {
    event.preventDefault()
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    isPanning.value = true
    panStart = { clientX: event.clientX, clientY: event.clientY, panX: panX.value, panY: panY.value }
    return
  }

  const point = toWorld(event)
  if (!point) return

  if (isTextMode.value) {
    const op = editor.selectedOp
    if (!op || op.type !== 'text') return
    event.preventDefault()
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    dragTarget = { kind: 'text', opId: op.id }
    beginOpDrag(op.id)
    editor.patchOpLive(op.id, point)
    return
  }

  if (isLocalAreaMode.value) {
    const op = editor.selectedOp
    if (!op || op.type !== 'local-area') return
    const handle = hitTestShape(op.shape, point)
    if (!handle) return
    event.preventDefault()
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    dragTarget = {
      kind: 'shape',
      opId: op.id,
      handle,
      grabOffset: shapeGrabOffset(op.shape, handle, point),
      originShape: op.shape,
    }
    beginOpDrag(op.id)
  }
}

function onCanvasPointerMove(event: PointerEvent) {
  if (isPanning.value) {
    panX.value = panStart.panX + (event.clientX - panStart.clientX)
    panY.value = panStart.panY + (event.clientY - panStart.clientY)
    clampPan()
    draw()
    return
  }

  if (!dragTarget) return
  const point = toWorld(event)
  if (!point) return

  if (dragTarget.kind === 'text') {
    editor.patchOpLive(dragTarget.opId, point)
  } else {
    const nextShape = transformShape(dragTarget.originShape, dragTarget.handle, point, dragTarget.grabOffset)
    editor.patchOpLive(dragTarget.opId, { shape: nextShape })
  }
}

function onCanvasPointerUp() {
  if (isPanning.value) {
    isPanning.value = false
    return
  }
  if (!dragTarget) return
  dragTarget = null
  dragBase = null
  editor.endDrag()
  renderContent()
}

function drawTextOverlay(ctx: CanvasRenderingContext2D, op: TextOp, s: number) {
  const style = op.italic ? 'italic ' : ''
  const weight = op.bold ? 'bold ' : ''
  ctx.font = `${style}${weight}${op.fontSize}px ${op.fontFamily}`
  const lines = op.text.split('\n')
  const lineHeight = op.fontSize * 1.2
  const maxWidth = Math.max(...lines.map((line) => ctx.measureText(line || ' ').width), 1)
  const totalHeight = lineHeight * lines.length
  const left = op.align === 'center' ? op.x - maxWidth / 2 : op.align === 'right' ? op.x - maxWidth : op.x
  const top = op.y - totalHeight / 2
  const padding = Math.max(4, op.fontSize * 0.15)

  ctx.save()
  ctx.strokeStyle = '#7c5cff'
  ctx.lineWidth = 2 / s
  ctx.setLineDash([8 / s, 5 / s])
  ctx.strokeRect(left - padding, top - padding, maxWidth + padding * 2, totalHeight + padding * 2)
  ctx.restore()
}

function drawShapeOverlay(ctx: CanvasRenderingContext2D, shape: Shape, s: number) {
  ctx.save()
  ctx.strokeStyle = '#7c5cff'
  ctx.lineWidth = 2 / s
  ctx.setLineDash([8 / s, 5 / s])
  ctx.stroke(buildShapePath(shape))
  ctx.restore()

  if (shape.kind === 'bezier') {
    ctx.save()
    ctx.fillStyle = '#7c5cff'
    for (const point of shape.points) {
      ctx.beginPath()
      ctx.arc(point.x, point.y, 6 / s, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }
}

watch(
  () => editor.sourceImage,
  () => {
    panX.value = 0
    panY.value = 0
  },
)

watch(
  () => [editor.sourceImage, ui.showOriginal, editor.ops.map((op) => JSON.stringify(op)).join('|')] as const,
  renderContent,
)

watch(
  () => ui.zoom,
  (z1, z0) => {
    const { w: cw, h: ch } = contentSize.value
    const { w: vw, h: vh } = viewportSize.value
    if (cw && ch && vw && vh && z0) {
      const fit = Math.min(vw / cw, vh / ch)
      const s0 = fit * z0
      const s1 = fit * z1
      const o0 = origin(s0)
      const worldX = (vw / 2 - o0.x) / s0
      const worldY = (vh / 2 - o0.y) / s0
      panX.value = vw / 2 - worldX * s1 - (vw - cw * s1) / 2
      panY.value = vh / 2 - worldY * s1 - (vh - ch * s1) / 2
    }
    clampPan()
    draw()
  },
)

watch(
  () => [ui.activeTool, editor.selectedOpId] as const,
  () => {
    if (isCropMode.value) setupCropSession()
    else {
      teardownCropSession()
      renderContent()
    }
  },
)

watch(viewportSize, () => {
  clampPan()
  draw()
})

onMounted(() => {
  const el = viewport.value
  if (el) {
    viewportSize.value = { w: el.clientWidth, h: el.clientHeight }
    resizeObserver = new ResizeObserver(() => {
      viewportSize.value = { w: el.clientWidth, h: el.clientHeight }
    })
    resizeObserver.observe(el)
  }
  renderContent()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  teardownCropSession()
})
</script>

<template>
  <div ref="viewport" class="canvas-viewport">
    <img v-show="isCropMode" ref="cropImage" class="crop-image" alt="Image being cropped" />
    <canvas
      v-show="!isCropMode"
      ref="displayCanvas"
      class="display-canvas"
      :class="{
        'display-canvas--draggable': isDraggableMode,
        'display-canvas--pan': canPan && !isPanning,
        'display-canvas--panning': isPanning,
      }"
      @pointerdown="onCanvasPointerDown"
      @pointermove="onCanvasPointerMove"
      @pointerup="onCanvasPointerUp"
      @pointercancel="onCanvasPointerUp"
    />
  </div>
</template>

<style scoped>
.canvas-viewport {
  position: absolute;
  inset: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: linear-gradient(45deg, #00000022 25%, transparent 25%),
    linear-gradient(-45deg, #00000022 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #00000022 75%),
    linear-gradient(-45deg, transparent 75%, #00000022 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
}
.display-canvas {
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
}
.display-canvas--draggable {
  cursor: move;
}
.display-canvas--pan {
  cursor: grab;
}
.display-canvas--panning {
  cursor: grabbing;
}
.crop-image {
  max-width: min(80vw, 900px);
  max-height: 70vh;
}
</style>

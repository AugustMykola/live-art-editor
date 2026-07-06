import { FilterKind, Tone, type EditOp, type LocalAreaOp, type TextOp } from '../types/edit'
import { buildShapePath } from '../types/shape'

const CSS_NO_FILTER = 'none'

const FILTER_CSS: Record<FilterKind, string> = {
  [FilterKind.None]: CSS_NO_FILTER,
  [FilterKind.Grayscale]: 'grayscale(100%)',
  [FilterKind.Sepia]: 'sepia(100%)',
  [FilterKind.Invert]: 'invert(100%)',
}

interface ToneParams {
  brightness: number
  contrast: number
  saturation: number
}

function isNeutralTone(t: ToneParams): boolean {
  return t.brightness === Tone.Neutral && t.contrast === Tone.Neutral && t.saturation === Tone.Neutral
}

function toneToCssFilter(t: ToneParams): string {
  return `brightness(${t.brightness}%) contrast(${t.contrast}%) saturate(${t.saturation}%)`
}

export function renderPipeline(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  ops: EditOp[],
  upTo: number = ops.length,
): HTMLCanvasElement {
  let canvas = document.createElement('canvas')
  canvas.width = sourceWidth
  canvas.height = sourceHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas context is not available')
  ctx.drawImage(source, 0, 0, sourceWidth, sourceHeight)

  for (const op of ops.slice(0, upTo)) {
    if (!op.enabled) continue
    canvas = applyOp(canvas, op)
  }
  return canvas
}

function applyOp(input: HTMLCanvasElement, op: EditOp): HTMLCanvasElement {
  switch (op.type) {
    case 'crop':
      return applyCrop(input, op.x, op.y, op.width, op.height)
    case 'rotate':
      return applyRotate(input, op.degrees)
    case 'flip':
      return applyFlip(input, op.horizontal, op.vertical)
    case 'adjust':
      return isNeutralTone(op) ? input : applyFilterString(input, toneToCssFilter(op))
    case 'filter':
      return applyFilterString(input, FILTER_CSS[op.filter])
    case 'text':
      return applyText(input, op)
    case 'local-area':
      return applyLocalArea(input, op)
  }
}

function newCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas context is not available')
  return { canvas, ctx }
}

function applyCrop(input: HTMLCanvasElement, x: number, y: number, width: number, height: number): HTMLCanvasElement {
  const { canvas, ctx } = newCanvas(width, height)
  ctx.drawImage(input, x, y, width, height, 0, 0, canvas.width, canvas.height)
  return canvas
}

function applyRotate(input: HTMLCanvasElement, degrees: number): HTMLCanvasElement {
  if (degrees % 360 === 0) return input
  const rad = (degrees * Math.PI) / 180
  const { width: w, height: h } = input
  const newWidth = Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad))
  const newHeight = Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad))
  const { canvas, ctx } = newCanvas(newWidth, newHeight)
  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate(rad)
  ctx.drawImage(input, -w / 2, -h / 2)
  return canvas
}

function applyFlip(input: HTMLCanvasElement, horizontal: boolean, vertical: boolean): HTMLCanvasElement {
  if (!horizontal && !vertical) return input
  const { canvas, ctx } = newCanvas(input.width, input.height)
  ctx.translate(horizontal ? canvas.width : 0, vertical ? canvas.height : 0)
  ctx.scale(horizontal ? -1 : 1, vertical ? -1 : 1)
  ctx.drawImage(input, 0, 0)
  return canvas
}

function applyFilterString(input: HTMLCanvasElement, cssFilter: string): HTMLCanvasElement {
  if (cssFilter === CSS_NO_FILTER) return input
  const { canvas, ctx } = newCanvas(input.width, input.height)
  ctx.filter = cssFilter
  ctx.drawImage(input, 0, 0)
  ctx.filter = CSS_NO_FILTER
  return canvas
}

function applyText(input: HTMLCanvasElement, op: TextOp): HTMLCanvasElement {
  if (!op.text.trim()) return input
  const { canvas, ctx } = newCanvas(input.width, input.height)
  ctx.drawImage(input, 0, 0)

  const style = op.italic ? 'italic ' : ''
  const weight = op.bold ? 'bold ' : ''
  ctx.font = `${style}${weight}${op.fontSize}px ${op.fontFamily}`
  ctx.fillStyle = op.color
  ctx.textAlign = op.align
  ctx.textBaseline = 'middle'

  const lines = op.text.split('\n')
  const lineHeight = op.fontSize * 1.2
  const startY = op.y - (lineHeight * (lines.length - 1)) / 2
  lines.forEach((line, index) => ctx.fillText(line, op.x, startY + index * lineHeight))

  return canvas
}

function applyLocalArea(input: HTMLCanvasElement, op: LocalAreaOp): HTMLCanvasElement {
  if (isNeutralTone(op)) return input
  const { canvas, ctx } = newCanvas(input.width, input.height)
  ctx.drawImage(input, 0, 0)

  ctx.save()
  ctx.clip(buildShapePath(op.shape))
  ctx.filter = toneToCssFilter(op)
  ctx.drawImage(input, 0, 0)
  ctx.restore()

  return canvas
}

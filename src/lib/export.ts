import type { EditOp } from '../types/edit'
import type { Point, Shape } from '../types/shape'

export interface EditDocument {
  version: 1
  fileName: string | null
  sourceDataUrl: string | null
  sourceWidth: number
  sourceHeight: number
  ops: EditOp[]
}

interface EditSource {
  fileName: string | null
  sourceDataUrl: string | null
  sourceWidth: number
  sourceHeight: number
  ops: EditOp[]
}

export function toEditDocument(source: EditSource): EditDocument {
  return {
    version: 1,
    fileName: source.fileName,
    sourceDataUrl: source.sourceDataUrl,
    sourceWidth: source.sourceWidth,
    sourceHeight: source.sourceHeight,
    ops: source.ops,
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isPoint(value: unknown): value is Point {
  return !!value && typeof value === 'object' && isFiniteNumber((value as Point).x) && isFiniteNumber((value as Point).y)
}

function isValidShape(value: unknown): value is Shape {
  if (!value || typeof value !== 'object') return false
  const shape = value as Shape
  switch (shape.kind) {
    case 'rectangle':
      return ['x', 'y', 'width', 'height'].every((k) => isFiniteNumber((shape as never)[k]))
    case 'circle':
      return isFiniteNumber(shape.cx) && isFiniteNumber(shape.cy) && isFiniteNumber(shape.radius)
    case 'bezier':
      return Array.isArray(shape.points) && shape.points.length > 0 && shape.points.every(isPoint)
    default:
      return false
  }
}

function isValidOp(value: unknown): value is EditOp {
  if (!value || typeof value !== 'object') return false
  const op = value as EditOp
  if (typeof op.id !== 'string' || typeof op.enabled !== 'boolean') return false
  switch (op.type) {
    case 'crop':
      return isFiniteNumber(op.x) && isFiniteNumber(op.y) && op.width > 0 && op.height > 0
    case 'rotate':
      return isFiniteNumber(op.degrees)
    case 'flip':
      return typeof op.horizontal === 'boolean' && typeof op.vertical === 'boolean'
    case 'adjust':
      return isFiniteNumber(op.brightness) && isFiniteNumber(op.contrast) && isFiniteNumber(op.saturation)
    case 'filter':
      return typeof op.filter === 'string'
    case 'text':
      return typeof op.text === 'string' && isFiniteNumber(op.x) && isFiniteNumber(op.y) && isFiniteNumber(op.fontSize)
    case 'local-area':
      return (
        isValidShape(op.shape) &&
        isFiniteNumber(op.brightness) &&
        isFiniteNumber(op.contrast) &&
        isFiniteNumber(op.saturation)
      )
    default:
      return false
  }
}

export function parseEditDocument(text: string): EditDocument {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('This file is not valid JSON.')
  }

  if (!data || typeof data !== 'object' || !Array.isArray((data as EditDocument).ops)) {
    throw new Error('This is not a Live Art file. Import expects a JSON exported from this app (see the “?” next to Import).')
  }

  const doc = data as EditDocument

  let sourceDataUrl: string | null = null
  if (doc.sourceDataUrl != null) {
    if (typeof doc.sourceDataUrl !== 'string' || !doc.sourceDataUrl.startsWith('data:image/')) {
      throw new Error("This project's embedded image is missing or not a supported image.")
    }
    sourceDataUrl = doc.sourceDataUrl
  }

  return {
    version: 1,
    fileName: typeof doc.fileName === 'string' ? doc.fileName : null,
    sourceDataUrl,
    sourceWidth: Number(doc.sourceWidth) || 0,
    sourceHeight: Number(doc.sourceHeight) || 0,
    ops: doc.ops.filter(isValidOp),
  }
}

function baseName(fileName: string | null): string {
  return (fileName ?? 'image').replace(/\.[^./]+$/, '')
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

export function exportPng(canvas: HTMLCanvasElement, fileName: string | null): Promise<void> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Could not encode the image as PNG.'))
        return
      }
      downloadBlob(blob, `${baseName(fileName)}-edited.png`)
      resolve()
    }, 'image/png')
  })
}

export function exportJson(doc: EditDocument): void {
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' })
  downloadBlob(blob, `${baseName(doc.fileName)}-edits.json`)
}

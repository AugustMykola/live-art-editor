import { defaultShape, shapeLabel } from '../shape'
import { FilterKind, Tone } from './constants'
import type { EditOp, EditOpType } from './types'

let nextId = 0
export function createOpId(): string {
  nextId += 1
  return `op-${Date.now().toString(36)}-${nextId}`
}

export function createDefaultOp(type: EditOpType, source: { width: number; height: number }): EditOp {
  const base = { id: createOpId(), enabled: true } as const
  switch (type) {
    case 'crop':
      return {
        ...base,
        type: 'crop',
        x: Math.round(source.width * 0.1),
        y: Math.round(source.height * 0.1),
        width: Math.round(source.width * 0.8),
        height: Math.round(source.height * 0.8),
      }
    case 'rotate':
      return { ...base, type: 'rotate', degrees: 0 }
    case 'flip':
      return { ...base, type: 'flip', horizontal: false, vertical: false }
    case 'adjust':
      return { ...base, type: 'adjust', brightness: Tone.Neutral, contrast: Tone.Neutral, saturation: Tone.Neutral }
    case 'filter':
      return { ...base, type: 'filter', filter: FilterKind.None }
    case 'text':
      return {
        ...base,
        type: 'text',
        text: 'Sample text',
        x: Math.round(source.width / 2),
        y: Math.round(source.height / 2),
        fontSize: Math.max(12, Math.round(source.height * 0.08)),
        color: '#ffffff',
        fontFamily: 'sans-serif',
        align: 'center',
        bold: false,
        italic: false,
      }
    case 'local-area':
      return {
        ...base,
        type: 'local-area',
        shape: defaultShape('rectangle', source.width, source.height),
        brightness: Tone.Neutral,
        contrast: Tone.Neutral,
        saturation: Tone.Neutral,
      }
  }
}

export function describeOp(op: EditOp): string {
  switch (op.type) {
    case 'crop':
      return `${Math.round(op.width)}×${Math.round(op.height)} @ ${Math.round(op.x)},${Math.round(op.y)}`
    case 'rotate':
      return `${op.degrees}°`
    case 'flip':
      if (op.horizontal && op.vertical) return 'horizontal + vertical'
      if (op.horizontal) return 'horizontal'
      if (op.vertical) return 'vertical'
      return 'none'
    case 'adjust':
      return `B ${op.brightness}% · C ${op.contrast}% · S ${op.saturation}%`
    case 'filter':
      return op.filter === FilterKind.None ? 'no filter' : op.filter
    case 'text': {
      const firstLine = op.text.split('\n')[0] ?? ''
      const preview = firstLine.length > 18 ? `${firstLine.slice(0, 18)}…` : firstLine
      return preview ? `"${preview}" · ${op.fontSize}px` : `(empty) · ${op.fontSize}px`
    }
    case 'local-area':
      return `${shapeLabel(op.shape)} · B${op.brightness}% C${op.contrast}% S${op.saturation}%`
  }
}

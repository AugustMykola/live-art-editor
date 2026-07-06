import type { ShapeKind } from './types'

export const SHAPE_KINDS: { value: ShapeKind; label: string; icon: string }[] = [
  { value: 'rectangle', label: 'Rectangle', icon: 'mdi-vector-rectangle' },
  { value: 'circle', label: 'Circle', icon: 'mdi-vector-circle' },
  { value: 'bezier', label: 'Curve', icon: 'mdi-vector-curve' },
]

export const BEZIER_POINT_COUNT = 6

export const POINT_HANDLE_RADIUS = 14

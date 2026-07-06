import type { EditOpType, FilterOption } from './types'

export const Tone = {
  Min: 0,
  Neutral: 100,
  Max: 200,
  Step: 1,
} as const

export const FilterKind = {
  None: 'none',
  Grayscale: 'grayscale',
  Sepia: 'sepia',
  Invert: 'invert',
} as const
export type FilterKind = (typeof FilterKind)[keyof typeof FilterKind]

export const FILTER_OPTIONS: FilterOption[] = [
  { value: FilterKind.None, label: 'None', icon: 'mdi-circle-off-outline' },
  { value: FilterKind.Grayscale, label: 'Grayscale', icon: 'mdi-contrast-circle' },
  { value: FilterKind.Sepia, label: 'Sepia', icon: 'mdi-white-balance-sunny' },
  { value: FilterKind.Invert, label: 'Invert', icon: 'mdi-invert-colors' },
]

export const OP_LABELS: Record<EditOpType, string> = {
  crop: 'Crop',
  rotate: 'Rotate',
  flip: 'Flip',
  adjust: 'Adjust',
  filter: 'Filter',
  text: 'Text',
  'local-area': 'Local Area',
}

export const OP_ICONS: Record<EditOpType, string> = {
  crop: 'mdi-crop',
  rotate: 'mdi-rotate-right',
  flip: 'mdi-flip-horizontal',
  adjust: 'mdi-tune',
  filter: 'mdi-palette',
  text: 'mdi-format-text',
  'local-area': 'mdi-selection-drag',
}

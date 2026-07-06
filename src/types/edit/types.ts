import type { Shape } from '../shape'
import type { FilterKind } from './constants'

export type EditOpType = 'crop' | 'rotate' | 'flip' | 'adjust' | 'filter' | 'text' | 'local-area'

interface BaseOp {
  id: string
  type: EditOpType
  enabled: boolean
}

export interface CropOp extends BaseOp {
  type: 'crop'
  x: number
  y: number
  width: number
  height: number
}

export interface RotateOp extends BaseOp {
  type: 'rotate'
  degrees: number
}

export interface FlipOp extends BaseOp {
  type: 'flip'
  horizontal: boolean
  vertical: boolean
}

export interface AdjustOp extends BaseOp {
  type: 'adjust'
  brightness: number
  contrast: number
  saturation: number
}

export interface FilterOp extends BaseOp {
  type: 'filter'
  filter: FilterKind
}

export interface FilterOption {
  value: FilterKind
  label: string
  icon: string
}

export type TextAlign = 'left' | 'center' | 'right'
export type TextFontFamily = 'sans-serif' | 'serif' | 'monospace' | 'cursive'

export interface TextOp extends BaseOp {
  type: 'text'
  text: string
  x: number
  y: number
  fontSize: number
  color: string
  fontFamily: TextFontFamily
  align: TextAlign
  bold: boolean
  italic: boolean
}

export interface LocalAreaOp extends BaseOp {
  type: 'local-area'
  shape: Shape
  brightness: number
  contrast: number
  saturation: number
}

export type EditOp = CropOp | RotateOp | FlipOp | AdjustOp | FilterOp | TextOp | LocalAreaOp

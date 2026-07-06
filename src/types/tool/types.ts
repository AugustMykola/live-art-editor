import type { EditOpType } from '../edit'

export type ToolId = EditOpType

export interface ToolDefinition {
  id: ToolId
  label: string
  icon: string
  implemented: boolean
}

export type AspectRatioValue = 'original' | 'free' | number

export interface AspectRatioOption {
  label: string
  value: AspectRatioValue
}

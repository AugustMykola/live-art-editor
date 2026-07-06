import type { AspectRatioOption, ToolDefinition, ToolId } from './types'

export const TOOLS: ToolDefinition[] = [
  { id: 'crop', label: 'Crop', icon: 'mdi-crop', implemented: true },
  { id: 'rotate', label: 'Rotate', icon: 'mdi-rotate-right', implemented: true },
  { id: 'flip', label: 'Flip', icon: 'mdi-flip-horizontal', implemented: true },
  { id: 'adjust', label: 'Adjust', icon: 'mdi-tune', implemented: true },
  { id: 'filter', label: 'Filters', icon: 'mdi-palette-outline', implemented: true },
  { id: 'local-area', label: 'Local Area', icon: 'mdi-selection-drag', implemented: true },
  { id: 'text', label: 'Text', icon: 'mdi-format-text', implemented: true },
]

export const PANEL_TOOL_IDS: ToolId[] = ['crop', 'rotate', 'flip', 'adjust', 'filter', 'local-area', 'text']

export const ASPECT_RATIOS: AspectRatioOption[] = [
  { label: 'Original', value: 'original' },
  { label: 'Freeform', value: 'free' },
  { label: 'Square · 1:1', value: 1 },
  { label: 'Landscape · 4:3', value: 4 / 3 },
  { label: 'Portrait · 3:4', value: 3 / 4 },
  { label: 'Widescreen · 16:9', value: 16 / 9 },
]

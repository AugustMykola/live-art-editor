import type { AspectRatioValue } from './types'

export function aspectRatioToNumber(value: AspectRatioValue, sourceWidth: number, sourceHeight: number): number {
  if (value === 'free') return NaN
  if (value === 'original') return sourceHeight === 0 ? NaN : sourceWidth / sourceHeight
  return value
}

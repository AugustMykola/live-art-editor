export interface Point {
  x: number
  y: number
}

export type ShapeKind = 'rectangle' | 'circle' | 'bezier'

export interface RectangleShape {
  kind: 'rectangle'
  x: number
  y: number
  width: number
  height: number
}

export interface CircleShape {
  kind: 'circle'
  cx: number
  cy: number
  radius: number
}

export interface BezierShape {
  kind: 'bezier'
  points: Point[]
}

export type Shape = RectangleShape | CircleShape | BezierShape

export type ShapeHandle = { kind: 'move' } | { kind: 'point'; index: number }

import { BEZIER_POINT_COUNT, POINT_HANDLE_RADIUS } from './constants'
import type { Point, Shape, ShapeHandle, ShapeKind } from './types'

export function defaultShape(kind: ShapeKind, sourceWidth: number, sourceHeight: number): Shape {
  const width = Math.max(20, Math.round(sourceWidth * 0.3))
  const height = Math.max(20, Math.round(sourceHeight * 0.3))
  const cx = Math.round(sourceWidth / 2)
  const cy = Math.round(sourceHeight / 2)

  switch (kind) {
    case 'rectangle':
      return { kind: 'rectangle', x: Math.round(cx - width / 2), y: Math.round(cy - height / 2), width, height }
    case 'circle':
      return { kind: 'circle', cx, cy, radius: Math.round(Math.min(width, height) / 2) }
    case 'bezier': {
      const radius = Math.min(width, height) / 2
      const points: Point[] = Array.from({ length: BEZIER_POINT_COUNT }, (_, index) => {
        const angle = (index / BEZIER_POINT_COUNT) * Math.PI * 2
        return { x: Math.round(cx + Math.cos(angle) * radius), y: Math.round(cy + Math.sin(angle) * radius) }
      })
      return { kind: 'bezier', points }
    }
  }
}

export function shapeLabel(shape: Shape): string {
  switch (shape.kind) {
    case 'rectangle':
      return `Rectangle ${Math.round(shape.width)}×${Math.round(shape.height)}`
    case 'circle':
      return `Circle r=${Math.round(shape.radius)}`
    case 'bezier':
      return `Curve (${shape.points.length} pts)`
  }
}

export function buildShapePath(shape: Shape): Path2D {
  const path = new Path2D()
  switch (shape.kind) {
    case 'rectangle':
      path.rect(shape.x, shape.y, shape.width, shape.height)
      break
    case 'circle':
      path.arc(shape.cx, shape.cy, Math.max(0, shape.radius), 0, Math.PI * 2)
      break
    case 'bezier': {
      const points = shape.points
      if (points.length < 3) {
        points.forEach((point, index) => (index === 0 ? path.moveTo(point.x, point.y) : path.lineTo(point.x, point.y)))
      } else {
        const midpoint = (a: Point, b: Point) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
        const start = midpoint(points[points.length - 1], points[0])
        path.moveTo(start.x, start.y)
        for (let i = 0; i < points.length; i += 1) {
          const next = points[(i + 1) % points.length]
          const knot = midpoint(points[i], next)
          path.quadraticCurveTo(points[i].x, points[i].y, knot.x, knot.y)
        }
      }
      path.closePath()
      break
    }
  }
  return path
}

export function hitTestShape(shape: Shape, point: Point): ShapeHandle | null {
  if (shape.kind === 'bezier') {
    const index = shape.points.findIndex((p) => Math.hypot(p.x - point.x, p.y - point.y) <= POINT_HANDLE_RADIUS)
    return index >= 0 ? { kind: 'point', index } : null
  }
  if (shape.kind === 'rectangle') {
    const inside =
      point.x >= shape.x && point.x <= shape.x + shape.width && point.y >= shape.y && point.y <= shape.y + shape.height
    return inside ? { kind: 'move' } : null
  }
  const inside = Math.hypot(point.x - shape.cx, point.y - shape.cy) <= shape.radius
  return inside ? { kind: 'move' } : null
}

export function shapeGrabOffset(shape: Shape, handle: ShapeHandle, point: Point): Point {
  if (handle.kind === 'move') {
    if (shape.kind === 'rectangle') return { x: point.x - shape.x, y: point.y - shape.y }
    if (shape.kind === 'circle') return { x: point.x - shape.cx, y: point.y - shape.cy }
  }
  if (handle.kind === 'point' && shape.kind === 'bezier') {
    const target = shape.points[handle.index]
    return { x: point.x - target.x, y: point.y - target.y }
  }
  return { x: 0, y: 0 }
}

export function transformShape(shape: Shape, handle: ShapeHandle, point: Point, grabOffset: Point): Shape {
  if (handle.kind === 'move') {
    if (shape.kind === 'rectangle') return { ...shape, x: point.x - grabOffset.x, y: point.y - grabOffset.y }
    if (shape.kind === 'circle') return { ...shape, cx: point.x - grabOffset.x, cy: point.y - grabOffset.y }
    return shape
  }
  if (shape.kind === 'bezier') {
    const points = shape.points.map((p, index) =>
      index === handle.index ? { x: point.x - grabOffset.x, y: point.y - grabOffset.y } : p,
    )
    return { ...shape, points }
  }
  return shape
}

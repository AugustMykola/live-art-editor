import { defineStore } from 'pinia'
import { renderPipeline } from '../lib/pipeline'
import type { EditDocument } from '../lib/export'
import { createDefaultOp, type EditOp, type EditOpType } from '../types/edit'

const HISTORY_LIMIT = 50

function cloneOps(ops: EditOp[]): EditOp[] {
  return ops.map((op) => ({ ...op }))
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not read this file as an image.'))
    image.src = src
  })
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read this file.'))
    reader.readAsDataURL(file)
  })
}

interface EditorState {
  fileName: string | null
  sourceImage: HTMLImageElement | null
  sourceDataUrl: string | null
  sourceWidth: number
  sourceHeight: number
  ops: EditOp[]
  selectedOpId: string | null
  past: EditOp[][]
  future: EditOp[][]
  dragSnapshot: EditOp[] | null
}

export const useEditorStore = defineStore('editor', {
  state: (): EditorState => ({
    fileName: null,
    sourceImage: null,
    sourceDataUrl: null,
    sourceWidth: 0,
    sourceHeight: 0,
    ops: [],
    selectedOpId: null,
    past: [],
    future: [],
    dragSnapshot: null,
  }),

  getters: {
    hasImage: (state) => state.sourceImage !== null,
    canUndo: (state) => state.past.length > 0,
    canRedo: (state) => state.future.length > 0,
    selectedOp: (state): EditOp | null => state.ops.find((op) => op.id === state.selectedOpId) ?? null,
  },

  actions: {
    async loadImageFromDataUrl(dataUrl: string, fileName: string | null = null) {
      let img: HTMLImageElement
      try {
        img = await loadImageElement(dataUrl)
      } catch {
        throw new Error('The image could not be decoded — the file may be corrupted or not an image.')
      }
      this.fileName = fileName
      this.sourceImage = img
      this.sourceDataUrl = dataUrl
      this.sourceWidth = img.naturalWidth
      this.sourceHeight = img.naturalHeight
      this.ops = []
      this.selectedOpId = null
      this.past = []
      this.future = []
      this.dragSnapshot = null
    },

    async loadImage(file: File) {
      await this.loadImageFromDataUrl(await readAsDataUrl(file), file.name)
    },

    async loadProject(doc: EditDocument) {
      if (!doc.sourceDataUrl) throw new Error('This file has no embedded image.')
      await this.loadImageFromDataUrl(doc.sourceDataUrl, doc.fileName)
      this.ops = cloneOps(doc.ops)
    },

    render(upTo?: number): HTMLCanvasElement | null {
      if (!this.sourceImage) return null
      return renderPipeline(this.sourceImage, this.sourceWidth, this.sourceHeight, this.ops, upTo)
    },

    renderFrom(base: HTMLCanvasElement, fromIndex: number): HTMLCanvasElement {
      return renderPipeline(base, base.width, base.height, this.ops.slice(fromIndex))
    },

    pushHistory() {
      this.past.push(cloneOps(this.ops))
      if (this.past.length > HISTORY_LIMIT) this.past.shift()
      this.future = []
    },

    addOp(type: EditOpType): EditOp | null {
      if (!this.sourceImage) return null
      this.pushHistory()
      const previous = this.render(this.ops.length)
      const opInput = previous ?? { width: this.sourceWidth, height: this.sourceHeight }
      const op = createDefaultOp(type, opInput)
      this.ops.push(op)
      this.selectedOpId = op.id
      return op
    },

    importOps(ops: EditOp[]) {
      if (!this.sourceImage) return
      this.pushHistory()
      this.ops = cloneOps(ops)
      this.selectedOpId = null
    },

    updateOp(id: string, patch: Partial<EditOp>) {
      const op = this.ops.find((o) => o.id === id)
      if (!op) return
      this.pushHistory()
      Object.assign(op, patch)
    },

    patchOpLive(id: string, patch: Partial<EditOp>) {
      const op = this.ops.find((o) => o.id === id)
      if (!op) return
      Object.assign(op, patch)
    },

    beginDrag() {
      this.dragSnapshot = cloneOps(this.ops)
    },

    endDrag() {
      if (!this.dragSnapshot) return
      this.past.push(this.dragSnapshot)
      if (this.past.length > HISTORY_LIMIT) this.past.shift()
      this.future = []
      this.dragSnapshot = null
    },

    toggleOp(id: string) {
      const op = this.ops.find((o) => o.id === id)
      if (!op) return
      this.pushHistory()
      op.enabled = !op.enabled
    },

    removeOp(id: string) {
      this.pushHistory()
      this.ops = this.ops.filter((o) => o.id !== id)
      if (this.selectedOpId === id) this.selectedOpId = null
    },

    moveOp(id: string, direction: -1 | 1) {
      const index = this.ops.findIndex((o) => o.id === id)
      const target = index + direction
      if (index === -1 || target < 0 || target >= this.ops.length) return
      this.pushHistory()
      const [op] = this.ops.splice(index, 1)
      this.ops.splice(target, 0, op)
    },

    selectOp(id: string | null) {
      this.selectedOpId = id
    },

    undo() {
      if (this.past.length === 0) return
      this.future.push(cloneOps(this.ops))
      this.ops = this.past.pop()!
      if (!this.ops.some((o) => o.id === this.selectedOpId)) this.selectedOpId = null
    },

    redo() {
      if (this.future.length === 0) return
      this.past.push(cloneOps(this.ops))
      this.ops = this.future.pop()!
      if (!this.ops.some((o) => o.id === this.selectedOpId)) this.selectedOpId = null
    },

    reset() {
      if (this.ops.length === 0) return
      this.pushHistory()
      this.ops = []
      this.selectedOpId = null
    },
  },
})

import { defineStore } from 'pinia'
import { markRaw } from 'vue'
import type { CropController } from '../lib/cropController'
import type { ToolId } from '../types/tool'

export type MobilePanel = 'tools' | 'operations' | 'export' | null
export type ToastColor = 'success' | 'warning' | 'error' | 'info'
export interface Toast {
  message: string
  color: ToastColor
}

interface UiState {
  activeTool: ToolId | null
  zoom: number
  showOriginal: boolean
  mobilePanel: MobilePanel
  cropController: CropController | null
  toast: Toast | null
}

const ZOOM_MIN = 0.25
const ZOOM_MAX = 3
const ZOOM_STEP = 0.25
const ZOOM_DEFAULT = 1

export const useUiStore = defineStore('ui', {
  state: (): UiState => ({
    activeTool: null,
    zoom: ZOOM_DEFAULT,
    showOriginal: false,
    mobilePanel: null,
    cropController: null,
    toast: null,
  }),

  actions: {
    setActiveTool(tool: ToolId | null) {
      this.activeTool = tool
    },

    zoomIn() {
      this.zoom = Math.min(ZOOM_MAX, +(this.zoom + ZOOM_STEP).toFixed(2))
    },

    zoomOut() {
      this.zoom = Math.max(ZOOM_MIN, +(this.zoom - ZOOM_STEP).toFixed(2))
    },

    zoomToFit() {
      this.zoom = ZOOM_DEFAULT
    },

    toggleOriginal(value?: boolean) {
      this.showOriginal = value ?? !this.showOriginal
    },

    openMobilePanel(panel: MobilePanel) {
      this.mobilePanel = this.mobilePanel === panel ? null : panel
    },

    setCropController(controller: CropController | null) {
      this.cropController = controller ? markRaw(controller) : null
    },

    notify(message: string, color: ToastColor = 'info') {
      this.toast = { message, color }
    },

    dismissToast() {
      this.toast = null
    },
  },
})

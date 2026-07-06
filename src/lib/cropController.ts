export interface CropRect {
  x: number
  y: number
  width: number
  height: number
}

export interface CropController {
  getData(): CropRect
  setData(rect: Partial<CropRect>): void
  setAspectRatio(ratio: number): void
  destroy(): void
}

export interface CropControllerOptions {
  initial?: CropRect
  aspectRatio?: number
  onChange?: (rect: CropRect) => void
}

export async function createCropController(
  image: HTMLImageElement,
  options: CropControllerOptions = {},
): Promise<CropController> {
  const [{ default: Cropper }] = await Promise.all([import('cropperjs'), import('cropperjs/dist/cropper.css')])

  const cropper = new Cropper(image, {
    viewMode: 1,
    autoCropArea: 1,
    background: false,
    aspectRatio: options.aspectRatio ?? NaN,
    data: options.initial,
    ready() {
      if (options.initial) cropper.setData(options.initial)
    },
    crop(event) {
      options.onChange?.({
        x: event.detail.x,
        y: event.detail.y,
        width: event.detail.width,
        height: event.detail.height,
      })
    },
  })

  return {
    getData() {
      const data = cropper.getData(true)
      return { x: data.x, y: data.y, width: data.width, height: data.height }
    },
    setData(rect) {
      cropper.setData(rect)
    },
    setAspectRatio(ratio) {
      cropper.setAspectRatio(ratio)
    },
    destroy() {
      cropper.destroy()
    },
  }
}

import { ref } from 'vue'
import { useEditorStore } from '../stores/editor'
import { useUiStore } from '../stores/ui'
import { exportJson, exportPng, parseEditDocument, toEditDocument } from '../lib/export'

export function useEditDocumentActions() {
  const editor = useEditorStore()
  const ui = useUiStore()
  const importInputRef = ref<HTMLInputElement | null>(null)

  async function handleExportPng() {
    const canvas = editor.render()
    if (canvas) await exportPng(canvas, editor.fileName)
  }

  function handleExportJson() {
    exportJson(toEditDocument(editor))
  }

  function openImportPicker() {
    importInputRef.value?.click()
  }

  function handleImportJsonChange(event: Event) {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    target.value = ''
    if (file) void importJsonFile(file)
  }

  async function importJsonFile(file: File) {
    let doc
    try {
      doc = parseEditDocument(await file.text())
    } catch (err) {
      ui.notify(err instanceof Error ? err.message : 'Could not import this file.', 'error')
      return
    }

    const opCount = `${doc.ops.length} operation${doc.ops.length === 1 ? '' : 's'}`

    if (doc.sourceDataUrl) {
      try {
        await editor.loadProject(doc)
        ui.notify(`Opened project with ${opCount}.`, 'success')
      } catch (err) {
        ui.notify(err instanceof Error ? err.message : 'Could not open this project.', 'error')
      }
      return
    }

    if (!editor.hasImage) {
      ui.notify('This file has no image in it — open an image first, then import the recipe.', 'warning')
      return
    }
    if (
      doc.sourceWidth &&
      doc.sourceHeight &&
      (doc.sourceWidth !== editor.sourceWidth || doc.sourceHeight !== editor.sourceHeight)
    ) {
      ui.notify(
        `This recipe was made for a ${doc.sourceWidth}×${doc.sourceHeight} image — the loaded image is ${editor.sourceWidth}×${editor.sourceHeight}, so positions may be off.`,
        'warning',
      )
    }
    editor.importOps(doc.ops)
    ui.notify(`Imported ${opCount}.`, 'success')
  }

  return {
    importInputRef,
    handleExportPng,
    handleExportJson,
    openImportPicker,
    handleImportJsonChange,
    importJsonFile,
  }
}

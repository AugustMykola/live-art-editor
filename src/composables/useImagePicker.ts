import { ref } from 'vue'

export function useImagePicker(onSelect: (file: File) => void) {
  const inputRef = ref<HTMLInputElement | null>(null)

  function openPicker() {
    inputRef.value?.click()
  }

  function handleChange(event: Event) {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) onSelect(file)
    target.value = ''
  }

  return { inputRef, openPicker, handleChange }
}

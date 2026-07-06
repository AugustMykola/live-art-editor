<script setup lang="ts">
import { Tone } from '../../types/edit'

type ToneField = 'brightness' | 'contrast' | 'saturation'

defineProps<{
  brightness: number
  contrast: number
  saturation: number
}>()

const emit = defineEmits<{
  patch: [field: ToneField, value: number]
  start: []
  end: []
}>()

const SLIDERS: { field: ToneField; label: string }[] = [
  { field: 'brightness', label: 'Brightness' },
  { field: 'contrast', label: 'Contrast' },
  { field: 'saturation', label: 'Saturation' },
]
</script>

<template>
  <div class="d-flex flex-column ga-4">
    <div v-for="slider in SLIDERS" :key="slider.field">
      <div class="d-flex justify-space-between text-caption text-medium-emphasis mb-1">
        <span>{{ slider.label }}</span>
        <span>{{ $props[slider.field] }}%</span>
      </div>
      <v-slider
        :model-value="$props[slider.field]"
        :min="Tone.Min"
        :max="Tone.Max"
        :step="Tone.Step"
        hide-details
        color="primary"
        @update:model-value="emit('patch', slider.field, $event)"
        @start="emit('start')"
        @end="emit('end')"
      />
    </div>
  </div>
</template>

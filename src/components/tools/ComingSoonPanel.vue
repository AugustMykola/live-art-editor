<script setup lang="ts">
  defineProps<{ label: string }>()
</script>

<template>
  <div class="text-body-2 text-medium-emphasis">
    {{ label }} isn't implemented yet — it's out of scope for this pass, but the
    tool rail and settings panel are already wired up to support it.
  </div>
</template>

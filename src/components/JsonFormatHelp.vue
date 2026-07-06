<script setup lang="ts">
import { ref } from 'vue'

const open = ref(false)

const example = `{
  "version": 1,
  "fileName": "photo.jpg",
  "sourceDataUrl": "data:image/png;base64, …",
  "sourceWidth": 1920,
  "sourceHeight": 1080,
  "ops": [
    { "type": "adjust", "brightness": 106, "contrast": 112, "saturation": 125 },
    { "type": "filter", "filter": "grayscale" },
    { "type": "text", "text": "Hello", "x": 960, "y": 980, "fontSize": 48 }
  ]
}`
</script>

<template>
  <v-menu v-model="open" :close-on-content-click="false" location="bottom end" offset="6" max-width="440">
    <template #activator="{ props }">
      <v-btn
        icon="mdi-help-circle-outline"
        size="x-small"
        variant="text"
        density="comfortable"
        aria-label="About the Import JSON format"
        v-bind="props"
      />
    </template>

    <v-card class="json-help-card" max-width="440">
      <v-card-title class="d-flex align-center text-body-1 font-weight-medium">
        <v-icon icon="mdi-code-json" size="20" class="mr-2" />
        What can I import?
      </v-card-title>

      <v-card-text class="text-body-2">
        <p class="mb-3">
          Import accepts <strong>only JSON files this editor creates</strong> with
          <strong>Export JSON</strong> — not arbitrary JSON, and not an image encoded inside some other
          JSON. The file describes your edits as data, so it can be re-applied later.
        </p>

        <p class="mb-2">There are two variants of the same format:</p>
        <ul class="variants mb-3">
          <li>
            <strong>Project</strong> — includes the picture itself in
            <code>sourceDataUrl</code>, so it opens on its own (even with nothing loaded).
          </li>
          <li>
            <strong>Recipe</strong> — the same file <em>without</em> <code>sourceDataUrl</code>: just the
            list of edits, applied on top of the image you already have open.
          </li>
        </ul>

        <div class="text-overline text-medium-emphasis mb-1">Example structure</div>
        <pre class="example"><code>{{ example }}</code></pre>
        <p class="text-caption text-medium-emphasis mt-2 mb-0">
          Unknown or malformed operations are skipped; the rest still load.
        </p>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<style scoped>
.variants {
  padding-left: 20px;
}
.variants li {
  margin-bottom: 6px;
}
.example {
  background: rgba(var(--v-theme-on-surface), 0.06);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  padding: 12px;
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
  overflow-x: auto;
  white-space: pre;
}
code {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}
</style>

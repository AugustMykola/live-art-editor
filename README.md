# Live Art Editor

Non-destructive, browser-only image editor. Every edit (crop, rotate, flip, brightness/contrast/saturation,
filters, local-area adjustments, text overlays) is stored as a small data object in an ordered ops stack, not
baked into pixels — so you can reorder, disable, tweak, undo/redo, or re-export the recipe at any time. Nothing
leaves the browser: images are read as data URLs and rendered to `<canvas>` locally.

## Features

- **Crop** — freeform or fixed aspect ratio (via [cropperjs](https://github.com/fengyuanchen/cropperjs)).
- **Rotate** — 90° steps, left/right.
- **Flip** — horizontal / vertical, independently toggleable.
- **Adjust** — brightness / contrast / saturation sliders.
- **Filters** — grayscale, sepia, invert (CSS-filter based).
- **Local Area** — brightness/contrast/saturation applied only inside a rectangle, circle, or freehand (bezier)
  shape drawn on the canvas.
- **Text** — positioned, styled (font family/size/color/bold/italic/alignment) text overlay.
- **Non-destructive ops stack** — every operation is a card in the Operations strip: toggle visibility, delete,
  reorder, or click to re-open its settings panel. Full undo/redo history.
- **Export** — PNG (flattened render) or JSON (the full edit recipe, optionally with the source image embedded,
  see [Import/Export format](#importexport-json-format) below).
- **Responsive layout** — a three-pane desktop layout (canvas / operations strip / settings panel) that collapses
  into a bottom-navigation + sliding sheet layout on mobile, reusing the exact same components.

## Key decisions

- **Non-destructive editing**: an immutable `sourceImage`/`sourceDataUrl` plus a typed `EditOp` union
  (crop/rotate/flip/adjust/filter/text/local-area) in a Pinia store (`stores/editor.ts`). The pipeline always
  redraws from the original source through the ops — nothing is ever written back into it.
- **Ops stack, not single-slot**: instead of one `cropOp`/`adjustOp`/`filterOp` per type, the store keeps an
  *ordered array* of ops, each with its own id. You can stack several crops, rotates, flips, text layers, or
  local-area regions, and independently reorder/toggle/delete/re-select any of them (`OperationsStrip.vue`).
  This trades the simplicity of "one flat state shape per property" for supporting real documents (multiple
  text layers, several differently-adjusted regions, a rotate + a separate re-crop, etc.) — closer to a
  history/layers stack than a single settings form.
- **Two mutation modes on the store**, matching how the input behaves: `updateOp()` for one discrete commit
  (push history immediately — clicking a filter, toggling a flip axis), vs. `beginDrag()` → `patchOpLive()`
  (repeatable, no history push) → `endDrag()` for continuous input (slider drag, crop/text/shape dragging) —
  the whole gesture becomes a single undo step, exactly like "drag a slider back to neutral = fully undone".

### Trade-offs

- **Preview and export share one interpreter**: `lib/pipeline.ts`'s `renderPipeline(source, w, h, ops, upTo?)` is
  the *only* place ops turn into pixels. The live on-canvas preview, the per-op history thumbnails, the
  "compare to original" view, and PNG export all call it — there's no separate cheap "preview math" that could
  drift from what actually gets exported; adjust/filter/local-area all resolve to the same CSS filter string
  (`toneToCssFilter`/`FILTER_CSS`) drawn with `ctx.filter` on a real canvas, not a GPU-composited CSS overlay.
- **Cost of that simplicity**: because every change re-runs the pipeline, a naive redraw would re-apply the
  *entire* ops stack from the original image on every reactive tick. For pointer-driven interactions on the
  canvas itself (crop rectangle, dragging text/a shape) `ImageCanvas.vue` caches the canvas rendered up to the
  dragged op (`beginOpDrag`/`dragBase`) and only re-applies `renderFrom(base, index)` — the tail of the stack —
  on each pointer move, instead of the whole thing. Slider-driven ops (Adjust/Local Area panels) don't use that
  cache and do redraw the full stack per tick; with the small op counts this editor targets that's fast enough
  in practice, so the extra caching wasn't worth the added complexity there too.

### Bonuses

- **Filters** — grayscale/sepia/invert are just another `FilterOp.filter` (`FilterKind`), folded into the exact
  same CSS-filter-string path as brightness/contrast/saturation, not a separate code path.
- **Export JSON** — `toEditDocument()` (`lib/export.ts`) turns the store into an `EditDocument` v1
  (`fileName`/`sourceWidth`/`sourceHeight`/optional `sourceDataUrl` + `ops[]`).
- **Import JSON** — `parseEditDocument()` runtime-validates untrusted input (`isValidOp`/`isValidShape` per op
  type; unknown/malformed ops are silently dropped, the rest still load) before handing off to
  `editor.importOps()`/`editor.loadProject()`.
- **Replay** — `renderPipeline` *is* the interpreter: import and export both speak the same `EditOp` shape, so
  "replay a recipe" is just re-running the pipeline against the same (or a freshly loaded) original image —
  no bespoke replay logic.

## Tech stack

- [Vue 3](https://vuejs.org/) (`<script setup>`, Composition API) + [TypeScript](https://www.typescriptlang.org/)
- [Vuetify 3](https://vuetifyjs.com/) for UI components — **pinned to `^3.12.9`**, do not let it drift to v4
  (see [Development notes](#development-notes))
- [Pinia](https://pinia.vuejs.org/) for state (two stores, see [Architecture](#architecture))
- [Vue Router](https://router.vuejs.org/) — two routes, `/` (home/upload) and `/editor` (guarded: redirects to
  home if no image is loaded)
- [cropperjs](https://github.com/fengyuanchen/cropperjs) for the crop UI (isolated behind an internal interface,
  see `lib/cropController.ts`)
- [Vite](https://vitejs.dev/) for dev/build tooling

## Getting started

```sh
npm install
npm run dev      # start the dev server (Vite)
npm run build    # type-check (vue-tsc -b) + production build
npm run preview  # preview the production build locally
```

There is a sample edit document at [samples/test-image.json](samples/test-image.json) you can load via
**Open project (JSON)** on the home screen or **Import JSON** in the editor toolbar.

## Project structure

```
src/
  types/
    edit/        EditOp union (crop/rotate/flip/adjust/filter/text/local-area) + constants + pure helpers
    shape/        Shape union (rectangle/circle/bezier) + geometry helpers for the Local Area tool
    tool/         ToolId/ToolDefinition/TOOLS registry — drives the settings-panel tool tabs
  lib/
    pipeline.ts        renderPipeline(source, w, h, ops, upTo?) — pure canvas-in/canvas-out renderer, no framework deps
    cropController.ts  wraps cropperjs behind a small interface (only file that imports cropperjs directly)
    export.ts          EditDocument (JSON export shape), exportPng/exportJson/parseEditDocument
  stores/
    editor.ts    document store — source image, ops stack, undo/redo (past/future), drag session helpers
    ui.ts        view-only store — active tool, zoom, showOriginal, mobile panel, crop controller instance
  components/
    AppToolbar.vue, OperationsStrip.vue, SettingsPanel.vue, ImageCanvas.vue, CanvasZoomBar.vue,
    MobileBottomNav.vue, DocumentActionButtons.vue, JsonFormatHelp.vue
    tools/       one settings panel per tool (CropPanel, RotatePanel, FlipPanel, AdjustPanel, FilterPanel,
                 TextPanel, LocalAreaPanel, ToneSliders, ComingSoonPanel)
  composables/
    useImagePicker.ts          shared hidden-<input type=file> pattern
    useEditDocumentActions.ts  export PNG/JSON, import JSON (with validation + user-facing toasts)
  views/
    HomeView.vue    drop/open an image or a project JSON
    EditorView.vue  desktop vs. mobile layout branch (useDisplay().mdAndUp), same components either way
  router/index.ts  '/' (home) and '/editor' (guarded on hasImage)
```

## Architecture

- **Data model**: `types/edit` defines the `EditOp` discriminated union (`crop | rotate | flip | adjust | filter
  | text | local-area`). Every op is plain, serializable data — no framework or canvas references.
- **Rendering**: `lib/pipeline.ts`'s `renderPipeline` takes the source image and the ops array and produces a
  `<canvas>` by applying each *enabled* op in order, up to an optional `upTo` index (used for per-op thumbnails
  and for scrubbing history). Renders are pure — call it as many times as you like, it never mutates state.
- **Editor store** (`stores/editor.ts`): owns `ops`, `selectedOpId`, `past`/`future` undo history. Two ways to
  mutate an op:
  - `updateOp(id, patch)` — one discrete commit, pushes history immediately (e.g. clicking a filter, toggling a
    flip axis).
  - `beginDrag()` → `patchOpLive(id, patch)` (repeatable) → `endDrag()` — a *session* for continuous input
    (sliders, crop-rectangle dragging): only one history entry is pushed for the whole gesture.
- **UI store** (`stores/ui.ts`): deliberately separate from the editor store (SRP) — active tool, zoom level,
  "show original" toggle, which mobile sheet is open, and the (non-reactive, `markRaw`-wrapped) crop controller
  instance.
- **Tools & panels**: `types/tool` has a `TOOLS` registry (id/label/icon) and `PANEL_TOOL_IDS`. Every panel tool
  gets a tab in `SettingsPanel.vue`'s tab bar and a component in its `PANEL_COMPONENTS` map. The tab bar is a
  pure *view switcher* (`ui.setActiveTool(id)` only) — clicking a tab never searches the ops stack for a
  matching op, selects one, or creates one. An op only becomes selected/created through an explicit action:
  **Add Operation** (in `OperationsStrip.vue`) creates a new op with a neutral default (see `createDefaultOp`),
  selects it, and opens its panel; clicking a specific op's card in the Operations strip selects that exact op.
  If a tab's tool has no currently-selected op of its type, its panel shows a "Add a … operation to …" empty
  state instead of guessing which existing op to show — on mobile, creating/selecting an op like this also
  switches the bottom sheet from "Operations" to "Tools".
- **Local Area (shapes)**: `types/shape` owns geometry (hit-testing, drag/transform, path-building for
  clip+stroke). `ImageCanvas.vue` draws the dashed selection overlay directly on top of the rendered preview and
  reuses the same begin/patch/end drag session pattern as everything else.
- **Import/export**: see below.

### Import/export JSON format

`Export JSON` writes an `EditDocument`:

```jsonc
{
  "version": 1,
  "fileName": "photo.jpg",
  "sourceDataUrl": "data:image/png;base64,…", // present for a full "project", omitted for a "recipe"
  "sourceWidth": 1920,
  "sourceHeight": 1080,
  "ops": [
    { "type": "adjust", "brightness": 106, "contrast": 112, "saturation": 125 },
    { "type": "filter", "filter": "grayscale" },
    { "type": "text", "text": "Hello", "x": 960, "y": 980, "fontSize": 48 }
  ]
}
```

Two variants of the same shape:
- **Project** — includes `sourceDataUrl`, so it can be opened standalone (nothing needs to be loaded first).
- **Recipe** — the same file without `sourceDataUrl`: just the ops, replayed on top of whatever image is
  currently open (a warning is shown if the loaded image's dimensions don't match `sourceWidth`/`sourceHeight`).

`parseEditDocument` (in `lib/export.ts`) validates structurally on import: unknown/malformed ops are silently
skipped, the rest still load. See `JsonFormatHelp.vue` for the in-app help popover shown next to "Import JSON".

## Adding a new operation type

1. Add the type to `EditOpType` and its interface in `types/edit/types.ts`.
2. Add a case to `createDefaultOp` (neutral default value), `OP_LABELS`, `OP_ICONS`, `describeOp`
   (`types/edit/helpers.ts` / `constants.ts`).
3. Add a case to `applyOp` in `lib/pipeline.ts`.
4. Add a case to `isValidOp` in `lib/export.ts` — **easy to forget**, otherwise JSON import silently drops the op.
5. If it should be user-adjustable via a panel: add it to `TOOLS`/`PANEL_TOOL_IDS` in `types/tool/constants.ts`,
   create `components/tools/<Name>Panel.vue`, register it in `SettingsPanel.vue`'s `PANEL_COMPONENTS` map, and
   add the type to the `isPanelType` guard in `OperationsStrip.vue`.

## Development notes

- Vuetify is pinned to `^3.12.9` in `package.json` — running `npm install vuetify` bare will pull v4 by default
  in some environments; don't let it drift back to v4.
- Desktop vs. mobile is a single layout branch in `EditorView.vue` (`useDisplay().mdAndUp`) reusing the same
  components in different arrangements — there is no separate mobile component tree.
- The `/editor` route redirects to `/` if no image is loaded (`router/index.ts`'s `beforeEnter` guard checks
  `editor.hasImage`); loading an image is what makes `/editor` reachable.
- `SettingsPanel.vue`'s tool tabs must stay "dumb" (`ui.setActiveTool(id)` only). There used to be a
  `selectOrCreateOp()` store action that a tab click would call to reuse/auto-create an op of that type — it
  was removed because it silently jumped to or mutated an arbitrary existing op from the ops stack whenever you
  clicked a tab, which is surprising in a stack model where a type can have zero, one, or many ops. Don't
  reintroduce that pattern; op selection/creation should always be an explicit user action (Add Operation, or
  clicking a specific op card).
- `vite.config.ts`'s `optimizeDeps.include` explicitly lists every `vuetify/components/*` module actually used
  (plus `cropperjs`). Without it, a freshly started dev server discovers those auto-imported Vuetify components
  lazily — a few more each time you navigate deeper (home → `/editor` → each tool panel) — triggering a fresh
  "optimized dependencies changed, reloading" *full page reload* on every discovery. On a cold `npm run dev`
  that reload can land mid-action (e.g. right as you pick a file in "Open image"), silently dropping it and
  requiring a retry. If you add a new Vuetify component tag somewhere, add its `vuetify/components/VXxx` entry
  here too, or the reload storm (and the "first action after starting the dev server does nothing" symptom)
  comes back. This only affects `npm run dev`; production builds are unaffected.

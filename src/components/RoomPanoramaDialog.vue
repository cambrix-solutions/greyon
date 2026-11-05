<template>
  <q-dialog
    :model-value="modelValue"
    maximized
    transition-show="fade"
    transition-hide="fade"
    @update:model-value="emit('update:modelValue', $event)"
    @show="boot"
    @hide="shutdown"
  >
    <div class="pano">
      <div ref="stageEl" class="pano__stage" />

      <div class="pano__bar">
        <h2 id="pano-title" class="pano__title">{{ title || "360° view" }}</h2>
      </div>

      <button
        type="button"
        class="pano__close"
        aria-label="Close 360° view"
        @click="close"
      >
        <q-icon name="close" size="22px" />
      </button>

      <div
        v-if="phase === 'ready'"
        class="pano__zoom"
        role="group"
        aria-label="Zoom"
      >
        <button type="button" aria-label="Zoom in" @click="zoom(-1)">+</button>
        <button type="button" aria-label="Zoom out" @click="zoom(1)">−</button>
      </div>

      <p v-if="phase === 'ready'" class="pano__hint">
        Drag to look around · pinch or zoom
      </p>

      <div v-if="phase === 'loading'" class="pano__veil" role="status">
        <span class="pano__spinner" aria-hidden="true" />
        <p>Loading 360° view…</p>
      </div>

      <div v-else-if="phase === 'error'" class="pano__veil" role="alert">
        <h2>This view didn’t load</h2>
        <p>{{ errorMessage }}</p>
        <button type="button" class="pano__retry" @click="boot">
          Try again
        </button>
      </div>
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, shallowRef, watch } from "vue";

type PannellumViewer = {
  on: (event: string, callback: (arg?: unknown) => void) => unknown;
  destroy: () => void;
  getHfov: () => number;
  setHfov: (hfov: number, duration?: number) => unknown;
  resize: () => void;
};

type PannellumApi = {
  viewer: (
    container: HTMLElement,
    config: Record<string, unknown>
  ) => PannellumViewer;
};

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    src: string;
    title?: string;
  }>(),
  { title: "" }
);

const emit = defineEmits<{
  "update:modelValue": [open: boolean];
}>();

const stageEl = ref<HTMLElement | null>(null);
const phase = ref<"loading" | "ready" | "error">("loading");
const errorMessage = ref("");
const viewer = shallowRef<PannellumViewer | null>(null);

let token = 0;
let loadTimer = 0;

function close() {
  emit("update:modelValue", false);
}

function onEscape(event: KeyboardEvent) {
  if (event.key !== "Escape" || !props.modelValue) return;
  event.preventDefault();
  event.stopPropagation();
  close();
}

function destroyViewer() {
  window.clearTimeout(loadTimer);
  loadTimer = 0;
  const current = viewer.value;
  viewer.value = null;
  if (!current) return;
  try {
    current.destroy();
  } catch {
    /* already torn down */
  }
}

function fail(id: number, message: string) {
  if (id !== token) return;
  destroyViewer();
  phase.value = "error";
  errorMessage.value = message;
}

function resolveApi(mod: unknown): PannellumApi | null {
  const record = mod as {
    default?: PannellumApi;
    viewer?: PannellumApi["viewer"];
  };
  if (typeof record.viewer === "function") return record as PannellumApi;
  if (record.default && typeof record.default.viewer === "function") {
    return record.default;
  }
  const fromWindow = (window as Window & { pannellum?: PannellumApi })
    .pannellum;
  if (fromWindow && typeof fromWindow.viewer === "function") return fromWindow;
  return null;
}

async function boot() {
  const id = ++token;
  phase.value = "loading";
  errorMessage.value = "";
  destroyViewer();

  const src = props.src.trim();
  if (!src) {
    fail(id, "No 360° photo is available for this room.");
    return;
  }

  await new Promise<void>(resolve => {
    requestAnimationFrame(() => resolve());
  });
  if (id !== token) return;

  let api: PannellumApi | null = null;
  try {
    const [mod] = await Promise.all([
      import("pannellum"),
      import("pannellum/build/pannellum.css")
    ]);
    api = resolveApi(mod);
  } catch {
    api = null;
  }
  if (id !== token) return;
  if (!api || !stageEl.value) {
    fail(id, "The 360° viewer couldn’t be loaded. Try again.");
    return;
  }

  try {
    const next = api.viewer(stageEl.value, {
      type: "equirectangular",
      panorama: src,
      autoLoad: true,
      autoRotate: false,
      compass: false,
      showControls: false,
      mouseZoom: true,
      draggable: true,
      keyboardZoom: true,
      hfov: 100,
      minHfov: 50,
      maxHfov: 120,
      crossOrigin: "anonymous",
      friction: 0.15
    });
    if (id !== token) {
      next.destroy();
      return;
    }
    viewer.value = next;
    loadTimer = window.setTimeout(() => {
      fail(id, "This 360° photo is taking too long to load.");
    }, 20000);
    next.on("load", () => {
      if (id !== token) return;
      window.clearTimeout(loadTimer);
      loadTimer = 0;
      phase.value = "ready";
      next.resize();
    });
    next.on("error", () => {
      fail(id, "The 360° photo didn’t load. Close this view and try again.");
    });
  } catch {
    fail(id, "The 360° viewer couldn’t start.");
  }
}

function shutdown() {
  token += 1;
  destroyViewer();
}

function zoom(direction: -1 | 1) {
  const current = viewer.value;
  if (!current || phase.value !== "ready") return;
  const next = Math.min(120, Math.max(50, current.getHfov() + direction * 12));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  current.setHfov(next, reduce ? 80 : 180);
}

watch(
  () => props.modelValue,
  open => {
    if (typeof window === "undefined") return;
    if (open) window.addEventListener("keydown", onEscape, true);
    else window.removeEventListener("keydown", onEscape, true);
  }
);

onBeforeUnmount(() => {
  token += 1;
  destroyViewer();
  window.removeEventListener("keydown", onEscape, true);
});
</script>

<style scoped>
.pano {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  height: 100%;
  min-height: 100%;
  overflow: hidden;
  background: #1a211e;
  color: var(--gy-white);
}

.pano__stage {
  position: absolute;
  inset: 0;
  min-width: 0;
  min-height: 0;
}

.pano__stage :deep(.pnlm-container) {
  width: 100%;
  height: 100%;
  background: #1a211e;
}

.pano__stage :deep(.pnlm-load-box),
.pano__stage :deep(.pnlm-lbar),
.pano__stage :deep(.pnlm-about-msg) {
  display: none !important;
}

.pano__bar {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  z-index: 4;
  min-width: 0;
  padding: max(0.9rem, env(safe-area-inset-top)) 4.75rem 2.4rem
    max(1rem, env(safe-area-inset-left));
  background: linear-gradient(to bottom, rgba(26, 33, 30, 0.78), transparent);
  pointer-events: none;
}

.pano__title {
  margin: 0;
  min-width: 0;
  overflow: hidden;
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: normal;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--gy-white);
}

.pano__close,
.pano__zoom button,
.pano__retry {
  border: 1px solid var(--gy-gold);
  background: var(--gy-forest);
  color: var(--gy-gold);
  cursor: pointer;
}

.pano__close {
  position: absolute;
  top: max(0.75rem, env(safe-area-inset-top));
  right: max(0.75rem, env(safe-area-inset-right));
  z-index: 5;
  display: inline-grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border-radius: 999px;
}

.pano__close:focus-visible,
.pano__zoom button:focus-visible,
.pano__retry:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: 2px;
}

.pano__zoom {
  position: absolute;
  bottom: max(0.75rem, env(safe-area-inset-bottom));
  left: max(0.75rem, env(safe-area-inset-left));
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.pano__zoom button {
  width: 44px;
  height: 44px;
  padding: 0;
  border-radius: 2px;
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 700;
  line-height: 1;
}

.pano__hint {
  position: absolute;
  bottom: max(0.9rem, env(safe-area-inset-bottom));
  left: 50%;
  z-index: 4;
  max-width: calc(100% - 7.5rem);
  margin: 0;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  background: rgba(26, 33, 30, 0.78);
  transform: translateX(-50%);
  font-family: var(--font-body);
  font-size: 0.92rem;
  line-height: 1.4;
  text-align: center;
  color: var(--gy-gold);
  pointer-events: none;
}

.pano__veil {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 0.75rem;
  padding: 5rem 1.25rem;
  background: rgba(26, 33, 30, 0.88);
  text-align: center;
}

.pano__veil p,
.pano__veil h2 {
  max-width: 28rem;
  margin: 0;
}

.pano__veil h2 {
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--gy-white);
}

.pano__veil p {
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.5;
  color: var(--gy-gold);
}

.pano__spinner {
  width: 1.75rem;
  height: 1.75rem;
  border: 2px solid var(--gy-gold);
  border-right-color: var(--gy-forest);
  border-radius: 50%;
  animation: pano-pulse 1.4s ease-in-out infinite;
}

.pano__retry {
  min-width: 8.5rem;
  min-height: 44px;
  padding: 0 1.1rem;
  border-radius: 999px;
  font-family: var(--font-display);
  font-size: 0.85rem;
  font-weight: 700;
}

@keyframes pano-pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.55;
    transform: scale(0.92);
  }
}

@media (prefers-reduced-motion: reduce) {
  .pano__spinner {
    animation-duration: 2.2s;
  }
}

@media (max-width: 420px) {
  .pano__hint {
    max-width: calc(100% - 6.5rem);
    font-size: 0.82rem;
  }
}
</style>

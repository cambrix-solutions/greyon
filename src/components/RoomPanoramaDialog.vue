<template>
  <q-dialog
    :model-value="modelValue"
    maximized
    transition-show="fade"
    transition-hide="fade"
    @update:model-value="emit('update:modelValue', $event)"
    @show="onShow"
    @hide="shutdown"
  >
    <div ref="panoRoot" class="pano">
      <div ref="stageEl" class="pano__stage" />

      <div class="pano__top">
        <img
          class="pano__logo"
          src="/logo/Logo white V1-05.png"
          alt="Greyon"
          width="240"
          height="84"
        />
        <div class="pano__top-actions">
          <div v-if="switchableRooms.length > 1" class="pano__rooms">
            <button
              type="button"
              class="pano__rooms-btn"
              :aria-expanded="roomsOpen"
              aria-haspopup="listbox"
              aria-label="Rooms with 360° views"
              @click="roomsOpen = !roomsOpen"
            >
              Rooms
              <q-icon name="expand_more" size="18px" />
            </button>
            <ul
              v-if="roomsOpen"
              class="pano__rooms-menu"
              role="listbox"
              aria-label="Rooms with 360° views"
            >
              <li v-for="room in switchableRooms" :key="room.id">
                <button
                  type="button"
                  role="option"
                  :aria-selected="room.id === activeRoomId"
                  :class="{ 'is-on': room.id === activeRoomId }"
                  @click="selectRoom(room.id)"
                >
                  {{ room.name }}
                </button>
              </li>
            </ul>
          </div>
          <button
            type="button"
            class="pano__close"
            aria-label="Close 360° view"
            @click="close"
          >
            <q-icon name="close" size="22px" />
          </button>
        </div>
      </div>

      <div v-if="phase === 'ready'" class="pano__dock">
        <div class="pano__cluster">
          <div class="pano__dial" role="group" aria-label="Look around">
            <div
              class="pano__compass"
              :style="{ transform: `rotate(${yaw}deg)` }"
              aria-hidden="true"
            >
              <span class="pano__needle" />
            </div>
            <img
              class="pano__hub"
              src="/logo/Logo white V1-05.png"
              alt=""
              width="80"
              height="28"
            />
            <button
              type="button"
              class="pano__pan pano__pan--up"
              aria-label="Pan up"
              @pointerdown="onPanPointer($event, 'up')"
              @pointerup="onPanRelease('up')"
              @pointercancel="onPanRelease('up')"
              @lostpointercapture="onPanRelease('up')"
            >
              <q-icon name="keyboard_arrow_up" size="22px" />
            </button>
            <button
              type="button"
              class="pano__pan pano__pan--down"
              aria-label="Pan down"
              @pointerdown="onPanPointer($event, 'down')"
              @pointerup="onPanRelease('down')"
              @pointercancel="onPanRelease('down')"
              @lostpointercapture="onPanRelease('down')"
            >
              <q-icon name="keyboard_arrow_down" size="22px" />
            </button>
            <button
              type="button"
              class="pano__pan pano__pan--left"
              aria-label="Pan left"
              @pointerdown="onPanPointer($event, 'left')"
              @pointerup="onPanRelease('left')"
              @pointercancel="onPanRelease('left')"
              @lostpointercapture="onPanRelease('left')"
            >
              <q-icon name="keyboard_arrow_left" size="22px" />
            </button>
            <button
              type="button"
              class="pano__pan pano__pan--right"
              aria-label="Pan right"
              @pointerdown="onPanPointer($event, 'right')"
              @pointerup="onPanRelease('right')"
              @pointercancel="onPanRelease('right')"
              @lostpointercapture="onPanRelease('right')"
            >
              <q-icon name="keyboard_arrow_right" size="22px" />
            </button>
          </div>
          <div class="pano__tools" role="group" aria-label="View controls">
            <button type="button" aria-label="Zoom in" @click="zoom(-1)">
              +
            </button>
            <button type="button" aria-label="Zoom out" @click="zoom(1)">
              −
            </button>
            <button
              type="button"
              :aria-label="
                autoRotateOn
                  ? 'Stop automatic rotation'
                  : 'Start automatic rotation'
              "
              :aria-pressed="autoRotateOn"
              :class="{ 'is-on': autoRotateOn }"
              @click="toggleAutoRotate"
            >
              <q-icon name="360" size="18px" />
            </button>
            <button
              v-if="fullscreenAvailable"
              type="button"
              :aria-label="
                isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'
              "
              :aria-pressed="isFullscreen"
              :class="{ 'is-on': isFullscreen }"
              @click="toggleFullscreen"
            >
              <q-icon
                :name="isFullscreen ? 'fullscreen_exit' : 'fullscreen'"
                size="18px"
              />
            </button>
          </div>
        </div>
        <p class="pano__label">{{ labelText }}</p>
      </div>

      <p
        v-if="phase === 'ready' && hintVisible"
        class="pano__hint"
        :class="{ 'pano__hint--raised': many }"
      >
        Drag to look around · pinch or zoom
      </p>

      <div v-if="many" class="pano__nav" role="group" aria-label="360° photos">
        <button
          type="button"
          class="pano__step"
          aria-label="Previous 360° photo"
          @click="go(index - 1)"
        >
          <q-icon name="chevron_left" size="22px" />
        </button>
        <div class="pano__dots">
          <button
            v-for="(_, i) in photos"
            :key="i"
            type="button"
            class="pano__dot"
            :class="{ 'pano__dot--active': i === index }"
            :aria-label="`360° photo ${i + 1} of ${photos.length}`"
            :aria-current="i === index ? 'true' : undefined"
            @click="go(i)"
          >
            {{ i + 1 }}
          </button>
        </div>
        <button
          type="button"
          class="pano__step"
          aria-label="Next 360° photo"
          @click="go(index + 1)"
        >
          <q-icon name="chevron_right" size="22px" />
        </button>
      </div>

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
import { computed, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import type { PanoramaTourRoom, RoomPanorama } from "@/types/greyon";
import { hotspotLabel, roomPanoramaLabel } from "@/utils/roomPanoramas";

type PannellumViewer = {
  on: (event: string, callback: (arg?: unknown) => void) => unknown;
  destroy: () => void;
  getHfov: () => number;
  setHfov: (hfov: number, duration?: number) => unknown;
  getYaw: () => number;
  setYaw: (yaw: number, duration?: number) => unknown;
  getPitch: () => number;
  setPitch: (pitch: number, duration?: number) => unknown;
  startAutoRotate: (speed?: number) => unknown;
  stopAutoRotate: () => unknown;
  resize: () => void;
};

type PannellumApi = {
  viewer: (
    container: HTMLElement,
    config: Record<string, unknown>
  ) => PannellumViewer;
};

type PanDir = "up" | "down" | "left" | "right";

type FsElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type FsDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenEnabled?: boolean;
};

const AUTO_SPEED = -2;
const IDLE_MS = 3000;
const PAN_MS = 32;
const PAN_STEP = 1.6;
const HINT_MS = 3500;

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    /** A single photo. Used when `sources` is empty. */
    src?: string;
    /** Several photos, already in the order guests should see them. */
    sources?: string[];
    /** Preferred: published photos with captions and hotspots. */
    photos?: RoomPanorama[];
    /** Room type name for the label pill and hotspot defaults. */
    title?: string;
    roomId?: string;
    /** Other rooms in this hotel that have published 360° photos. */
    tourRooms?: PanoramaTourRoom[];
  }>(),
  {
    src: "",
    sources: () => [],
    photos: () => [],
    title: "",
    roomId: "",
    tourRooms: () => []
  }
);

const emit = defineEmits<{
  "update:modelValue": [open: boolean];
}>();

const panoRoot = ref<HTMLElement | null>(null);
const stageEl = ref<HTMLElement | null>(null);
const phase = ref<"loading" | "ready" | "error">("loading");
const errorMessage = ref("");
const viewer = shallowRef<PannellumViewer | null>(null);
const index = ref(0);
const yaw = ref(0);
const autoRotateOn = ref(true);
const isFullscreen = ref(false);
const hintVisible = ref(true);
const fullscreenAvailable = ref(false);
const roomsOpen = ref(false);
const activeRoomId = ref("");

const switchableRooms = computed(() =>
  props.tourRooms.filter(room => room.photos.some(photo => photo.url))
);

const activeRoom = computed(
  () =>
    switchableRooms.value.find(room => room.id === activeRoomId.value) ?? null
);

const roomName = computed(
  () => activeRoom.value?.name.trim() || props.title.trim() || "360° view"
);

const photos = computed((): RoomPanorama[] => {
  if (activeRoom.value) {
    return activeRoom.value.photos.filter(photo => photo.url);
  }
  if (props.photos.length) {
    return props.photos.filter(photo => photo.url);
  }
  const list = props.sources.map(item => item.trim()).filter(Boolean);
  const urls = list.length ? list : [props.src.trim()].filter(Boolean);
  return urls.map((url, i) => ({
    id: `src-${i}`,
    url,
    caption: null,
    isPublished: true,
    sortOrder: i,
    hotspots: []
  }));
});
const many = computed(() => photos.value.length > 1);
const currentPhoto = computed(() => photos.value[index.value]);
const labelText = computed(() =>
  roomPanoramaLabel(
    roomName.value,
    currentPhoto.value,
    index.value,
    photos.value.length
  )
);

let token = 0;
let loadTimer = 0;
let idleTimer = 0;
let hintTimer = 0;
let panTimer = 0;
let yawRaf = 0;
let stageBound = false;
const panDirs = new Set<PanDir>();

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function fsDoc(): FsDocument {
  return document as FsDocument;
}

function close() {
  emit("update:modelValue", false);
}

function isPanKey(event: KeyboardEvent): PanDir | null {
  const key = event.key;
  if (key === "ArrowLeft" || key === "a" || key === "A") return "left";
  if (key === "ArrowRight" || key === "d" || key === "D") return "right";
  if (key === "ArrowUp" || key === "w" || key === "W") return "up";
  if (key === "ArrowDown" || key === "s" || key === "S") return "down";
  return null;
}

function onKeyDown(event: KeyboardEvent) {
  if (!props.modelValue) return;
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    if (roomsOpen.value) {
      roomsOpen.value = false;
      return;
    }
    if (isFullscreen.value) {
      void exitFullscreen();
      return;
    }
    close();
    return;
  }
  if (phase.value !== "ready") return;
  const dir = isPanKey(event);
  if (dir) {
    event.preventDefault();
    event.stopPropagation();
    if (!event.repeat) startPan(dir);
    return;
  }
  if (event.key === "+" || event.key === "=" || event.key === "Add") {
    event.preventDefault();
    if (!event.repeat) zoom(-1);
    return;
  }
  if (event.key === "-" || event.key === "_" || event.key === "Subtract") {
    event.preventDefault();
    if (!event.repeat) zoom(1);
    return;
  }
  if (event.key === "f" || event.key === "F") {
    event.preventDefault();
    if (!event.repeat) toggleFullscreen();
    return;
  }
  if (event.key === "r" || event.key === "R") {
    event.preventDefault();
    if (!event.repeat) toggleAutoRotate();
  }
}

function onKeyUp(event: KeyboardEvent) {
  if (!props.modelValue) return;
  const dir = isPanKey(event);
  if (dir) stopPan(dir);
}

function onPanPointer(event: PointerEvent, dir: PanDir) {
  if (event.button !== 0) return;
  event.preventDefault();
  const target = event.currentTarget as HTMLElement;
  target.setPointerCapture(event.pointerId);
  startPan(dir);
}

function onPanRelease(dir: PanDir) {
  stopPan(dir);
}

function startPan(dir: PanDir) {
  panDirs.add(dir);
  onUserInteract();
  if (panTimer) return;
  tickPan();
  panTimer = window.setInterval(tickPan, PAN_MS);
}

function stopPan(dir?: PanDir) {
  if (dir) panDirs.delete(dir);
  else panDirs.clear();
  if (panDirs.size || !panTimer) return;
  window.clearInterval(panTimer);
  panTimer = 0;
}

function tickPan() {
  const current = viewer.value;
  if (!current || phase.value !== "ready" || !panDirs.size) return;
  let nextYaw = current.getYaw();
  let nextPitch = current.getPitch();
  if (panDirs.has("left")) nextYaw -= PAN_STEP;
  if (panDirs.has("right")) nextYaw += PAN_STEP;
  if (panDirs.has("up")) nextPitch += PAN_STEP;
  if (panDirs.has("down")) nextPitch -= PAN_STEP;
  current.setYaw(nextYaw, 0);
  current.setPitch(nextPitch, 0);
}

function pollYaw() {
  const current = viewer.value;
  if (current && phase.value === "ready") {
    try {
      yaw.value = current.getYaw();
    } catch {
      /* viewer tearing down */
    }
  }
  yawRaf = window.requestAnimationFrame(pollYaw);
}

function stopYawPoll() {
  if (!yawRaf) return;
  window.cancelAnimationFrame(yawRaf);
  yawRaf = 0;
}

function stopAuto() {
  try {
    viewer.value?.stopAutoRotate();
  } catch {
    /* already torn down */
  }
}

function startAuto() {
  const current = viewer.value;
  if (!current || !autoRotateOn.value || phase.value !== "ready") return;
  if (prefersReducedMotion()) return;
  try {
    current.startAutoRotate(AUTO_SPEED);
  } catch {
    /* viewer tearing down */
  }
}

function onUserInteract() {
  stopAuto();
  window.clearTimeout(idleTimer);
  idleTimer = 0;
  if (!autoRotateOn.value || phase.value !== "ready") return;
  if (prefersReducedMotion()) return;
  idleTimer = window.setTimeout(() => {
    idleTimer = 0;
    startAuto();
  }, IDLE_MS);
}

function toggleAutoRotate() {
  autoRotateOn.value = !autoRotateOn.value;
  window.clearTimeout(idleTimer);
  idleTimer = 0;
  if (autoRotateOn.value) startAuto();
  else stopAuto();
}

function isFsActive(): boolean {
  const doc = fsDoc();
  const root = panoRoot.value;
  const active = doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
  return Boolean(root && active === root);
}

function onFullscreenChange() {
  isFullscreen.value = isFsActive();
  viewer.value?.resize();
}

async function exitFullscreen(): Promise<void> {
  const doc = fsDoc();
  const active = doc.fullscreenElement ?? doc.webkitFullscreenElement;
  if (!active) return;
  try {
    if (doc.exitFullscreen) await doc.exitFullscreen();
    else doc.webkitExitFullscreen?.();
  } catch {
    /* already left fullscreen */
  }
}

function toggleFullscreen() {
  if (!fullscreenAvailable.value) return;
  const root = panoRoot.value;
  if (!root) return;
  if (isFsActive()) {
    void exitFullscreen();
    return;
  }
  const el = root as FsElement;
  try {
    const request = el.requestFullscreen ?? el.webkitRequestFullscreen;
    void request?.call(el);
  } catch {
    /* fullscreen blocked */
  }
}

function onResize() {
  viewer.value?.resize();
}

/** Show photo `next` (wraps around). The viewer is rebuilt for the new photo. */
function go(next: number) {
  const total = photos.value.length;
  if (total < 2) return;
  const wrapped = ((next % total) + total) % total;
  if (wrapped === index.value && phase.value !== "error") return;
  index.value = wrapped;
  void boot();
}

function goToId(targetId: string) {
  const next = photos.value.findIndex(photo => photo.id === targetId);
  if (next < 0) return;
  go(next);
}

function selectRoom(id: string) {
  if (id === activeRoomId.value) {
    roomsOpen.value = false;
    return;
  }
  activeRoomId.value = id;
  index.value = 0;
  roomsOpen.value = false;
  void boot();
}

function onShow() {
  index.value = 0;
  roomsOpen.value = false;
  activeRoomId.value =
    props.roomId ||
    switchableRooms.value.find(room => room.name === props.title)?.id ||
    switchableRooms.value[0]?.id ||
    "";
  autoRotateOn.value = !prefersReducedMotion();
  hintVisible.value = true;
  const doc = fsDoc();
  fullscreenAvailable.value = Boolean(
    doc.fullscreenEnabled ?? doc.webkitFullscreenEnabled
  );
  void boot();
}

function unbindStage() {
  const stage = stageEl.value;
  if (!stage || !stageBound) return;
  stage.removeEventListener("wheel", onUserInteract);
  stageBound = false;
}

function bindStage() {
  const stage = stageEl.value;
  if (!stage || stageBound) return;
  stage.addEventListener("wheel", onUserInteract, { passive: true });
  stageBound = true;
}

function destroyViewer() {
  window.clearTimeout(loadTimer);
  loadTimer = 0;
  window.clearTimeout(idleTimer);
  idleTimer = 0;
  window.clearTimeout(hintTimer);
  hintTimer = 0;
  stopPan();
  stopYawPoll();
  unbindStage();
  const current = viewer.value;
  viewer.value = null;
  if (!current) return;
  try {
    current.stopAutoRotate();
  } catch {
    /* already torn down */
  }
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

function guestHotspots() {
  const photo = currentPhoto.value;
  if (!photo) return [];
  const ids = new Set(photos.value.map(item => item.id));
  return photo.hotspots
    .filter(spot => ids.has(spot.targetPanoramaId))
    .map(spot => {
      const text = hotspotLabel(roomName.value, spot, photos.value);
      return {
        id: `hs-${spot.id}`,
        yaw: spot.yaw,
        pitch: spot.pitch,
        cssClass: "pano-hs",
        createTooltipFunc: (div: HTMLDivElement) => {
          div.classList.add("pano-hs");
          const mark = document.createElement("span");
          mark.className = "pano-hs__mark";
          mark.setAttribute("aria-label", text);
          mark.textContent = "›";
          const tip = document.createElement("span");
          tip.className = "pano-hs__tip";
          tip.textContent = text;
          div.append(mark, tip);
        },
        clickHandlerFunc: () => {
          goToId(spot.targetPanoramaId);
        }
      };
    });
}

async function boot() {
  const id = ++token;
  phase.value = "loading";
  errorMessage.value = "";
  destroyViewer();

  const src = currentPhoto.value?.url ?? "";
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
      keyboardZoom: false,
      hfov: 100,
      minHfov: 50,
      maxHfov: 120,
      crossOrigin: "anonymous",
      friction: 0.15,
      hotSpots: guestHotspots()
    });
    if (id !== token) {
      next.destroy();
      return;
    }
    viewer.value = next;
    bindStage();
    loadTimer = window.setTimeout(() => {
      fail(id, "This 360° photo is taking too long to load.");
    }, 20000);
    next.on("load", () => {
      if (id !== token) return;
      window.clearTimeout(loadTimer);
      loadTimer = 0;
      phase.value = "ready";
      next.resize();
      yaw.value = next.getYaw();
      if (!yawRaf) pollYaw();
      startAuto();
      window.clearTimeout(hintTimer);
      hintVisible.value = true;
      hintTimer = window.setTimeout(() => {
        hintVisible.value = false;
        hintTimer = 0;
      }, HINT_MS);
    });
    next.on("error", () => {
      fail(id, "The 360° photo didn’t load. Close this view and try again.");
    });
    next.on("mousedown", () => {
      onUserInteract();
    });
  } catch {
    fail(id, "The 360° viewer couldn’t start.");
  }
}

function shutdown() {
  token += 1;
  destroyViewer();
  void exitFullscreen();
}

function zoom(direction: -1 | 1) {
  const current = viewer.value;
  if (!current || phase.value !== "ready") return;
  onUserInteract();
  const next = Math.min(120, Math.max(50, current.getHfov() + direction * 12));
  const reduce = prefersReducedMotion();
  current.setHfov(next, reduce ? 80 : 180);
}

function bindWindow(open: boolean) {
  if (typeof window === "undefined") return;
  if (open) {
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("resize", onResize);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
  } else {
    window.removeEventListener("keydown", onKeyDown, true);
    window.removeEventListener("keyup", onKeyUp, true);
    window.removeEventListener("resize", onResize);
    document.removeEventListener("fullscreenchange", onFullscreenChange);
    document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
  }
}

watch(
  () => props.modelValue,
  open => {
    bindWindow(open);
  }
);

onBeforeUnmount(() => {
  token += 1;
  destroyViewer();
  bindWindow(false);
  void exitFullscreen();
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
  background: #000;
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
  background: #000;
}

.pano__stage :deep(.pnlm-load-box),
.pano__stage :deep(.pnlm-lbar),
.pano__stage :deep(.pnlm-about-msg) {
  display: none !important;
}

.pano__top {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  z-index: 5;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: max(0.75rem, env(safe-area-inset-top))
    max(0.75rem, env(safe-area-inset-right)) 3.5rem
    max(0.9rem, env(safe-area-inset-left));
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.72),
    rgba(0, 0, 0, 0.22) 58%,
    transparent
  );
  pointer-events: none;
}

.pano__logo,
.pano__top-actions,
.pano__close,
.pano__rooms-btn,
.pano__rooms-menu button {
  pointer-events: auto;
}

.pano__top-actions {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.pano__rooms {
  position: relative;
}

.pano__rooms-btn,
.pano__rooms-menu button {
  border: 0;
  background: rgba(0, 0, 0, 0.45);
  color: var(--gy-white);
  font-family: var(--font-display);
  cursor: pointer;
}

.pano__rooms-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  min-height: 2.5rem;
  padding: 0 0.7rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.pano__rooms-menu {
  position: absolute;
  top: calc(100% + 0.35rem);
  right: 0;
  z-index: 6;
  min-width: 12rem;
  max-width: min(18rem, 70vw);
  max-height: min(18rem, 50vh);
  margin: 0;
  padding: 0.3rem;
  overflow: auto;
  list-style: none;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  background: rgba(0, 0, 0, 0.88);
}

.pano__rooms-menu button {
  display: block;
  width: 100%;
  padding: 0.55rem 0.7rem;
  border-radius: 0.35rem;
  background: transparent;
  font-size: 0.88rem;
  font-weight: 600;
  text-align: left;
}

.pano__rooms-menu button.is-on,
.pano__rooms-menu button:hover {
  background: rgba(196, 163, 90, 0.2);
  color: var(--gy-gold);
}

.pano__logo {
  display: block;
  height: 2.85rem;
  width: auto;
  max-width: 9.5rem;
  object-fit: contain;
}

.pano__close {
  display: inline-grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.35);
  color: var(--gy-white);
  cursor: pointer;
}

.pano__close:hover {
  background: rgba(0, 0, 0, 0.55);
  color: var(--gy-gold);
}

.pano__dock {
  position: absolute;
  right: max(0.75rem, env(safe-area-inset-right));
  bottom: max(0.85rem, env(safe-area-inset-bottom));
  left: max(0.85rem, env(safe-area-inset-left));
  z-index: 5;
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  max-width: calc(100% - 1.5rem);
  pointer-events: none;
}

.pano__cluster,
.pano__label,
.pano__dial button,
.pano__tools button {
  pointer-events: auto;
}

.pano__cluster {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
}

.pano__dial {
  position: relative;
  width: 8.5rem;
  height: 8.5rem;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 50%;
  background: radial-gradient(
    circle at 50% 45%,
    rgba(40, 40, 40, 0.35),
    rgba(0, 0, 0, 0.62) 62%
  );
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

.pano__compass {
  position: absolute;
  inset: 1.7rem;
  z-index: 1;
  pointer-events: none;
}

.pano__needle {
  position: absolute;
  top: 0;
  left: 50%;
  width: 0;
  height: 0;
  border-right: 4px solid transparent;
  border-bottom: 11px solid var(--gy-gold);
  border-left: 4px solid transparent;
  transform: translateX(-50%);
}

.pano__hub {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 2;
  width: 3.15rem;
  height: auto;
  max-height: 1.55rem;
  object-fit: contain;
  pointer-events: none;
  transform: translate(-50%, -50%);
}

.pano__pan {
  position: absolute;
  z-index: 3;
  display: inline-grid;
  place-items: center;
  width: 2.15rem;
  height: 2.15rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--gy-white);
  cursor: pointer;
  touch-action: none;
  user-select: none;
}

.pano__pan:hover,
.pano__tools button:hover {
  color: var(--gy-gold);
}

.pano__pan--up {
  top: 0.15rem;
  left: 50%;
  transform: translateX(-50%);
}

.pano__pan--down {
  bottom: 0.15rem;
  left: 50%;
  transform: translateX(-50%);
}

.pano__pan--left {
  top: 50%;
  left: 0.15rem;
  transform: translateY(-50%);
}

.pano__pan--right {
  top: 50%;
  right: 0.15rem;
  transform: translateY(-50%);
}

.pano__tools {
  display: flex;
  align-items: stretch;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.55);
}

.pano__tools button {
  display: inline-grid;
  place-items: center;
  width: 2.5rem;
  height: 2.25rem;
  padding: 0;
  border: 0;
  border-right: 1px solid rgba(255, 255, 255, 0.16);
  background: transparent;
  color: var(--gy-white);
  font-family: var(--font-display);
  font-size: 1.15rem;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
}

.pano__tools button:last-child {
  border-right: 0;
}

.pano__tools button.is-on {
  color: var(--gy-gold);
}

.pano__label {
  min-width: 0;
  max-width: min(22rem, calc(100% - 9.5rem));
  margin: 0 0 2.55rem;
  padding: 0.4rem 0.85rem;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.55);
  font-family: var(--font-display);
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  line-height: 1.3;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--gy-white);
}

.pano__rooms-btn:focus-visible,
.pano__rooms-menu button:focus-visible,
.pano__close:focus-visible,
.pano__pan:focus-visible,
.pano__tools button:focus-visible,
.pano__step:focus-visible,
.pano__dot:focus-visible,
.pano__retry:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: 2px;
}

.pano__nav {
  position: absolute;
  bottom: max(0.85rem, env(safe-area-inset-bottom));
  left: 50%;
  z-index: 5;
  display: flex;
  align-items: stretch;
  gap: 0.35rem;
  max-width: calc(100% - 18rem);
  transform: translateX(-50%);
}

.pano__step,
.pano__dot {
  flex: 0 0 auto;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.55);
  color: var(--gy-white);
  font-family: var(--font-display);
  font-size: 0.85rem;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
}

.pano__step {
  display: inline-grid;
  place-items: center;
}

.pano__dots {
  display: flex;
  gap: 0.35rem;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.pano__dots::-webkit-scrollbar {
  display: none;
}

.pano__dot--active {
  border-color: var(--gy-gold);
  background: var(--gy-gold);
  color: #111;
}

.pano__hint {
  position: absolute;
  bottom: max(5.75rem, calc(env(safe-area-inset-bottom) + 5.5rem));
  left: 50%;
  z-index: 4;
  max-width: calc(100% - 7.5rem);
  margin: 0;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.55);
  transform: translateX(-50%);
  font-family: var(--font-body);
  font-size: 0.88rem;
  line-height: 1.4;
  text-align: center;
  color: rgba(255, 255, 255, 0.92);
  pointer-events: none;
}

.pano__hint--raised {
  bottom: max(6.5rem, calc(env(safe-area-inset-bottom) + 6.25rem));
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
  background: rgba(0, 0, 0, 0.88);
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
  color: rgba(255, 255, 255, 0.8);
}

.pano__spinner {
  width: 1.75rem;
  height: 1.75rem;
  border: 2px solid var(--gy-gold);
  border-right-color: #000;
  border-radius: 50%;
  animation: pano-pulse 1.4s ease-in-out infinite;
}

.pano__retry {
  min-width: 8.5rem;
  min-height: 44px;
  padding: 0 1.1rem;
  border: 1px solid var(--gy-gold);
  border-radius: 999px;
  background: transparent;
  color: var(--gy-gold);
  font-family: var(--font-display);
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
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

@media (max-width: 720px) {
  .pano__logo {
    height: 2.25rem;
    max-width: 7.25rem;
  }

  .pano__dial {
    width: 6.75rem;
    height: 6.75rem;
  }

  .pano__compass {
    inset: 1.35rem;
  }

  .pano__hub {
    width: 2.55rem;
    max-height: 1.25rem;
  }

  .pano__pan {
    width: 1.9rem;
    height: 1.9rem;
  }

  .pano__tools button {
    width: 2.2rem;
    height: 2rem;
  }

  .pano__label {
    margin-bottom: 2.7rem;
    max-width: min(16rem, calc(100% - 7.75rem));
    font-size: 0.75rem;
  }

  .pano__step,
  .pano__dot {
    width: 2.15rem;
    height: 2.15rem;
  }

  .pano__nav {
    left: auto;
    right: max(0.6rem, env(safe-area-inset-right));
    max-width: calc(100% - 10.5rem);
    transform: none;
  }

  .pano__hint {
    max-width: calc(100% - 2rem);
    font-size: 0.78rem;
  }
}

.pano__stage :deep(.pnlm-hotspot.pano-hs),
.pano__stage :deep(.pano-hs) {
  background: transparent !important;
  border: 0 !important;
  width: auto !important;
  height: auto !important;
}

.pano__stage :deep(.pano-hs__mark) {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border: 2px solid #fff;
  border-radius: 50%;
  background: var(--gy-gold);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
  color: #111;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
}

.pano__stage :deep(.pano-hs__tip) {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 0.4rem);
  padding: 0.28rem 0.55rem;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.82);
  color: #fff;
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  white-space: nowrap;
  transform: translateX(-50%);
  opacity: 0;
  pointer-events: none;
}

.pano__stage :deep(.pano-hs:hover .pano-hs__tip),
.pano__stage :deep(.pano-hs:focus-within .pano-hs__tip) {
  opacity: 1;
}

@media (hover: none) {
  .pano__stage :deep(.pano-hs__tip) {
    opacity: 1;
  }
}
</style>

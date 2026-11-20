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
    <div class="hs-ed">
      <header class="hs-ed__bar">
        <div class="hs-ed__copy">
          <h2 class="hs-ed__title">Place arrows</h2>
          <p class="hs-ed__sub">
            {{ photoTitle }} — click the photo to drop an arrow, or click an
            existing arrow to edit it.
          </p>
        </div>
        <button
          type="button"
          class="hs-ed__close"
          aria-label="Close arrow editor"
          @click="close"
        >
          <q-icon name="close" size="20px" />
        </button>
      </header>

      <div class="hs-ed__body">
        <div
          ref="stageEl"
          class="hs-ed__stage"
          @pointerdown="onStagePointerDown"
          @click="onStageClick"
        />

        <aside class="hs-ed__side">
          <p v-if="error" class="hs-ed__error" role="alert">{{ error }}</p>

          <div v-if="draft" class="hs-ed__form">
            <p class="hs-ed__form-title">
              {{ draft.id ? "Edit arrow" : "New arrow" }}
            </p>
            <label class="hs-ed__field">
              <span>Goes to</span>
              <select v-model="draft.targetPanoramaId" :disabled="busy">
                <option disabled value="">Choose a photo</option>
                <option
                  v-for="option in targets"
                  :key="option.id"
                  :value="option.id"
                >
                  {{ option.label }}
                </option>
              </select>
            </label>
            <label class="hs-ed__field">
              <span>Label (optional)</span>
              <input
                v-model="draft.label"
                type="text"
                maxlength="80"
                :disabled="busy"
                placeholder="Shown on hover"
              />
            </label>
            <p class="hs-ed__pos">
              Position {{ draft.yaw.toFixed(1) }}°,
              {{ draft.pitch.toFixed(1) }}°
              <button
                type="button"
                class="hs-ed__link"
                :disabled="busy"
                @click="moving = true"
              >
                {{ moving ? "Click the photo to move…" : "Move" }}
              </button>
            </p>
            <div class="hs-ed__form-actions">
              <button
                type="button"
                class="hs-ed__save"
                :disabled="busy || !draft.targetPanoramaId"
                @click="saveDraft"
              >
                Save
              </button>
              <button
                type="button"
                class="hs-ed__cancel"
                :disabled="busy"
                @click="cancelDraft"
              >
                Cancel
              </button>
              <button
                v-if="draft.id"
                type="button"
                class="hs-ed__delete"
                :disabled="busy"
                @click="removeDraft"
              >
                Delete
              </button>
            </div>
          </div>

          <p v-else-if="targets.length === 0" class="hs-ed__empty">
            Add at least one more 360° photo to this room before placing arrows.
          </p>
          <p v-else class="hs-ed__empty">
            Click the photo to place an arrow to another view.
          </p>

          <ul v-if="photo.hotspots.length" class="hs-ed__list">
            <li v-for="spot in photo.hotspots" :key="spot.id">
              <button
                type="button"
                class="hs-ed__item"
                :class="{ 'is-on': draft?.id === spot.id }"
                :disabled="busy"
                @click="editSpot(spot)"
              >
                {{ listLabel(spot) }}
              </button>
            </li>
          </ul>
        </aside>
      </div>
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef } from "vue";
import {
  addRoomPanoramaHotspot,
  deleteRoomPanoramaHotspot,
  updateRoomPanoramaHotspot
} from "@/services/engine/adminCatalog";
import type { RoomPanorama, RoomPanoramaHotspot } from "@/types/greyon";
import { hotspotLabel } from "@/utils/roomPanoramas";

type PannellumViewer = {
  destroy: () => void;
  resize: () => void;
  getYaw: () => number;
  getPitch: () => number;
  lookAt?: (
    pitch: number,
    yaw: number,
    hfov?: number,
    duration?: number
  ) => unknown;
  mouseEventToCoords?: (event: MouseEvent) => [number, number];
  on: (event: string, callback: (arg?: unknown) => void) => unknown;
};

type PannellumApi = {
  viewer: (
    container: HTMLElement,
    config: Record<string, unknown>
  ) => PannellumViewer;
};

type Draft = {
  id: string | null;
  targetPanoramaId: string;
  yaw: number;
  pitch: number;
  label: string;
};

const props = defineProps<{
  modelValue: boolean;
  roomId: string;
  photo: RoomPanorama;
  photos: RoomPanorama[];
}>();

const emit = defineEmits<{
  "update:modelValue": [open: boolean];
  saved: [list: RoomPanorama[]];
}>();

const stageEl = ref<HTMLElement | null>(null);
const viewer = shallowRef<PannellumViewer | null>(null);
const error = ref("");
const busy = ref(false);
const moving = ref(false);
const draft = ref<Draft | null>(null);
let token = 0;

const photoTitle = computed(() => {
  const i = props.photos.findIndex(item => item.id === props.photo.id);
  const caption = props.photo.caption?.trim();
  const n = i >= 0 ? `360° photo ${i + 1}` : "360° photo";
  return caption ? `${n} (${caption})` : n;
});

const targets = computed(() =>
  props.photos
    .filter(item => item.id !== props.photo.id)
    .map((item, _, list) => {
      const i = props.photos.indexOf(item);
      const caption = item.caption?.trim();
      return {
        id: item.id,
        label: caption ? `${i + 1} — ${caption}` : `360° photo ${i + 1}`
      };
    })
);

function listLabel(spot: RoomPanoramaHotspot) {
  return hotspotLabel("", spot, props.photos) || "Arrow";
}

function close() {
  emit("update:modelValue", false);
}

function message(e: unknown, fallback: string) {
  return e instanceof Error && e.message ? e.message : fallback;
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
  return null;
}

function coordsFromClick(
  event: MouseEvent
): { yaw: number; pitch: number } | null {
  const current = viewer.value;
  if (!current) return null;
  try {
    if (typeof current.mouseEventToCoords === "function") {
      const pair = current.mouseEventToCoords(event);
      if (Array.isArray(pair) && pair.length >= 2) {
        const pitch = Number(pair[0]);
        const yaw = Number(pair[1]);
        if (Number.isFinite(pitch) && Number.isFinite(yaw)) {
          return { pitch, yaw };
        }
      }
    }
  } catch {
    /* fall through */
  }
  try {
    return { yaw: current.getYaw(), pitch: current.getPitch() };
  } catch {
    return null;
  }
}

let pointerStart = { x: 0, y: 0 };

function onStagePointerDown(event: PointerEvent) {
  pointerStart = { x: event.clientX, y: event.clientY };
}

function onStageClick(event: MouseEvent) {
  if (
    Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) >
    6
  ) {
    return;
  }
  const target = event.target as HTMLElement | null;
  if (target?.closest(".pnlm-hotspot, .hs-ed__mark")) {
    const id = target
      .closest("[data-hotspot-id]")
      ?.getAttribute("data-hotspot-id");
    if (id) {
      const spot = props.photo.hotspots.find(item => item.id === id);
      if (spot) editSpot(spot);
    }
    return;
  }
  const coords = coordsFromClick(event);
  if (!coords) return;
  if (moving.value && draft.value) {
    draft.value = { ...draft.value, yaw: coords.yaw, pitch: coords.pitch };
    moving.value = false;
    void boot();
    return;
  }
  if (targets.value.length === 0) return;
  draft.value = {
    id: null,
    targetPanoramaId: targets.value[0]?.id ?? "",
    yaw: coords.yaw,
    pitch: coords.pitch,
    label: ""
  };
  moving.value = false;
  void boot();
}

function editSpot(spot: RoomPanoramaHotspot) {
  draft.value = {
    id: spot.id,
    targetPanoramaId: spot.targetPanoramaId,
    yaw: spot.yaw,
    pitch: spot.pitch,
    label: spot.label ?? ""
  };
  moving.value = false;
  viewer.value?.lookAt?.(spot.pitch, spot.yaw);
}

function cancelDraft() {
  draft.value = null;
  moving.value = false;
  void boot();
}

async function saveDraft() {
  const current = draft.value;
  if (!current || !current.targetPanoramaId || busy.value) return;
  busy.value = true;
  error.value = "";
  try {
    const input = {
      targetPanoramaId: current.targetPanoramaId,
      yaw: current.yaw,
      pitch: current.pitch,
      label: current.label.trim() || null
    };
    const list = current.id
      ? await updateRoomPanoramaHotspot(
          props.roomId,
          props.photo.id,
          current.id,
          input
        )
      : await addRoomPanoramaHotspot(props.roomId, props.photo.id, input);
    emit("saved", list);
    draft.value = null;
    moving.value = false;
    await boot();
  } catch (e) {
    error.value = message(e, "The arrow did not save. Try again.");
  } finally {
    busy.value = false;
  }
}

async function removeDraft() {
  const current = draft.value;
  if (!current?.id || busy.value) return;
  busy.value = true;
  error.value = "";
  try {
    const list = await deleteRoomPanoramaHotspot(
      props.roomId,
      props.photo.id,
      current.id
    );
    emit("saved", list);
    draft.value = null;
    moving.value = false;
    await boot();
  } catch (e) {
    error.value = message(e, "The arrow could not be deleted.");
  } finally {
    busy.value = false;
  }
}

function hotspotConfig() {
  const spots = [...props.photo.hotspots];
  if (draft.value) {
    const draftSpot = {
      id: draft.value.id ?? "draft",
      yaw: draft.value.yaw,
      pitch: draft.value.pitch,
      label: draft.value.label || "New arrow",
      targetPanoramaId: draft.value.targetPanoramaId
    };
    const i = spots.findIndex(item => item.id === draft.value?.id);
    if (i >= 0) spots[i] = { ...spots[i], ...draftSpot, id: spots[i].id };
    else spots.push({ ...draftSpot, id: "draft" });
  }
  return spots.map(spot => ({
    id: `hs-${spot.id}`,
    yaw: spot.yaw,
    pitch: spot.pitch,
    cssClass: "hs-ed-spot",
    createTooltipFunc: (div: HTMLDivElement) => {
      div.dataset.hotspotId = spot.id;
      div.classList.add("hs-ed__mark-wrap");
      const mark = document.createElement("span");
      mark.className = "hs-ed__mark";
      mark.textContent = "›";
      const tip = document.createElement("span");
      tip.className = "hs-ed__tip";
      tip.textContent = listLabel(spot);
      div.append(mark, tip);
    }
  }));
}

async function boot() {
  const id = ++token;
  const stage = stageEl.value;
  if (!stage || !props.photo.url) return;
  const current = viewer.value;
  viewer.value = null;
  try {
    current?.destroy();
  } catch {
    /* already torn down */
  }
  try {
    const [mod] = await Promise.all([
      import("pannellum"),
      import("pannellum/build/pannellum.css")
    ]);
    if (id !== token) return;
    const api = resolveApi(mod);
    if (!api) return;
    const next = api.viewer(stage, {
      type: "equirectangular",
      panorama: props.photo.url,
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
      friction: 0.15,
      hotSpots: hotspotConfig()
    });
    if (id !== token) {
      next.destroy();
      return;
    }
    viewer.value = next;
    next.resize();
  } catch {
    error.value = "The 360° photo could not be opened.";
  }
}

function onShow() {
  error.value = "";
  draft.value = null;
  moving.value = false;
  void boot();
}

function shutdown() {
  token += 1;
  const current = viewer.value;
  viewer.value = null;
  try {
    current?.destroy();
  } catch {
    /* already torn down */
  }
}

onBeforeUnmount(shutdown);
</script>

<style scoped>
.hs-ed {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #111;
  color: #fff;
}

.hs-ed__bar {
  display: flex;
  flex-shrink: 0;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1rem;
  background: #1a1a1a;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.hs-ed__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 700;
}

.hs-ed__sub,
.hs-ed__empty,
.hs-ed__pos,
.hs-ed__error,
.hs-ed__field span {
  margin: 0;
  font-family: var(--font-body);
  font-size: 0.85rem;
  line-height: 1.4;
}

.hs-ed__sub {
  margin-top: 0.2rem;
  color: rgba(255, 255, 255, 0.75);
}

.hs-ed__close {
  display: inline-grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  cursor: pointer;
}

.hs-ed__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(16rem, 20rem);
  flex: 1 1 auto;
  min-height: 0;
}

.hs-ed__stage {
  min-width: 0;
  min-height: 0;
  background: #000;
}

.hs-ed__stage :deep(.pnlm-container) {
  width: 100%;
  height: 100%;
  background: #000;
}

.hs-ed__stage :deep(.pnlm-load-box),
.hs-ed__stage :deep(.pnlm-lbar),
.hs-ed__stage :deep(.pnlm-about-msg) {
  display: none !important;
}

.hs-ed__side {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow: auto;
  padding: 0.85rem;
  background: #181818;
  border-left: 1px solid rgba(255, 255, 255, 0.12);
}

.hs-ed__error {
  color: #f0c0c0;
}

.hs-ed__form {
  display: grid;
  gap: 0.65rem;
}

.hs-ed__form-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 0.9rem;
  font-weight: 700;
}

.hs-ed__field {
  display: grid;
  gap: 0.25rem;
}

.hs-ed__field input,
.hs-ed__field select {
  width: 100%;
  min-height: 2.4rem;
  padding: 0.35rem 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0;
  background: #111;
  color: #fff;
  font-family: var(--font-body);
}

.hs-ed__form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.hs-ed__save,
.hs-ed__cancel,
.hs-ed__delete,
.hs-ed__item,
.hs-ed__link {
  font-family: var(--font-display);
  cursor: pointer;
}

.hs-ed__save,
.hs-ed__cancel,
.hs-ed__delete {
  min-height: 2.25rem;
  padding: 0 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: transparent;
  color: #fff;
}

.hs-ed__save {
  border-color: var(--gy-gold);
  background: var(--gy-gold);
  color: #111;
}

.hs-ed__delete {
  border-color: #c45b5b;
  color: #f0c0c0;
}

.hs-ed__link {
  margin-left: 0.4rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--gy-gold);
  text-decoration: underline;
}

.hs-ed__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.3rem;
}

.hs-ed__item {
  width: 100%;
  padding: 0.45rem 0.55rem;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: transparent;
  color: #fff;
  text-align: left;
}

.hs-ed__item.is-on {
  border-color: var(--gy-gold);
  color: var(--gy-gold);
}

.hs-ed__stage :deep(.hs-ed__mark-wrap) {
  background: transparent !important;
  border: 0 !important;
  width: auto !important;
  height: auto !important;
}

.hs-ed__stage :deep(.hs-ed__mark) {
  display: grid;
  place-items: center;
  width: 1.85rem;
  height: 1.85rem;
  border: 2px solid #fff;
  border-radius: 50%;
  background: var(--gy-gold);
  color: #111;
  font-size: 1.2rem;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
}

.hs-ed__stage :deep(.hs-ed__tip) {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 0.35rem);
  padding: 0.2rem 0.45rem;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  font-size: 0.72rem;
  white-space: nowrap;
  transform: translateX(-50%);
  pointer-events: none;
}

@media (max-width: 800px) {
  .hs-ed__body {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(16rem, 1fr) auto;
  }

  .hs-ed__side {
    border-left: 0;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    max-height: 45%;
  }
}
</style>

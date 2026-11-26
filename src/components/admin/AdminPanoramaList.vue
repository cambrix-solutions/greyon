<template>
  <div
    class="pano-list"
    :class="{ 'pano-list--active': dragging, 'pano-list--busy': busy }"
    @dragenter.prevent="onFileDrag"
    @dragover.prevent="onFileDrag"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onFileDrop"
  >
    <div class="pano-list__top">
      <p class="pano-list__hint">
        Add as many equirectangular photos as you like — JPG or WebP, up to 25
        MB each. Big photos are compressed for you.
        <template v-if="live"> Changes are saved as you make them. </template>
        <template v-else> They upload when you create the room. </template>
        Guests see only <strong>published</strong> photos, in this order.
      </p>
      <div class="pano-list__add" :class="{ 'is-disabled': busy }">
        <button
          type="button"
          class="pano-list__add-btn"
          :disabled="busy"
          @click="openFilePicker"
        >
          <q-icon name="add_a_photo" size="18px" />
          Add 360° photos
        </button>
        <input
          ref="fileInput"
          type="file"
          multiple
          class="pano-list__input"
          :accept="PANORAMA_ACCEPT_ATTR"
          :disabled="busy"
          tabindex="-1"
          @click.stop
          @change="onFileInput"
        />
      </div>
    </div>

    <div
      v-if="shownProgress"
      class="pano-list__progress"
      role="status"
      aria-live="polite"
    >
      <p class="pano-list__status">
        Uploading {{ shownProgress.current }} of {{ shownProgress.total }}
        <span class="pano-list__file">— {{ shownProgress.name }}</span>
      </p>
      <q-linear-progress
        :value="(shownProgress.current - 1) / shownProgress.total"
        :buffer="shownProgress.current / shownProgress.total"
        color="primary"
        track-color="grey-3"
        rounded
        size="8px"
      />
    </div>
    <p v-if="error" class="pano-list__error" role="alert">{{ error }}</p>

    <p v-if="loading" class="pano-list__empty">Loading 360° photos…</p>
    <p v-else-if="!items.length" class="pano-list__empty">
      No 360° photos yet. Guests see a “coming soon” message until one is
      published.
    </p>

    <ol v-else class="pano-list__items">
      <li
        v-for="(item, i) in items"
        :key="item.key"
        class="pano-item"
        :class="{
          'pano-item--hidden': !item.published,
          'pano-item--over': dragOver === i && dragFrom !== i,
          'pano-item--moving': dragFrom === i
        }"
        draggable="true"
        @dragstart="onRowDragStart(i, $event)"
        @dragover.prevent.stop="onRowDragOver(i)"
        @drop.prevent.stop="onRowDrop(i)"
        @dragend="onRowDragEnd"
      >
        <span class="pano-item__num" aria-hidden="true">{{ i + 1 }}</span>
        <img
          class="pano-item__thumb"
          :src="item.url"
          :alt="`360° photo ${i + 1}`"
          loading="lazy"
          draggable="false"
        />
        <div class="pano-item__meta">
          <p class="pano-item__title">360° photo {{ i + 1 }}</p>
          <p class="pano-item__state">
            {{ item.published ? "Shown to guests" : "Hidden from guests" }}
          </p>
          <input
            v-if="live && item.id"
            class="pano-item__caption"
            type="text"
            maxlength="80"
            :value="item.caption"
            placeholder="Caption (e.g. Bedroom)"
            :aria-label="`Caption for 360° photo ${i + 1}`"
            :disabled="busy"
            @mousedown.stop
            @dragstart.prevent
            @keydown.enter.prevent="blurCaption"
            @blur="onCaptionBlur(item, $event)"
          />
        </div>
        <q-toggle
          :model-value="item.published"
          :disable="busy"
          label="Published"
          color="primary"
          @update:model-value="togglePublished(item)"
        />
        <div class="pano-item__actions">
          <button
            v-if="live && item.id"
            type="button"
            class="pano-item__btn pano-item__btn--wide"
            :disabled="busy || items.length < 2"
            :aria-label="`Place arrows on 360° photo ${i + 1}`"
            @mousedown.stop
            @click="openEditor(item)"
          >
            Place arrows
          </button>
          <button
            type="button"
            class="pano-item__btn"
            :disabled="busy || i === 0"
            :aria-label="`Move 360° photo ${i + 1} up`"
            @click="move(i, i - 1)"
          >
            <q-icon name="arrow_upward" size="18px" />
          </button>
          <button
            type="button"
            class="pano-item__btn"
            :disabled="busy || i === items.length - 1"
            :aria-label="`Move 360° photo ${i + 1} down`"
            @click="move(i, i + 1)"
          >
            <q-icon name="arrow_downward" size="18px" />
          </button>
          <button
            type="button"
            class="pano-item__btn pano-item__btn--danger"
            :disabled="busy"
            :aria-label="`Delete 360° photo ${i + 1}`"
            @click="remove(item)"
          >
            <q-icon name="delete_outline" size="18px" />
          </button>
        </div>
      </li>
    </ol>

    <AdminPanoramaHotspotEditor
      v-if="editorPhoto && roomId"
      v-model="editorOpen"
      :room-id="roomId"
      :photo="editorPhoto"
      :photos="saved"
      @saved="apply"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useQuasar } from "quasar";
import AdminPanoramaHotspotEditor from "@/components/admin/AdminPanoramaHotspotEditor.vue";
import {
  addRoomPanorama,
  deleteRoomPanorama,
  fetchRoomPanoramas,
  reorderRoomPanoramas,
  setRoomPanoramaCaption,
  setRoomPanoramaPublished
} from "@/services/engine/adminCatalog";
import { useCmsStore } from "@/stores/cms-store";
import type { RoomPanorama } from "@/types/greyon";
import {
  PANORAMA_ACCEPT_ATTR,
  preparePanoramaFile
} from "@/utils/imageCompress";
import {
  panoramaUploadMessage,
  type PanoramaProgress
} from "@/utils/roomPanoramas";

/**
 * Many 360° photos for one room: upload, publish / hide, delete and
 * reorder (drag a row, or use the arrows).
 *
 * With a `roomId` every change goes straight to the engine. Without one
 * (a room that is not saved yet) photos wait here and are handed to the
 * parent through `staged`, which uploads them right after creating the room.
 */
type Item = {
  key: string;
  id: string | null;
  url: string;
  caption: string;
  published: boolean;
  file: File | null;
};

const props = defineProps<{
  roomId: string | null;
  /** Set by the parent while it uploads the photos of a new room. */
  progress?: PanoramaProgress | null;
}>();

const emit = defineEmits<{
  staged: [items: { file: File; published: boolean }[]];
}>();

const $q = useQuasar();
const cms = useCmsStore();

const fileInput = ref<HTMLInputElement | null>(null);
const items = ref<Item[]>([]);
const saved = ref<RoomPanorama[]>([]);
const editorOpen = ref(false);
const editorPhotoId = ref<string | null>(null);
const loading = ref(false);
const busy = ref(false);
const ownProgress = ref<PanoramaProgress | null>(null);
const error = ref("");
const dragging = ref(false);
const dragFrom = ref<number | null>(null);
const dragOver = ref<number | null>(null);

const live = computed(() => Boolean(props.roomId));
const shownProgress = computed(() => props.progress ?? ownProgress.value);
const editorPhoto = computed(
  () => saved.value.find(photo => photo.id === editorPhotoId.value) ?? null
);
let seq = 0;

function message(e: unknown, fallback: string) {
  return e instanceof Error && e.message ? e.message : fallback;
}

function fromList(list: RoomPanorama[]): Item[] {
  return list.map(photo => ({
    key: `saved-${photo.id}`,
    id: photo.id,
    url: photo.url,
    caption: photo.caption ?? "",
    published: photo.isPublished,
    file: null
  }));
}

function apply(list: RoomPanorama[]) {
  saved.value = list;
  items.value = fromList(list);
  if (props.roomId) cms.setRoomPanoramas(props.roomId, list);
}

async function load() {
  releaseStaged();
  items.value = [];
  error.value = "";
  if (!props.roomId) return;
  loading.value = true;
  try {
    apply(await fetchRoomPanoramas(props.roomId));
  } catch (e) {
    error.value = message(e, "Could not load the 360° photos.");
  } finally {
    loading.value = false;
  }
}

watch(() => props.roomId, load, { immediate: true });

watch(
  items,
  list => {
    if (live.value) return;
    emit(
      "staged",
      list
        .filter(item => item.file)
        .map(item => ({ file: item.file as File, published: item.published }))
    );
  },
  { deep: true }
);

/** Run one change against the engine; reload the list if it fails. */
async function run(action: () => Promise<RoomPanorama[]>) {
  busy.value = true;
  error.value = "";
  try {
    apply(await action());
  } catch (e) {
    error.value = message(e, "That change did not save. Try again.");
    await load();
  } finally {
    busy.value = false;
  }
}

/**
 * Upload the chosen photos one at a time: one POST per file, in order.
 * A photo that fails (too large, bad type, network) is reported by name and
 * the rest still go up. A saved room's list is re-read at the end.
 */
async function addFiles(files: File[]) {
  if (!files.length || busy.value) return;
  busy.value = true;
  error.value = "";
  const problems: string[] = [];
  try {
    for (const [index, file] of files.entries()) {
      if (props.roomId) {
        ownProgress.value = {
          current: index + 1,
          total: files.length,
          name: file.name
        };
      }
      let prepared: File;
      try {
        prepared = await preparePanoramaFile(file);
      } catch (e) {
        problems.push(`${file.name}: ${message(e, "Not a usable photo.")}`);
        continue;
      }
      if (props.roomId) {
        try {
          apply(await addRoomPanorama(props.roomId, prepared, true));
        } catch (e) {
          problems.push(`${file.name}: ${panoramaUploadMessage(e)}`);
        }
      } else {
        seq += 1;
        items.value.push({
          key: `new-${seq}`,
          id: null,
          url: URL.createObjectURL(prepared),
          caption: "",
          published: true,
          file: prepared
        });
      }
    }
    if (props.roomId) {
      try {
        apply(await fetchRoomPanoramas(props.roomId));
      } catch (e) {
        problems.push(message(e, "Could not refresh the 360° photos."));
      }
    }
  } catch (e) {
    problems.push(message(e, "Those 360° photos could not be added."));
  } finally {
    busy.value = false;
    ownProgress.value = null;
  }
  if (problems.length) error.value = problems.join(" ");
}
function togglePublished(item: Item) {
  if (props.roomId && item.id) {
    const roomId = props.roomId;
    const id = item.id;
    void run(() => setRoomPanoramaPublished(roomId, id, !item.published));
    return;
  }
  item.published = !item.published;
}

function remove(item: Item) {
  $q.dialog({
    title: "Delete this 360° photo?",
    message: "Guests will no longer see it.",
    cancel: true,
    persistent: true
  }).onOk(() => {
    if (props.roomId && item.id) {
      const roomId = props.roomId;
      const id = item.id;
      void run(() => deleteRoomPanorama(roomId, id));
      return;
    }
    if (item.file) URL.revokeObjectURL(item.url);
    items.value = items.value.filter(other => other.key !== item.key);
  });
}

function move(from: number, to: number) {
  if (from === to || to < 0 || to >= items.value.length) return;
  const next = [...items.value];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  items.value = next;
  if (!props.roomId) return;
  const roomId = props.roomId;
  const ids = next.map(item => item.id as string);
  void run(() => reorderRoomPanoramas(roomId, ids));
}

function blurCaption(event: Event) {
  (event.target as HTMLInputElement).blur();
}

function onCaptionBlur(item: Item, event: Event) {
  const next = (event.target as HTMLInputElement).value.trim();
  if (!live.value || !item.id || !props.roomId) {
    item.caption = next;
    return;
  }
  if (next === (item.caption ?? "").trim()) return;
  const roomId = props.roomId;
  const id = item.id;
  void run(() => setRoomPanoramaCaption(roomId, id, next || null));
}

function openEditor(item: Item) {
  if (!item.id) return;
  editorPhotoId.value = item.id;
  editorOpen.value = true;
}

function openFilePicker() {
  if (busy.value) return;
  const input = fileInput.value;
  if (!input) return;
  input.value = "";
  // Defer so the parent dialog's focus trap does not fight the native picker.
  window.setTimeout(() => input.click(), 0);
}

function onFileInput(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = "";
  void addFiles(files);
}

/* Dropping photos from the desktop onto the panel. */
function onFileDrag(event: DragEvent) {
  if (dragFrom.value !== null) return;
  if (event.dataTransfer?.types?.includes("Files")) dragging.value = true;
}

function onDragLeave(event: DragEvent) {
  const next = event.relatedTarget as Node | null;
  if (next && (event.currentTarget as Node).contains(next)) return;
  dragging.value = false;
}

function onFileDrop(event: DragEvent) {
  dragging.value = false;
  if (dragFrom.value !== null) return;
  void addFiles(Array.from(event.dataTransfer?.files ?? []));
}

/* Dragging a row to a new position. */
function onRowDragStart(index: number, event: DragEvent) {
  if (busy.value) {
    event.preventDefault();
    return;
  }
  dragFrom.value = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  }
}

function onRowDragOver(index: number) {
  if (dragFrom.value !== null) dragOver.value = index;
}

function onRowDrop(index: number) {
  const from = dragFrom.value;
  onRowDragEnd();
  if (from !== null) move(from, index);
}

function onRowDragEnd() {
  dragFrom.value = null;
  dragOver.value = null;
}

function releaseStaged() {
  for (const item of items.value) {
    if (item.file) URL.revokeObjectURL(item.url);
  }
}

onBeforeUnmount(releaseStaged);
</script>

<style scoped>
.pano-list {
  display: grid;
  gap: 0.75rem;
  min-width: 0;
  max-width: 100%;
  padding: 0.85rem;
  border: 1px dashed rgba(98, 112, 99, 0.45);
  border-radius: 0;
  background: var(--gy-sand);
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;
}

.pano-list--active {
  border-color: var(--gy-forest);
  background: rgba(98, 112, 99, 0.08);
}

.pano-list__top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.pano-list__hint,
.pano-list__status,
.pano-list__error,
.pano-list__empty {
  margin: 0;
  font-family: var(--font-body);
  font-size: 0.85rem;
  line-height: 1.45;
  color: var(--gy-forest);
}

.pano-list__progress {
  display: grid;
  gap: 0.4rem;
}

.pano-list__file {
  opacity: 0.7;
  overflow-wrap: anywhere;
}

.pano-list__hint {
  flex: 1 1 16rem;
  min-width: 0;
}

.pano-list__hint strong {
  font-family: var(--font-display);
  font-weight: 700;
}

.pano-list__add {
  position: relative;
  flex: 0 0 auto;
}

.pano-list__add-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 44px;
  padding: 0 1rem;
  border: 1px solid var(--gy-forest);
  border-radius: 0;
  background: var(--gy-forest);
  color: var(--gy-gold);
  font-family: var(--font-display);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}

.pano-list__add.is-disabled,
.pano-list__add-btn:disabled {
  opacity: 0.55;
  cursor: progress;
}

.pano-list__add-btn:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: 2px;
}

.pano-list__input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  pointer-events: none;
  opacity: 0;
}

.pano-list__error {
  padding: 0.65rem 0.75rem;
  border-radius: 0;
  background: rgba(196, 163, 90, 0.16);
}

.pano-list__empty {
  padding: 0.75rem 0;
  text-align: center;
}

.pano-list__items {
  display: grid;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.pano-item {
  display: grid;
  grid-template-columns: auto 6rem minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.65rem;
  border: 1px solid rgba(98, 112, 99, 0.35);
  border-radius: 0;
  background: var(--gy-white);
  cursor: grab;
}

.pano-item--hidden {
  background: rgba(255, 255, 255, 0.6);
}

.pano-item--hidden .pano-item__thumb {
  opacity: 0.5;
}

.pano-item--over {
  border-color: var(--gy-gold);
  box-shadow: 0 -3px 0 var(--gy-gold);
}

.pano-item--moving {
  opacity: 0.45;
}

.pano-item__num {
  display: grid;
  place-items: center;
  width: 1.75rem;
  height: 1.75rem;
  background: var(--gy-forest);
  color: var(--gy-gold);
  font-family: var(--font-display);
  font-size: 0.8rem;
  font-weight: 700;
}

.pano-item__thumb {
  display: block;
  width: 6rem;
  height: 3rem;
  border: 1px solid var(--gy-gold);
  border-radius: 0;
  object-fit: cover;
  background: var(--gy-sand);
}

.pano-item__meta {
  min-width: 0;
}

.pano-item__title,
.pano-item__state {
  margin: 0;
}

.pano-item__title {
  font-family: var(--font-display);
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--gy-forest);
}

.pano-item__state {
  font-family: var(--font-body);
  font-size: 0.8rem;
  color: var(--gy-forest);
}

.pano-item__actions {
  display: flex;
  gap: 0.3rem;
}

.pano-item__btn {
  display: inline-grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid var(--gy-forest);
  border-radius: 0;
  background: transparent;
  color: var(--gy-forest);
  cursor: pointer;
}

.pano-item__btn:hover:not(:disabled),
.pano-item__btn:focus-visible {
  background: var(--gy-forest);
  color: var(--gy-gold);
}

.pano-item__btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.pano-item__btn:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: 2px;
}

@media (max-width: 640px) {
  .pano-item {
    grid-template-columns: auto 5rem minmax(0, 1fr);
  }

  .pano-item__thumb {
    width: 5rem;
  }

  .pano-item :deep(.q-toggle) {
    grid-column: 2 / -1;
  }

  .pano-item__actions {
    grid-column: 1 / -1;
    justify-content: flex-end;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pano-list {
    transition-duration: 0.01s;
  }
}

.pano-item__caption {
  width: 100%;
  max-width: 16rem;
  min-height: 2.15rem;
  margin-top: 0.25rem;
  padding: 0.25rem 0.45rem;
  border: 1px solid rgba(98, 112, 99, 0.45);
  border-radius: 0;
  background: #fff;
  color: var(--gy-forest);
  font-family: var(--font-body);
  font-size: 0.85rem;
}

.pano-item__btn--wide {
  width: auto;
  padding: 0 0.55rem;
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}
</style>

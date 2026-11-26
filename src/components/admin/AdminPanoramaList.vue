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
        Add as many equirectangular photos as you like — JPG or WebP, up to 35
        MB each. The server shrinks very large files. Changes are saved when you
        click
        <strong>Save changes</strong>. Guests see only
        <strong>published</strong> photos, in this order.
      </p>
      <p v-if="dirty && !busy" class="pano-list__flag">Unsaved changes</p>
      <p v-else-if="busy" class="pano-list__saving">{{ savingLabel }}</p>
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
          'pano-item--moving': dragFrom === i,
          'pano-item--error': item.phase === 'error'
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
          <div v-if="item.phase !== 'idle'" class="pano-item__upload">
            <div class="pano-item__upload-row">
              <q-icon
                v-if="item.phase === 'uploaded'"
                name="check_circle"
                color="positive"
                size="18px"
              />
              <span v-if="item.phase === 'preparing'">Preparing…</span>
              <span v-else-if="item.phase === 'uploading'"
                >Uploading {{ item.percent }}%</span
              >
              <span v-else-if="item.phase === 'uploaded'" class="pano-item__ok"
                >Uploaded and saved</span
              >
              <span v-else-if="item.phase === 'error'" class="pano-item__err">{{
                item.error || "Upload failed."
              }}</span>
              <button
                v-if="item.phase === 'error'"
                type="button"
                class="pano-item__retry"
                @click="retryItem(item)"
              >
                Retry
              </button>
            </div>
            <q-linear-progress
              v-if="item.phase === 'preparing' || item.phase === 'uploading'"
              :value="item.phase === 'preparing' ? 0 : item.percent / 100"
              :indeterminate="item.phase === 'preparing'"
              color="primary"
              track-color="grey-3"
              size="6px"
            />
          </div>
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
      v-if="editorPhoto"
      v-model="editorOpen"
      :room-id="roomId || ''"
      :photo="editorPhoto"
      :photos="draftPhotos"
      defer-save
      @saved="onHotspotsSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useQuasar } from "quasar";
import AdminPanoramaHotspotEditor from "@/components/admin/AdminPanoramaHotspotEditor.vue";
import {
  addRoomPanorama,
  addRoomPanoramaHotspot,
  deleteRoomPanorama,
  deleteRoomPanoramaHotspot,
  fetchRoomPanoramas,
  reorderRoomPanoramas,
  setRoomPanoramaCaption,
  setRoomPanoramaPublished,
  updateRoomPanoramaHotspot
} from "@/services/engine/adminCatalog";
import { useCmsStore } from "@/stores/cms-store";
import type { RoomPanorama, RoomPanoramaHotspot } from "@/types/greyon";
import {
  PANORAMA_ACCEPT_ATTR,
  preparePanoramaFile,
  validatePanoramaFile
} from "@/utils/imageCompress";
import { panoramaUploadMessage } from "@/utils/roomPanoramas";

/**
 * 360° photos for one room. Edits stay pending in this dialog and are
 * written when the parent calls `commit` (Save changes). Cancel discards
 * them, and deletes any photos uploaded during a failed/partial save.
 */
type Phase = "idle" | "preparing" | "uploading" | "uploaded" | "error";

type Item = {
  key: string;
  id: string | null;
  url: string;
  caption: string;
  published: boolean;
  file: File | null;
  hotspots: RoomPanoramaHotspot[];
  phase: Phase;
  percent: number;
  error: string | null;
};

const props = defineProps<{
  roomId: string | null;
}>();

const emit = defineEmits<{
  dirty: [value: boolean];
  busy: [value: boolean];
}>();

const $q = useQuasar();
const cms = useCmsStore();

const fileInput = ref<HTMLInputElement | null>(null);
const items = ref<Item[]>([]);
const baseline = ref<RoomPanorama[]>([]);
const editorOpen = ref(false);
const editorPhotoId = ref<string | null>(null);
const loading = ref(false);
const busy = ref(false);
const error = ref("");
const dragging = ref(false);
const dragFrom = ref<number | null>(null);
const dragOver = ref<number | null>(null);
const sessionIds = new Set<string>();
let seq = 0;
let uploadAbort: AbortController | null = null;

function message(e: unknown, fallback: string) {
  return e instanceof Error && e.message ? e.message : fallback;
}

function photoId(item: Item) {
  return item.id ?? item.key;
}

function fromPhoto(photo: RoomPanorama): Item {
  return {
    key: `saved-${photo.id}`,
    id: photo.id,
    url: photo.url,
    caption: photo.caption ?? "",
    published: photo.isPublished,
    file: null,
    hotspots: [...(photo.hotspots ?? [])],
    phase: "idle",
    percent: 0,
    error: null
  };
}

function asPhoto(item: Item): RoomPanorama {
  return {
    id: photoId(item),
    url: item.url,
    caption: item.caption.trim() || null,
    isPublished: item.published,
    sortOrder: 0,
    hotspots: item.hotspots
  };
}

function hotspotsEqual(
  a: RoomPanoramaHotspot[],
  b: RoomPanoramaHotspot[]
): boolean {
  if (a.length !== b.length) return false;
  return a.every((spot, i) => {
    const other = b[i];
    return (
      !!other &&
      spot.id === other.id &&
      spot.targetPanoramaId === other.targetPanoramaId &&
      spot.yaw === other.yaw &&
      spot.pitch === other.pitch &&
      (spot.label ?? "") === (other.label ?? "")
    );
  });
}

const draftPhotos = computed(() => items.value.map(asPhoto));
const editorPhoto = computed(
  () =>
    draftPhotos.value.find(
      (photo: RoomPanorama) => photo.id === editorPhotoId.value
    ) ?? null
);

const dirty = computed(() => {
  if (items.value.some((item: Item) => item.file || item.phase === "error"))
    return true;
  if (items.value.length !== baseline.value.length) return true;
  return items.value.some((item: Item, i: number) => {
    const base = baseline.value[i];
    if (!base || base.id !== item.id) return true;
    if ((item.caption ?? "").trim() !== (base.caption ?? "").trim())
      return true;
    if (item.published !== base.isPublished) return true;
    return !hotspotsEqual(item.hotspots, base.hotspots ?? []);
  });
});

const savingLabel = computed(() => {
  const uploading = items.value.find(
    (item: Item) => item.phase === "uploading"
  );
  if (uploading) return `Uploading ${uploading.percent}%`;
  if (items.value.some((item: Item) => item.phase === "preparing")) {
    return "Preparing 360° photos…";
  }
  return "Saving 360° photos…";
});

watch(dirty, (value: boolean) => emit("dirty", value), { immediate: true });
watch(busy, (value: boolean) => emit("busy", value), { immediate: true });

function apply(list: RoomPanorama[]) {
  baseline.value = list;
  items.value = list.map(fromPhoto);
  sessionIds.clear();
  if (props.roomId) cms.setRoomPanoramas(props.roomId, list);
}

async function load() {
  releaseStaged();
  items.value = [];
  baseline.value = [];
  sessionIds.clear();
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

watch(
  () => props.roomId,
  (id: string | null, prev: string | null | undefined) => {
    // Creating a room sets the id mid-session; keep pending photos.
    // On first run `prev` is undefined, so edit still loads.
    if (id && prev === null) return;
    void load();
  },
  { immediate: true }
);

function addFiles(files: File[]) {
  if (!files.length || busy.value) return;
  error.value = "";
  const problems: string[] = [];
  for (const file of files) {
    const invalid = validatePanoramaFile(file);
    if (invalid) {
      problems.push(`${file.name}: ${invalid}`);
      continue;
    }
    seq += 1;
    items.value.push({
      key: `new-${seq}`,
      id: null,
      url: URL.createObjectURL(file),
      caption: "",
      published: true,
      file,
      hotspots: [],
      phase: "idle",
      percent: 0,
      error: null
    });
  }
  if (problems.length) error.value = problems.join(" ");
}

function togglePublished(item: Item) {
  item.published = !item.published;
}

function remove(item: Item) {
  $q.dialog({
    title: "Remove this 360° photo?",
    message: "It will be deleted when you click Save changes.",
    cancel: true,
    persistent: true
  }).onOk(() => {
    if (item.file) URL.revokeObjectURL(item.url);
    items.value = items.value.filter((other: Item) => other.key !== item.key);
    if (editorPhotoId.value === photoId(item)) {
      editorOpen.value = false;
      editorPhotoId.value = null;
    }
  });
}

function move(from: number, to: number) {
  if (from === to || to < 0 || to >= items.value.length) return;
  const next = [...items.value];
  const [moved] = next.splice(from, 1);
  if (!moved) return;
  next.splice(to, 0, moved);
  items.value = next;
}

function blurCaption(event: Event) {
  (event.target as HTMLInputElement).blur();
}

function onCaptionBlur(item: Item, event: Event) {
  item.caption = (event.target as HTMLInputElement).value.trim();
}

function openEditor(item: Item) {
  if (items.value.length < 2) return;
  editorPhotoId.value = photoId(item);
  editorOpen.value = true;
}

function onHotspotsSaved(list: RoomPanorama[]) {
  const byId = new Map(list.map(photo => [photo.id, photo]));
  for (const item of items.value) {
    const next = byId.get(photoId(item));
    if (next) item.hotspots = [...(next.hotspots ?? [])];
  }
}

function remapPhotoId(from: string, to: string) {
  for (const item of items.value) {
    for (const spot of item.hotspots) {
      if (spot.targetPanoramaId === from) spot.targetPanoramaId = to;
    }
  }
  if (editorPhotoId.value === from) editorPhotoId.value = to;
}

function knownIds() {
  return new Set(
    [
      ...baseline.value.map((photo: RoomPanorama) => photo.id),
      ...items.value.map((item: Item) => item.id)
    ].filter((id: string | null): id is string => Boolean(id))
  );
}

async function uploadItem(roomId: string, item: Item) {
  if (!item.file) return;
  item.phase = "preparing";
  item.percent = 0;
  item.error = null;
  const prepared = await preparePanoramaFile(item.file);
  item.file = prepared;
  item.phase = "uploading";
  const before = knownIds();
  uploadAbort = new AbortController();
  const list = await addRoomPanorama(roomId, prepared, item.published, {
    onUploadProgress: percent => {
      item.percent = percent;
    },
    signal: uploadAbort.signal
  });
  const created =
    list.find(photo => !before.has(photo.id)) ?? list[list.length - 1];
  if (!created) throw new Error("The photo uploaded, but no id came back.");
  const previous = photoId(item);
  if (item.file) URL.revokeObjectURL(item.url);
  item.id = created.id;
  item.url = created.url;
  item.file = null;
  item.phase = "uploaded";
  item.percent = 100;
  sessionIds.add(created.id);
  remapPhotoId(previous, created.id);
  $q.notify({ type: "positive", message: "Uploaded and saved" });
}

async function syncHotspots(roomId: string, item: Item) {
  if (!item.id) return;
  const before =
    baseline.value.find((photo: RoomPanorama) => photo.id === item.id)
      ?.hotspots ?? [];
  const after = item.hotspots;
  const afterIds = new Set(after.map(spot => spot.id));
  for (const spot of before) {
    if (!afterIds.has(spot.id)) {
      await deleteRoomPanoramaHotspot(roomId, item.id, spot.id);
    }
  }
  for (const spot of after) {
    const target = items.value.find(
      (other: Item) =>
        photoId(other) === spot.targetPanoramaId ||
        other.id === spot.targetPanoramaId
    );
    const targetId = target?.id ?? spot.targetPanoramaId;
    if (
      !targetId ||
      targetId.startsWith("new-") ||
      targetId.startsWith("pending-")
    ) {
      continue;
    }
    const input = {
      targetPanoramaId: targetId,
      yaw: spot.yaw,
      pitch: spot.pitch,
      label: spot.label
    };
    const prev = before.find(
      (other: RoomPanoramaHotspot) => other.id === spot.id
    );
    const isPending = !spot.id || spot.id.startsWith("pending-hs-");
    if (isPending || !prev) {
      await addRoomPanoramaHotspot(roomId, item.id, input);
    } else if (
      prev.targetPanoramaId !== input.targetPanoramaId ||
      prev.yaw !== input.yaw ||
      prev.pitch !== input.pitch ||
      (prev.label ?? "") !== (input.label ?? "")
    ) {
      await updateRoomPanoramaHotspot(roomId, item.id, spot.id, input);
    }
  }
}

async function commit(roomId: string) {
  if (busy.value) return;
  busy.value = true;
  error.value = "";
  try {
    const pending = items.value.filter((item: Item) => item.file);
    const failed: Item[] = [];
    for (const item of pending) {
      try {
        await uploadItem(roomId, item);
      } catch (e) {
        item.phase = "error";
        item.error = panoramaUploadMessage(e);
        failed.push(item);
      }
    }
    if (failed.length) {
      throw new Error(
        failed
          .map(item => `${item.file?.name ?? "Photo"}: ${item.error}`)
          .join(" ")
      );
    }

    for (const item of items.value) {
      if (!item.id) continue;
      const base = baseline.value.find(
        (photo: RoomPanorama) => photo.id === item.id
      );
      const caption = item.caption.trim() || null;
      if ((base?.caption ?? null) !== caption) {
        await setRoomPanoramaCaption(roomId, item.id, caption);
      }
      if (!base || base.isPublished !== item.published) {
        await setRoomPanoramaPublished(roomId, item.id, item.published);
      }
      await syncHotspots(roomId, item);
    }

    const ids = items.value
      .map((item: Item) => item.id)
      .filter((id: string | null): id is string => Boolean(id));
    if (ids.length) await reorderRoomPanoramas(roomId, ids);

    const keep = new Set(ids);
    for (const photo of baseline.value) {
      if (!keep.has(photo.id)) await deleteRoomPanorama(roomId, photo.id);
    }

    apply(await fetchRoomPanoramas(roomId));
  } catch (e) {
    error.value = message(e, "The 360° photos could not be saved. Try again.");
    throw e;
  } finally {
    busy.value = false;
  }
}

async function retryItem(item: Item) {
  if (!props.roomId || !item.file) return;
  error.value = "";
  busy.value = true;
  try {
    await uploadItem(props.roomId, item);
  } catch (e) {
    item.phase = "error";
    item.error = panoramaUploadMessage(e);
    error.value = item.error;
  } finally {
    busy.value = false;
  }
}

async function discard() {
  uploadAbort?.abort();
  uploadAbort = null;
  const roomId = props.roomId;
  const uploaded = [...sessionIds];
  if (roomId && uploaded.length) {
    for (const id of uploaded) {
      try {
        await deleteRoomPanorama(roomId, id);
      } catch {
        /* still discard local state */
      }
    }
  }
  releaseStaged();
  sessionIds.clear();
  if (roomId) {
    try {
      apply(await fetchRoomPanoramas(roomId));
    } catch {
      items.value = baseline.value.map(fromPhoto);
    }
  } else {
    items.value = [];
    baseline.value = [];
  }
}

function openFilePicker() {
  if (busy.value) return;
  const input = fileInput.value;
  if (!input) return;
  input.value = "";
  window.setTimeout(() => input.click(), 0);
}

function onFileInput(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = "";
  addFiles(files);
}

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
  addFiles(Array.from(event.dataTransfer?.files ?? []));
}

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

defineExpose({
  commit,
  discard,
  isDirty: () => dirty.value,
  isBusy: () => busy.value
});
</script>

<style scoped>
.pano-list__flag {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin: 0;
  padding: 0.15rem 0.5rem;
  border: 1px solid var(--gy-gold-deep, #8f7340);
  background: #fff8ef;
  color: var(--gy-ink, #454c4b);
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.pano-list__saving {
  margin: 0;
  font-family: var(--font-display);
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--gy-forest);
}

.pano-item__upload {
  display: grid;
  gap: 0.2rem;
  margin-top: 0.35rem;
}

.pano-item__upload-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-family: var(--font-body);
  font-size: 0.78rem;
  color: var(--gy-forest);
}

.pano-item__ok {
  color: #2e7d4f;
  font-weight: 700;
}

.pano-item__err {
  color: #8b2e2e;
}

.pano-item__retry {
  padding: 0;
  border: 0;
  background: none;
  color: var(--gy-forest);
  font: inherit;
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
}

.pano-item--error {
  border-color: #8b2e2e;
}

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

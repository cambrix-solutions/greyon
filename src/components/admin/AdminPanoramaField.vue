<template>
  <div
    class="pano-field"
    :class="{
      'pano-field--active': dragging,
      'pano-field--error': Boolean(error)
    }"
    @dragenter.prevent="dragging = true"
    @dragover.prevent="dragging = true"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <div v-if="preview" class="pano-field__preview">
      <img :src="preview" alt="360° photo preview" />
      <span class="pano-field__badge">360°</span>
      <div v-if="preparing" class="pano-field__overlay">
        <p>Preparing 360° photo…</p>
      </div>
      <button
        v-else
        type="button"
        class="pano-field__remove"
        aria-label="Remove 360° photo"
        @click="remove"
      >
        Remove
      </button>
    </div>

    <div v-else class="pano-field__empty">
      <q-icon name="language" size="28px" color="primary" />
      <p class="pano-field__title">360° photo</p>
      <p class="pano-field__hint">
        Drop an equirectangular photo here, or
        <label class="pano-field__browse">
          browse
          <input
            ref="fileInput"
            type="file"
            :accept="PANORAMA_ACCEPT_ATTR"
            class="pano-field__input"
            @change="onFileInput"
          />
        </label>
        — JPG or WebP, up to 15 MB. Optional. A new photo is sent as
        <code>panorama</code>; removing a saved one sends
        <code>remove_panorama=1</code>.
      </p>
    </div>

    <p v-if="error" class="pano-field__error" role="alert">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import {
  PANORAMA_ACCEPT_ATTR,
  preparePanoramaFile
} from "@/utils/imageCompress";

const props = withDefaults(
  defineProps<{
    existingUrl?: string | null;
  }>(),
  { existingUrl: null }
);

const emit = defineEmits<{
  change: [value: { file: File | null; clear: boolean }];
}>();

const dragging = ref(false);
const preparing = ref(false);
const error = ref("");
const fileInput = ref<HTMLInputElement | null>(null);
const picked = ref<File | null>(null);
const pickedUrl = ref("");
const removed = ref(false);

let objectUrl = "";

const preview = computed(() => {
  if (pickedUrl.value) return pickedUrl.value;
  if (removed.value) return "";
  return props.existingUrl?.trim() || "";
});

watch(
  () => props.existingUrl,
  () => {
    clearPicked();
    removed.value = false;
    error.value = "";
  }
);

function clearPicked() {
  picked.value = null;
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = "";
  pickedUrl.value = "";
}

function onDragLeave(event: DragEvent) {
  const next = event.relatedTarget as Node | null;
  if (next && (event.currentTarget as Node).contains(next)) return;
  dragging.value = false;
}

function onDrop(event: DragEvent) {
  dragging.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (file) void useFile(file);
}

function onFileInput(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (file) void useFile(file);
}

async function useFile(file: File) {
  error.value = "";
  preparing.value = true;
  try {
    const prepared = await preparePanoramaFile(file);
    clearPicked();
    objectUrl = URL.createObjectURL(prepared);
    pickedUrl.value = objectUrl;
    picked.value = prepared;
    removed.value = false;
    emit("change", { file: prepared, clear: false });
  } catch (e) {
    error.value =
      e instanceof Error ? e.message : "Could not use that 360° photo.";
  } finally {
    preparing.value = false;
  }
}

function remove() {
  clearPicked();
  removed.value = true;
  error.value = "";
  emit("change", {
    file: null,
    clear: Boolean(props.existingUrl?.trim())
  });
}

onBeforeUnmount(clearPicked);
</script>

<style scoped>
.pano-field {
  display: grid;
  gap: 0.65rem;
  min-width: 0;
  max-width: 100%;
  padding: 0.85rem;
  border: 1px dashed rgba(98, 112, 99, 0.45);
  border-radius: 10px;
  background: var(--gy-sand);
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;
}

.pano-field--active {
  border-color: var(--gy-forest);
  background: rgba(98, 112, 99, 0.08);
}

.pano-field--error {
  border-color: var(--gy-gold);
}

.pano-field__empty {
  display: grid;
  justify-items: center;
  gap: 0.25rem;
  padding: 1rem 0.5rem;
  text-align: center;
}

.pano-field__title {
  margin: 0.35rem 0 0;
  font-family: var(--font-display);
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--gy-forest);
}

.pano-field__hint,
.pano-field__error,
.pano-field__overlay p {
  margin: 0;
  font-family: var(--font-body);
  font-size: 0.85rem;
  line-height: 1.45;
}

.pano-field__hint {
  max-width: 32rem;
  color: var(--gy-forest);
}

.pano-field__hint code {
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--gy-gold);
}

.pano-field__browse {
  color: var(--gy-gold);
  text-decoration: underline;
  cursor: pointer;
}

.pano-field__input {
  display: none;
}

.pano-field__preview {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--gy-gold);
  border-radius: 8px;
  background: var(--gy-white);
}

.pano-field__preview img {
  display: block;
  width: 100%;
  max-height: 180px;
  object-fit: cover;
}

.pano-field__badge {
  position: absolute;
  top: 0.45rem;
  left: 0.45rem;
  padding: 0.2rem 0.4rem;
  border-radius: 2px;
  background: var(--gy-forest);
  color: var(--gy-gold);
  font-family: var(--font-display);
  font-size: 0.68rem;
  font-weight: 700;
}

.pano-field__overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(26, 33, 30, 0.55);
  color: var(--gy-gold);
}

.pano-field__remove {
  position: absolute;
  top: 0.45rem;
  right: 0.45rem;
  min-height: 44px;
  padding: 0 0.75rem;
  border: 1px solid var(--gy-gold);
  border-radius: 999px;
  background: var(--gy-forest);
  color: var(--gy-gold);
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
}

.pano-field__remove:focus-visible,
.pano-field__browse:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: 2px;
}

.pano-field__error {
  padding: 0.65rem 0.75rem;
  border-radius: 8px;
  background: rgba(196, 163, 90, 0.16);
  color: var(--gy-forest);
}

@media (prefers-reduced-motion: reduce) {
  .pano-field {
    transition-duration: 0.01s;
  }
}
</style>

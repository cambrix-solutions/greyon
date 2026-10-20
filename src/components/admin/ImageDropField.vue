<template>
  <div
    class="image-drop"
    :class="{
      'image-drop--active': dragging,
      'image-drop--busy': isBusy,
      'image-drop--has-preview': Boolean(displayPreview),
      'image-drop--error': Boolean(uploadError)
    }"
    @dragenter.prevent="dragging = true"
    @dragover.prevent="dragging = true"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <div v-if="displayPreview" class="image-drop__preview">
      <img :src="displayPreview" :alt="altHint || 'Preview'" />
      <div v-if="isBusy" class="image-drop__overlay">
        <div class="image-drop__progress-wrap">
          <q-linear-progress
            :value="progressValue"
            color="primary"
            track-color="white"
            size="6px"
            rounded
            class="image-drop__progress"
          />
          <p class="image-drop__progress-label">
            {{ statusLabel }}
          </p>
        </div>
        <q-btn
          flat
          dense
          no-caps
          color="white"
          label="Cancel"
          class="image-drop__cancel"
          @click.stop="onCancel"
        />
      </div>
      <button
        v-else
        type="button"
        class="image-drop__clear"
        aria-label="Clear image"
        @click="clear"
      >
        ×
      </button>
    </div>

    <div v-else class="image-drop__empty">
      <q-icon name="cloud_upload" size="28px" color="primary" />
      <p class="image-drop__title">{{ title }}</p>
      <p class="image-drop__hint">
        Drop {{ multiple ? "images" : "an image" }} here, or
        <label class="image-drop__browse">
          browse
          <input
            ref="fileInput"
            type="file"
            :accept="ACCEPT_IMAGE_ATTR"
            :multiple="multiple"
            class="image-drop__input"
            @change="onFileInput"
          />
        </label>
        — JPG, PNG, or WebP, up to 10 MB.
      </p>
      <p v-if="allowUrl" class="image-drop__hint">
        Or paste a hosted image URL below.
      </p>
    </div>

    <div v-if="uploadError" class="image-drop__error" role="alert">
      <p class="image-drop__error-msg">{{ uploadError }}</p>
      <div class="image-drop__error-actions">
        <q-btn
          v-if="canRetry"
          unelevated
          dense
          no-caps
          color="primary"
          label="Retry"
          @click="retry"
        />
        <q-btn flat dense no-caps label="Dismiss" @click="dismissError" />
      </div>
    </div>

    <div
      v-if="multiple && pendingBatch.length > 1 && !isBusy"
      class="image-drop__batch"
    >
      {{ pendingBatch.length }} images ready
    </div>

    <q-input
      v-if="allowUrl"
      :model-value="urlValue"
      dense
      outlined
      clearable
      class="image-drop__url"
      label="Image URL"
      :disable="isBusy"
      hint="Filled automatically after upload — or paste a URL"
      @update:model-value="onUrl"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ACCEPT_IMAGE_ATTR } from "@/utils/imageCompress";
import { useImageUpload } from "@/composables/useImageUpload";

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    title?: string;
    altHint?: string;
    allowUrl?: boolean;
    /** Storage folder hint for the engine, e.g. hotels/my-slug */
    folder?: string;
    /** Allow selecting / dropping multiple files (galleries). */
    multiple?: boolean;
  }>(),
  {
    modelValue: "",
    title: "Upload image",
    altHint: "",
    allowUrl: true,
    folder: undefined,
    multiple: false
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
  /** Fired when one or more files finish uploading successfully. */
  uploaded: [urls: string[]];
  "update:busy": [busy: boolean];
}>();

const dragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const uploadError = ref<string | null>(null);
const lastFiles = ref<File[]>([]);
const pendingBatch = ref<string[]>([]);
const localPreview = ref<string | null>(null);

const folderRef = computed(() => props.folder);
const {
  state,
  progress,
  error,
  previewUrl,
  upload,
  cancel,
  reset,
  clearPreview
} = useImageUpload({
  folder: () => folderRef.value
});

const isBusy = computed(
  () => state.value === "preparing" || state.value === "uploading"
);
const progressValue = computed(() =>
  state.value === "preparing" ? 0.08 : Math.max(0.05, progress.value / 100)
);
const statusLabel = computed(() => {
  if (state.value === "preparing") return "Preparing image…";
  if (state.value === "uploading") {
    return progress.value > 0 ? `Uploading ${progress.value}%…` : "Uploading…";
  }
  return "Working…";
});
const canRetry = computed(() => lastFiles.value.length > 0);

const displayPreview = computed(
  () =>
    localPreview.value ||
    previewUrl.value ||
    (props.modelValue && !props.modelValue.startsWith("data:")
      ? props.modelValue
      : "") ||
    ""
);

const urlValue = computed(() => {
  const v = props.modelValue || "";
  return v.startsWith("data:") ? "" : v;
});

watch(isBusy, busy => emit("update:busy", busy));
watch(error, msg => {
  if (msg) uploadError.value = msg;
});

function onDragLeave(e: DragEvent) {
  const next = e.relatedTarget as Node | null;
  if (next && (e.currentTarget as Node).contains(next)) return;
  dragging.value = false;
}

function onDrop(e: DragEvent) {
  dragging.value = false;
  const list = e.dataTransfer?.files;
  if (!list?.length) return;
  void handleFiles([...list]);
}

function onFileInput(e: Event) {
  const input = e.target as HTMLInputElement;
  const list = input.files;
  if (list?.length) void handleFiles([...list]);
  input.value = "";
}

async function handleFiles(files: File[]) {
  const picked = props.multiple ? files : files.slice(0, 1);
  if (!picked.length) return;

  lastFiles.value = picked;
  uploadError.value = null;
  pendingBatch.value = [];
  clearPreview();
  localPreview.value = null;

  const urls: string[] = [];
  for (const file of picked) {
    const result = await upload(file);
    if (!result) {
      // Error / cancel already reflected in state.
      if (state.value === "idle") return;
      return;
    }
    urls.push(result.url);
    localPreview.value = result.url;
  }

  pendingBatch.value = urls;
  const last = urls[urls.length - 1] ?? "";
  emit("update:modelValue", last);
  emit("uploaded", urls);
}

function onUrl(value: string | number | null) {
  const next = String(value ?? "").trim();
  uploadError.value = null;
  pendingBatch.value = next ? [next] : [];
  localPreview.value = next || null;
  clearPreview();
  emit("update:modelValue", next);
  if (next) emit("uploaded", [next]);
}

function clear() {
  reset();
  uploadError.value = null;
  lastFiles.value = [];
  pendingBatch.value = [];
  localPreview.value = null;
  emit("update:modelValue", "");
}

function onCancel() {
  cancel();
  uploadError.value = null;
}

function dismissError() {
  uploadError.value = null;
}

function retry() {
  if (!lastFiles.value.length) return;
  void handleFiles(lastFiles.value);
}

defineExpose({
  isBusy,
  pendingBatch,
  clear,
  retry
});
</script>

<style scoped>
.image-drop {
  display: grid;
  gap: 0.65rem;
  padding: 0.85rem;
  border: 1px dashed rgba(84, 88, 89, 0.4);
  background: var(--gy-sand);
  border-radius: 10px;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.image-drop--active {
  border-color: var(--gy-forest);
  background: rgba(84, 88, 89, 0.08);
}

.image-drop--error {
  border-color: rgba(176, 64, 64, 0.55);
}

.image-drop__empty {
  display: grid;
  justify-items: center;
  gap: 0.25rem;
  padding: 1rem 0.5rem;
  text-align: center;
}

.image-drop__title {
  margin: 0.35rem 0 0;
  font-size: 0.92rem;
  font-weight: 600;
}

.image-drop__hint {
  margin: 0;
  font-size: 0.8rem;
  color: var(--gy-muted);
  max-width: 28rem;
  line-height: 1.4;
}

.image-drop__browse {
  color: var(--gy-forest);
  text-decoration: underline;
  cursor: pointer;
}

.image-drop__input {
  display: none;
}

.image-drop__preview {
  position: relative;
  overflow: hidden;
  background: #fff;
  border: 1px solid rgba(28, 36, 33, 0.08);
  border-radius: 8px;
}

.image-drop__preview img {
  display: block;
  width: 100%;
  max-height: 200px;
  object-fit: cover;
}

.image-drop__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(28, 36, 33, 0.55);
}

.image-drop__progress-wrap {
  width: min(100%, 220px);
  text-align: center;
}

.image-drop__progress-label {
  margin: 0.45rem 0 0;
  color: #fff;
  font-size: 0.78rem;
  font-weight: 600;
}

.image-drop__clear {
  position: absolute;
  top: 0.35rem;
  right: 0.35rem;
  width: 1.75rem;
  height: 1.75rem;
  border: 0;
  border-radius: 999px;
  background: rgba(28, 36, 33, 0.75);
  color: #fff;
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
}

.image-drop__error {
  display: grid;
  gap: 0.45rem;
  padding: 0.65rem 0.75rem;
  background: rgba(176, 64, 64, 0.08);
  border-radius: 8px;
}

.image-drop__error-msg {
  margin: 0;
  font-size: 0.82rem;
  color: #8a2f2f;
  line-height: 1.4;
}

.image-drop__error-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.image-drop__batch {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--gy-forest);
}

.image-drop__url {
  background: #fff;
}

@media (max-width: 600px) {
  .image-drop {
    padding: 0.7rem;
  }

  .image-drop__preview img {
    max-height: 160px;
  }
}
</style>

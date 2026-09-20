<template>
  <div
    class="image-drop"
    :class="{
      'image-drop--active': dragging,
      'image-drop--has-preview': Boolean(previewSrc)
    }"
    @dragenter.prevent="dragging = true"
    @dragover.prevent="dragging = true"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <div v-if="previewSrc" class="image-drop__preview">
      <img :src="previewSrc" :alt="altHint || 'Preview'" />
      <button
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
        Drop an image here, or
        <label class="image-drop__browse">
          browse
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="image-drop__input"
            @change="onFileInput"
          />
        </label>
      </p>
    </div>

    <q-input
      v-if="allowUrl"
      :model-value="urlValue"
      dense
      outlined
      clearable
      class="image-drop__url"
      label="Or paste image URL"
      @update:model-value="onUrl"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useQuasar } from "quasar";

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    title?: string;
    altHint?: string;
    allowUrl?: boolean;
    maxBytes?: number;
  }>(),
  {
    modelValue: "",
    title: "Upload image",
    altHint: "",
    allowUrl: true,
    maxBytes: 2_500_000
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const $q = useQuasar();
const dragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const previewSrc = computed(() => props.modelValue || "");
const urlValue = computed(() =>
  props.modelValue?.startsWith("data:") ? "" : props.modelValue || ""
);

function onDragLeave(e: DragEvent) {
  const next = e.relatedTarget as Node | null;
  if (next && (e.currentTarget as Node).contains(next)) return;
  dragging.value = false;
}

function onDrop(e: DragEvent) {
  dragging.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) void readFile(file);
}

function onFileInput(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) void readFile(file);
  input.value = "";
}

async function readFile(file: File) {
  if (!file.type.startsWith("image/")) {
    $q.notify({ type: "negative", message: "Please choose an image file." });
    return;
  }
  if (file.size > props.maxBytes) {
    $q.notify({
      type: "negative",
      message: `Image is too large (max ${Math.round(props.maxBytes / 1000)} KB for local MVP).`
    });
    return;
  }
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  emit("update:modelValue", dataUrl);
}

function onUrl(value: string | number | null) {
  emit("update:modelValue", String(value ?? "").trim());
}

function clear() {
  emit("update:modelValue", "");
}
</script>

<style scoped>
.image-drop {
  display: grid;
  gap: 0.65rem;
  padding: 0.85rem;
  border: 1px dashed rgba(154, 123, 60, 0.4);
  background: var(--gy-sand);
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.image-drop--active {
  border-color: var(--gy-forest);
  background: rgba(154, 123, 60, 0.08);
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
}

.image-drop__preview img {
  display: block;
  width: 100%;
  max-height: 180px;
  object-fit: cover;
}

.image-drop__clear {
  position: absolute;
  top: 0.35rem;
  right: 0.35rem;
  width: 1.75rem;
  height: 1.75rem;
  border: 0;
  background: rgba(28, 36, 33, 0.75);
  color: #fff;
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
}

.image-drop__url {
  background: #fff;
}
</style>

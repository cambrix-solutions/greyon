<template>
  <div class="icon-picker">
    <div class="icon-picker__selected">
      <span class="icon-picker__preview" aria-hidden="true">
        <q-icon :name="modelValue || fallback" size="22px" />
      </span>
      <q-input
        :model-value="modelValue"
        dense
        outlined
        :label="label"
        :hint="hint"
        :error="Boolean(error)"
        :error-message="error || undefined"
        class="icon-picker__input"
        @update:model-value="onType"
      />
    </div>
    <q-input
      v-model="filter"
      dense
      outlined
      clearable
      placeholder="Filter icons…"
      class="icon-picker__filter"
    >
      <template #prepend><q-icon name="search" size="18px" /></template>
    </q-input>
    <div class="icon-picker__grid" role="listbox" :aria-label="label">
      <button
        v-for="icon in filtered"
        :key="icon"
        type="button"
        class="icon-picker__item"
        :class="{ 'icon-picker__item--on': icon === modelValue }"
        :title="icon"
        :aria-label="icon"
        :aria-selected="icon === modelValue"
        @click="emit('update:modelValue', icon)"
      >
        <q-icon :name="icon" size="20px" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { DEFAULT_SERVICE_ICON, SERVICE_ICONS } from "@/data/serviceIcons";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    label?: string;
    hint?: string;
    error?: string;
    icons?: readonly string[];
    fallback?: string;
  }>(),
  {
    label: "Icon",
    hint: "Material icon name shown on the public hotel page",
    error: "",
    icons: () => SERVICE_ICONS,
    fallback: DEFAULT_SERVICE_ICON
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const filter = ref("");

const filtered = computed(() => {
  const needle = filter.value.trim().toLowerCase();
  const list = [...props.icons];
  if (!needle) return list;
  return list.filter(icon => icon.toLowerCase().includes(needle));
});

function onType(value: string | number | null) {
  emit("update:modelValue", value == null ? "" : String(value));
}
</script>

<style scoped>
.icon-picker {
  display: grid;
  gap: 0.65rem;
}

.icon-picker__selected {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.65rem;
  align-items: start;
}

.icon-picker__preview {
  display: grid;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 10px;
  background: var(--gy-sand, #f3efe6);
  color: var(--gy-forest, #3f4a3f);
  border: 1px solid rgba(18, 17, 16, 0.08);
}

.icon-picker__filter {
  background: #fff;
}

.icon-picker__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(2.4rem, 1fr));
  gap: 0.35rem;
  max-height: 11rem;
  overflow: auto;
  padding: 0.35rem;
  border: 1px solid rgba(18, 17, 16, 0.08);
  border-radius: 12px;
  background: #fff;
}

.icon-picker__item {
  display: grid;
  place-items: center;
  width: 100%;
  aspect-ratio: 1;
  margin: 0;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--gy-ink, #121110);
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.icon-picker__item:hover {
  background: rgba(84, 88, 89, 0.08);
}

.icon-picker__item--on {
  background: rgba(84, 88, 89, 0.14);
  border-color: rgba(176, 141, 87, 0.45);
  color: var(--gy-forest, #3f4a3f);
}
</style>

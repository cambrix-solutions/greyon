<template>
  <div class="amenities-editor">
    <q-select
      :model-value="modelValue"
      :options="filteredOptions"
      :label="label"
      outlined
      dense
      multiple
      use-chips
      use-input
      input-debounce="0"
      new-value-mode="add-unique"
      hint="Pick from the list or type a custom amenity and press Enter"
      @filter="onFilter"
      @update:model-value="onUpdate"
      @new-value="onNewValue"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { STANDARD_AMENITIES } from "@/data/standardAmenities";

const props = withDefaults(
  defineProps<{
    modelValue: string[];
    label?: string;
  }>(),
  { label: "Amenities" }
);

const emit = defineEmits<{
  "update:modelValue": [value: string[]];
}>();

const filteredOptions = ref<string[]>([...STANDARD_AMENITIES]);

function onFilter(val: string, update: (fn: () => void) => void) {
  update(() => {
    const needle = val.trim().toLowerCase();
    const base = [...STANDARD_AMENITIES];
    for (const custom of props.modelValue) {
      if (!base.includes(custom as (typeof STANDARD_AMENITIES)[number])) {
        base.push(custom);
      }
    }
    filteredOptions.value = needle
      ? base.filter(o => o.toLowerCase().includes(needle))
      : base;
  });
}

function onUpdate(value: string[] | null) {
  const next = (value ?? []).map(v => String(v).trim()).filter(Boolean);
  emit("update:modelValue", [...new Set(next)]);
}

function onNewValue(
  val: string,
  done: (val?: string, mode?: "add-unique") => void
) {
  const trimmed = val.trim();
  if (!trimmed) {
    done();
    return;
  }
  done(trimmed, "add-unique");
}
</script>

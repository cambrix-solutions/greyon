<template>
  <div class="catalog-chip-select">
    <GySelect
      :model-value="modelValue"
      :options="filteredOptions"
      :label="label"
      :hint="hint"
      :loading="loading"
      :disable="disable"
      outlined
      dense
      multiple
      use-chips
      use-input
      input-debounce="0"
      emit-value
      map-options
      options-dense
      clearable
      :error="Boolean(error)"
      :error-message="error || undefined"
      @filter="onFilter"
      @update:model-value="onUpdate"
    >
      <template #option="scope">
        <q-item v-bind="scope.itemProps">
          <q-item-section v-if="scope.opt.icon" avatar>
            <q-icon :name="scope.opt.icon" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ scope.opt.label }}</q-item-label>
            <q-item-label v-if="scope.opt.caption" caption>{{
              scope.opt.caption
            }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <span class="catalog-chip-select__status">{{
              scope.opt.status
            }}</span>
          </q-item-section>
        </q-item>
      </template>
      <template #selected-item="scope">
        <q-chip
          dense
          removable
          :tabindex="scope.tabindex"
          class="catalog-chip-select__chip"
          @remove="scope.removeAtIndex(scope.index)"
        >
          <q-icon
            v-if="scope.opt.icon"
            :name="scope.opt.icon"
            size="14px"
            class="q-mr-xs"
          />
          {{ scope.opt.label }}
        </q-chip>
      </template>
    </GySelect>
  </div>
</template>

<script setup lang="ts">
import GySelect from "@/components/GySelect.vue";
import { ref, watch } from "vue";

export type CatalogChipOption = {
  label: string;
  value: string;
  icon?: string;
  caption?: string;
  status?: string;
};

const props = withDefaults(
  defineProps<{
    modelValue: string[];
    options: CatalogChipOption[];
    label?: string;
    hint?: string;
    error?: string;
    loading?: boolean;
    disable?: boolean;
  }>(),
  {
    label: "Select",
    hint: "",
    error: "",
    loading: false,
    disable: false
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: string[]];
}>();

const filteredOptions = ref<CatalogChipOption[]>([...props.options]);

watch(
  () => props.options,
  next => {
    filteredOptions.value = [...next];
  }
);

function onFilter(val: string, update: (fn: () => void) => void) {
  update(() => {
    const needle = val.trim().toLowerCase();
    filteredOptions.value = needle
      ? props.options.filter(o =>
          `${o.label} ${o.caption ?? ""} ${o.status ?? ""}`
            .toLowerCase()
            .includes(needle)
        )
      : [...props.options];
  });
}

function onUpdate(value: string[] | null) {
  emit("update:modelValue", [...new Set(value ?? [])]);
}
</script>

<style scoped>
.catalog-chip-select__status {
  font-size: 0.68rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--gy-muted, #6b6560);
}

.catalog-chip-select__chip {
  background: var(--gy-sand, #f3efe6);
}
</style>

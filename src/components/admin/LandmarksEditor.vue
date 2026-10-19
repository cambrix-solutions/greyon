<template>
  <div class="landmarks-editor">
    <div class="row items-center justify-between q-mb-sm">
      <div class="text-subtitle2">{{ label }}</div>
      <q-btn dense flat color="primary" label="Add landmark" @click="addRow" />
    </div>
    <div v-if="!modelValue.length" class="text-caption text-grey-7 q-mb-sm">
      No nearby landmarks yet.
    </div>
    <div class="q-gutter-sm">
      <q-card
        v-for="(row, index) in modelValue"
        :key="`landmark-${index}`"
        flat
        bordered
        class="landmark-row"
      >
        <div class="row items-center q-col-gutter-sm q-pa-sm">
          <div class="col-12 col-sm">
            <q-input
              dense
              outlined
              :model-value="row.place"
              label="Place"
              placeholder="e.g. China Wanda Supermarket"
              @update:model-value="v => update(index, 'place', String(v ?? ''))"
            />
          </div>
          <div class="col-12 col-sm-4">
            <q-input
              dense
              outlined
              :model-value="row.distance"
              label="Distance"
              placeholder="e.g. 50 m"
              @update:model-value="
                v => update(index, 'distance', String(v ?? ''))
              "
            />
          </div>
          <div class="col-auto">
            <q-btn
              dense
              flat
              color="negative"
              icon="delete"
              aria-label="Remove landmark"
              @click="remove(index)"
            />
          </div>
        </div>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NearbyLandmark } from "@/types/greyon";

const props = withDefaults(
  defineProps<{
    modelValue: NearbyLandmark[];
    label?: string;
  }>(),
  { label: "Nearby landmarks" }
);

const emit = defineEmits<{
  "update:modelValue": [value: NearbyLandmark[]];
}>();

function addRow() {
  emit("update:modelValue", [...props.modelValue, { place: "", distance: "" }]);
}

function update(index: number, key: keyof NearbyLandmark, value: string) {
  const next = props.modelValue.map((row, i) =>
    i === index ? { ...row, [key]: value } : row
  );
  emit("update:modelValue", next);
}

function remove(index: number) {
  emit(
    "update:modelValue",
    props.modelValue.filter((_, i) => i !== index)
  );
}
</script>

<style scoped>
.landmark-row {
  background: #fff;
}
</style>

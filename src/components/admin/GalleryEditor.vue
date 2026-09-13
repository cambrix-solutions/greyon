<template>
  <div class="gallery-editor">
    <div class="row items-center justify-between q-mb-sm">
      <div class="text-subtitle2">{{ label }}</div>
      <q-btn dense flat color="primary" label="Add image" @click="showAdd = true" />
    </div>
    <div v-if="!modelValue.length" class="text-caption text-grey-7 q-mb-sm">
      No gallery images yet.
    </div>
    <div class="q-gutter-sm">
      <q-card
        v-for="(src, index) in modelValue"
        :key="`${index}-${src.slice(0, 24)}`"
        flat
        bordered
        class="gallery-row"
      >
        <div class="row items-center q-col-gutter-sm q-pa-sm">
          <div class="col-auto">
            <q-img :src="src" style="width: 72px; height: 54px" fit="cover" />
          </div>
          <div class="col">
            <q-input
              dense
              outlined
              :model-value="isDataUrl(src) ? 'Local upload (stored in browser)' : src"
              :readonly="isDataUrl(src)"
              label="Image"
              @update:model-value="(v) => update(index, String(v ?? ''))"
            />
          </div>
          <div class="col-auto row q-gutter-xs no-wrap">
            <q-btn
              dense
              flat
              icon="arrow_upward"
              :disable="index === 0"
              @click="move(index, -1)"
            />
            <q-btn
              dense
              flat
              icon="arrow_downward"
              :disable="index === modelValue.length - 1"
              @click="move(index, 1)"
            />
            <q-btn dense flat color="negative" icon="delete" @click="remove(index)" />
          </div>
        </div>
      </q-card>
    </div>

    <AdminDialog
      v-model="showAdd"
      size="md"
      icon="add_photo_alternate"
      eyebrow="Gallery"
      title="Add gallery image"
      subtitle="Drop a file or paste an image URL for this gallery."
    >
      <AdminFormSection title="Image">
        <ImageDropField v-model="pendingSrc" title="Drop or browse image" />
      </AdminFormSection>
      <template #actions>
        <q-btn flat no-caps label="Cancel" v-close-popup />
        <q-btn
          unelevated
          no-caps
          color="primary"
          label="Add image"
          :disable="!pendingSrc"
          @click="confirmAdd"
        />
      </template>
    </AdminDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import AdminDialog from "@/components/admin/AdminDialog.vue";
import AdminFormSection from "@/components/admin/AdminFormSection.vue";
import ImageDropField from "@/components/admin/ImageDropField.vue";

const props = withDefaults(
  defineProps<{
    modelValue: string[];
    label?: string;
  }>(),
  { label: "Gallery images" }
);

const emit = defineEmits<{
  "update:modelValue": [value: string[]];
}>();

const showAdd = ref(false);
const pendingSrc = ref("");

watch(showAdd, open => {
  if (open) pendingSrc.value = "";
});

function isDataUrl(src: string) {
  return src.startsWith("data:");
}

function confirmAdd() {
  if (!pendingSrc.value) return;
  emit("update:modelValue", [...props.modelValue, pendingSrc.value]);
  showAdd.value = false;
  pendingSrc.value = "";
}

function update(index: number, value: string) {
  if (isDataUrl(props.modelValue[index] ?? "")) return;
  const next = [...props.modelValue];
  next[index] = value;
  emit("update:modelValue", next);
}

function remove(index: number) {
  emit(
    "update:modelValue",
    props.modelValue.filter((_, i) => i !== index)
  );
}

function move(index: number, delta: number) {
  const target = index + delta;
  if (target < 0 || target >= props.modelValue.length) return;
  const next = [...props.modelValue];
  const tmp = next[index]!;
  next[index] = next[target]!;
  next[target] = tmp;
  emit("update:modelValue", next);
}
</script>

<style scoped>
.gallery-row {
  background: #fff;
}

@media (max-width: 600px) {
  .gallery-row .row {
    flex-wrap: wrap;
  }
}
</style>

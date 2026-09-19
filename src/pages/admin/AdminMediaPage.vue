<template>
  <q-page padding>
    <AdminPageHeader
      eyebrow="Content"
      title="Media library"
      :subtitle="`${filtered.length} of ${cms.media.length} assets · drop files or paste URLs`"
    >
      <template #actions>
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="add"
          label="Add media"
          @click="openAdd"
        />
      </template>
      <template #toolbar>
        <q-input
          v-model="query"
          dense
          outlined
          clearable
          placeholder="Search by alt or URL…"
          style="min-width: min(100%, 280px); background: #fff"
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>
      </template>
    </AdminPageHeader>

    <div
      v-if="filtered.length"
      v-reveal="{ delay: '120ms' }"
      class="row q-col-gutter-md gy-reveal-stagger"
    >
      <div
        v-for="(item, i) in filtered"
        :key="item.id"
        v-reveal="{ delay: `${Math.min(i, 5) * 60}ms` }"
        class="col-6 col-sm-4 col-md-3"
      >
        <q-card flat bordered class="bg-white media-card gy-interactive">
          <q-img :src="item.src" :ratio="4 / 3" :alt="item.alt" />
          <q-card-section class="q-gutter-sm">
            <q-input
              dense
              outlined
              :model-value="item.alt"
              label="Alt text"
              @update:model-value="(v) => cms.updateMedia(item.id, { alt: String(v ?? '') })"
            />
            <div class="row q-gutter-sm">
              <q-btn dense flat color="primary" label="Copy" @click="copy(item.src)" />
              <q-btn dense flat color="negative" label="Delete" @click="remove(item.id)" />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
    <q-banner v-else class="bg-white" rounded>
      No media yet. Drop images or paste a URL to get started.
      <template #action>
        <q-btn flat color="primary" label="Add media" @click="openAdd" />
      </template>
    </q-banner>

    <AdminDialog
      v-model="dialog"
      size="md"
      icon="photo_library"
      eyebrow="Publishing"
      title="Add media"
      subtitle="Drop an image or paste a hosted URL for hotels, rooms, and news."
    >
      <AdminFormSection title="Image" hint="Prefer hosted URLs in production; local uploads stay in this browser.">
        <ImageDropField v-model="src" title="Drop hotel / room image" />
        <q-input
          v-model="alt"
          label="Alt text"
          outlined
          dense
          hint="Short description for accessibility and SEO"
        />
      </AdminFormSection>
      <template #actions>
        <q-btn flat no-caps label="Cancel" v-close-popup />
        <q-btn
          color="primary"
          unelevated
          no-caps
          label="Add to library"
          :disable="!src"
          @click="add"
        />
      </template>
    </AdminDialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useQuasar } from "quasar";
import AdminDialog from "@/components/admin/AdminDialog.vue";
import AdminFormSection from "@/components/admin/AdminFormSection.vue";
import AdminPageHeader from "@/components/admin/AdminPageHeader.vue";
import ImageDropField from "@/components/admin/ImageDropField.vue";
import { useCmsStore } from "@/stores/cms-store";

const cms = useCmsStore();
const $q = useQuasar();

onMounted(() => {
  void cms.ensureMedia();
});

const dialog = ref(false);
const src = ref("");
const alt = ref("");
const query = ref("");

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return cms.media;
  return cms.media.filter(m => `${m.alt} ${m.src}`.toLowerCase().includes(q));
});

function openAdd() {
  src.value = "";
  alt.value = "";
  dialog.value = true;
}

async function add() {
  if (!src.value) {
    $q.notify({ type: "negative", message: "Image is required." });
    return;
  }
  try {
    await cms.addMedia(src.value, alt.value || "Greyon media");
    src.value = "";
    alt.value = "";
    dialog.value = false;
    $q.notify({ type: "positive", message: "Media added." });
  } catch (e) {
    $q.notify({
      type: "negative",
      message: e instanceof Error ? e.message : "Add failed."
    });
  }
}

function copy(value: string) {
  void navigator.clipboard.writeText(value);
  $q.notify({ type: "info", message: "Copied." });
}

function remove(id: string) {
  $q.dialog({ title: "Delete media?", cancel: true, persistent: true }).onOk(async () => {
    try {
      await cms.deleteMedia(id);
    } catch (e) {
      $q.notify({
        type: "negative",
        message: e instanceof Error ? e.message : "Delete failed."
      });
    }
  });
}
</script>

<style scoped>
.media-card {
  overflow: hidden;
}
</style>

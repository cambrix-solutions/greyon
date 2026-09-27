<template>
  <q-page padding>
    <AdminPageHeader
      eyebrow="Content"
      title="Media library"
      :subtitle="`${filtered.length} of ${cms.media.length} assets · scoped to destinations`"
    >
      <template #actions>
        <q-btn
          v-if="auth.canAction('media', 'create')"
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
          :model-value="query"
          dense
          outlined
          clearable
          placeholder="Search by alt or URL…"
          style="min-width: min(100%, 220px); background: #fff"
          @update:model-value="onQueryUpdate"
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>
        <q-select
          v-model="locationFilter"
          :options="locationFilterOptions"
          dense
          outlined
          emit-value
          map-options
          options-dense
          label="Destination"
          style="min-width: 180px; background: #fff"
          popup-content-class="admin-filter-menu"
          @update:model-value="onLocationFilterChange"
        />
        <q-select
          v-model="hotelFilter"
          :options="hotelFilterOptions"
          dense
          outlined
          emit-value
          map-options
          options-dense
          label="Hotel"
          style="min-width: 180px; background: #fff"
          popup-content-class="admin-filter-menu"
        />
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
            <p class="media-card__scope">{{ scopeLabel(item) }}</p>
            <q-input
              dense
              outlined
              :model-value="item.alt"
              label="Alt text"
              :disable="!auth.canAction('media', 'update')"
              @update:model-value="
                v => cms.updateMedia(item.id, { alt: String(v ?? '') })
              "
            />
            <q-select
              dense
              outlined
              emit-value
              map-options
              options-dense
              label="Destination"
              :model-value="item.locationId ?? null"
              :options="locationOptions"
              :disable="!auth.canAction('media', 'update')"
              @update:model-value="(v: string) => patchScope(item.id, v, item.hotelId)"
            />
            <q-select
              dense
              outlined
              emit-value
              map-options
              options-dense
              clearable
              label="Hotel (optional)"
              :model-value="item.hotelId ?? null"
              :options="hotelOptionsForLocation(item.locationId)"
              :disable="!auth.canAction('media', 'update') || !item.locationId"
              @update:model-value="
                (v: string | null) =>
                  patchScope(item.id, item.locationId, v)
              "
            />
            <div class="row q-gutter-sm">
              <q-btn
                dense
                flat
                color="primary"
                label="Copy"
                @click="copy(item.src)"
              />
              <q-btn
                v-if="auth.canAction('media', 'delete')"
                dense
                flat
                color="negative"
                label="Delete"
                @click="remove(item.id)"
              />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
    <q-banner v-else class="bg-white" rounded>
      No media match. Attach assets to a destination (and optionally a hotel).
      <template #action>
        <q-btn
          v-if="auth.canAction('media', 'create')"
          flat
          color="primary"
          label="Add media"
          @click="openAdd"
        />
      </template>
    </q-banner>

    <AdminDialog
      v-model="dialog"
      size="md"
      icon="photo_library"
      eyebrow="Publishing"
      title="Add media"
      subtitle="Attach to a destination first — optionally pin to a hotel for filtering."
    >
      <AdminFormSection
        title="Scope"
        hint="Destination is required. Hotel narrows the library filter under that city."
        :columns="2"
      >
        <q-select
          v-model="formLocationId"
          :options="locationOptions"
          label="Destination *"
          outlined
          dense
          emit-value
          map-options
          @update:model-value="formHotelId = null"
        />
        <q-select
          v-model="formHotelId"
          :options="hotelOptionsForLocation(formLocationId)"
          label="Hotel (optional)"
          outlined
          dense
          emit-value
          map-options
          clearable
          :disable="!formLocationId"
        />
      </AdminFormSection>
      <AdminFormSection
        title="Image"
        hint="Prefer hosted URLs in production; local uploads stay in this browser."
      >
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
          :disable="!src || !formLocationId"
          @click="add"
        />
      </template>
    </AdminDialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useQuasar } from "quasar";
import AdminDialog from "@/components/admin/AdminDialog.vue";
import AdminFormSection from "@/components/admin/AdminFormSection.vue";
import AdminPageHeader from "@/components/admin/AdminPageHeader.vue";
import ImageDropField from "@/components/admin/ImageDropField.vue";
import { useAuthStore } from "@/stores/auth-store";
import { useCmsStore } from "@/stores/cms-store";
import type { MediaItem } from "@/stores/cms-store";

const cms = useCmsStore();
const auth = useAuthStore();
const $q = useQuasar();

onMounted(async () => {
  await Promise.all([
    cms.ensureMedia(),
    cms.ensureLocations(),
    cms.ensureHotels()
  ]);
});

const dialog = ref(false);
const src = ref("");
const alt = ref("");
const formLocationId = ref<string | null>(null);
const formHotelId = ref<string | null>(null);
const query = ref("");
const locationFilter = ref("all");
const hotelFilter = ref("all");

function onQueryUpdate(value: string | number | null) {
  query.value = value == null ? "" : String(value);
}

function onLocationFilterChange() {
  hotelFilter.value = "all";
}

const locationOptions = computed(() =>
  cms.locations
    .filter(l => auth.canAccessLocation(l.id))
    .map(l => ({ label: l.name, value: l.id }))
);

const locationFilterOptions = computed(() => [
  { label: "All destinations", value: "all" },
  ...locationOptions.value
]);

const hotelOptionsForFilter = computed(() => {
  return cms.hotels
    .filter(h => {
      if (!auth.canAccessHotel(h.id)) return false;
      if (locationFilter.value !== "all" && h.locationId !== locationFilter.value)
        return false;
      return true;
    })
    .map(h => ({ label: h.name, value: h.id }));
});

const hotelFilterOptions = computed(() => [
  { label: "All hotels", value: "all" },
  ...hotelOptionsForFilter.value
]);

function hotelOptionsForLocation(locationId?: string | null) {
  if (!locationId) return [];
  return cms.hotels
    .filter(h => h.locationId === locationId && auth.canAccessHotel(h.id))
    .map(h => ({ label: h.name, value: h.id }));
}

const filtered = computed(() => {
  const q = (query.value ?? "").trim().toLowerCase();
  return cms.media.filter(m => {
    if (locationFilter.value !== "all" && m.locationId !== locationFilter.value)
      return false;
    if (hotelFilter.value !== "all" && m.hotelId !== hotelFilter.value)
      return false;
    if (!q) return true;
    return `${m.alt} ${m.src}`.toLowerCase().includes(q);
  });
});

watch(locationFilter, () => {
  if (
    hotelFilter.value !== "all" &&
    !hotelOptionsForFilter.value.some(h => h.value === hotelFilter.value)
  ) {
    hotelFilter.value = "all";
  }
});

function scopeLabel(item: MediaItem) {
  const loc = item.locationId
    ? cms.getLocationById(item.locationId)?.name
    : null;
  const hotel = item.hotelId ? cms.getHotelById(item.hotelId)?.name : null;
  if (loc && hotel) return `${loc} · ${hotel}`;
  if (loc) return loc;
  if (hotel) return hotel;
  return "Unscoped";
}

function openAdd() {
  src.value = "";
  alt.value = "";
  formLocationId.value =
    locationFilter.value !== "all"
      ? locationFilter.value
      : (locationOptions.value[0]?.value ?? null);
  formHotelId.value =
    hotelFilter.value !== "all" ? hotelFilter.value : null;
  dialog.value = true;
}

async function add() {
  if (!src.value) {
    $q.notify({ type: "negative", message: "Image is required." });
    return;
  }
  if (!formLocationId.value) {
    $q.notify({ type: "negative", message: "Destination is required." });
    return;
  }
  try {
    await cms.addMedia({
      src: src.value,
      alt: alt.value || "Greyon media",
      locationId: formLocationId.value,
      hotelId: formHotelId.value
    });
    src.value = "";
    alt.value = "";
    formHotelId.value = null;
    dialog.value = false;
    $q.notify({ type: "positive", message: "Media added." });
  } catch (e) {
    $q.notify({
      type: "negative",
      message: e instanceof Error ? e.message : "Add failed."
    });
  }
}

async function patchScope(
  id: string,
  locationId?: string | null,
  hotelId?: string | null
) {
  if (!locationId) {
    $q.notify({ type: "negative", message: "Destination is required." });
    return;
  }
  // Clear hotel if it no longer belongs to the destination.
  let nextHotel = hotelId ?? null;
  if (nextHotel) {
    const hotel = cms.getHotelById(nextHotel);
    if (!hotel || hotel.locationId !== locationId) nextHotel = null;
  }
  try {
    await cms.updateMedia(id, {
      locationId,
      hotelId: nextHotel
    });
  } catch (e) {
    $q.notify({
      type: "negative",
      message: e instanceof Error ? e.message : "Update failed."
    });
  }
}

function copy(value: string) {
  void navigator.clipboard.writeText(value);
  $q.notify({ type: "info", message: "Copied." });
}

function remove(id: string) {
  $q.dialog({ title: "Delete media?", cancel: true, persistent: true }).onOk(
    async () => {
      try {
        await cms.deleteMedia(id);
      } catch (e) {
        $q.notify({
          type: "negative",
          message: e instanceof Error ? e.message : "Delete failed."
        });
      }
    }
  );
}
</script>

<style scoped>
.media-card {
  overflow: hidden;
}

.media-card__scope {
  margin: 0;
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
  font-weight: 600;
}
</style>

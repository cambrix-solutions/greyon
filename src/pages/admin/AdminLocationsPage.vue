<template>
  <q-page padding>
    <AdminPageHeader
      eyebrow="Properties"
      title="Locations"
      :subtitle="`${filtered.length} destinations · each location owns hotels · each hotel owns rooms`"
    >
      <template #actions>
        <q-btn outline no-caps color="primary" label="View live" to="/locations" target="_blank" />
        <q-btn unelevated no-caps color="primary" icon="add" label="Add location" @click="openCreate" />
      </template>
      <template #toolbar>
        <q-input
          v-model="query"
          dense
          outlined
          clearable
          placeholder="Search locations…"
          style="min-width: min(100%, 240px); background: #fff"
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>
        <q-select
          v-model="statusFilter"
          :options="statusOptions"
          dense
          outlined
          emit-value
          map-options
          label="Status"
          style="min-width: 140px; background: #fff"
        />
      </template>
    </AdminPageHeader>

    <div v-reveal class="tree-legend">
      <span><strong>1 · Location</strong> destination</span>
      <span class="tree-legend__arrow">→</span>
      <span><strong>2 · Hotel</strong> property</span>
      <span class="tree-legend__arrow">→</span>
      <span><strong>3 · Rooms</strong> inventory</span>
    </div>

    <div v-reveal="{ delay: '80ms' }" class="loc-hub">
      <article v-for="loc in filtered" :key="loc.id" class="loc-card">
        <header class="loc-card__head">
          <div class="loc-card__media" v-if="loc.heroImage">
            <img :src="loc.heroImage" :alt="loc.name" />
          </div>
          <div class="loc-card__intro">
            <p class="loc-card__level">Location</p>
            <h2 class="loc-card__title">{{ loc.name }}</h2>
            <p class="loc-card__slug">{{ loc.slug }}</p>
            <p v-if="loc.highlights.length" class="loc-card__highlights">
              {{ loc.highlights.slice(0, 3).join(" · ") }}
            </p>
          </div>
          <div class="loc-card__side">
            <q-select
              dense
              outlined
              :model-value="loc.status"
              :options="cms.statusOptions"
              style="min-width: 120px"
              @update:model-value="(v: string) => setStatus(loc.id, v)"
            />
            <div class="loc-card__actions">
              <q-btn flat dense round icon="edit" color="primary" @click="openEdit(loc)">
                <q-tooltip>Edit location</q-tooltip>
              </q-btn>
              <q-btn
                flat
                dense
                round
                icon="open_in_new"
                :to="`/locations/${loc.slug}`"
                target="_blank"
              />
              <q-btn flat dense round icon="delete" color="negative" @click="remove(loc.id)" />
            </div>
          </div>
        </header>

        <div class="loc-card__hotels">
          <div class="loc-card__hotels-bar">
            <h3>
              Hotels
              <span>{{ hotelsFor(loc.id).length }}</span>
            </h3>
            <q-btn
              flat
              dense
              no-caps
              color="primary"
              icon="add"
              label="Add hotel here"
              :to="`/admin/hotels?locationId=${loc.id}&create=1`"
            />
          </div>

          <div v-if="hotelsFor(loc.id).length" class="hotel-rows">
            <div v-for="hotel in hotelsFor(loc.id)" :key="hotel.id" class="hotel-row">
              <img
                v-if="hotel.heroImage"
                :src="hotel.heroImage"
                alt=""
                class="hotel-row__thumb"
              />
              <div class="hotel-row__main">
                <p class="hotel-row__level">Hotel · under {{ loc.name }}</p>
                <router-link
                  class="hotel-row__name"
                  :to="`/admin/hotels?locationId=${loc.id}`"
                >
                  {{ hotel.name }}
                </router-link>
                <p class="hotel-row__meta">
                  {{ roomCount(hotel.id) }} room type{{
                    roomCount(hotel.id) === 1 ? "" : "s"
                  }}
                  · {{ hotel.status }}
                  <template v-if="hotel.featured"> · featured</template>
                </p>
              </div>
              <div class="hotel-row__actions">
                <q-btn
                  outline
                  dense
                  no-caps
                  color="primary"
                  label="Rooms"
                  :to="`/admin/rooms?hotelId=${hotel.id}`"
                />
                <q-btn
                  flat
                  dense
                  no-caps
                  color="primary"
                  label="Open"
                  :to="`/admin/hotels?locationId=${loc.id}`"
                />
              </div>
            </div>
          </div>
          <p v-else class="loc-card__empty">
            No hotels in this location yet. Add a hotel and it will nest here via
            <code>locationId</code>.
          </p>
        </div>
      </article>

      <div v-if="!filtered.length" class="loc-hub__empty">
        No locations match.
        <q-btn flat dense color="primary" label="Add location" @click="openCreate" />
      </div>
    </div>

    <AdminDialog
      v-model="dialog"
      size="lg"
      icon="place"
      eyebrow="Properties"
      :title="editing ? 'Edit location' : 'Add location'"
      subtitle="A destination guests browse first. Hotels nest under this record."
    >
      <template #notice>
        Hotels link here with <strong>locationId</strong> — locations never “own” rooms
        directly.
      </template>
      <AdminFormSection
        title="Identity"
        hint="Name and URL slug shown on the public destinations pages."
        :columns="2"
      >
        <q-input v-model="form.name" label="Location name" outlined dense class="admin-form-span-2" />
        <q-input
          v-model="form.slug"
          label="URL slug"
          outlined
          dense
          hint="e.g. siem-reap"
          class="admin-form-span-2"
        />
      </AdminFormSection>
      <AdminFormSection title="Story" hint="Help guests feel the place before they pick a hotel.">
        <q-input
          v-model="form.description"
          label="Description"
          type="textarea"
          outlined
          autogrow
        />
        <q-input
          v-model="highlightsText"
          label="Highlights"
          outlined
          dense
          hint="Comma-separated, e.g. Temples, Night market, Riverside"
        />
      </AdminFormSection>
      <AdminFormSection title="Media & status" :columns="2">
        <q-input
          v-model="form.heroImage"
          label="Hero image URL"
          outlined
          dense
          class="admin-form-span-2"
        />
        <q-select
          v-model="form.status"
          :options="cms.statusOptions"
          label="Status"
          outlined
          dense
        />
      </AdminFormSection>
      <template #actions>
        <q-btn flat no-caps label="Cancel" v-close-popup />
        <q-btn color="primary" unelevated no-caps :label="editing ? 'Save changes' : 'Create location'" @click="save" />
      </template>
    </AdminDialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useQuasar } from "quasar";
import AdminDialog from "@/components/admin/AdminDialog.vue";
import AdminFormSection from "@/components/admin/AdminFormSection.vue";
import AdminPageHeader from "@/components/admin/AdminPageHeader.vue";
import { useAuthStore } from "@/stores/auth-store";
import { useCmsStore } from "@/stores/cms-store";
import type { ContentStatus, Location } from "@/types/greyon";

const cms = useCmsStore();
const auth = useAuthStore();
const $q = useQuasar();
const dialog = ref(false);
const editing = ref<string | null>(null);
const highlightsText = ref("");
const query = ref("");
const statusFilter = ref("all");
const statusOptions = [
  { label: "All statuses", value: "all" },
  ...cms.statusOptions.map(s => ({ label: s, value: s }))
];

const form = reactive({
  name: "",
  slug: "",
  description: "",
  heroImage: "",
  status: "draft" as ContentStatus
});

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  return cms.locations.filter(loc => {
    if (!auth.canAccessLocation(loc.id)) return false;
    if (statusFilter.value !== "all" && loc.status !== statusFilter.value) return false;
    if (!q) return true;
    return `${loc.name} ${loc.slug} ${loc.description} ${loc.highlights.join(" ")}`
      .toLowerCase()
      .includes(q);
  });
});

function hotelsFor(locationId: string) {
  return cms.hotels.filter(
    h => h.locationId === locationId && auth.canAccessHotel(h.id)
  );
}

function roomCount(hotelId: string) {
  return cms.getRoomTypesByHotelId(hotelId).length;
}

function openCreate() {
  editing.value = null;
  form.name = "";
  form.slug = "";
  form.description = "";
  form.heroImage = "";
  form.status = "draft";
  highlightsText.value = "";
  dialog.value = true;
}

function openEdit(loc: Location) {
  editing.value = loc.id;
  form.name = loc.name;
  form.slug = loc.slug;
  form.description = loc.description;
  form.heroImage = loc.heroImage;
  form.status = loc.status;
  highlightsText.value = loc.highlights.join(", ");
  dialog.value = true;
}

function save() {
  if (!form.name) {
    $q.notify({ type: "negative", message: "Name is required." });
    return;
  }
  cms.upsertLocation({
    ...(editing.value ? { id: editing.value } : {}),
    ...form,
    highlights: highlightsText.value
      .split(",")
      .map(s => s.trim())
      .filter(Boolean)
  });
  dialog.value = false;
  $q.notify({ type: "positive", message: "Location saved." });
}

function setStatus(id: string, status: string) {
  const loc = cms.getLocationById(id);
  if (!loc) return;
  cms.upsertLocation({ ...loc, status: status as ContentStatus });
}

function remove(id: string) {
  const linked = hotelsFor(id).length;
  $q.dialog({
    title: "Delete location?",
    message: linked
      ? `This location still has ${linked} hotel(s). Delete hotels first or reassign them.`
      : "This cannot be undone.",
    cancel: true,
    persistent: true
  }).onOk(() => {
    if (linked) {
      $q.notify({
        type: "warning",
        message: "Reassign or delete hotels before removing the location."
      });
      return;
    }
    cms.deleteLocation(id);
    $q.notify({ type: "positive", message: "Location deleted." });
  });
}
</script>

<style scoped>
.tree-legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem 0.65rem;
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  background: #fff;
  border: 1px solid rgba(154, 123, 60, 0.18);
  border-radius: 12px;
  font-size: 0.84rem;
  color: var(--gy-muted);
}

.tree-legend strong {
  color: var(--gy-ink);
  font-weight: 600;
}

.tree-legend__arrow {
  color: var(--gy-gold-deep);
}

.loc-hub {
  display: grid;
  gap: 1rem;
}

.loc-card {
  background: #fff;
  border: 1px solid rgba(28, 36, 33, 0.08);
  border-radius: 16px;
  overflow: hidden;
}

.loc-card__head {
  display: grid;
  grid-template-columns: 120px 1fr auto;
  gap: 1rem;
  padding: 1rem;
  align-items: start;
  border-bottom: 1px solid rgba(28, 36, 33, 0.06);
}

.loc-card__media {
  aspect-ratio: 4 / 3;
  border-radius: 10px;
  overflow: hidden;
  background: var(--gy-stone);
}

.loc-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.loc-card__level,
.hotel-row__level {
  margin: 0;
  font-size: 0.66rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
}

.loc-card__title {
  margin: 0.2rem 0 0;
  font-family: var(--font-display);
  font-size: 1.45rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.15;
}

.loc-card__slug,
.loc-card__highlights {
  margin: 0.25rem 0 0;
  font-size: 0.82rem;
  color: var(--gy-muted);
}

.loc-card__side {
  display: grid;
  gap: 0.45rem;
  justify-items: end;
}

.loc-card__actions {
  display: flex;
  gap: 0.1rem;
}

.loc-card__hotels {
  padding: 0.85rem 1rem 1rem;
  background: #faf9f7;
}

.loc-card__hotels-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.65rem;
}

.loc-card__hotels-bar h3 {
  margin: 0;
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gy-muted);
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.loc-card__hotels-bar h3 span {
  display: inline-grid;
  place-items: center;
  min-width: 1.35rem;
  height: 1.35rem;
  padding: 0 0.35rem;
  border-radius: 999px;
  background: rgba(154, 123, 60, 0.14);
  color: var(--gy-gold-deep);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
}

.hotel-rows {
  display: grid;
  gap: 0.5rem;
}

.hotel-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.7rem 0.75rem;
  background: #fff;
  border: 1px solid rgba(28, 36, 33, 0.07);
  border-radius: 12px;
}

.hotel-row__thumb {
  width: 3.25rem;
  height: 3.25rem;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.hotel-row__main {
  flex: 1;
  min-width: 0;
}

.hotel-row__name {
  display: inline-block;
  margin-top: 0.1rem;
  font-weight: 600;
  color: var(--gy-ink);
  text-decoration: none;
}

.hotel-row__name:hover {
  color: var(--gy-gold-deep);
}

.hotel-row__meta {
  margin: 0.2rem 0 0;
  font-size: 0.8rem;
  color: var(--gy-muted);
}

.hotel-row__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  flex-shrink: 0;
}

.loc-card__empty,
.loc-hub__empty {
  margin: 0;
  padding: 0.85rem;
  color: var(--gy-muted);
  font-size: 0.88rem;
}

.loc-hub__empty {
  text-align: center;
  background: #fff;
  border-radius: 14px;
  border: 1px dashed rgba(28, 36, 33, 0.15);
}

@media (max-width: 800px) {
  .loc-card__head {
    grid-template-columns: 88px 1fr;
  }

  .loc-card__side {
    grid-column: 1 / -1;
    justify-items: start;
    flex-direction: row;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    width: 100%;
  }

  .hotel-row {
    flex-wrap: wrap;
  }

  .hotel-row__actions {
    width: 100%;
  }
}
</style>

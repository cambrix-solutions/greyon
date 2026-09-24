<template>
  <q-page padding>
    <AdminPageHeader
      eyebrow="Properties"
      title="Destinations"
      :subtitle="`${filtered.length} destinations · hotels nest under each · rooms under hotels`"
    >
      <template #actions>
        <q-btn
          outline
          no-caps
          color="primary"
          label="View live"
          to="/locations"
          target="_blank"
        />
        <q-btn
          v-if="auth.canAction('locations', 'create')"
          unelevated
          no-caps
          color="primary"
          icon="add"
          label="Add destination"
          @click="openCreate"
        />
      </template>
      <template #toolbar>
        <q-input
          v-model="query"
          dense
          outlined
          clearable
          placeholder="Search destinations…"
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
      <span><strong>1 · Destination</strong> city / region</span>
      <span class="tree-legend__arrow">→</span>
      <span><strong>2 · Hotel</strong> property</span>
      <span class="tree-legend__arrow">→</span>
      <span><strong>3 · Rooms</strong> how many you can sell</span>
    </div>

    <div v-reveal="{ delay: '80ms' }" class="loc-hub">
      <article
        v-for="loc in filtered"
        :key="loc.id"
        class="loc-card"
        :class="{ 'loc-card--has-media': Boolean(loc.heroImage) }"
      >
        <header class="loc-card__head">
          <div v-if="loc.heroImage" class="loc-card__media">
            <img :src="loc.heroImage" :alt="loc.name" />
          </div>

          <div class="loc-card__intro">
            <div class="loc-card__topline">
              <p class="loc-card__level">Destination</p>
              <span class="loc-card__status" :data-status="loc.status">{{
                loc.status
              }}</span>
            </div>
            <h2 class="loc-card__title">
              <router-link
                v-if="auth.canDestinationDetail()"
                :to="`/admin/locations/${loc.id}`"
                >{{ loc.name }}</router-link
              >
              <template v-else>{{ loc.name }}</template>
            </h2>
            <p class="loc-card__slug">/{{ loc.slug }}</p>
            <ul v-if="loc.highlights.length" class="loc-card__chips">
              <li v-for="h in loc.highlights.slice(0, 4)" :key="h">{{ h }}</li>
            </ul>
          </div>

          <div class="loc-card__side">
            <AdminEntityActions
              :status="loc.status"
              :status-options="cms.statusOptions"
              :status-disable="!auth.can('locations_publish')"
              :primary-label="
                auth.canDestinationDetail() ? 'Manage' : undefined
              "
              :primary-show="auth.canDestinationDetail()"
              :primary-to="`/admin/locations/${loc.id}`"
              :actions="[
                {
                  key: 'edit',
                  icon: 'edit',
                  tip: 'Edit destination',
                  show: auth.canAction('locations', 'update'),
                  onClick: () => openEdit(loc)
                },
                {
                  key: 'live',
                  icon: 'open_in_new',
                  tip: 'View live',
                  to: `/locations/${loc.slug}`,
                  target: '_blank'
                },
                {
                  key: 'delete',
                  icon: 'delete',
                  tip: 'Delete',
                  danger: true,
                  show: auth.canAction('locations', 'delete'),
                  onClick: () => remove(loc.id)
                }
              ]"
              @update:status="(v: string) => setStatus(loc.id, v)"
            />
          </div>
        </header>

        <div class="loc-card__hotels">
          <div class="loc-card__hotels-bar">
            <h3>
              Hotels
              <span>{{ hotelsFor(loc.id).length }}</span>
              <small> / {{ hotelCap }} max</small>
            </h3>
            <q-btn
              v-if="
                auth.canAction('hotels', 'create') &&
                auth.canDestinationDetail()
              "
              flat
              dense
              no-caps
              color="primary"
              icon="add"
              label="Add hotel"
              :to="`/admin/locations/${loc.id}`"
            />
          </div>

          <div v-if="hotelsFor(loc.id).length" class="hotel-rows">
            <div
              v-for="hotel in hotelsFor(loc.id)"
              :key="hotel.id"
              class="hotel-row"
            >
              <div class="hotel-row__thumb" aria-hidden="true">
                <img v-if="hotel.heroImage" :src="hotel.heroImage" alt="" />
                <q-icon v-else name="apartment" size="22px" />
              </div>
              <div class="hotel-row__main">
                <p class="hotel-row__level">Hotel</p>
                <router-link
                  v-if="auth.canDestinationDetail()"
                  class="hotel-row__name"
                  :to="`/admin/locations/${loc.id}`"
                >
                  {{ hotel.name }}
                </router-link>
                <span v-else class="hotel-row__name">{{ hotel.name }}</span>
                <p class="hotel-row__meta">
                  <span
                    >{{ roomCount(hotel.id) }} room type{{
                      roomCount(hotel.id) === 1 ? "" : "s"
                    }}</span
                  >
                  <span class="hotel-row__dot">·</span>
                  <span>{{ hotel.status }}</span>
                  <template v-if="hotel.featured">
                    <span class="hotel-row__dot">·</span>
                    <span class="hotel-row__feat">featured</span>
                  </template>
                </p>
              </div>
              <div class="hotel-row__actions">
                <AdminEntityActions
                  dense
                  hide-status
                  :primary-label="
                    auth.canDestinationDetail() ? 'Manage' : undefined
                  "
                  :primary-show="auth.canDestinationDetail()"
                  :primary-to="`/admin/locations/${loc.id}`"
                  primary-outline
                />
              </div>
            </div>
          </div>
          <p v-else class="loc-card__empty">
            No hotels yet
            <template v-if="auth.canDestinationDetail()">
              —
              <router-link :to="`/admin/locations/${loc.id}`"
                >open destination</router-link
              >
              to add hotels and rooms.
            </template>
            <template v-else>.</template>
          </p>
        </div>
      </article>

      <div v-if="!filtered.length" class="loc-hub__empty">
        No locations match.
        <q-btn
          v-if="auth.canAction('locations', 'create')"
          flat
          dense
          color="primary"
          label="Add location"
          @click="openCreate"
        />
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
        Hotels link here with <strong>locationId</strong> — locations never
        “own” rooms directly.
      </template>
      <AdminFormSection title="Essentials" :columns="2">
        <q-input
          v-model="form.name"
          label="Destination name"
          outlined
          dense
          :disable="editing ? !auth.canAction('locations', 'update') : false"
        />
        <q-select
          v-model="form.status"
          :options="cms.statusOptions"
          label="Status"
          outlined
          dense
          :disable="!auth.can('locations_publish')"
          hint="Requires Locations: Publish permission"
        />
      </AdminFormSection>
      <AdminFormSection title="Hero image" hint="Drop, browse, or paste a URL.">
        <ImageDropField
          v-model="form.heroImage"
          title="Drop or browse hero image"
        />
      </AdminFormSection>
      <AdminFormSection
        title="Details"
        hint="Optional slug and story for the public destinations page."
      >
        <q-input
          v-model="form.slug"
          label="URL slug"
          outlined
          dense
          hint="e.g. sihanoukville — leave blank to auto-generate"
        />
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
          hint="Comma-separated, e.g. Riverside, Royal Palace, Central Market"
        />
      </AdminFormSection>
      <template #actions>
        <q-btn flat no-caps label="Cancel" v-close-popup />
        <q-btn
          v-if="
            editing
              ? auth.canAction('locations', 'update')
              : auth.canAction('locations', 'create')
          "
          color="primary"
          unelevated
          no-caps
          :label="editing ? 'Save changes' : 'Create location'"
          @click="save"
        />
      </template>
    </AdminDialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useQuasar } from "quasar";
import AdminDialog from "@/components/admin/AdminDialog.vue";
import AdminEntityActions from "@/components/admin/AdminEntityActions.vue";
import AdminFormSection from "@/components/admin/AdminFormSection.vue";
import AdminPageHeader from "@/components/admin/AdminPageHeader.vue";
import ImageDropField from "@/components/admin/ImageDropField.vue";
import { useAuthStore } from "@/stores/auth-store";
import { useCmsStore } from "@/stores/cms-store";
import type { ContentStatus, Location } from "@/types/greyon";

const cms = useCmsStore();
const auth = useAuthStore();
const $q = useQuasar();

onMounted(() => {
  void Promise.all([
    auth.refreshEngineSession(),
    cms.ensureLocations(),
    cms.ensureHotels(),
    cms.ensureRoomTypes()
  ]);
});

const dialog = ref(false);
const editing = ref<string | null>(null);
const highlightsText = ref("");
const query = ref("");
const statusFilter = ref("all");
const statusOptions = [
  { label: "All statuses", value: "all" },
  ...cms.statusOptions.map(s => ({ label: s, value: s }))
];

/** Soft cap matching package limit hotels_per_location (seeded at 3). */
const hotelCap = 3;

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
    if (statusFilter.value !== "all" && loc.status !== statusFilter.value)
      return false;
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
  return cms.roomTypes.filter(r => r.hotelId === hotelId).length;
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
  void (async () => {
    try {
      await cms.upsertLocation({
        ...(editing.value ? { id: editing.value } : {}),
        ...form,
        highlights: highlightsText.value
          .split(",")
          .map(s => s.trim())
          .filter(Boolean)
      });
      dialog.value = false;
      $q.notify({ type: "positive", message: "Location saved." });
    } catch (e) {
      $q.notify({
        type: "negative",
        message: e instanceof Error ? e.message : "Save failed."
      });
    }
  })();
}

function setStatus(id: string, status: string) {
  const loc = cms.getLocationById(id);
  if (!loc) return;
  void cms
    .upsertLocation({ ...loc, status: status as ContentStatus })
    .catch(e =>
      $q.notify({
        type: "negative",
        message: e instanceof Error ? e.message : "Update failed."
      })
    );
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
    void cms
      .deleteLocation(id)
      .then(() => $q.notify({ type: "positive", message: "Location deleted." }))
      .catch(e =>
        $q.notify({
          type: "negative",
          message: e instanceof Error ? e.message : "Delete failed."
        })
      );
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
  gap: 1.1rem;
}

.loc-card {
  background: #fff;
  border: 1px solid rgba(28, 36, 33, 0.08);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 0 rgba(28, 36, 33, 0.03);
}

.loc-card__head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1rem 1.25rem;
  padding: 1.15rem 1.2rem 1.05rem;
  align-items: start;
  border-bottom: 1px solid rgba(28, 36, 33, 0.06);
}

.loc-card--has-media .loc-card__head {
  grid-template-columns: 112px minmax(0, 1fr) auto;
}

.loc-card__media {
  aspect-ratio: 4 / 3;
  border-radius: 10px;
  overflow: hidden;
  background: var(--gy-stone, #e8e4dc);
}

.loc-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.loc-card__intro {
  min-width: 0;
}

.loc-card__topline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.loc-card__level,
.hotel-row__level {
  margin: 0;
  font-size: 0.66rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
  font-weight: 600;
}

.loc-card__status {
  display: inline-flex;
  align-items: center;
  padding: 0.12rem 0.45rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: lowercase;
  letter-spacing: 0.02em;
  background: rgba(28, 36, 33, 0.06);
  color: var(--gy-muted);
}

.loc-card__status[data-status="published"] {
  background: rgba(46, 125, 80, 0.12);
  color: #1e6b3a;
}

.loc-card__status[data-status="draft"] {
  background: rgba(154, 123, 60, 0.14);
  color: var(--gy-gold-deep);
}

.loc-card__title {
  margin: 0.35rem 0 0;
  font-family: var(--font-display);
  font-size: clamp(1.35rem, 2.4vw, 1.65rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: var(--gy-ink);
  overflow-wrap: anywhere;
}

.loc-card__title a {
  color: inherit;
  text-decoration: none;
}

.loc-card__title a:hover {
  color: var(--gy-gold-deep);
}

.loc-card__slug {
  margin: 0.3rem 0 0;
  font-size: 0.8rem;
  color: var(--gy-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.loc-card__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin: 0.65rem 0 0;
  padding: 0;
  list-style: none;
}

.loc-card__chips li {
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: rgba(154, 123, 60, 0.1);
  color: var(--gy-ink);
  font-size: 0.74rem;
  font-weight: 500;
}

.loc-card__side {
  display: flex;
  justify-content: flex-end;
  align-content: start;
}

.loc-card__hotels {
  padding: 0.9rem 1.15rem 1.15rem;
  background: linear-gradient(180deg, #f7f5f1 0%, #faf9f7 100%);
}

.loc-card__hotels-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.7rem;
}

.loc-card__hotels-bar h3 {
  margin: 0;
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gy-muted);
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.loc-card__hotels-bar h3 span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.4rem;
  height: 1.4rem;
  padding: 0 0.35rem;
  border-radius: 999px;
  background: rgba(154, 123, 60, 0.16);
  color: var(--gy-gold-deep);
  font-size: 0.74rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0;
  text-transform: none;
}

.loc-card__hotels-bar h3 small {
  font-size: 0.7rem;
  letter-spacing: 0;
  text-transform: none;
  color: var(--gy-muted);
  font-weight: 500;
}

.hotel-rows {
  display: grid;
  gap: 0.55rem;
}

.hotel-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.85rem;
  padding: 0.75rem 0.85rem;
  background: #fff;
  border: 1px solid rgba(28, 36, 33, 0.07);
  border-radius: 12px;
  transition: border-color 0.15s ease;
}

.hotel-row:hover {
  border-color: rgba(154, 123, 60, 0.35);
}

.hotel-row__thumb {
  width: 3rem;
  height: 3rem;
  border-radius: 9px;
  overflow: hidden;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  background: rgba(154, 123, 60, 0.1);
  color: var(--gy-gold-deep);
}

.hotel-row__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.hotel-row__main {
  min-width: 0;
}

.hotel-row__name {
  display: block;
  margin-top: 0.12rem;
  font-weight: 650;
  color: var(--gy-ink);
  text-decoration: none;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hotel-row__name:hover {
  color: var(--gy-gold-deep);
}

.hotel-row__meta {
  margin: 0.22rem 0 0;
  font-size: 0.78rem;
  color: var(--gy-muted);
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem 0.35rem;
  align-items: center;
}

.hotel-row__dot {
  opacity: 0.55;
}

.hotel-row__feat {
  color: var(--gy-gold-deep);
  font-weight: 600;
}

.hotel-row__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem;
  flex-shrink: 0;
}

.loc-card__empty,
.loc-hub__empty {
  margin: 0;
  padding: 0.9rem 0.85rem;
  color: var(--gy-muted);
  font-size: 0.88rem;
  border: 1px dashed rgba(28, 36, 33, 0.14);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.55);
}

.loc-hub__empty {
  text-align: center;
  background: #fff;
  border-radius: 14px;
  border-style: dashed;
}

@media (max-width: 800px) {
  .loc-card__head,
  .loc-card--has-media .loc-card__head {
    grid-template-columns: 1fr;
  }

  .loc-card--has-media .loc-card__media {
    max-width: 160px;
  }

  .loc-card__side {
    justify-items: start;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    width: 100%;
    gap: 0.5rem;
  }

  .hotel-row {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .hotel-row__actions {
    grid-column: 1 / -1;
    justify-content: flex-start;
  }
}
</style>

<template>
  <q-page padding class="admin-page">
    <AdminPageHeader
      eyebrow="Properties"
      title="Hotels"
      :subtitle="`${filtered.length} hotels · each belongs to one location via locationId`"
    >
      <template #actions>
        <q-btn
          outline
          no-caps
          color="primary"
          label="View live hotels"
          to="/hotels"
          target="_blank"
        />
        <q-btn
          v-if="auth.canAction('hotels', 'create')"
          unelevated
          no-caps
          color="primary"
          icon="add"
          label="Add hotel"
          @click="openCreate"
        />
      </template>
      <template #toolbar>
        <q-input
          v-model="query"
          dense
          outlined
          clearable
          placeholder="Search hotels…"
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
        <q-select
          v-model="locationFilter"
          :options="locationFilterOptions"
          dense
          outlined
          emit-value
          map-options
          label="Destination"
          style="min-width: 180px; background: #fff"
        />
        <q-toggle v-model="featuredOnly" label="Featured only" dense />
      </template>
    </AdminPageHeader>

    <div v-reveal class="tree-legend">
      <span><strong>Parent</strong> Destination</span>
      <span class="tree-legend__arrow">→</span>
      <span><strong>This page</strong> Hotel</span>
      <span class="tree-legend__arrow">→</span>
      <span><strong>Children</strong> Room types</span>
    </div>

    <div v-reveal="{ delay: '80ms' }" class="hotel-groups">
      <section
        v-for="group in grouped"
        :key="group.locationId"
        class="hotel-group"
      >
        <header class="hotel-group__head">
          <div>
            <p class="hotel-group__level">Destination</p>
            <h2 class="hotel-group__title">{{ group.locationName }}</h2>
            <p class="hotel-group__meta">
              {{ group.hotels.length }} hotel{{
                group.hotels.length === 1 ? "" : "s"
              }}
            </p>
          </div>
          <div class="hotel-group__links">
            <q-btn
              v-if="
                group.locationId !== 'orphan' && auth.canDestinationDetail()
              "
              flat
              dense
              no-caps
              color="primary"
              label="Open destination"
              :to="`/admin/locations/${group.locationId}`"
            />
            <q-btn
              v-if="auth.canAction('hotels', 'create')"
              outline
              dense
              no-caps
              color="primary"
              icon="add"
              label="Hotel here"
              @click="openCreateIn(group.locationId)"
            />
          </div>
        </header>

        <div class="hotel-cards">
          <article
            v-for="hotel in group.hotels"
            :key="hotel.id"
            class="hotel-card"
            :class="{ 'hotel-card--has-media': Boolean(hotel.heroImage) }"
          >
            <div v-if="hotel.heroImage" class="hotel-card__media">
              <img :src="hotel.heroImage" :alt="hotel.name" />
            </div>
            <div v-else class="hotel-card__thumb" aria-hidden="true">
              <q-icon name="apartment" size="22px" />
            </div>

            <div class="hotel-card__body">
              <div class="hotel-card__topline">
                <p class="hotel-card__crumb">Hotel</p>
                <span class="hotel-card__status" :data-status="hotel.status">{{
                  hotel.status
                }}</span>
                <span v-if="hotel.featured" class="hotel-card__feat-pill"
                  >Featured</span
                >
              </div>
              <h3 class="hotel-card__name">{{ hotel.name }}</h3>
              <p class="hotel-card__slug">/{{ hotel.slug }}</p>
              <p v-if="hotel.shortDescription" class="hotel-card__desc">
                {{ hotel.shortDescription }}
              </p>
              <ul class="hotel-card__chips">
                <li>
                  {{ roomCount(hotel.id) }} room type{{
                    roomCount(hotel.id) === 1 ? "" : "s"
                  }}
                </li>
                <li v-if="hotel.address">{{ shortAddress(hotel.address) }}</li>
              </ul>
            </div>

            <div class="hotel-card__side">
              <AdminEntityActions
                :status="hotel.status"
                :status-options="cms.statusOptions"
                :status-disable="!auth.canAction('hotels', 'update')"
                primary-label="Rooms"
                :primary-to="`/admin/rooms?hotelId=${hotel.id}`"
                :actions="[
                  {
                    key: 'edit',
                    icon: 'edit',
                    tip: 'Edit hotel',
                    show: auth.canAction('hotels', 'update'),
                    onClick: () => openEdit(hotel)
                  },
                  {
                    key: 'live',
                    icon: 'open_in_new',
                    tip: 'View live',
                    to: `/hotels/${hotel.slug}`,
                    target: '_blank'
                  },
                  {
                    key: 'delete',
                    icon: 'delete',
                    tip: 'Delete',
                    danger: true,
                    show: auth.canAction('hotels', 'delete'),
                    onClick: () => remove(hotel.id)
                  }
                ]"
                @update:status="(v: string) => setStatus(hotel.id, v)"
              >
                <template #meta>
                  <q-toggle
                    dense
                    :model-value="Boolean(hotel.featured)"
                    label="Featured"
                    class="hotel-card__feat-toggle"
                    :disable="!auth.canAction('hotels', 'update')"
                    @update:model-value="
                      (v: boolean) => toggleFeatured(hotel.id, v)
                    "
                  />
                </template>
              </AdminEntityActions>
            </div>
          </article>
        </div>
      </section>

      <div v-if="!grouped.length" class="hotel-groups__empty">
        No hotels match.
        <q-btn
          v-if="auth.canAction('hotels', 'create')"
          flat
          dense
          color="primary"
          label="Add hotel"
          @click="openCreate"
        />
      </div>
    </div>

    <AdminDialog
      v-model="dialog"
      size="xl"
      icon="apartment"
      eyebrow="Properties"
      :title="editing ? 'Edit hotel' : 'Add hotel'"
      subtitle="Link this property to a destination, then add room types under it."
    >
      <template #notice>
        Required relationship: <strong>Destination → Hotel → Rooms</strong>. Pick
        the parent destination first.
      </template>
      <AdminFormSection title="Essentials" :columns="2">
        <q-input v-model="form.name" label="Hotel name" outlined dense />
        <q-select
          v-model="form.status"
          :options="cms.statusOptions"
          label="Status"
          outlined
          dense
        />
      </AdminFormSection>
      <AdminFormSection
        title="Hero image"
        hint="Drop, browse, or paste a URL."
      >
        <ImageDropField
          v-model="form.heroImage"
          title="Drop or browse hero image"
        />
      </AdminFormSection>
      <AdminFormSection title="Details" :columns="2">
        <q-select
          v-model="form.locationId"
          :options="locationOptions"
          label="Parent destination"
          outlined
          dense
          emit-value
          map-options
        />
        <q-input
          v-model="form.slug"
          label="URL slug"
          outlined
          dense
          hint="Leave blank to auto-generate"
        />
        <q-input
          v-model="form.shortDescription"
          label="Short description"
          outlined
          dense
          class="admin-form-span-2"
        />
        <div class="admin-form-toggle admin-form-span-2">
          <q-toggle v-model="form.featured" label="Featured on home" />
        </div>
      </AdminFormSection>
      <AdminFormSection
        title="Gallery"
        hint="Extra photos for the hotel detail page."
      >
        <GalleryEditor v-model="gallery" label="Hotel gallery" />
      </AdminFormSection>
      <AdminFormSection
        title="About the stay"
        hint="Longer copy for the hotel detail page."
      >
        <q-input
          v-model="form.description"
          label="Full description"
          type="textarea"
          outlined
          autogrow
        />
        <q-input
          v-model="amenitiesText"
          label="Amenities"
          outlined
          dense
          hint="Comma-separated, e.g. Pool, Breakfast, Free Wi‑Fi"
        />
      </AdminFormSection>
      <AdminFormSection title="Contact & hours" :columns="2">
        <q-input
          v-model="form.address"
          label="Address"
          outlined
          dense
          class="admin-form-span-2"
        />
        <q-input v-model="form.phone" label="Phone" outlined dense />
        <q-input v-model="form.email" label="Email" outlined dense />
        <q-input
          v-model="form.checkInTime"
          type="time"
          label="Check-in"
          outlined
          dense
        />
        <q-input
          v-model="form.checkOutTime"
          type="time"
          label="Check-out"
          outlined
          dense
        />
      </AdminFormSection>
      <AdminFormSection title="Map pin">
        <MapPinPicker
          v-if="dialog"
          v-model:lat="form.lat"
          v-model:lng="form.lng"
          v-model:embed-url="form.mapEmbedUrl"
          class="admin-form-span-2"
        />
      </AdminFormSection>
      <template #actions>
        <q-btn flat no-caps label="Cancel" v-close-popup />
        <q-btn
          v-if="
            editing
              ? auth.canAction('hotels', 'update')
              : auth.canAction('hotels', 'create')
          "
          color="primary"
          unelevated
          no-caps
          :label="editing ? 'Save changes' : 'Create hotel'"
          @click="save"
        />
      </template>
    </AdminDialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useQuasar } from "quasar";
import AdminDialog from "@/components/admin/AdminDialog.vue";
import AdminEntityActions from "@/components/admin/AdminEntityActions.vue";
import AdminFormSection from "@/components/admin/AdminFormSection.vue";
import AdminPageHeader from "@/components/admin/AdminPageHeader.vue";
import GalleryEditor from "@/components/admin/GalleryEditor.vue";
import ImageDropField from "@/components/admin/ImageDropField.vue";
import MapPinPicker from "@/components/admin/MapPinPicker.vue";
import { useAuthStore } from "@/stores/auth-store";
import { useCmsStore } from "@/stores/cms-store";
import type { ContentStatus, Hotel } from "@/types/greyon";

const cms = useCmsStore();
const auth = useAuthStore();
const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const dialog = ref(false);
const editing = ref<string | null>(null);
const amenitiesText = ref("");
const gallery = ref<string[]>([]);
const query = ref("");
const statusFilter = ref("all");
const locationFilter = ref("all");
const featuredOnly = ref(false);

const statusOptions = [
  { label: "All statuses", value: "all" },
  ...cms.statusOptions.map(s => ({ label: s, value: s }))
];

const locationOptions = computed(() =>
  cms.locations.map(l => ({ label: l.name, value: l.id }))
);
const locationFilterOptions = computed(() => [
  { label: "All destinations", value: "all" },
  ...locationOptions.value
]);

const form = reactive({
  name: "",
  slug: "",
  locationId: "",
  shortDescription: "",
  description: "",
  address: "",
  lat: null as number | null,
  lng: null as number | null,
  mapEmbedUrl: null as string | null,
  phone: "",
  email: "",
  checkInTime: "14:00",
  checkOutTime: "12:00",
  heroImage: "",
  status: "draft" as ContentStatus,
  featured: false
});

const hasFormMapPin = computed(() => {
  const lat = Number(form.lat);
  const lng = Number(form.lng);
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    (lat !== 0 || lng !== 0)
  );
});

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  return cms.hotels.filter(h => {
    if (!auth.canAccessHotel(h.id)) return false;
    if (statusFilter.value !== "all" && h.status !== statusFilter.value)
      return false;
    if (locationFilter.value !== "all" && h.locationId !== locationFilter.value)
      return false;
    if (featuredOnly.value && !h.featured) return false;
    if (!q) return true;
    return `${h.name} ${h.slug} ${h.address} ${h.shortDescription}`
      .toLowerCase()
      .includes(q);
  });
});

const grouped = computed(() => {
  const map = new Map<
    string,
    { locationId: string; locationName: string; hotels: Hotel[] }
  >();
  for (const hotel of filtered.value) {
    const loc = cms.getLocationById(hotel.locationId);
    const key = hotel.locationId || "orphan";
    if (!map.has(key)) {
      map.set(key, {
        locationId: key,
        locationName: loc?.name ?? "Unassigned location",
        hotels: []
      });
    }
    map.get(key)!.hotels.push(hotel);
  }
  return [...map.values()].sort((a, b) =>
    a.locationName.localeCompare(b.locationName)
  );
});

function roomCount(hotelId: string) {
  return cms.roomTypes.filter(r => r.hotelId === hotelId).length;
}

function shortAddress(address: string) {
  const part = address.split(",")[0]?.trim() ?? address;
  return part.length > 36 ? `${part.slice(0, 34)}…` : part;
}

function blank(locationId?: string) {
  form.name = "";
  form.slug = "";
  form.locationId =
    locationId ||
    (locationFilter.value !== "all" ? locationFilter.value : "") ||
    cms.locations[0]?.id ||
    "";
  form.shortDescription = "";
  form.description = "";
  form.address = "";
  form.lat = null;
  form.lng = null;
  form.mapEmbedUrl = null;
  form.phone = "";
  form.email = "";
  form.checkInTime = "14:00";
  form.checkOutTime = "12:00";
  form.heroImage = "";
  form.status = "draft";
  form.featured = false;
  amenitiesText.value = "";
  gallery.value = [];
}

function openCreate() {
  editing.value = null;
  blank();
  dialog.value = true;
}

function openCreateIn(locationId: string) {
  editing.value = null;
  blank(locationId);
  dialog.value = true;
}

function openEdit(hotel: Hotel) {
  editing.value = hotel.id;
  form.name = hotel.name;
  form.slug = hotel.slug;
  form.locationId = hotel.locationId;
  form.shortDescription = hotel.shortDescription;
  form.description = hotel.description;
  form.address = hotel.address;
  form.lat =
    hotel.coordinates &&
    Number.isFinite(hotel.coordinates.lat) &&
    (hotel.coordinates.lat !== 0 || hotel.coordinates.lng !== 0)
      ? hotel.coordinates.lat
      : null;
  form.lng =
    hotel.coordinates &&
    Number.isFinite(hotel.coordinates.lng) &&
    (hotel.coordinates.lat !== 0 || hotel.coordinates.lng !== 0)
      ? hotel.coordinates.lng
      : null;
  form.mapEmbedUrl = hotel.mapEmbedUrl || null;
  form.phone = hotel.phone;
  form.email = hotel.email;
  form.checkInTime = hotel.checkInTime || "14:00";
  form.checkOutTime = hotel.checkOutTime || "12:00";
  form.heroImage = hotel.heroImage;
  form.status = hotel.status;
  form.featured = Boolean(hotel.featured);
  amenitiesText.value = hotel.amenities.join(", ");
  gallery.value = [...hotel.gallery];
  dialog.value = true;
}

function save() {
  if (!form.name || !form.locationId) {
    $q.notify({ type: "negative", message: "Name and destination are required." });
    return;
  }
  void (async () => {
    try {
      await cms.upsertHotel({
        ...(editing.value ? { id: editing.value } : {}),
        name: form.name,
        ...(form.slug ? { slug: form.slug } : {}),
        locationId: form.locationId,
        shortDescription: form.shortDescription,
        description: form.description,
        address: form.address,
        ...(hasFormMapPin.value
          ? {
              coordinates: {
                lat: Number(form.lat),
                lng: Number(form.lng)
              }
            }
          : {}),
        mapEmbedUrl: form.mapEmbedUrl || null,
        phone: form.phone,
        email: form.email,
        checkInTime: form.checkInTime || "14:00",
        checkOutTime: form.checkOutTime || "12:00",
        ...(form.heroImage ? { heroImage: form.heroImage } : {}),
        gallery: gallery.value.filter(Boolean),
        amenities: amenitiesText.value
          .split(",")
          .map(s => s.trim())
          .filter(Boolean),
        status: form.status,
        featured: form.featured
      });
      dialog.value = false;
      $q.notify({ type: "positive", message: "Hotel saved." });
    } catch (e) {
      $q.notify({
        type: "negative",
        message: e instanceof Error ? e.message : "Save failed."
      });
    }
  })();
}

function setStatus(id: string, status: string) {
  const hotel = cms.getHotelById(id);
  if (!hotel) return;
  void cms.upsertHotel({ ...hotel, status: status as ContentStatus }).catch(e =>
    $q.notify({
      type: "negative",
      message: e instanceof Error ? e.message : "Update failed."
    })
  );
}

function toggleFeatured(id: string, featured: boolean) {
  const hotel = cms.getHotelById(id);
  if (!hotel) return;
  void cms.upsertHotel({ ...hotel, featured }).catch(e =>
    $q.notify({
      type: "negative",
      message: e instanceof Error ? e.message : "Update failed."
    })
  );
}

function remove(id: string) {
  $q.dialog({
    title: "Delete hotel?",
    message: "Related room types and rates will also be removed.",
    cancel: true,
    persistent: true
  }).onOk(() => {
    void cms
      .deleteHotel(id)
      .then(() => $q.notify({ type: "positive", message: "Hotel deleted." }))
      .catch(e =>
        $q.notify({
          type: "negative",
          message: e instanceof Error ? e.message : "Delete failed."
        })
      );
  });
}

function syncQuery() {
  const next: Record<string, string> = {};
  if (statusFilter.value !== "all") next.status = statusFilter.value;
  if (locationFilter.value !== "all") next.locationId = locationFilter.value;
  if (featuredOnly.value) next.featured = "1";
  if (query.value.trim()) next.q = query.value.trim();
  void router.replace({ query: next });
}

onMounted(async () => {
  await Promise.all([
    cms.ensureHotels(),
    cms.ensureLocations(),
    cms.ensureRoomTypes()
  ]);
  const s = String(route.query.status || "");
  if (cms.statusOptions.includes(s as ContentStatus)) statusFilter.value = s;
  const loc = String(route.query.locationId || "");
  if (cms.locations.some(l => l.id === loc)) locationFilter.value = loc;
  featuredOnly.value = route.query.featured === "1";
  if (typeof route.query.q === "string") query.value = route.query.q;
  if (route.query.create === "1") openCreate();
});

watch([statusFilter, locationFilter, featuredOnly, query], syncQuery);
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

.hotel-groups {
  display: grid;
  gap: 1.15rem;
}

.hotel-group {
  background: #fff;
  border: 1px solid rgba(28, 36, 33, 0.08);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 0 rgba(28, 36, 33, 0.03);
}

.hotel-group__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.05rem 1.15rem;
  background: linear-gradient(180deg, #f7f5f1 0%, #faf9f7 100%);
  border-bottom: 1px solid rgba(28, 36, 33, 0.06);
}

.hotel-group__level {
  margin: 0;
  font-size: 0.66rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
  font-weight: 600;
}

.hotel-group__title {
  margin: 0.25rem 0 0;
  font-family: var(--font-display);
  font-size: clamp(1.25rem, 2vw, 1.45rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.hotel-group__meta {
  margin: 0.25rem 0 0;
  font-size: 0.82rem;
  color: var(--gy-muted);
}

.hotel-group__links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.hotel-cards {
  display: grid;
  gap: 0.65rem;
  padding: 0.9rem 1rem 1.05rem;
}

.hotel-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.9rem 1rem;
  align-items: start;
  padding: 0.85rem 0.9rem;
  border: 1px solid rgba(28, 36, 33, 0.07);
  border-radius: 14px;
  background: #fff;
  transition: border-color 0.15s ease;
}

.hotel-card:hover {
  border-color: rgba(154, 123, 60, 0.35);
}

.hotel-card__media,
.hotel-card__thumb {
  width: 5.25rem;
  height: 4rem;
  border-radius: 10px;
  flex-shrink: 0;
}

.hotel-card__media {
  overflow: hidden;
  background: var(--gy-stone, #e8e4dc);
}

.hotel-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.hotel-card__thumb {
  display: grid;
  place-items: center;
  background: rgba(154, 123, 60, 0.1);
  color: var(--gy-gold-deep);
}

.hotel-card__body {
  min-width: 0;
}

.hotel-card__topline {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.hotel-card__crumb {
  margin: 0;
  font-size: 0.66rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
  font-weight: 600;
}

.hotel-card__status {
  display: inline-flex;
  align-items: center;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: lowercase;
  background: rgba(28, 36, 33, 0.06);
  color: var(--gy-muted);
}

.hotel-card__status[data-status="published"] {
  background: rgba(46, 125, 80, 0.12);
  color: #1e6b3a;
}

.hotel-card__status[data-status="draft"] {
  background: rgba(154, 123, 60, 0.14);
  color: var(--gy-gold-deep);
}

.hotel-card__feat-pill {
  display: inline-flex;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 650;
  background: rgba(154, 123, 60, 0.14);
  color: var(--gy-gold-deep);
}

.hotel-card__name {
  margin: 0.35rem 0 0;
  font-family: var(--font-display);
  font-size: 1.12rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.25;
  color: var(--gy-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hotel-card__slug {
  margin: 0.25rem 0 0;
  font-size: 0.78rem;
  color: var(--gy-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.hotel-card__desc {
  margin: 0.4rem 0 0;
  font-size: 0.84rem;
  color: var(--gy-muted);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.hotel-card__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin: 0.55rem 0 0;
  padding: 0;
  list-style: none;
}

.hotel-card__chips li {
  padding: 0.18rem 0.55rem;
  border-radius: 999px;
  background: rgba(28, 36, 33, 0.05);
  color: var(--gy-ink);
  font-size: 0.74rem;
  font-weight: 500;
}

.hotel-card__side {
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
}

.hotel-card__feat-toggle {
  padding: 0.15rem 0.55rem;
  border-radius: 10px;
  border: 1px solid rgba(28, 25, 23, 0.1);
  background: #fff;
  box-shadow: 0 1px 0 rgba(28, 25, 23, 0.03);
  min-height: 34px;
}

.hotel-groups__empty {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--gy-muted);
  background: #fff;
  border-radius: 14px;
  border: 1px dashed rgba(28, 36, 33, 0.15);
}

.admin-form-toggle {
  display: flex;
  align-items: center;
  min-height: 40px;
  padding: 0.35rem 0.65rem;
  background: #faf9f7;
  border-radius: 12px;
  border: 1px solid rgba(28, 36, 33, 0.06);
}

@media (max-width: 860px) {
  .hotel-card {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .hotel-card__side {
    grid-column: 1 / -1;
    justify-content: flex-start;
    width: 100%;
  }

  .hotel-group__head {
    flex-direction: column;
  }
}
</style>

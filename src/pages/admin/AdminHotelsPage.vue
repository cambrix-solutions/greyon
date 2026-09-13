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
          label="Location"
          style="min-width: 180px; background: #fff"
        />
        <q-toggle v-model="featuredOnly" label="Featured only" dense />
      </template>
    </AdminPageHeader>

    <div v-reveal class="tree-legend">
      <span><strong>Parent</strong> Location</span>
      <span class="tree-legend__arrow">→</span>
      <span><strong>This page</strong> Hotel</span>
      <span class="tree-legend__arrow">→</span>
      <span><strong>Children</strong> Room types</span>
    </div>

    <div v-reveal="{ delay: '80ms' }" class="hotel-groups">
      <section v-for="group in grouped" :key="group.locationId" class="hotel-group">
        <header class="hotel-group__head">
          <div>
            <p class="hotel-group__level">Location</p>
            <h2 class="hotel-group__title">{{ group.locationName }}</h2>
            <p class="hotel-group__meta">
              {{ group.hotels.length }} hotel{{ group.hotels.length === 1 ? "" : "s" }}
            </p>
          </div>
          <div class="hotel-group__links">
            <q-btn
              flat
              dense
              no-caps
              color="primary"
              label="Open location"
              :to="`/admin/locations`"
            />
            <q-btn
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
          <article v-for="hotel in group.hotels" :key="hotel.id" class="hotel-card">
            <img
              v-if="hotel.heroImage"
              :src="hotel.heroImage"
              alt=""
              class="hotel-card__media"
            />
            <div class="hotel-card__body">
              <p class="hotel-card__crumb">
                {{ group.locationName }}
                <span aria-hidden="true">/</span>
                Hotel
              </p>
              <h3 class="hotel-card__name">{{ hotel.name }}</h3>
              <p class="hotel-card__slug">{{ hotel.slug }}</p>
              <p class="hotel-card__desc">{{ hotel.shortDescription }}</p>
              <div class="hotel-card__stats">
                <span
                  >{{ roomCount(hotel.id) }} room type{{
                    roomCount(hotel.id) === 1 ? "" : "s"
                  }}</span
                >
                <span v-if="hotel.featured" class="hotel-card__feat">Featured</span>
              </div>
            </div>
            <div class="hotel-card__side">
              <q-select
                dense
                outlined
                :model-value="hotel.status"
                :options="cms.statusOptions"
                style="min-width: 120px"
                @update:model-value="(v: string) => setStatus(hotel.id, v)"
              />
              <q-toggle
                dense
                :model-value="Boolean(hotel.featured)"
                label="Featured"
                @update:model-value="(v: boolean) => toggleFeatured(hotel.id, v)"
              />
              <div class="hotel-card__actions">
                <q-btn
                  outline
                  dense
                  no-caps
                  color="primary"
                  label="Rooms"
                  :to="`/admin/rooms?hotelId=${hotel.id}`"
                />
                <q-btn flat dense no-caps color="primary" label="Edit" @click="openEdit(hotel)" />
                <q-btn
                  flat
                  dense
                  round
                  icon="open_in_new"
                  :to="`/hotels/${hotel.slug}`"
                  target="_blank"
                />
                <q-btn flat dense round icon="delete" color="negative" @click="remove(hotel.id)" />
              </div>
            </div>
          </article>
        </div>
      </section>

      <div v-if="!grouped.length" class="hotel-groups__empty">
        No hotels match.
        <q-btn flat dense color="primary" label="Add hotel" @click="openCreate" />
      </div>
    </div>

    <AdminDialog
      v-model="dialog"
      size="xl"
      icon="apartment"
      eyebrow="Properties"
      :title="editing ? 'Edit hotel' : 'Add hotel'"
      subtitle="Link this property to a location, then add room types under it."
    >
      <template #notice>
        Required relationship: <strong>Location → Hotel → Rooms</strong>. Pick the parent
        location first.
      </template>
      <AdminFormSection
        title="Basics"
        hint="What guests see in listings and search results."
        :columns="2"
      >
        <q-input v-model="form.name" label="Hotel name" outlined dense class="admin-form-span-2" />
        <q-input
          v-model="form.slug"
          label="URL slug"
          outlined
          dense
          hint="Leave blank to auto-generate"
        />
        <q-select
          v-model="form.locationId"
          :options="locationOptions"
          label="Parent location"
          outlined
          dense
          emit-value
          map-options
        />
        <q-input
          v-model="form.shortDescription"
          label="Short description"
          outlined
          dense
          class="admin-form-span-2"
        />
      </AdminFormSection>
      <AdminFormSection title="About the stay" hint="Longer copy for the hotel detail page.">
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
        <q-input v-model="form.address" label="Address" outlined dense class="admin-form-span-2" />
        <q-input v-model="form.phone" label="Phone" outlined dense />
        <q-input v-model="form.email" label="Email" outlined dense />
        <q-input v-model="form.checkInTime" type="time" label="Check-in" outlined dense />
        <q-input v-model="form.checkOutTime" type="time" label="Check-out" outlined dense />
      </AdminFormSection>
      <AdminFormSection title="Media" hint="Hero drives cards; gallery appears on the detail page.">
        <q-input v-model="form.heroImage" label="Hero image URL" outlined dense />
        <GalleryEditor v-model="gallery" label="Hotel gallery" />
      </AdminFormSection>
      <AdminFormSection title="Publishing" :columns="2">
        <q-select
          v-model="form.status"
          :options="cms.statusOptions"
          label="Status"
          outlined
          dense
        />
        <div class="admin-form-toggle">
          <q-toggle v-model="form.featured" label="Featured on home" />
        </div>
      </AdminFormSection>
      <template #actions>
        <q-btn flat no-caps label="Cancel" v-close-popup />
        <q-btn
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
import AdminFormSection from "@/components/admin/AdminFormSection.vue";
import AdminPageHeader from "@/components/admin/AdminPageHeader.vue";
import GalleryEditor from "@/components/admin/GalleryEditor.vue";
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
  { label: "All locations", value: "all" },
  ...locationOptions.value
]);

const form = reactive({
  name: "",
  slug: "",
  locationId: "",
  shortDescription: "",
  description: "",
  address: "",
  phone: "",
  email: "",
  checkInTime: "14:00",
  checkOutTime: "12:00",
  heroImage: "",
  status: "draft" as ContentStatus,
  featured: false
});

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  return cms.hotels.filter(h => {
    if (!auth.canAccessHotel(h.id)) return false;
    if (statusFilter.value !== "all" && h.status !== statusFilter.value) return false;
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
  return cms.getRoomTypesByHotelId(hotelId).length;
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
    $q.notify({ type: "negative", message: "Name and location are required." });
    return;
  }
  cms.upsertHotel({
    ...(editing.value ? { id: editing.value } : {}),
    name: form.name,
    ...(form.slug ? { slug: form.slug } : {}),
    locationId: form.locationId,
    shortDescription: form.shortDescription,
    description: form.description,
    address: form.address,
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
}

function setStatus(id: string, status: string) {
  const hotel = cms.getHotelById(id);
  if (!hotel) return;
  cms.upsertHotel({ ...hotel, status: status as ContentStatus });
}

function toggleFeatured(id: string, featured: boolean) {
  const hotel = cms.getHotelById(id);
  if (!hotel) return;
  cms.upsertHotel({ ...hotel, featured });
}

function remove(id: string) {
  $q.dialog({
    title: "Delete hotel?",
    message: "Related room types and rates will also be removed.",
    cancel: true,
    persistent: true
  }).onOk(() => {
    cms.deleteHotel(id);
    $q.notify({ type: "positive", message: "Hotel deleted." });
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

onMounted(() => {
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
}

.hotel-group__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 1.1rem;
  background: #faf9f7;
  border-bottom: 1px solid rgba(28, 36, 33, 0.06);
}

.hotel-group__level,
.hotel-card__crumb {
  margin: 0;
  font-size: 0.66rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
}

.hotel-card__crumb span {
  margin: 0 0.35rem;
  opacity: 0.55;
}

.hotel-group__title {
  margin: 0.2rem 0 0;
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.hotel-group__meta {
  margin: 0.2rem 0 0;
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
  padding: 0.85rem 1rem 1rem;
}

.hotel-card {
  display: grid;
  grid-template-columns: 96px 1fr auto;
  gap: 0.9rem;
  align-items: start;
  padding: 0.75rem;
  border: 1px solid rgba(28, 36, 33, 0.07);
  border-radius: 12px;
  background: #fff;
}

.hotel-card__media {
  width: 96px;
  height: 72px;
  object-fit: cover;
  border-radius: 8px;
  background: var(--gy-stone);
}

.hotel-card__name {
  margin: 0.2rem 0 0;
  font-size: 1.05rem;
  font-weight: 650;
  letter-spacing: -0.01em;
}

.hotel-card__slug,
.hotel-card__desc {
  margin: 0.2rem 0 0;
  font-size: 0.82rem;
  color: var(--gy-muted);
}

.hotel-card__desc {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.hotel-card__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.45rem;
  font-size: 0.78rem;
  color: var(--gy-muted);
}

.hotel-card__feat {
  color: var(--gy-gold-deep);
  font-weight: 600;
}

.hotel-card__side {
  display: grid;
  gap: 0.4rem;
  justify-items: end;
}

.hotel-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.15rem;
  justify-content: flex-end;
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
    grid-template-columns: 72px 1fr;
  }

  .hotel-card__side {
    grid-column: 1 / -1;
    justify-items: start;
    width: 100%;
  }

  .hotel-card__actions {
    justify-content: flex-start;
  }

  .hotel-group__head {
    flex-direction: column;
  }
}
</style>

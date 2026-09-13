<template>
  <q-page padding class="admin-page">
    <AdminPageHeader
      eyebrow="Properties"
      title="Room types"
      :subtitle="`${filtered.length} rooms · each belongs to one hotel via hotelId`"
    >
      <template #actions>
        <q-btn outline no-caps color="primary" label="Rates calendar" to="/admin/rates" />
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="add"
          label="Add room"
          @click="openCreate"
        />
      </template>
      <template #toolbar>
        <q-input
          v-model="query"
          dense
          outlined
          clearable
          placeholder="Search rooms…"
          style="min-width: min(100%, 220px); background: #fff"
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>
        <q-select
          v-model="hotelFilter"
          :options="hotelFilterOptions"
          dense
          outlined
          emit-value
          map-options
          label="Hotel"
          style="min-width: 200px; background: #fff"
        />
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
      <span><strong>Location</strong></span>
      <span class="tree-legend__arrow">→</span>
      <span><strong>Hotel</strong> parent</span>
      <span class="tree-legend__arrow">→</span>
      <span><strong>This page</strong> Room types</span>
    </div>

    <div v-reveal="{ delay: '80ms' }" class="room-groups">
      <section v-for="group in grouped" :key="group.hotelId" class="room-group">
        <header class="room-group__head">
          <div>
            <p class="room-group__crumb">
              {{ group.locationName }}
              <span aria-hidden="true">/</span>
              Hotel
            </p>
            <h2 class="room-group__title">{{ group.hotelName }}</h2>
            <p class="room-group__meta">
              {{ group.rooms.length }} room type{{ group.rooms.length === 1 ? "" : "s" }}
            </p>
          </div>
          <div class="room-group__links">
            <q-btn
              flat
              dense
              no-caps
              color="primary"
              label="Edit hotel"
              :to="`/admin/hotels?locationId=${group.locationId}`"
            />
            <q-btn
              outline
              dense
              no-caps
              color="primary"
              icon="add"
              label="Room here"
              @click="openCreateIn(group.hotelId)"
            />
          </div>
        </header>

        <div class="room-rows">
          <article v-for="room in group.rooms" :key="room.id" class="room-row">
            <img
              v-if="room.images?.[0]"
              :src="room.images[0]"
              alt=""
              class="room-row__thumb"
            />
            <div class="room-row__main">
              <p class="room-row__level">Room type</p>
              <h3 class="room-row__name">{{ room.name }}</h3>
              <p class="room-row__facts">
                {{ room.bedType }} · {{ room.roomSize }} ·
                {{ room.maxAdults }}A / {{ room.maxChildren }}C · max
                {{ room.maxGuests }}
              </p>
            </div>
            <div class="room-row__inv">
              <label>Inventory</label>
              <q-input
                dense
                outlined
                type="number"
                style="max-width: 90px"
                :model-value="room.baseInventory"
                @update:model-value="(v) => setInventory(room.id, Number(v))"
              />
            </div>
            <div class="room-row__side">
              <q-select
                dense
                outlined
                :model-value="room.status"
                :options="cms.statusOptions"
                style="min-width: 120px"
                @update:model-value="(v: string) => setStatus(room.id, v)"
              />
              <div class="room-row__actions">
                <q-btn flat dense no-caps color="primary" label="Edit" @click="openEdit(room)" />
                <q-btn
                  flat
                  dense
                  no-caps
                  color="primary"
                  label="Rates"
                  :to="`/admin/rates?roomId=${room.id}`"
                />
                <q-btn
                  flat
                  dense
                  round
                  icon="delete"
                  color="negative"
                  @click="remove(room.id)"
                />
              </div>
            </div>
          </article>
        </div>
      </section>

      <div v-if="!grouped.length" class="room-groups__empty">
        No rooms match.
        <q-btn flat dense color="primary" label="Add room" @click="openCreate" />
      </div>
    </div>

    <AdminDialog
      v-model="dialog"
      size="xl"
      icon="bed"
      eyebrow="Properties"
      :title="editing ? 'Edit room' : 'Add room'"
      subtitle="Room types sit under a hotel and drive inventory, rates, and booking."
    >
      <template #notice>
        Pick the <strong>parent hotel</strong> — rooms never link straight to a location.
      </template>
      <AdminFormSection title="Parent & name" :columns="2">
        <q-select
          v-model="form.hotelId"
          :options="hotelOptions"
          label="Parent hotel"
          outlined
          dense
          emit-value
          map-options
          class="admin-form-span-2"
        />
        <q-input v-model="form.name" label="Room type name" outlined dense class="admin-form-span-2" />
      </AdminFormSection>
      <AdminFormSection title="Description" hint="Shown on hotel detail and booking steps.">
        <q-input
          v-model="form.description"
          label="Description"
          type="textarea"
          outlined
          autogrow
        />
        <q-input
          v-model="amenitiesText"
          label="Amenities"
          outlined
          dense
          hint="Comma-separated"
        />
      </AdminFormSection>
      <AdminFormSection title="Layout & capacity" :columns="3">
        <q-input v-model="form.bedType" label="Bed type" outlined dense />
        <q-input v-model="form.roomSize" label="Size" outlined dense />
        <q-input
          v-model.number="form.baseInventory"
          type="number"
          label="Base inventory"
          outlined
          dense
        />
        <q-input v-model.number="form.maxAdults" type="number" label="Max adults" outlined dense />
        <q-input
          v-model.number="form.maxChildren"
          type="number"
          label="Max children"
          outlined
          dense
        />
        <q-input v-model.number="form.maxGuests" type="number" label="Max guests" outlined dense />
      </AdminFormSection>
      <AdminFormSection title="Gallery & status">
        <GalleryEditor v-model="images" label="Room gallery" />
        <q-select
          v-model="form.status"
          :options="cms.statusOptions"
          label="Status"
          outlined
          dense
          style="max-width: 220px"
        />
      </AdminFormSection>
      <template #actions>
        <q-btn flat no-caps label="Cancel" v-close-popup />
        <q-btn
          color="primary"
          unelevated
          no-caps
          :label="editing ? 'Save changes' : 'Create room'"
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
import type { ContentStatus, RoomType } from "@/types/greyon";

const cms = useCmsStore();
const auth = useAuthStore();
const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const dialog = ref(false);
const editing = ref<string | null>(null);
const images = ref<string[]>([]);
const amenitiesText = ref("");
const query = ref("");
const hotelFilter = ref("all");
const statusFilter = ref("all");

const statusOptions = [
  { label: "All statuses", value: "all" },
  ...cms.statusOptions.map(s => ({ label: s, value: s }))
];
const hotelOptions = computed(() =>
  cms.hotels
    .filter(h => auth.canAccessHotel(h.id))
    .map(h => ({ label: h.name, value: h.id }))
);
const hotelFilterOptions = computed(() => [
  { label: "All hotels", value: "all" },
  ...hotelOptions.value
]);

const form = reactive({
  hotelId: "",
  name: "",
  description: "",
  bedType: "1 King",
  roomSize: "28 m²",
  maxAdults: 2,
  maxChildren: 1,
  maxGuests: 3,
  baseInventory: 5,
  status: "draft" as ContentStatus
});

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  return cms.roomTypes.filter(r => {
    if (!auth.canAccessHotel(r.hotelId)) return false;
    if (hotelFilter.value !== "all" && r.hotelId !== hotelFilter.value) return false;
    if (statusFilter.value !== "all" && r.status !== statusFilter.value) return false;
    if (!q) return true;
    const hotel = cms.getHotelById(r.hotelId);
    return `${r.name} ${r.bedType} ${r.description} ${hotel?.name ?? ""}`
      .toLowerCase()
      .includes(q);
  });
});

const grouped = computed(() => {
  const map = new Map<
    string,
    {
      hotelId: string;
      hotelName: string;
      locationId: string;
      locationName: string;
      rooms: RoomType[];
    }
  >();
  for (const room of filtered.value) {
    const hotel = cms.getHotelById(room.hotelId);
    const loc = hotel ? cms.getLocationById(hotel.locationId) : undefined;
    const key = room.hotelId || "orphan";
    if (!map.has(key)) {
      map.set(key, {
        hotelId: key,
        hotelName: hotel?.name ?? "Unassigned hotel",
        locationId: hotel?.locationId ?? "",
        locationName: loc?.name ?? "Unknown location",
        rooms: []
      });
    }
    map.get(key)!.rooms.push(room);
  }
  return [...map.values()].sort((a, b) => {
    const loc = a.locationName.localeCompare(b.locationName);
    return loc !== 0 ? loc : a.hotelName.localeCompare(b.hotelName);
  });
});

function openCreate() {
  editing.value = null;
  resetForm();
  dialog.value = true;
}

function openCreateIn(hotelId: string) {
  editing.value = null;
  resetForm(hotelId);
  dialog.value = true;
}

function resetForm(hotelId?: string) {
  form.hotelId =
    hotelId ||
    (hotelFilter.value !== "all" ? hotelFilter.value : "") ||
    cms.hotels.find(h => auth.canAccessHotel(h.id))?.id ||
    "";
  form.name = "";
  form.description = "";
  form.bedType = "1 King";
  form.roomSize = "28 m²";
  form.maxAdults = 2;
  form.maxChildren = 1;
  form.maxGuests = 3;
  form.baseInventory = 5;
  form.status = "draft";
  images.value = [];
  amenitiesText.value = "";
}

function openEdit(room: RoomType) {
  editing.value = room.id;
  form.hotelId = room.hotelId;
  form.name = room.name;
  form.description = room.description;
  form.bedType = room.bedType;
  form.roomSize = room.roomSize;
  form.maxAdults = room.maxAdults;
  form.maxChildren = room.maxChildren;
  form.maxGuests = room.maxGuests;
  form.baseInventory = room.baseInventory;
  form.status = room.status;
  images.value = [...room.images];
  amenitiesText.value = room.amenities.join(", ");
  dialog.value = true;
}

function save() {
  if (!form.name || !form.hotelId) {
    $q.notify({ type: "negative", message: "Name and hotel are required." });
    return;
  }
  cms.upsertRoom({
    ...(editing.value ? { id: editing.value } : {}),
    ...form,
    images: images.value.filter(Boolean),
    amenities: amenitiesText.value
      .split(",")
      .map(s => s.trim())
      .filter(Boolean)
  });
  dialog.value = false;
  $q.notify({ type: "positive", message: "Room saved." });
}

function setInventory(id: string, baseInventory: number) {
  const room = cms.getRoomTypeById(id);
  if (!room || Number.isNaN(baseInventory)) return;
  cms.upsertRoom({ ...room, baseInventory });
}

function setStatus(id: string, status: string) {
  const room = cms.getRoomTypeById(id);
  if (!room) return;
  cms.upsertRoom({ ...room, status: status as ContentStatus });
}

function remove(id: string) {
  $q.dialog({
    title: "Delete room type?",
    cancel: true,
    persistent: true
  }).onOk(() => {
    cms.deleteRoom(id);
    $q.notify({ type: "positive", message: "Room deleted." });
  });
}

onMounted(() => {
  const hotelId = String(route.query.hotelId || "");
  if (cms.hotels.some(h => h.id === hotelId)) hotelFilter.value = hotelId;
  const s = String(route.query.status || "");
  if (cms.statusOptions.includes(s as ContentStatus)) statusFilter.value = s;
  if (route.query.create === "1") openCreate();
});

watch([hotelFilter, statusFilter, query], () => {
  const next: Record<string, string> = {};
  if (hotelFilter.value !== "all") next.hotelId = hotelFilter.value;
  if (statusFilter.value !== "all") next.status = statusFilter.value;
  if (query.value.trim()) next.q = query.value.trim();
  void router.replace({ query: next });
});
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

.room-groups {
  display: grid;
  gap: 1.15rem;
}

.room-group {
  background: #fff;
  border: 1px solid rgba(28, 36, 33, 0.08);
  border-radius: 16px;
  overflow: hidden;
}

.room-group__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 1.1rem;
  background: #faf9f7;
  border-bottom: 1px solid rgba(28, 36, 33, 0.06);
}

.room-group__crumb,
.room-row__level {
  margin: 0;
  font-size: 0.66rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
}

.room-group__crumb span {
  margin: 0 0.35rem;
  opacity: 0.55;
}

.room-group__title {
  margin: 0.2rem 0 0;
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.room-group__meta {
  margin: 0.2rem 0 0;
  font-size: 0.82rem;
  color: var(--gy-muted);
}

.room-group__links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.room-rows {
  display: grid;
  gap: 0.55rem;
  padding: 0.85rem 1rem 1rem;
}

.room-row {
  display: grid;
  grid-template-columns: 64px 1fr auto auto;
  gap: 0.85rem;
  align-items: center;
  padding: 0.7rem 0.75rem;
  border: 1px solid rgba(28, 36, 33, 0.07);
  border-radius: 12px;
}

.room-row__thumb {
  width: 64px;
  height: 52px;
  object-fit: cover;
  border-radius: 8px;
  background: var(--gy-stone);
}

.room-row__name {
  margin: 0.15rem 0 0;
  font-size: 1rem;
  font-weight: 650;
}

.room-row__facts {
  margin: 0.2rem 0 0;
  font-size: 0.8rem;
  color: var(--gy-muted);
}

.room-row__inv label {
  display: block;
  margin-bottom: 0.2rem;
  font-size: 0.68rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--gy-muted);
}

.room-row__side {
  display: grid;
  gap: 0.35rem;
  justify-items: end;
}

.room-row__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.1rem;
  justify-content: flex-end;
}

.room-groups__empty {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--gy-muted);
  background: #fff;
  border-radius: 14px;
  border: 1px dashed rgba(28, 36, 33, 0.15);
}

@media (max-width: 900px) {
  .room-row {
    grid-template-columns: 56px 1fr;
  }

  .room-row__inv,
  .room-row__side {
    grid-column: 1 / -1;
    justify-items: start;
  }

  .room-row__actions {
    justify-content: flex-start;
  }

  .room-group__head {
    flex-direction: column;
  }
}
</style>

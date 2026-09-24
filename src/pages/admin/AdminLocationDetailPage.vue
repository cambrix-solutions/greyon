<template>
  <q-page v-if="location" padding class="dest-detail">
    <nav class="dest-crumb" aria-label="Breadcrumb">
      <router-link to="/admin/locations">Destinations</router-link>
      <q-icon name="chevron_right" size="16px" />
      <span>{{ location.name }}</span>
    </nav>

    <AdminPageHeader
      eyebrow="Destination detail"
      :title="location.name"
      :subtitle="`Manage hotels and room types for /${location.slug}`"
    >
      <template #actions>
        <q-btn
          outline
          no-caps
          color="primary"
          icon="open_in_new"
          label="View live"
          :to="`/locations/${location.slug}`"
          target="_blank"
        />
        <q-btn
          v-if="auth.canAction('locations', 'update')"
          unelevated
          no-caps
          color="primary"
          icon="edit"
          label="Edit destination"
          @click="openEditLocation"
        />
      </template>
    </AdminPageHeader>

    <section v-reveal class="dest-overview">
      <div
        class="dest-overview__cover"
        :class="{ 'dest-overview__cover--empty': !location.heroImage }"
      >
        <img
          v-if="location.heroImage"
          :src="location.heroImage"
          :alt="location.name"
        />
        <div v-else class="dest-overview__cover-empty">
          <q-icon name="image" size="28px" />
          <span>No cover image</span>
        </div>
      </div>

      <div class="dest-overview__panel">
        <div class="dest-overview__topline">
          <span class="status-pill" :data-status="location.status">{{
            location.status
          }}</span>
          <span class="dest-overview__slug">/{{ location.slug }}</span>
        </div>

        <p class="dest-overview__desc">
          {{ location.description || "No description yet." }}
        </p>

        <ul v-if="location.highlights.length" class="dest-overview__tags">
          <li v-for="h in location.highlights" :key="h">{{ h }}</li>
        </ul>

        <div class="dest-overview__stats">
          <div class="stat">
            <strong>{{ hotels.length }}</strong>
            <span>Hotels</span>
          </div>
          <div class="stat">
            <strong>{{ totalRooms }}</strong>
            <span>Room types</span>
          </div>
          <div class="stat">
            <strong>{{ hotelCap - hotels.length }}</strong>
            <span>Slots left</span>
          </div>
        </div>
      </div>
    </section>

    <section v-reveal="{ delay: '70ms' }" class="prop-board">
      <header class="prop-board__head">
        <div>
          <p class="prop-board__eyebrow">Properties</p>
          <h2 class="prop-board__title">
            Hotels
            <em>{{ hotels.length }}/{{ hotelCap }}</em>
          </h2>
        </div>
        <q-btn
          v-if="auth.canAction('hotels', 'create')"
          unelevated
          no-caps
          color="primary"
          icon="add"
          label="Add hotel"
          :disable="hotels.length >= hotelCap"
          @click="openCreateHotel"
        />
      </header>

      <div v-if="hotels.length" class="prop-list">
        <article
          v-for="hotel in hotels"
          :key="hotel.id"
          class="prop-hotel"
          :class="{ 'prop-hotel--open': expandedHotelId === hotel.id }"
        >
          <button
            type="button"
            class="prop-hotel__summary"
            @click="toggleHotel(hotel.id)"
          >
            <div class="prop-hotel__thumb" aria-hidden="true">
              <img v-if="hotel.heroImage" :src="hotel.heroImage" alt="" />
              <q-icon v-else name="apartment" size="22px" />
            </div>
            <div class="prop-hotel__copy">
              <div class="prop-hotel__title-row">
                <h3>{{ hotel.name }}</h3>
                <span class="status-pill" :data-status="hotel.status">{{
                  hotel.status
                }}</span>
                <span v-if="hotel.featured" class="feat-pill">Featured</span>
              </div>
              <p>
                {{ roomsFor(hotel.id).length }} room type{{
                  roomsFor(hotel.id).length === 1 ? "" : "s"
                }}
                <template v-if="hotel.shortDescription">
                  · {{ hotel.shortDescription }}
                </template>
              </p>
            </div>
            <q-icon
              class="prop-hotel__chevron"
              :name="
                expandedHotelId === hotel.id
                  ? 'expand_less'
                  : 'expand_more'
              "
              size="22px"
            />
          </button>

          <div class="prop-hotel__toolbar" @click.stop>
            <AdminEntityActions
              dense
              hide-status
              primary-label="Add room"
              primary-icon="add"
              :primary-show="auth.canAction('rooms', 'create')"
              :actions="[
                {
                  key: 'edit',
                  icon: 'edit',
                  tip: 'Edit hotel',
                  show: auth.canAction('hotels', 'update'),
                  onClick: () => openEditHotel(hotel)
                },
                {
                  key: 'delete',
                  icon: 'delete',
                  tip: 'Delete hotel',
                  danger: true,
                  show: auth.canAction('hotels', 'delete'),
                  onClick: () => removeHotel(hotel.id)
                }
              ]"
              @primary="openCreateRoom(hotel.id)"
            />
          </div>

          <div v-show="expandedHotelId === hotel.id" class="prop-rooms">
            <div class="prop-rooms__label">Room types</div>

            <div
              v-for="room in roomsFor(hotel.id)"
              :key="room.id"
              class="prop-room"
            >
              <div class="prop-room__thumb" aria-hidden="true">
                <img v-if="room.images?.[0]" :src="room.images[0]" alt="" />
                <q-icon v-else name="bed" size="18px" />
              </div>
              <div class="prop-room__copy">
                <div class="prop-room__title-row">
                  <strong>{{ room.name }}</strong>
                  <span class="status-pill" :data-status="room.status">{{
                    room.status
                  }}</span>
                </div>
                <p>
                  {{ room.bedType }} · {{ room.roomSize }} · max
                  {{ room.maxGuests }} guests · {{ room.baseInventory }} to sell
                    / night
                </p>
              </div>
              <div class="prop-room__actions">
                <AdminEntityActions
                  dense
                  hide-status
                  :actions="[
                    {
                      key: 'edit',
                      icon: 'edit',
                      tip: 'Edit room',
                      show: auth.canAction('rooms', 'update'),
                      onClick: () => openEditRoom(room)
                    },
                    {
                      key: 'delete',
                      icon: 'delete',
                      tip: 'Delete room',
                      danger: true,
                      show: auth.canAction('rooms', 'delete'),
                      onClick: () => removeRoom(room.id)
                    }
                  ]"
                />
              </div>
            </div>

            <div v-if="!roomsFor(hotel.id).length" class="prop-rooms__empty">
              <q-icon name="bed" size="22px" />
              <p>No room types yet</p>
              <q-btn
                v-if="auth.canAction('rooms', 'create')"
                flat
                dense
                no-caps
                color="primary"
                label="Add first room"
                @click="openCreateRoom(hotel.id)"
              />
            </div>
          </div>
        </article>
      </div>

      <div v-else class="prop-empty">
        <div class="prop-empty__icon" aria-hidden="true">
          <q-icon name="apartment" size="32px" />
        </div>
        <h3>No hotels yet</h3>
        <p>
          Add the first hotel for {{ location.name }}, then create room types
          under it.
        </p>
        <q-btn
          v-if="auth.canAction('hotels', 'create')"
          unelevated
          no-caps
          color="primary"
          icon="add"
          label="Add hotel"
          @click="openCreateHotel"
        />
      </div>
    </section>

    <!-- Destination dialog -->
    <AdminDialog
      v-model="locDialog"
      size="lg"
      icon="place"
      eyebrow="Destination"
      title="Edit destination"
      subtitle="Hero image and story guests see on the destinations page."
    >
      <AdminFormSection title="Essentials" :columns="2">
        <q-input v-model="locForm.name" label="Destination name" outlined dense />
        <q-select
          v-model="locForm.status"
          :options="cms.statusOptions"
          label="Status"
          outlined
          dense
          :disable="!auth.can('locations_publish')"
        />
      </AdminFormSection>
      <AdminFormSection
        title="Hero image"
        hint="Drop, browse, or paste a URL — same as hotel & room galleries."
      >
        <ImageDropField
          v-model="locForm.heroImage"
          title="Drop or browse hero image"
        />
      </AdminFormSection>
      <AdminFormSection title="Details">
        <q-input
          v-model="locForm.slug"
          label="URL slug"
          outlined
          dense
          hint="Leave blank to keep current"
        />
        <q-input
          v-model="locForm.description"
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
          hint="Comma-separated"
        />
      </AdminFormSection>
      <template #actions>
        <q-btn flat no-caps label="Cancel" v-close-popup />
        <q-btn
          v-if="auth.canAction('locations', 'update')"
          color="primary"
          unelevated
          no-caps
          label="Save changes"
          @click="saveLocation"
        />
      </template>
    </AdminDialog>

    <!-- Hotel dialog -->
    <AdminDialog
      v-model="hotelDialog"
      size="xl"
      icon="apartment"
      eyebrow="Hotel"
      :title="hotelEditing ? 'Edit hotel' : 'Add hotel'"
      subtitle="Belongs to this destination. Add a hero image and gallery."
    >
      <AdminFormSection title="Essentials" :columns="2">
        <q-input v-model="hotelForm.name" label="Hotel name" outlined dense />
        <q-select
          v-model="hotelForm.status"
          :options="cms.statusOptions"
          label="Status"
          outlined
          dense
        />
        <q-input
          v-model="hotelForm.slug"
          label="URL slug"
          outlined
          dense
          hint="Leave blank to auto-generate"
        />
        <div class="admin-form-toggle">
          <q-toggle v-model="hotelForm.featured" label="Featured on home" />
        </div>
      </AdminFormSection>
      <AdminFormSection
        title="Hero image"
        hint="Drop, browse, or paste a URL."
      >
        <ImageDropField
          v-model="hotelForm.heroImage"
          title="Drop or browse hero image"
        />
      </AdminFormSection>
      <AdminFormSection title="Gallery" hint="Extra photos for the hotel page.">
        <GalleryEditor v-model="hotelGallery" label="Hotel gallery" />
      </AdminFormSection>
      <AdminFormSection title="About">
        <q-input
          v-model="hotelForm.shortDescription"
          label="Short description"
          outlined
          dense
        />
        <q-input
          v-model="hotelForm.description"
          label="Full description"
          type="textarea"
          outlined
          autogrow
        />
        <q-input
          v-model="hotelAmenities"
          label="Amenities"
          outlined
          dense
          hint="Comma-separated"
        />
      </AdminFormSection>
      <AdminFormSection title="Contact & hours" :columns="2">
        <q-input
          v-model="hotelForm.address"
          label="Address"
          outlined
          dense
          class="admin-form-span-2"
        />
        <q-input v-model="hotelForm.phone" label="Phone" outlined dense />
        <q-input v-model="hotelForm.email" label="Email" outlined dense />
        <q-input
          v-model="hotelForm.checkInTime"
          type="time"
          label="Check-in"
          outlined
          dense
        />
        <q-input
          v-model="hotelForm.checkOutTime"
          type="time"
          label="Check-out"
          outlined
          dense
        />
      </AdminFormSection>
      <AdminFormSection title="Map pin">
        <MapPinPicker
          v-if="hotelDialog"
          v-model:lat="hotelForm.lat"
          v-model:lng="hotelForm.lng"
          v-model:embed-url="hotelForm.mapEmbedUrl"
        />
      </AdminFormSection>
      <template #actions>
        <q-btn flat no-caps label="Cancel" v-close-popup />
        <q-btn
          v-if="
            hotelEditing
              ? auth.canAction('hotels', 'update')
              : auth.canAction('hotels', 'create')
          "
          color="primary"
          unelevated
          no-caps
          :label="hotelEditing ? 'Save hotel' : 'Create hotel'"
          @click="saveHotel"
        />
      </template>
    </AdminDialog>

    <!-- Room dialog -->
    <AdminDialog
      v-model="roomDialog"
      size="xl"
      icon="bed"
      eyebrow="Room"
      :title="roomEditing ? 'Edit room' : 'Add room'"
      subtitle="Room type under the selected hotel."
    >
      <AdminFormSection title="Essentials" :columns="2">
        <q-input v-model="roomForm.name" label="Room name" outlined dense />
        <q-select
          v-model="roomForm.status"
          :options="cms.statusOptions"
          label="Status"
          outlined
          dense
        />
        <q-select
          v-model="roomForm.hotelId"
          :options="hotelOptions"
          label="Parent hotel"
          outlined
          dense
          emit-value
          map-options
          class="admin-form-span-2"
        />
      </AdminFormSection>
      <AdminFormSection title="Gallery" hint="Photos for this room type.">
        <GalleryEditor v-model="roomImages" label="Room gallery" />
      </AdminFormSection>
      <AdminFormSection title="Details">
        <q-input
          v-model="roomForm.description"
          label="Description"
          type="textarea"
          outlined
          autogrow
        />
        <q-input
          v-model="roomAmenities"
          label="Amenities"
          outlined
          dense
          hint="Comma-separated"
        />
      </AdminFormSection>
      <AdminFormSection title="Layout & capacity" :columns="3">
        <q-input v-model="roomForm.bedType" label="Bed type" outlined dense />
        <q-input v-model="roomForm.roomSize" label="Size" outlined dense />
        <q-input
          v-model.number="roomForm.baseInventory"
          type="number"
          label="Sell per night (default)"
          hint="How many of this room type you can sell each night, unless a day is changed under Prices & rooms."
          outlined
          dense
        />
        <q-input
          v-model.number="roomForm.maxAdults"
          type="number"
          label="Max adults"
          outlined
          dense
        />
        <q-input
          v-model.number="roomForm.maxChildren"
          type="number"
          label="Max children"
          outlined
          dense
        />
        <q-input
          v-model.number="roomForm.maxGuests"
          type="number"
          label="Max guests"
          outlined
          dense
        />
      </AdminFormSection>
      <template #actions>
        <q-btn flat no-caps label="Cancel" v-close-popup />
        <q-btn
          v-if="
            roomEditing
              ? auth.canAction('rooms', 'update')
              : auth.canAction('rooms', 'create')
          "
          color="primary"
          unelevated
          no-caps
          :label="roomEditing ? 'Save room' : 'Create room'"
          @click="saveRoom"
        />
      </template>
    </AdminDialog>
  </q-page>

  <q-page v-else padding>
    <AdminPageHeader eyebrow="Destination" title="Not found" subtitle="" />
    <q-btn flat no-caps color="primary" to="/admin/locations" label="Back" />
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
import type { ContentStatus, Hotel, RoomType } from "@/types/greyon";

const cms = useCmsStore();
const auth = useAuthStore();
const $q = useQuasar();
const route = useRoute();
const router = useRouter();

const hotelCap = 3;
const expandedHotelId = ref<string | null>(null);

const locationId = computed(() => String(route.params.id || ""));
const location = computed(() => cms.getLocationById(locationId.value));

const hotels = computed(() =>
  cms.hotels.filter(
    h => h.locationId === locationId.value && auth.canAccessHotel(h.id)
  )
);

const totalRooms = computed(() =>
  hotels.value.reduce((n, h) => n + roomsFor(h.id).length, 0)
);

const hotelOptions = computed(() =>
  hotels.value.map(h => ({ label: h.name, value: h.id }))
);

function roomsFor(hotelId: string) {
  return cms.roomTypes.filter(r => r.hotelId === hotelId);
}

function toggleHotel(id: string) {
  expandedHotelId.value = expandedHotelId.value === id ? null : id;
}

onMounted(() => {
  void Promise.all([
    auth.refreshEngineSession(),
    cms.ensureLocations(),
    cms.ensureHotels(),
    cms.ensureRoomTypes()
  ]).then(() => {
    if (!auth.canDestinationDetail()) {
      void router.replace("/admin/locations");
      return;
    }
    if (location.value && !auth.canAccessLocation(location.value.id)) {
      void router.replace("/admin/locations");
      return;
    }
    if (hotels.value[0]) expandedHotelId.value = hotels.value[0].id;
  });
});

watch(locationId, () => {
  if (!auth.canDestinationDetail()) {
    void router.replace("/admin/locations");
    return;
  }
  if (location.value && !auth.canAccessLocation(location.value.id)) {
    void router.replace("/admin/locations");
    return;
  }
  expandedHotelId.value = hotels.value[0]?.id ?? null;
});

watch(
  hotels,
  list => {
    if (!list.length) {
      expandedHotelId.value = null;
      return;
    }
    if (
      !expandedHotelId.value ||
      !list.some(h => h.id === expandedHotelId.value)
    ) {
      expandedHotelId.value = list[0]?.id ?? null;
    }
  },
  { deep: false }
);

/* —— Destination edit —— */
const locDialog = ref(false);
const highlightsText = ref("");
const locForm = reactive({
  name: "",
  slug: "",
  description: "",
  heroImage: "",
  status: "draft" as ContentStatus
});

function openEditLocation() {
  if (!location.value) return;
  const loc = location.value;
  locForm.name = loc.name;
  locForm.slug = loc.slug;
  locForm.description = loc.description;
  locForm.heroImage = loc.heroImage;
  locForm.status = loc.status;
  highlightsText.value = loc.highlights.join(", ");
  locDialog.value = true;
}

function saveLocation() {
  if (!location.value || !locForm.name) {
    $q.notify({ type: "negative", message: "Name is required." });
    return;
  }
  void (async () => {
    try {
      await cms.upsertLocation({
        id: location.value!.id,
        ...locForm,
        highlights: highlightsText.value
          .split(",")
          .map(s => s.trim())
          .filter(Boolean)
      });
      locDialog.value = false;
      $q.notify({ type: "positive", message: "Destination saved." });
    } catch (e) {
      $q.notify({
        type: "negative",
        message: e instanceof Error ? e.message : "Save failed."
      });
    }
  })();
}

/* —— Hotel —— */
const hotelDialog = ref(false);
const hotelEditing = ref<string | null>(null);
const hotelGallery = ref<string[]>([]);
const hotelAmenities = ref("");
const hotelForm = reactive({
  name: "",
  slug: "",
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

function blankHotel() {
  hotelForm.name = "";
  hotelForm.slug = "";
  hotelForm.shortDescription = "";
  hotelForm.description = "";
  hotelForm.address = "";
  hotelForm.lat = null;
  hotelForm.lng = null;
  hotelForm.mapEmbedUrl = null;
  hotelForm.phone = "";
  hotelForm.email = "";
  hotelForm.checkInTime = "14:00";
  hotelForm.checkOutTime = "12:00";
  hotelForm.heroImage = "";
  hotelForm.status = "draft";
  hotelForm.featured = false;
  hotelGallery.value = [];
  hotelAmenities.value = "";
}

function openCreateHotel() {
  hotelEditing.value = null;
  blankHotel();
  hotelDialog.value = true;
}

function openEditHotel(hotel: Hotel) {
  hotelEditing.value = hotel.id;
  hotelForm.name = hotel.name;
  hotelForm.slug = hotel.slug;
  hotelForm.shortDescription = hotel.shortDescription;
  hotelForm.description = hotel.description;
  hotelForm.address = hotel.address;
  hotelForm.lat =
    hotel.coordinates &&
    Number.isFinite(hotel.coordinates.lat) &&
    (hotel.coordinates.lat !== 0 || hotel.coordinates.lng !== 0)
      ? hotel.coordinates.lat
      : null;
  hotelForm.lng =
    hotel.coordinates &&
    Number.isFinite(hotel.coordinates.lng) &&
    (hotel.coordinates.lat !== 0 || hotel.coordinates.lng !== 0)
      ? hotel.coordinates.lng
      : null;
  hotelForm.mapEmbedUrl = hotel.mapEmbedUrl || null;
  hotelForm.phone = hotel.phone;
  hotelForm.email = hotel.email;
  hotelForm.checkInTime = hotel.checkInTime || "14:00";
  hotelForm.checkOutTime = hotel.checkOutTime || "12:00";
  hotelForm.heroImage = hotel.heroImage;
  hotelForm.status = hotel.status;
  hotelForm.featured = Boolean(hotel.featured);
  hotelGallery.value = [...hotel.gallery];
  hotelAmenities.value = hotel.amenities.join(", ");
  hotelDialog.value = true;
}

const hasHotelMapPin = computed(() => {
  const lat = Number(hotelForm.lat);
  const lng = Number(hotelForm.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0);
});

function saveHotel() {
  if (!hotelForm.name) {
    $q.notify({ type: "negative", message: "Hotel name is required." });
    return;
  }
  void (async () => {
    try {
      await cms.upsertHotel({
        ...(hotelEditing.value ? { id: hotelEditing.value } : {}),
        name: hotelForm.name,
        ...(hotelForm.slug ? { slug: hotelForm.slug } : {}),
        locationId: locationId.value,
        shortDescription: hotelForm.shortDescription,
        description: hotelForm.description,
        address: hotelForm.address,
        ...(hasHotelMapPin.value
          ? {
              coordinates: {
                lat: Number(hotelForm.lat),
                lng: Number(hotelForm.lng)
              }
            }
          : {}),
        mapEmbedUrl: hotelForm.mapEmbedUrl || null,
        phone: hotelForm.phone,
        email: hotelForm.email,
        checkInTime: hotelForm.checkInTime || "14:00",
        checkOutTime: hotelForm.checkOutTime || "12:00",
        ...(hotelForm.heroImage ? { heroImage: hotelForm.heroImage } : {}),
        gallery: hotelGallery.value.filter(Boolean),
        amenities: hotelAmenities.value
          .split(",")
          .map(s => s.trim())
          .filter(Boolean),
        status: hotelForm.status,
        featured: hotelForm.featured
      });
      hotelDialog.value = false;
      $q.notify({ type: "positive", message: "Hotel saved." });
    } catch (e) {
      $q.notify({
        type: "negative",
        message: e instanceof Error ? e.message : "Save failed."
      });
    }
  })();
}

function removeHotel(id: string) {
  $q.dialog({
    title: "Delete hotel?",
    message: "Room types under this hotel will also be removed.",
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

/* —— Room —— */
const roomDialog = ref(false);
const roomEditing = ref<string | null>(null);
const roomImages = ref<string[]>([]);
const roomAmenities = ref("");
const roomForm = reactive({
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

function openCreateRoom(hotelId: string) {
  expandedHotelId.value = hotelId;
  roomEditing.value = null;
  roomForm.hotelId = hotelId;
  roomForm.name = "";
  roomForm.description = "";
  roomForm.bedType = "1 King";
  roomForm.roomSize = "28 m²";
  roomForm.maxAdults = 2;
  roomForm.maxChildren = 1;
  roomForm.maxGuests = 3;
  roomForm.baseInventory = 5;
  roomForm.status = "draft";
  roomImages.value = [];
  roomAmenities.value = "";
  roomDialog.value = true;
}

function openEditRoom(room: RoomType) {
  roomEditing.value = room.id;
  roomForm.hotelId = room.hotelId;
  roomForm.name = room.name;
  roomForm.description = room.description;
  roomForm.bedType = room.bedType;
  roomForm.roomSize = room.roomSize;
  roomForm.maxAdults = room.maxAdults;
  roomForm.maxChildren = room.maxChildren;
  roomForm.maxGuests = room.maxGuests;
  roomForm.baseInventory = room.baseInventory;
  roomForm.status = room.status;
  roomImages.value = [...room.images];
  roomAmenities.value = room.amenities.join(", ");
  roomDialog.value = true;
}

function saveRoom() {
  if (!roomForm.name || !roomForm.hotelId) {
    $q.notify({ type: "negative", message: "Name and hotel are required." });
    return;
  }
  void (async () => {
    try {
      await cms.upsertRoom({
        ...(roomEditing.value ? { id: roomEditing.value } : {}),
        ...roomForm,
        images: roomImages.value.filter(Boolean),
        amenities: roomAmenities.value
          .split(",")
          .map(s => s.trim())
          .filter(Boolean)
      });
      roomDialog.value = false;
      $q.notify({ type: "positive", message: "Room saved." });
    } catch (e) {
      $q.notify({
        type: "negative",
        message: e instanceof Error ? e.message : "Save failed."
      });
    }
  })();
}

function removeRoom(id: string) {
  $q.dialog({
    title: "Delete room type?",
    cancel: true,
    persistent: true
  }).onOk(() => {
    void cms
      .deleteRoom(id)
      .then(() => $q.notify({ type: "positive", message: "Room deleted." }))
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
.dest-crumb {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin: 0 0 0.85rem;
  font-size: 0.82rem;
  color: var(--gy-muted);
}

.dest-crumb a {
  color: var(--gy-gold-deep);
  text-decoration: none;
  font-weight: 650;
}

.dest-overview {
  display: grid;
  grid-template-columns: minmax(180px, 280px) minmax(0, 1fr);
  gap: 0;
  margin-bottom: 1.15rem;
  background: #fff;
  border: 1px solid rgba(28, 36, 33, 0.08);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 28px rgba(28, 36, 33, 0.04);
}

.dest-overview__cover {
  min-height: 200px;
  background: #ebe6dc;
}

.dest-overview__cover img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dest-overview__cover-empty {
  height: 100%;
  min-height: 200px;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 0.35rem;
  color: var(--gy-muted);
  font-size: 0.82rem;
}

.dest-overview__panel {
  display: grid;
  align-content: start;
  gap: 0.7rem;
  padding: 1.15rem 1.25rem 1.2rem;
}

.dest-overview__topline {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.dest-overview__slug {
  font-size: 0.8rem;
  color: var(--gy-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.dest-overview__desc {
  margin: 0;
  color: var(--gy-ink);
  line-height: 1.5;
  font-size: 0.95rem;
}

.dest-overview__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.dest-overview__tags li {
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background: rgba(154, 123, 60, 0.12);
  color: var(--gy-gold-deep);
  font-size: 0.74rem;
  font-weight: 550;
}

.dest-overview__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.55rem;
  margin-top: 0.25rem;
}

.stat {
  padding: 0.65rem 0.7rem;
  border-radius: 12px;
  background: #f7f5f1;
  border: 1px solid rgba(28, 36, 33, 0.05);
}

.stat strong {
  display: block;
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.stat span {
  font-size: 0.72rem;
  color: var(--gy-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  background: rgba(28, 36, 33, 0.07);
  color: var(--gy-muted);
}

.status-pill[data-status="published"] {
  background: rgba(47, 107, 79, 0.14);
  color: #2f6b4f;
}

.status-pill[data-status="draft"] {
  background: rgba(154, 123, 60, 0.16);
  color: var(--gy-gold-deep);
}

.status-pill[data-status="archived"] {
  background: rgba(28, 36, 33, 0.08);
  color: #666;
}

.feat-pill {
  display: inline-flex;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  background: rgba(154, 123, 60, 0.14);
  color: var(--gy-gold-deep);
}

.prop-board {
  background: #fff;
  border: 1px solid rgba(28, 36, 33, 0.08);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 28px rgba(28, 36, 33, 0.04);
}

.prop-board__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.85rem;
  padding: 1rem 1.15rem;
  border-bottom: 1px solid rgba(28, 36, 33, 0.07);
  background: linear-gradient(180deg, #fbfaf7 0%, #fff 100%);
}

.prop-board__eyebrow {
  margin: 0 0 0.15rem;
  font-size: 0.66rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
}

.prop-board__title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.prop-board__title em {
  margin-left: 0.4rem;
  font-style: normal;
  font-size: 0.85rem;
  font-weight: 650;
  color: var(--gy-muted);
}

.prop-list {
  display: grid;
}

.prop-hotel {
  border-bottom: 1px solid rgba(28, 36, 33, 0.06);
}

.prop-hotel:last-child {
  border-bottom: 0;
}

.prop-hotel--open {
  background: #fcfbf9;
}

.prop-hotel__summary {
  width: 100%;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.85rem;
  align-items: center;
  padding: 0.95rem 1.15rem;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
  font: inherit;
  color: inherit;
}

.prop-hotel__summary:hover {
  background: rgba(154, 123, 60, 0.04);
}

.prop-hotel__thumb {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  overflow: hidden;
  background: #ebe6dc;
  display: grid;
  place-items: center;
  color: var(--gy-muted);
  flex-shrink: 0;
}

.prop-hotel__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.prop-hotel__copy h3 {
  margin: 0;
  font-size: 1.02rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.prop-hotel__copy p {
  margin: 0.25rem 0 0;
  font-size: 0.82rem;
  color: var(--gy-muted);
  line-height: 1.35;
}

.prop-hotel__title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}

.prop-hotel__chevron {
  color: var(--gy-muted);
}

.prop-hotel__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  align-items: center;
  padding: 0 1.15rem 0.85rem;
}

.prop-rooms {
  margin: 0 1.15rem 1rem;
  border: 1px solid rgba(28, 36, 33, 0.08);
  border-radius: 12px;
  background: #fff;
  overflow: hidden;
}

.prop-rooms__label {
  padding: 0.55rem 0.85rem;
  font-size: 0.68rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--gy-muted);
  background: #f7f5f1;
  border-bottom: 1px solid rgba(28, 36, 33, 0.06);
}

.prop-room {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.7rem 0.85rem;
  border-top: 1px solid rgba(28, 36, 33, 0.05);
}

.prop-room:first-of-type {
  border-top: 0;
}

.prop-room__thumb {
  width: 40px;
  height: 40px;
  border-radius: 9px;
  overflow: hidden;
  background: #ebe6dc;
  display: grid;
  place-items: center;
  color: var(--gy-muted);
}

.prop-room__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.prop-room__title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
}

.prop-room__copy p {
  margin: 0.15rem 0 0;
  font-size: 0.78rem;
  color: var(--gy-muted);
}

.prop-room__actions {
  display: flex;
  gap: 0.1rem;
}

.prop-rooms__empty {
  display: grid;
  justify-items: center;
  gap: 0.25rem;
  padding: 1.25rem 1rem;
  color: var(--gy-muted);
  text-align: center;
}

.prop-rooms__empty p {
  margin: 0;
  font-size: 0.88rem;
}

.prop-empty {
  display: grid;
  justify-items: center;
  gap: 0.4rem;
  padding: 2.5rem 1.5rem;
  text-align: center;
}

.prop-empty__icon {
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: rgba(154, 123, 60, 0.12);
  color: var(--gy-gold-deep);
  margin-bottom: 0.35rem;
}

.prop-empty h3 {
  margin: 0;
  font-size: 1.1rem;
}

.prop-empty p {
  margin: 0 0 0.55rem;
  max-width: 26rem;
  color: var(--gy-muted);
  font-size: 0.9rem;
  line-height: 1.45;
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
  .dest-overview {
    grid-template-columns: 1fr;
  }

  .dest-overview__cover {
    min-height: 160px;
    max-height: 200px;
  }

  .dest-overview__stats {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .prop-hotel__summary {
    grid-template-columns: auto 1fr;
  }

  .prop-hotel__chevron {
    display: none;
  }

  .prop-room {
    grid-template-columns: auto 1fr;
  }

  .prop-room__actions {
    grid-column: 1 / -1;
    justify-content: flex-end;
  }
}
</style>

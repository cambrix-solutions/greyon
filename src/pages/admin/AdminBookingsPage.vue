<template>
  <q-page padding>
    <AdminPageHeader
      eyebrow="Operations"
      title="Bookings"
      :subtitle="`${filtered.length} bookings shown`"
    >
      <template #actions>
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="add"
          label="Create booking"
          @click="openCreate"
        />
      </template>
      <template #toolbar>
        <q-select
          v-model="statusFilter"
          :options="statusFilterOptions"
          dense
          outlined
          emit-value
          map-options
          style="min-width: 160px; background: #fff"
          label="Status"
        />
        <q-input
          v-model="query"
          dense
          outlined
          clearable
          label="Search guest / ref"
          style="min-width: 220px; background: #fff"
        />
      </template>
    </AdminPageHeader>

    <div v-reveal="{ delay: '120ms' }" class="admin-scroll bookings-scroll">
      <table class="bookings-table">
        <thead>
          <tr>
            <th>Reference</th>
            <th>Guest</th>
            <th>Stay</th>
            <th>Status</th>
            <th class="text-right">Total</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in filtered" :key="b.id">
            <td>
              <button type="button" class="ref-link" @click="openDetail(b)">
                {{ b.reference }}
              </button>
            </td>
            <td>
              <div class="cell-primary">{{ b.guest.fullName }}</div>
            </td>
            <td>
              <div class="cell-primary">{{ hotelName(b.hotelId) }}</div>
              <div class="cell-secondary">{{ roomName(b.roomTypeId) }}</div>
              <div class="cell-secondary">{{ shortStayLabel(b) }}</div>
            </td>
            <td>
              <span class="status-pill" :data-status="b.status">
                {{ b.status }}
              </span>
            </td>
            <td class="text-right cell-total">${{ b.total.toFixed(2) }}</td>
            <td class="text-right">
              <div class="actions-row">
                <q-btn
                  outline
                  dense
                  no-caps
                  color="primary"
                  label="View"
                  @click="openDetail(b)"
                />
                <q-btn
                  v-if="b.status === 'pending'"
                  unelevated
                  dense
                  no-caps
                  color="primary"
                  label="Confirm"
                  @click="confirmBooking(b)"
                />
              </div>
            </td>
          </tr>
          <tr v-if="!filtered.length">
            <td colspan="6" class="empty-row">No bookings match.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <AdminDialog
      v-model="detailOpen"
      position="right"
      full-height
      maximized
      :persistent="false"
      size="md"
      icon="receipt_long"
      eyebrow="Booking"
      :title="detailBooking?.reference ?? 'Booking'"
      :subtitle="detailBooking ? `${detailBooking.status} · ${detailBooking.source}` : ''"
    >
      <template v-if="detailBooking">
        <section class="booking-detail__section">
          <h3>Stay</h3>
          <p>{{ stayLabel(detailBooking) }}</p>
          <p class="muted">
            {{ hotelName(detailBooking.hotelId) }} ·
            {{ roomName(detailBooking.roomTypeId) }}
          </p>
          <p class="muted">
            {{ detailBooking.rooms }} room(s) · {{ detailBooking.adults }} adults ·
            {{ detailBooking.children }} children
          </p>
        </section>

        <section class="booking-detail__section">
          <h3>Guest</h3>
          <p>{{ detailBooking.guest.fullName }}</p>
          <p class="muted">{{ detailBooking.guest.email }}</p>
          <p class="muted">{{ detailBooking.guest.phone }}</p>
          <p v-if="detailBooking.guest.specialRequests" class="muted">
            Requests: {{ detailBooking.guest.specialRequests }}
          </p>
        </section>

        <section class="booking-detail__section">
          <h3>Booking meta</h3>
          <p class="muted">Booked {{ formatDateTime(detailBooking.createdAt) }}</p>
        </section>

        <section class="booking-detail__section">
          <h3>Pricing</h3>
          <div class="booking-detail__price-row">
            <span>Subtotal</span>
            <strong>${{ detailBooking.subtotal.toFixed(2) }}</strong>
          </div>
          <div class="booking-detail__price-row">
            <span>Taxes / fees</span>
            <strong>${{ detailBooking.taxesFees.toFixed(2) }}</strong>
          </div>
          <div class="booking-detail__price-row booking-detail__price-row--total">
            <span>Total</span>
            <strong>${{ detailBooking.total.toFixed(2) }}</strong>
          </div>
        </section>

        <section class="booking-detail__section">
          <h3>Status</h3>
          <q-select
            dense
            outlined
            :model-value="detailBooking.status"
            :options="cms.bookingStatusOptions"
            @update:model-value="(v: string) => setStatus(detailBooking!.reference, v)"
          />
        </section>
      </template>
      <template #actions>
        <template v-if="detailBooking">
          <q-btn
            v-if="detailBooking.status === 'pending'"
            unelevated
            no-caps
            color="primary"
            label="Confirm booking"
            class="full-width"
            @click="confirmBooking(detailBooking)"
          />
          <q-btn
            flat
            no-caps
            color="negative"
            label="Delete booking"
            class="full-width"
            @click="remove(detailBooking.id)"
          />
        </template>
      </template>
    </AdminDialog>

    <AdminDialog
      v-model="createOpen"
      size="2xl"
      icon="book_online"
      eyebrow="Operations"
      title="Create booking"
      subtitle="Confirm stay details, check inventory, then save the reservation."
    >
      <section class="booking-section">
        <div class="booking-section__bar">
          <h3 class="booking-section__title">1 · Stay</h3>
          <span v-if="nightCount > 0" class="booking-section__meta">
            {{ nightCount }} night{{ nightCount === 1 ? "" : "s" }}
          </span>
        </div>

            <div class="booking-grid booking-grid--2">
              <q-select
                v-model="form.hotelId"
                :options="hotelOptions"
                label="Hotel"
                outlined
                dense
                emit-value
                map-options
                @update:model-value="onHotelChange"
              />
              <q-select
                v-model="form.roomTypeId"
                :options="roomOptions"
                label="Room type"
                outlined
                dense
                emit-value
                map-options
                :disable="!roomOptions.length"
                @update:model-value="onRoomChange"
              />
            </div>

            <q-select
              v-model="form.ratePlanId"
              :options="rateOptions"
              label="Rate plan"
              outlined
              dense
              emit-value
              map-options
              :disable="!rateOptions.length"
              :hint="
                rateOptions.length
                  ? undefined
                  : 'No published rate plan for this room — add one under Rates.'
              "
              @update:model-value="invalidatePreview"
            />

            <div class="booking-grid booking-grid--dates">
              <q-input
                v-model="form.checkIn"
                type="date"
                label="Check-in"
                outlined
                dense
                :min="todayYmd"
                :error="Boolean(dateError)"
                :error-message="dateError || undefined"
                @update:model-value="onCheckInChange"
              />
              <q-input
                v-model="form.checkOut"
                type="date"
                label="Check-out"
                outlined
                dense
                :min="minCheckOut"
                :error="Boolean(dateError)"
                hide-bottom-space
                @update:model-value="invalidatePreview"
              />
            </div>

            <p v-if="selectedHotelTimes" class="booking-hint">
              Arrive from {{ selectedHotelTimes.checkIn }} · depart by
              {{ selectedHotelTimes.checkOut }}
              <template v-if="selectedRoom">
                · room holds {{ selectedRoom.maxAdults }} adults /
                {{ selectedRoom.maxChildren }} children
                (max {{ selectedRoom.maxGuests }})
              </template>
            </p>

            <div class="booking-grid booking-grid--occ">
              <q-input
                v-model.number="form.rooms"
                type="number"
                :min="1"
                :max="20"
                label="Rooms"
                outlined
                dense
                :error="Boolean(occupancyError)"
                hide-bottom-space
                @update:model-value="onOccupancyChange"
              />
              <q-input
                v-model.number="form.adults"
                type="number"
                :min="1"
                :max="selectedRoom?.maxAdults ?? 20"
                label="Adults"
                outlined
                dense
                :error="Boolean(occupancyError)"
                hide-bottom-space
                @update:model-value="onOccupancyChange"
              />
              <q-input
                v-model.number="form.children"
                type="number"
                :min="0"
                :max="selectedRoom?.maxChildren ?? 20"
                label="Children"
                outlined
                dense
                :error="Boolean(occupancyError)"
                :error-message="occupancyError || undefined"
                @update:model-value="onOccupancyChange"
              />
            </div>
          </section>

          <section class="booking-section">
            <div class="booking-section__bar">
              <h3 class="booking-section__title">2 · Guest</h3>
            </div>
            <div class="booking-grid booking-grid--guest">
              <q-input
                v-model="form.fullName"
                label="Full name *"
                outlined
                dense
                class="booking-span-full"
                :error="submitted && !form.fullName.trim()"
                hide-bottom-space
              />
              <q-input
                v-model="form.email"
                type="email"
                label="Email *"
                outlined
                dense
                :error="submitted && !emailValid"
                :error-message="
                  submitted && !emailValid ? 'Enter a valid email.' : undefined
                "
              />
              <q-input
                v-model="form.phone"
                label="Phone *"
                outlined
                dense
                :error="submitted && !form.phone.trim()"
                hide-bottom-space
              />
            </div>
            <q-input
              v-model="form.specialRequests"
              label="Special requests"
              type="textarea"
              outlined
              :input-style="{ minHeight: '72px', maxHeight: '120px' }"
            />
            <q-select
              v-model="form.status"
              :options="statusCreateOptions"
              label="Booking status"
              outlined
              dense
              emit-value
              map-options
              style="max-width: 220px"
            />
          </section>

          <div v-if="preview" class="booking-quote booking-quote--ok">
            <div class="booking-quote__main">
              <p class="booking-quote__label">Ready to create</p>
              <p class="booking-quote__value">${{ preview.total.toFixed(2) }}</p>
              <p class="booking-quote__breakdown">
                {{ preview.nights }} night{{ preview.nights === 1 ? "" : "s" }} ·
                subtotal ${{ preview.subtotal.toFixed(2) }} · tax/fees
                ${{ preview.taxesFees.toFixed(2) }}
              </p>
            </div>
            <p class="booking-quote__meta">
              {{ preview.availableUnits }} unit{{
                preview.availableUnits === 1 ? "" : "s"
              }}
              free
            </p>
          </div>
          <div v-else-if="formError" class="booking-quote booking-quote--warn">
            <p class="booking-quote__label">Fix before checking</p>
            <p class="booking-quote__meta">{{ formError }}</p>
          </div>
          <div v-else-if="searched" class="booking-quote booking-quote--warn">
            <p class="booking-quote__label">No availability</p>
            <p class="booking-quote__meta">
              {{ availabilityHint }}
            </p>
          </div>

      <template #actions>
        <q-btn flat no-caps label="Cancel" v-close-popup />
        <q-space />
        <q-btn
          outline
          no-caps
          color="primary"
          icon="event_available"
          label="Check availability"
          :disable="Boolean(formError)"
          @click="checkAvailability"
        />
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="check"
          label="Create booking"
          :disable="!canCreate"
          @click="create"
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
import AdminPageHeader from "@/components/admin/AdminPageHeader.vue";
import { useAuthStore } from "@/stores/auth-store";
import { useCmsStore } from "@/stores/cms-store";
import type { AvailabilityResult, Booking, BookingStatus } from "@/types/greyon";
import {
  addLocalDays,
  formatDateTime,
  formatStayRange,
  hotelCheckInTime,
  hotelCheckOutTime,
  nightsBetweenLocal,
  toLocalYmd
} from "@/utils/datetime";

const cms = useCmsStore();
const auth = useAuthStore();
const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const query = ref("");
const statusFilter = ref("all");
const statusFilterOptions = [
  { label: "All statuses", value: "all" },
  ...cms.bookingStatusOptions.map(status => ({
    label: status.replaceAll("_", " "),
    value: status
  }))
];
const createOpen = ref(false);
const searched = ref(false);
const submitted = ref(false);
const preview = ref<AvailabilityResult | null>(null);
const todayYmd = toLocalYmd(new Date());
const detailOpen = ref(false);
const detailBooking = ref<Booking | null>(null);

const statusCreateOptions = [
  { label: "Confirmed", value: "confirmed" },
  { label: "Pending", value: "pending" }
];

function applyRouteQuery() {
  const status = String(route.query.status || "");
  if (status && cms.bookingStatusOptions.includes(status as BookingStatus)) {
    statusFilter.value = status;
  }
  const q = String(route.query.q || "").trim();
  if (q) query.value = q;
  if (route.query.create === "1") {
    openCreate();
    const nextQuery = { ...route.query };
    delete nextQuery.create;
    void router.replace({ query: nextQuery });
  }
}

onMounted(async () => {
  await Promise.all([
    cms.ensureBookings(),
    cms.ensureHotels(),
    cms.ensureRoomTypes(),
    cms.ensureRatePlans()
  ]);
  applyRouteQuery();
});
watch(() => route.query, applyRouteQuery);

function defaultCheckIn() {
  return addLocalDays(toLocalYmd(new Date()), 1);
}
function defaultCheckOut() {
  return addLocalDays(toLocalYmd(new Date()), 2);
}

const form = reactive({
  hotelId: "",
  roomTypeId: "",
  ratePlanId: "",
  checkIn: defaultCheckIn(),
  checkOut: defaultCheckOut(),
  rooms: 1,
  adults: 2,
  children: 0,
  fullName: "",
  email: "",
  phone: "",
  specialRequests: "",
  status: "confirmed" as BookingStatus
});

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  return cms.bookings.filter(b => {
    if (!auth.canAccessHotel(b.hotelId)) return false;
    if (statusFilter.value !== "all" && b.status !== statusFilter.value) return false;
    if (!q) return true;
    return (
      b.reference.toLowerCase().includes(q) ||
      b.guest.fullName.toLowerCase().includes(q) ||
      b.guest.email.toLowerCase().includes(q)
    );
  });
});

const hotelOptions = computed(() =>
  cms.hotels
    .filter(h => auth.canAccessHotel(h.id))
    .map(h => ({ label: h.name, value: h.id }))
);

const roomOptions = computed(() =>
  cms.roomTypes
    .filter(r => !form.hotelId || r.hotelId === form.hotelId)
    .map(r => ({ label: r.name, value: r.id }))
);

const rateOptions = computed(() =>
  cms.ratePlans
    .filter(
      p =>
        (!form.roomTypeId || p.roomTypeId === form.roomTypeId) &&
        p.status === "published"
    )
    .map(p => ({ label: `${p.name} ($${p.basePrice})`, value: p.id }))
);

const selectedRoom = computed(() => cms.getRoomTypeById(form.roomTypeId) ?? null);

const selectedHotelTimes = computed(() => {
  const hotel = cms.getHotelById(form.hotelId);
  if (!hotel) return null;
  return {
    checkIn: hotelCheckInTime(hotel.checkInTime),
    checkOut: hotelCheckOutTime(hotel.checkOutTime)
  };
});

const nightCount = computed(() =>
  nightsBetweenLocal(form.checkIn, form.checkOut)
);

const minCheckOut = computed(() => addLocalDays(form.checkIn || todayYmd, 1));

const dateError = computed(() => {
  if (!form.checkIn || !form.checkOut) return "Choose check-in and check-out.";
  if (form.checkIn < todayYmd) return "Check-in cannot be in the past.";
  if (form.checkOut <= form.checkIn) {
    return "Check-out must be after check-in.";
  }
  return "";
});

const occupancyError = computed(() => {
  const rooms = Number(form.rooms);
  const adults = Number(form.adults);
  const children = Number(form.children);
  if (!Number.isFinite(rooms) || rooms < 1) return "At least 1 room is required.";
  if (!Number.isFinite(adults) || adults < 1) return "At least 1 adult is required.";
  if (!Number.isFinite(children) || children < 0) return "Children cannot be negative.";
  const room = selectedRoom.value;
  if (!room) return "";
  if (adults > room.maxAdults) {
    return `This room allows up to ${room.maxAdults} adults.`;
  }
  if (children > room.maxChildren) {
    return `This room allows up to ${room.maxChildren} children.`;
  }
  if (adults + children > room.maxGuests) {
    return `This room allows up to ${room.maxGuests} guests total.`;
  }
  return "";
});

const emailValid = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
);

const formError = computed(() => {
  if (!form.hotelId) return "Select a hotel.";
  if (!form.roomTypeId) return "Select a room type.";
  if (!form.ratePlanId) return "Select a published rate plan.";
  if (dateError.value) return dateError.value;
  if (occupancyError.value) return occupancyError.value;
  return "";
});

const canCreate = computed(
  () =>
    Boolean(preview.value) &&
    !formError.value &&
    form.fullName.trim() &&
    emailValid.value &&
    form.phone.trim()
);

const availabilityHint = computed(() => {
  if (occupancyError.value) return occupancyError.value;
  if (!rateOptions.value.length) {
    return "Publish a rate plan for this room under Rates & availability.";
  }
  return "Try different dates, fewer rooms, or update inventory for this room.";
});

function hotelName(id: string) {
  return cms.getHotelById(id)?.name ?? id;
}
function roomName(id: string) {
  return cms.getRoomTypeById(id)?.name ?? id;
}

function stayLabel(b: Booking) {
  const hotel = cms.getHotelById(b.hotelId);
  return formatStayRange(b.checkIn, b.checkOut, {
    checkInTime: hotel?.checkInTime,
    checkOutTime: hotel?.checkOutTime
  });
}

function shortStayLabel(b: Booking) {
  const inDate = new Date(`${b.checkIn}T12:00:00`);
  const outDate = new Date(`${b.checkOut}T12:00:00`);
  const fmt = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short"
  });
  return `${fmt.format(inDate)} → ${fmt.format(outDate)}`;
}

function openCreate() {
  form.hotelId = cms.hotels[0]?.id ?? "";
  onHotelChange();
  form.checkIn = defaultCheckIn();
  form.checkOut = defaultCheckOut();
  form.rooms = 1;
  form.adults = 2;
  form.children = 0;
  form.fullName = "";
  form.email = "";
  form.phone = "";
  form.specialRequests = "";
  form.status = "confirmed";
  preview.value = null;
  searched.value = false;
  submitted.value = false;
  createOpen.value = true;
}

function onHotelChange() {
  const rooms = cms.roomTypes.filter(r => r.hotelId === form.hotelId);
  form.roomTypeId = rooms[0]?.id ?? "";
  onRoomChange();
}

function onRoomChange() {
  const plans = cms.ratePlans.filter(
    p => p.roomTypeId === form.roomTypeId && p.status === "published"
  );
  form.ratePlanId = plans[0]?.id ?? "";
  // Clamp occupancy to room limits when room changes
  const room = cms.getRoomTypeById(form.roomTypeId);
  if (room) {
    form.adults = Math.min(Math.max(1, form.adults), room.maxAdults);
    form.children = Math.min(Math.max(0, form.children), room.maxChildren);
  }
  invalidatePreview();
}

function onCheckInChange() {
  if (form.checkOut <= form.checkIn) {
    form.checkOut = addLocalDays(form.checkIn, 1);
  }
  invalidatePreview();
}

function onOccupancyChange() {
  form.rooms = Math.max(1, Number(form.rooms) || 1);
  form.adults = Math.max(1, Number(form.adults) || 1);
  form.children = Math.max(0, Number(form.children) || 0);
  invalidatePreview();
}

function invalidatePreview() {
  preview.value = null;
  searched.value = false;
}

async function checkAvailability() {
  if (formError.value) {
    searched.value = false;
    preview.value = null;
    $q.notify({ type: "warning", message: formError.value });
    return;
  }
  searched.value = true;
  const hotel = cms.getHotelById(form.hotelId);
  const results = await cms.searchAvailability({
    locationSlug: "",
    hotelSlug: hotel?.slug ?? "",
    checkIn: form.checkIn,
    checkOut: form.checkOut,
    rooms: form.rooms,
    adults: form.adults,
    children: form.children
  });
  preview.value =
    results.find(
      r =>
        r.hotel.id === form.hotelId &&
        r.roomType.id === form.roomTypeId &&
        r.ratePlan.id === form.ratePlanId
    ) ?? null;
}

async function create() {
  submitted.value = true;
  if (!form.fullName.trim() || !emailValid.value || !form.phone.trim()) {
    $q.notify({ type: "negative", message: "Guest contact details are required." });
    return;
  }
  if (formError.value) {
    $q.notify({ type: "negative", message: formError.value });
    return;
  }
  await checkAvailability();
  if (!preview.value) {
    $q.notify({ type: "negative", message: "No availability for this selection." });
    return;
  }
  const result = await cms.createBooking({
    hotelId: form.hotelId,
    roomTypeId: form.roomTypeId,
    ratePlanId: form.ratePlanId,
    checkIn: form.checkIn,
    checkOut: form.checkOut,
    rooms: form.rooms,
    adults: form.adults,
    children: form.children,
    guest: {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      ...(form.specialRequests.trim()
        ? { specialRequests: form.specialRequests.trim() }
        : {})
    },
    source: "admin",
    status: form.status
  });
  if (!result.ok) {
    $q.notify({ type: "negative", message: result.message });
    return;
  }
  createOpen.value = false;
  $q.notify({
    type: "positive",
    message: `Booking ${result.booking.reference} created.`
  });
}

function openDetail(b: Booking) {
  detailBooking.value = b;
  detailOpen.value = true;
}

async function setStatus(reference: string, status: string) {
  if (status === "confirmed") {
    const booking = cms.getBookingByReference(reference);
    if (booking) {
      confirmBooking(booking);
      return;
    }
  }

  await cms.updateBookingStatus(reference, status as BookingStatus);
  if (detailBooking.value?.reference === reference) {
    detailBooking.value = cms.getBookingByReference(reference) ?? detailBooking.value;
  }
  $q.notify({ type: "positive", message: `Booking ${reference} → ${status}` });
}

function confirmBooking(b: Booking) {
  if (b.status === "confirmed") return;

  $q.dialog({
    title: "Confirm booking?",
    message: `Confirm booking ${b.reference} for ${b.guest.fullName}?`,
    cancel: { flat: true, label: "Cancel", noCaps: true },
    ok: { unelevated: true, label: "OK, confirm", color: "primary", noCaps: true },
    persistent: true
  }).onOk(async () => {
    await cms.updateBookingStatus(b.reference, "confirmed");
    if (detailBooking.value?.reference === b.reference) {
      detailBooking.value =
        cms.getBookingByReference(b.reference) ?? detailBooking.value;
    }
    $q.notify({
      type: "positive",
      message: `Booking ${b.reference} confirmed.`
    });
  });
}

function remove(id: string) {
  $q.dialog({ title: "Delete booking?", cancel: true, persistent: true }).onOk(() => {
    cms.deleteBooking(id);
    if (detailBooking.value?.id === id) {
      detailOpen.value = false;
      detailBooking.value = null;
    }
    $q.notify({ type: "positive", message: "Booking deleted." });
  });
}
</script>

<style scoped>
/* Admin dialog polish for booking forms inside AdminDialog */
.booking-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 1.05rem 1.1rem;
  background: #fff;
  border: 1px solid rgba(28, 36, 33, 0.07);
  border-radius: 14px;
}

.booking-section__bar {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
}

.booking-section__title {
  margin: 0;
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--gy-muted);
}

.booking-section__meta {
  font-size: 0.78rem;
  color: var(--gy-forest);
  font-weight: 600;
}

.booking-grid {
  display: grid;
  gap: 0.65rem;
}

.booking-grid--2 {
  grid-template-columns: 1fr;
}

.booking-grid--dates {
  grid-template-columns: 1fr 1fr;
}

.booking-grid--occ {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.booking-grid--guest {
  grid-template-columns: 1fr;
}

.booking-hint {
  margin: -0.15rem 0 0;
  font-size: 0.78rem;
  color: var(--gy-muted);
}

.booking-quote {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem 1rem;
  border: 1px solid transparent;
}

.booking-quote--ok {
  background: rgba(154, 123, 60, 0.08);
  border-color: rgba(154, 123, 60, 0.18);
}

.booking-quote--warn {
  background: #fff6e8;
  border-color: rgba(176, 141, 87, 0.35);
}

.booking-quote__label {
  margin: 0;
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--gy-muted);
}

.booking-quote__value {
  margin: 0.2rem 0 0;
  font-size: 1.35rem;
  font-weight: 600;
  color: var(--gy-forest);
  line-height: 1.1;
}

.booking-quote__breakdown {
  margin: 0.35rem 0 0;
  font-size: 0.8rem;
  color: var(--gy-muted);
}

.booking-quote__meta {
  margin: 0.2rem 0 0;
  font-size: 0.82rem;
  color: var(--gy-muted);
}

.booking-dialog__actions {
  padding: 0.85rem 1rem 1rem;
  border-top: 1px solid rgba(28, 36, 33, 0.08);
  gap: 0.45rem;
  flex-wrap: wrap;
}

@media (min-width: 720px) {
  .booking-grid--2 {
    grid-template-columns: 1fr 1fr;
  }

  .booking-grid--guest {
    grid-template-columns: 1fr 1fr;
  }

  .booking-span-full {
    grid-column: 1 / -1;
  }
}

.ref-link {
  border: 0;
  background: none;
  padding: 0;
  color: var(--gy-forest);
  font: inherit;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
}

.ref-link:hover {
  color: var(--gy-gold-deep);
  text-decoration: underline;
}

.bookings-scroll {
  border-radius: 10px;
  overflow: hidden;
}

.bookings-scroll.admin-scroll {
  border: 1px solid rgba(28, 36, 33, 0.1);
}

.bookings-table {
  width: 100%;
  min-width: 0 !important;
  border-collapse: collapse;
  background: #fff;
}

.bookings-table th,
.bookings-table td {
  padding: 0.85rem 1rem;
  text-align: left;
  vertical-align: middle;
  border-bottom: 1px solid rgba(28, 36, 33, 0.08);
}

.bookings-table th {
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--gy-muted);
  font-weight: 600;
  background: #f7f4ef;
}

.bookings-table tbody tr:hover {
  background: rgba(154, 123, 60, 0.03);
}

.bookings-table tbody tr:last-child td {
  border-bottom: 0;
}

.bookings-table .text-right {
  text-align: right;
}

.cell-primary {
  font-weight: 500;
  color: var(--gy-ink, #1c2421);
  line-height: 1.35;
}

.cell-secondary {
  margin-top: 0.15rem;
  font-size: 0.8rem;
  color: var(--gy-muted);
  line-height: 1.35;
}

.cell-total {
  font-weight: 600;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.22rem 0.65rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: capitalize;
  background: #eeeae3;
  color: #5a635e;
}

.status-pill[data-status="pending"] {
  background: #fff1d6;
  color: #8a6418;
}

.status-pill[data-status="confirmed"] {
  background: #e3f0ea;
  color: var(--gy-gold-deep);
}

.status-pill[data-status="cancelled"],
.status-pill[data-status="no_show"] {
  background: #f8e6e4;
  color: #8a3a32;
}

.status-pill[data-status="checked_in"],
.status-pill[data-status="checked_out"] {
  background: #e8eef8;
  color: #35507a;
}

.actions-row {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.empty-row {
  text-align: center;
  color: var(--gy-muted);
  padding: 1.5rem 1rem !important;
}

.booking-detail__source {
  margin-left: 0.35rem;
  color: var(--gy-muted);
  text-transform: capitalize;
}

.booking-detail__section h3 {
  margin: 0 0 0.4rem;
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--gy-muted);
}

.booking-detail__section p {
  margin: 0.15rem 0;
}

.booking-detail__section .muted {
  color: var(--gy-muted);
  font-size: 0.88rem;
}

.booking-detail__price-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.25rem 0;
  font-size: 0.9rem;
}

.booking-detail__price-row--total {
  margin-top: 0.35rem;
  padding-top: 0.55rem;
  border-top: 1px solid rgba(28, 36, 33, 0.1);
  font-size: 1.05rem;
}

.booking-detail__actions {
  margin-top: auto;
  display: grid;
  gap: 0.4rem;
  padding-top: 0.5rem;
}
</style>

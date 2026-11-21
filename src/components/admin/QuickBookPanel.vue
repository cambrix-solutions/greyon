<template>
  <section class="qb" aria-label="Quick book">
    <header class="qb__head">
      <div>
        <h2 class="qb__title">Quick book</h2>
        <p class="qb__sub">{{ subtitle }}</p>
      </div>
      <span class="qb__badge">New</span>
    </header>

    <ol class="qb__steps" aria-label="Booking steps">
      <li
        v-for="step in steps"
        :key="step.id"
        class="qb__step"
        :class="{
          'is-done': step.completed,
          'is-on': step.current,
          'is-skip': step.skipped,
          'is-disabled': step.disabled
        }"
      >
        <button
          v-if="step.clickable"
          type="button"
          class="qb__step-btn"
          :aria-label="`Go back to ${step.label}`"
          @click="backTo(step.id)"
        >
          <span class="qb__step-mark" aria-hidden="true">
            <q-icon name="check" size="14px" />
          </span>
          <span class="qb__step-copy">
            <span class="qb__step-name">{{ step.label }}</span>
            <span v-if="step.detail" class="qb__step-detail">{{
              step.detail
            }}</span>
          </span>
        </button>
        <span
          v-else
          class="qb__step-btn"
          :aria-current="step.current ? 'step' : undefined"
          :aria-disabled="step.disabled ? 'true' : undefined"
        >
          <span class="qb__step-mark" aria-hidden="true">
            <q-icon
              v-if="step.completed || phase === 'done'"
              name="check"
              size="14px"
            />
            <template v-else>{{ step.number }}</template>
          </span>
          <span class="qb__step-copy">
            <span class="qb__step-name">{{ step.label }}</span>
            <span v-if="step.detail" class="qb__step-detail">{{
              step.detail
            }}</span>
          </span>
        </span>
      </li>
    </ol>

    <div v-if="phase === 'done' && confirmed" class="qb__done">
      <p class="qb__done-kicker">Reservation confirmed</p>
      <p
        class="qb__code"
        :aria-label="`Reservation code ${confirmed.reference}`"
      >
        {{ confirmed.reference }}
      </p>
      <div class="qb__done-actions">
        <button type="button" class="qb__btn qb__btn--ghost" @click="copyCode">
          {{ copied ? "Copied" : "Copy code" }}
        </button>
        <router-link
          class="qb__btn qb__btn--primary"
          :to="`/admin/bookings?q=${encodeURIComponent(confirmed.reference)}`"
        >
          Open reservation
        </router-link>
        <button
          type="button"
          class="qb__btn qb__btn--ghost"
          @click="startAgain"
        >
          Book another
        </button>
      </div>
      <p class="qb__hint">
        {{ paymentLabel(confirmed.paymentMethod) }} recorded as paid. Status is
        confirmed.
      </p>
    </div>

    <div v-else-if="stepId === 'destination'" class="qb__grid">
      <p v-if="!destinationCards.length" class="qb__empty">
        No hotels are available for booking yet.
        <router-link
          v-if="auth.can('hotels')"
          class="qb__text-link qb__empty-link"
          to="/admin/hotels"
        >
          Open hotels
        </router-link>
      </p>
      <button
        v-for="card in destinationCards"
        :key="card.id"
        type="button"
        class="qb-card"
        :class="{ 'is-soon': !card.bookable }"
        :disabled="!card.bookable"
        @click="pickDestination(card.id)"
      >
        <span
          class="qb-card__photo"
          :style="
            card.photo ? { backgroundImage: `url(${card.photo})` } : undefined
          "
        />
        <span class="qb-card__body">
          <span class="qb-card__name">{{ card.name }}</span>
          <span class="qb-card__meta">
            {{
              card.bookable
                ? `${card.count} ${card.unit}${card.count === 1 ? "" : "s"}`
                : "Coming soon"
            }}
          </span>
        </span>
      </button>
    </div>

    <div v-else-if="stepId === 'hotel'" class="qb__stack">
      <p v-if="!hotelCards.length" class="qb__empty">
        No published hotels to book at this destination.
      </p>
      <button
        v-for="card in hotelCards"
        :key="card.id"
        type="button"
        class="qb-card qb-card--wide"
        @click="pickHotel(card.id)"
      >
        <span
          class="qb-card__photo"
          :style="
            card.photo ? { backgroundImage: `url(${card.photo})` } : undefined
          "
        />
        <span class="qb-card__body">
          <span class="qb-card__name">{{ card.name }}</span>
          <span class="qb-card__meta">{{ card.meta }}</span>
        </span>
      </button>
      <button
        v-if="!destinationLocked"
        type="button"
        class="qb__text-link"
        @click="backTo('destination')"
      >
        Change destination
      </button>
    </div>

    <div v-else class="qb__stay">
      <div class="qb__main">
        <div class="qb__dates">
          <label class="qb__field">
            <span>Check-in</span>
            <input v-model="checkIn" type="date" :min="todayIso" />
          </label>
          <label class="qb__field">
            <span>Check-out</span>
            <input v-model="checkOut" type="date" :min="minCheckOut" />
          </label>
          <label class="qb__field qb__field--guests">
            <span>Guests</span>
            <span class="qb__stepper">
              <button
                type="button"
                :disabled="guests <= 1"
                aria-label="Fewer guests"
                @click="guests--"
              >
                −
              </button>
              <span>{{ guests }} {{ guests === 1 ? "adult" : "adults" }}</span>
              <button
                type="button"
                :disabled="guests >= 8"
                aria-label="More guests"
                @click="guests++"
              >
                +
              </button>
            </span>
          </label>
        </div>

        <p v-if="dateError" class="qb__error">{{ dateError }}</p>
        <p v-else-if="loadingRooms" class="qb__muted">Checking rooms…</p>
        <p v-else-if="roomsError" class="qb__error">{{ roomsError }}</p>
        <p v-else-if="!roomOffers.length" class="qb__empty">
          No room types are listed for these dates.
        </p>

        <div v-else class="qb__rooms">
          <button
            v-for="room in roomOffers"
            :key="room.roomTypeId"
            type="button"
            class="qb-room"
            :class="{
              'is-on': selectedId === room.roomTypeId,
              'is-out': room.soldOut
            }"
            :disabled="room.soldOut || stepId === 'pay'"
            @click="selectedId = room.roomTypeId"
          >
            <span
              class="qb-room__photo"
              :style="
                room.image
                  ? { backgroundImage: `url(${room.image})` }
                  : undefined
              "
            />
            <span class="qb-room__body">
              <span class="qb-room__name">{{ room.name }}</span>
              <span v-if="roomMeta(room)" class="qb-room__facts">{{
                roomMeta(room)
              }}</span>
              <span class="qb-room__price"
                >{{ money(room.nightly) }} <small>/night</small></span
              >
            </span>
            <span class="qb-room__left" :class="{ 'is-out': room.soldOut }">
              {{ room.soldOut ? "Sold out" : `${room.availableUnits} left` }}
            </span>
          </button>
        </div>
      </div>

      <aside class="qb__side">
        <p class="qb__side-label">Booking summary</p>
        <p v-if="hotel" class="qb__side-title">{{ hotel.name }}</p>
        <p class="qb__side-line">
          {{ locationName }}
          <template v-if="selected"> · {{ selected.name }}</template>
        </p>
        <p class="qb__side-line">{{ stayLabel }}</p>
        <template v-if="selected">
          <dl class="qb__totals">
            <div>
              <dt
                >{{ selected.nights }} night{{
                  selected.nights === 1 ? "" : "s"
                }}</dt
              >
              <dd>{{ money(selected.subtotal) }}</dd>
            </div>
            <div>
              <dt>Tax &amp; service</dt>
              <dd>{{ money(selected.taxesFees) }}</dd>
            </div>
            <div class="is-total">
              <dt>Total</dt>
              <dd>{{ money(selected.total) }}</dd>
            </div>
          </dl>
        </template>
        <p v-else class="qb__muted">Pick a room to see the total.</p>

        <div class="qb__guest">
          <p class="qb__side-label">Guest</p>
          <label class="qb__field">
            <span>Full name</span>
            <input
              v-model="guestName"
              type="text"
              maxlength="255"
              autocomplete="name"
              :disabled="stepId === 'pay'"
            />
          </label>
          <label class="qb__field">
            <span>Phone</span>
            <input
              v-model="guestPhone"
              type="tel"
              maxlength="255"
              autocomplete="tel"
              :disabled="stepId === 'pay'"
            />
          </label>
          <label class="qb__field">
            <span>Email <em>(optional)</em></span>
            <input
              v-model="guestEmail"
              type="email"
              maxlength="255"
              autocomplete="email"
              :disabled="stepId === 'pay'"
            />
          </label>
        </div>

        <template v-if="stepId === 'room'">
          <p v-if="guestError" class="qb__error">{{ guestError }}</p>
          <button
            type="button"
            class="qb__btn qb__btn--primary qb__btn--block"
            :disabled="!selected"
            @click="goPay"
          >
            Continue to pay
          </button>
        </template>

        <template v-else>
          <p class="qb__side-label">Payment</p>
          <div class="qb__pay" role="radiogroup" aria-label="Payment method">
            <button
              v-for="method in methods"
              :key="method.id"
              type="button"
              class="qb__pay-btn"
              :class="{ 'is-on': paymentMethod === method.id }"
              :aria-pressed="paymentMethod === method.id"
              @click="paymentMethod = method.id"
            >
              {{ method.label }}
            </button>
          </div>
          <p v-if="payError" class="qb__error">{{ payError }}</p>
          <button
            type="button"
            class="qb__btn qb__btn--primary qb__btn--block"
            :disabled="confirming || !selected || !paymentMethod"
            @click="confirm"
          >
            {{
              confirming
                ? "Confirming…"
                : `Pay ${selected ? money(selected.total) : ""} & confirm`
            }}
          </button>
          <p class="qb__hint"
            >Payment is recorded only — no charge is taken online.</p
          >
          <button type="button" class="qb__text-link" @click="stepId = 'room'"
            >Back to rooms</button
          >
        </template>
      </aside>
    </div>

    <p v-if="stepId !== 'destination' && phase !== 'done'" class="qb__foot">
      <button
        v-if="stepId !== 'destination' && !destinationLocked"
        type="button"
        class="qb__text-link"
        @click="backTo('destination')"
      >
        Change destination
      </button>
      <button
        v-if="stepId === 'room' || stepId === 'pay'"
        type="button"
        class="qb__text-link"
        @click="backTo('hotel')"
      >
        Change hotel
      </button>
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import {
  createQuickReservation,
  fetchQuickBookInventory
} from "@/services/engine/adminQuickBooking";
import { useAuthStore } from "@/stores/auth-store";
import { useCmsStore } from "@/stores/cms-store";
import type { Booking, PaymentMethod, QuickBookRoom } from "@/types/greyon";
import { friendlyApiError } from "@/utils/apiErrors";

const emit = defineEmits<{
  created: [booking: Booking];
}>();

const auth = useAuthStore();
const cms = useCmsStore();

type StepId = "destination" | "hotel" | "room" | "pay";

const methods: { id: PaymentMethod; label: string }[] = [
  { id: "cash", label: "Cash" },
  { id: "aba_qr", label: "ABA QR" },
  { id: "card", label: "Card" }
];

const stepId = ref<StepId>("destination");
const phase = ref<"flow" | "done">("flow");
const locationId = ref("");
const hotelId = ref("");
const checkIn = ref("");
const checkOut = ref("");
const guests = ref(2);
const selectedId = ref("");
const guestName = ref("");
const guestPhone = ref("");
const guestEmail = ref("");
const paymentMethod = ref<PaymentMethod>("cash");
const loadingRooms = ref(false);
const roomsError = ref("");
const dateError = ref("");
const guestError = ref("");
const payError = ref("");
const confirming = ref(false);
const copied = ref(false);
const confirmed = ref<Booking | null>(null);
const roomOffers = ref<QuickBookRoom[]>([]);

const todayIso = isoDate(new Date());

const accessibleHotels = computed(() => auth.scopedHotels);

const destinationCards = computed(() => {
  const groups = new Map<string, (typeof accessibleHotels.value)[number][]>();
  for (const hotel of accessibleHotels.value) {
    const list = groups.get(hotel.locationId) ?? [];
    list.push(hotel);
    groups.set(hotel.locationId, list);
  }
  return [...groups.entries()].map(([id, hotels]) => {
    const published = hotels.filter(item => item.status === "published");
    const roomsKnown = published.some(item =>
      cms.roomTypes.some(room => room.hotelId === item.id)
    );
    const roomCount = published.reduce(
      (sum, item) => sum + bookableCountForHotel(item.id),
      0
    );
    const count = roomsKnown ? roomCount : published.length;
    return {
      id,
      name: locationLabel(id, hotels),
      photo: locationPhoto(id, hotels),
      count,
      unit: roomsKnown ? "room type" : "hotel",
      bookable: published.length > 0 && (!roomsKnown || roomCount > 0)
    };
  });
});

const destinationLocked = computed(
  () => !auth.isGlobalScope && destinationCards.value.length === 1
);

const hotelCards = computed(() =>
  accessibleHotels.value
    .filter(
      hotel =>
        hotel.locationId === locationId.value && hotel.status === "published"
    )
    .map(hotel => ({
      id: hotel.id,
      name: hotel.name,
      photo: hotel.heroImage || "",
      meta: hotelCardMeta(hotel.id, hotel)
    }))
);

const hotel = computed(
  () => cms.hotels.find(item => item.id === hotelId.value) ?? null
);
const locationName = computed(() => {
  if (!locationId.value) return "";
  return (
    destinationCards.value.find(card => card.id === locationId.value)?.name ??
    ""
  );
});
const selected = computed(
  () =>
    roomOffers.value.find(room => room.roomTypeId === selectedId.value) ?? null
);

const minCheckOut = computed(() => {
  if (!checkIn.value) return todayIso;
  return isoDate(addDays(parseIso(checkIn.value), 1));
});

const stayLabel = computed(() => {
  if (!checkIn.value || !checkOut.value) return "Choose dates";
  const nights = nightCount(checkIn.value, checkOut.value);
  return `${formatShort(checkIn.value)} → ${formatShort(checkOut.value)} · ${nights} night${nights === 1 ? "" : "s"} · ${guests.value} ${guests.value === 1 ? "adult" : "adults"}`;
});

const subtitle = computed(() => {
  if (phase.value === "done") return "Paid and confirmed.";
  if (destinationLocked.value) {
    return `Phone or walk-in stays for ${locationName.value || "your location"}.`;
  }
  return "Four steps from destination to a paid reservation.";
});

const stepIndex = computed(() => {
  if (phase.value === "done") return 3;
  return ["destination", "hotel", "room", "pay"].indexOf(stepId.value);
});

const steps = computed(() => {
  const destDetail = locationName.value
    ? destinationLocked.value
      ? `${locationName.value} (your location)`
      : locationName.value
    : "";
  const order: StepId[] = ["destination", "hotel", "room", "pay"];
  const currentIndex = phase.value === "done" ? order.length : stepIndex.value;
  const items: {
    id: StepId;
    label: string;
    detail: string;
    skipped: boolean;
    number: number;
    current: boolean;
    completed: boolean;
    clickable: boolean;
    disabled: boolean;
  }[] = [
    {
      id: "destination",
      label: "Destination",
      detail: destDetail,
      skipped: destinationLocked.value,
      number: 1,
      current: false,
      completed: false,
      clickable: false,
      disabled: false
    },
    {
      id: "hotel",
      label: "Hotel",
      detail: hotel.value?.name ?? "",
      skipped: false,
      number: 2,
      current: false,
      completed: false,
      clickable: false,
      disabled: false
    },
    {
      id: "room",
      label: "Room",
      detail: selected.value?.name ?? "",
      skipped: false,
      number: 3,
      current: false,
      completed: false,
      clickable: false,
      disabled: false
    },
    {
      id: "pay",
      label: "Pay",
      detail:
        phase.value === "done"
          ? paymentLabel(confirmed.value?.paymentMethod)
          : "",
      skipped: false,
      number: 4,
      current: false,
      completed: false,
      clickable: false,
      disabled: false
    }
  ];
  return items.map((step, i) => {
    const completed = !step.skipped && currentIndex > i;
    const current =
      !step.skipped && phase.value !== "done" && stepIndex.value === i;
    const clickable = completed;
    const disabled = !step.skipped && !completed && !current;
    return { ...step, completed, current, clickable, disabled };
  });
});

onMounted(() => {
  resetDates();
  if (destinationLocked.value && destinationCards.value[0]) {
    locationId.value = destinationCards.value[0].id;
    stepId.value = "hotel";
  }
});

watch([checkIn, checkOut, guests, hotelId], () => {
  if (
    hotelId.value &&
    stepId.value !== "destination" &&
    stepId.value !== "hotel"
  ) {
    void loadRooms();
  }
});

function locationLabel(
  locId: string,
  hotels: (typeof accessibleHotels.value)[number][]
) {
  const catalog = cms.locations.find(item => item.id === locId);
  if (catalog?.name) return catalog.name;
  const named = hotels.find(item => item.locationName);
  return named?.locationName || "Unnamed destination";
}

function locationPhoto(
  locId: string,
  hotels: (typeof accessibleHotels.value)[number][]
) {
  const catalog = cms.locations.find(item => item.id === locId);
  if (catalog?.heroImage) return catalog.heroImage;
  const published = hotels.find(
    item => item.status === "published" && item.heroImage
  );
  return (
    published?.heroImage || hotels.find(item => item.heroImage)?.heroImage || ""
  );
}

function hotelCardMeta(
  id: string,
  hotel: (typeof accessibleHotels.value)[number]
) {
  const known = cms.roomTypes.some(room => room.hotelId === id);
  if (!known) return hotel.propertyType || hotel.area || "Published";
  const count = bookableCountForHotel(id);
  return `${count} room type${count === 1 ? "" : "s"}`;
}

function bookableCountForHotel(id: string) {
  const rooms = cms.roomTypes.filter(
    room => room.hotelId === id && room.status === "published"
  );
  return rooms.filter(room =>
    cms.ratePlans.some(
      plan => plan.roomTypeId === room.id && plan.status === "published"
    )
  ).length;
}

function pickDestination(id: string) {
  locationId.value = id;
  hotelId.value = "";
  selectedId.value = "";
  roomOffers.value = [];
  stepId.value = "hotel";
}

function pickHotel(id: string) {
  hotelId.value = id;
  selectedId.value = "";
  stepId.value = "room";
  void loadRooms();
}

function backTo(id: StepId) {
  phase.value = "flow";
  confirmed.value = null;
  if (id === "destination") {
    if (destinationLocked.value) return;
    hotelId.value = "";
    selectedId.value = "";
    roomOffers.value = [];
  }
  if (id === "hotel") {
    selectedId.value = "";
  }
  stepId.value = id;
}

function goPay() {
  guestError.value = "";
  if (!selected.value) return;
  if (!guestName.value.trim() || !guestPhone.value.trim()) {
    guestError.value = "Guest name and phone are required.";
    return;
  }
  stepId.value = "pay";
}

async function loadRooms() {
  dateError.value = "";
  roomsError.value = "";
  if (!hotelId.value) return;
  if (!checkIn.value || !checkOut.value || checkOut.value <= checkIn.value) {
    dateError.value = "Check-out must be after check-in.";
    roomOffers.value = [];
    return;
  }
  loadingRooms.value = true;
  const stay = {
    hotelId: hotelId.value,
    checkIn: checkIn.value,
    checkOut: checkOut.value,
    guests: guests.value
  };
  try {
    const inventory = await fetchQuickBookInventory(stay);
    if (
      stay.hotelId !== hotelId.value ||
      stay.checkIn !== checkIn.value ||
      stay.checkOut !== checkOut.value ||
      stay.guests !== guests.value
    ) {
      return;
    }
    roomOffers.value = inventory.roomTypes;
    if (
      selectedId.value &&
      !inventory.roomTypes.some(
        room => room.roomTypeId === selectedId.value && !room.soldOut
      )
    ) {
      selectedId.value = "";
    }
  } catch (error) {
    roomsError.value = friendlyApiError(
      error,
      "Couldn’t load rooms for these dates."
    );
    roomOffers.value = [];
  } finally {
    loadingRooms.value = false;
  }
}

async function confirm() {
  if (!selected.value || !paymentMethod.value) return;
  payError.value = "";
  confirming.value = true;
  try {
    const booking = await createQuickReservation({
      roomTypeId: selected.value.roomTypeId,
      checkIn: checkIn.value,
      checkOut: checkOut.value,
      guests: guests.value,
      guestFullName: guestName.value.trim(),
      guestPhone: guestPhone.value.trim(),
      guestEmail: guestEmail.value.trim() || undefined,
      paymentMethod: paymentMethod.value
    });
    confirmed.value = booking;
    phase.value = "done";
    emit("created", booking);
  } catch (error) {
    payError.value = friendlyApiError(
      error,
      "Couldn’t confirm this reservation. Check availability and try again."
    );
  } finally {
    confirming.value = false;
  }
}

async function copyCode() {
  const code = confirmed.value?.reference;
  if (!code) return;
  try {
    await navigator.clipboard.writeText(code);
    copied.value = true;
    window.setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch {
    copied.value = false;
  }
}

function startAgain() {
  confirmed.value = null;
  phase.value = "flow";
  selectedId.value = "";
  guestName.value = "";
  guestPhone.value = "";
  guestEmail.value = "";
  paymentMethod.value = "cash";
  payError.value = "";
  guestError.value = "";
  resetDates();
  if (destinationLocked.value) {
    stepId.value = "hotel";
    if (hotelId.value) void loadRooms();
  } else {
    locationId.value = "";
    hotelId.value = "";
    roomOffers.value = [];
    stepId.value = "destination";
  }
}

function resetDates() {
  const start = new Date();
  checkIn.value = isoDate(start);
  checkOut.value = isoDate(addDays(start, 1));
}

function roomMeta(room: QuickBookRoom) {
  return [room.bedType, room.roomSize].filter(Boolean).join(" · ");
}

function paymentLabel(method?: string | null) {
  return methods.find(item => item.id === method)?.label ?? "Payment";
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value);
}

function formatShort(iso: string) {
  const date = parseIso(iso);
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short"
  });
}

function nightCount(start: string, end: string) {
  return Math.max(
    0,
    Math.round((parseIso(end).getTime() - parseIso(start).getTime()) / 86400000)
  );
}

function isoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseIso(value: string) {
  const parts = value.split("-").map(part => Number(part));
  const year = parts[0] ?? 0;
  const month = parts[1] ?? 1;
  const day = parts[2] ?? 1;
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
</script>

<style scoped>
.qb {
  margin: 0 0 1.15rem;
  padding: 1rem 1rem 1.1rem;
  background: #fff;
  border: 1px solid rgba(28, 36, 33, 0.08);
  border-radius: 0;
}

.qb__head {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: start;
  margin-bottom: 0.85rem;
}

.qb__title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.qb__sub {
  margin: 0.2rem 0 0;
  color: var(--gy-muted);
  font-size: 0.86rem;
}

.qb__badge {
  flex: none;
  padding: 0.15rem 0.45rem;
  border-radius: 0;
  background: var(--gy-gold);
  color: #1c2421;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.qb__steps {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin: 0 0 1rem;
  padding: 0;
  list-style: none;
}

.qb__step {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 2.1rem;
  padding: 0.2rem 0.65rem 0.2rem 0.3rem;
  border: 1px solid rgba(28, 36, 33, 0.1);
  background: #f6f4ef;
  color: var(--gy-muted);
}

.qb__step-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  width: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
}

.qb__step.is-on,
.qb__step.is-done {
  border-color: var(--gy-forest);
  background: var(--gy-forest);
  color: #fff;
}

.qb__step.is-done .qb__step-btn {
  cursor: pointer;
}

.qb__step.is-disabled {
  color: #9a9389;
  background: #eeebe4;
  border-color: rgba(28, 36, 33, 0.08);
  cursor: not-allowed;
  opacity: 0.72;
}

.qb__step.is-disabled .qb__step-btn,
.qb__step.is-disabled .qb__step-btn[aria-disabled="true"] {
  cursor: not-allowed;
}

.qb__step-mark {
  display: grid;
  place-items: center;
  width: 1.35rem;
  height: 1.35rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  font-size: 0.72rem;
  font-weight: 700;
}

.qb__step:not(.is-on):not(.is-done) .qb__step-mark {
  background: rgba(28, 36, 33, 0.08);
}

.qb__step-copy {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}

.qb__step-name {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.qb__step-detail {
  max-width: 11rem;
  overflow: hidden;
  font-size: 0.68rem;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.9;
}

.qb__grid,
.qb__stack {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(12.5rem, 1fr));
  gap: 0.7rem;
}

.qb__stack {
  grid-template-columns: 1fr;
}

.qb-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
  border: 1px solid rgba(28, 36, 33, 0.1);
  border-radius: 0;
  background: #f6f4ef;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.qb-card:hover:not(:disabled),
.qb-card:focus-visible {
  border-color: var(--gy-forest);
  outline: none;
}

.qb-card:disabled,
.qb-card.is-soon {
  cursor: not-allowed;
  opacity: 0.7;
}

.qb-card--wide {
  flex-direction: row;
  min-height: 5.5rem;
}

.qb-card__photo {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #c5c0b2 center / cover no-repeat;
}

.qb-card--wide .qb-card__photo {
  width: 8.5rem;
  min-height: 100%;
  aspect-ratio: auto;
}

.qb-card__body {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.7rem 0.8rem;
}

.qb-card__name,
.qb-room__name,
.qb__side-title {
  font-weight: 700;
}

.qb-card__meta,
.qb-room__facts,
.qb__side-line,
.qb__muted,
.qb__hint,
.qb__empty {
  color: var(--gy-muted);
  font-size: 0.82rem;
}

.qb__stay {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
}

@media (min-width: 860px) {
  .qb__stay {
    grid-template-columns: minmax(0, 1.4fr) minmax(16rem, 0.9fr);
    align-items: start;
  }
}

.qb__dates {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9.5rem, 1fr));
  gap: 0.55rem;
  margin-bottom: 0.7rem;
}

.qb__field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--gy-muted);
}

.qb__field em {
  font-style: normal;
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;
}

.qb__field input {
  min-height: 2.4rem;
  padding: 0.35rem 0.5rem;
  border: 1px solid rgba(28, 36, 33, 0.18);
  border-radius: 0;
  background: #fff;
  color: var(--gy-forest);
  font: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
}

.qb__field input:focus-visible,
.qb__btn:focus-visible,
.qb__pay-btn:focus-visible,
.qb__text-link:focus-visible,
.qb-room:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: 1px;
}

.qb__stepper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 2.4rem;
  border: 1px solid rgba(28, 36, 33, 0.18);
  background: #fff;
  color: var(--gy-forest);
  text-transform: none;
  letter-spacing: 0;
  font-size: 0.9rem;
  font-weight: 600;
}

.qb__stepper button {
  width: 2.2rem;
  height: 2.4rem;
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 1.1rem;
  cursor: pointer;
}

.qb__stepper button:disabled {
  opacity: 0.35;
  cursor: default;
}

.qb__rooms {
  display: grid;
  gap: 0.6rem;
}

.qb-room {
  display: grid;
  grid-template-columns: 4.8rem minmax(0, 1fr) auto;
  gap: 0.7rem;
  align-items: center;
  padding: 0;
  overflow: hidden;
  border: 1px solid rgba(28, 36, 33, 0.12);
  border-radius: 0;
  background: #fff;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.qb-room.is-on {
  border-color: var(--gy-forest);
  box-shadow: inset 0 0 0 1px var(--gy-forest);
}

.qb-room.is-out,
.qb-room:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.qb-room__photo {
  width: 4.8rem;
  height: 4.8rem;
  background: #c5c0b2 center / cover no-repeat;
}

.qb-room__body {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  padding: 0.45rem 0;
}

.qb-room__price {
  font-weight: 700;
}

.qb-room__price small {
  font-weight: 500;
  color: var(--gy-muted);
}

.qb-room__left {
  padding: 0 0.75rem 0 0;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--gy-forest);
  white-space: nowrap;
}

.qb-room__left.is-out {
  color: var(--gy-muted);
}

.qb__side {
  padding: 0.9rem;
  border: 1px solid rgba(28, 36, 33, 0.08);
  background: #f6f4ef;
}

.qb__side-label {
  margin: 0 0 0.35rem;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
}

.qb__side-title {
  margin: 0;
  font-size: 1.02rem;
}

.qb__side-line,
.qb__hint,
.qb__empty,
.qb__muted,
.qb__error {
  margin: 0.15rem 0 0;
}

.qb__totals {
  display: grid;
  gap: 0.25rem;
  margin: 0.7rem 0 0;
}

.qb__totals div {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.88rem;
}

.qb__totals dt {
  color: var(--gy-muted);
}

.qb__totals dd {
  margin: 0;
  font-weight: 600;
}

.qb__totals .is-total {
  margin-top: 0.25rem;
  padding-top: 0.35rem;
  border-top: 1px solid rgba(28, 36, 33, 0.1);
  font-size: 1rem;
  font-weight: 700;
}

.qb__guest,
.qb__pay {
  margin-top: 0.9rem;
}

.qb__guest .qb__field {
  margin-bottom: 0.45rem;
}

.qb__pay {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.qb__pay-btn,
.qb__btn {
  min-height: 2.4rem;
  padding: 0 0.8rem;
  border: 1px solid rgba(28, 36, 33, 0.16);
  border-radius: 0;
  background: #fff;
  color: var(--gy-forest);
  font: inherit;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
}

.qb__pay-btn.is-on,
.qb__btn--primary {
  border-color: var(--gy-forest);
  background: var(--gy-forest);
  color: #fff;
}

.qb__btn--ghost {
  background: #fff;
}

.qb__btn--block {
  width: 100%;
  margin-top: 0.7rem;
}

.qb__btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.qb__error {
  color: #9b2c2c;
  font-size: 0.82rem;
}

.qb__text-link,
.qb__foot {
  margin-top: 0.7rem;
}

.qb__foot {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
}

.qb__text-link {
  padding: 0;
  border: 0;
  background: none;
  color: var(--gy-forest);
  font: inherit;
  font-size: 0.84rem;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
}

.qb__empty-link {
  display: inline-block;
  margin-left: 0.35rem;
}

.qb__done {
  padding: 0.4rem 0 0.2rem;
}

.qb__done-kicker {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
}

.qb__code {
  margin: 0.35rem 0 0.8rem;
  font-family: var(--font-display, inherit);
  font-size: clamp(1.6rem, 3vw, 2.1rem);
  font-weight: 700;
  letter-spacing: 0.04em;
}

.qb__done-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  align-items: center;
}

.qb__btn--primary {
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>

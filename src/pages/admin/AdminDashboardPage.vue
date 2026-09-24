<template>
  <q-page class="dash">
    <header v-reveal class="dash__head">
      <div>
        <p class="dash__eyebrow">{{ greeting }}</p>
        <h1 class="gy-display dash__title">{{ auth.user?.name ?? "Admin" }}</h1>
        <p class="dash__sub">Pending work, arrivals, and guest messages.</p>
      </div>
      <div class="dash__head-actions">
        <q-btn
          outline
          color="negative"
          no-caps
          label="Reset demo data"
          @click="resetData"
        />
        <q-btn
          v-if="auth.canAction('bookings', 'create')"
          unelevated
          no-caps
          class="dash-btn-primary"
          icon="add"
          label="Create booking"
          to="/admin/bookings?create=1"
        />
      </div>
    </header>

    <div v-reveal="{ delay: '70ms' }" class="dash-toolbar">
      <q-input
        v-model="search"
        dense
        outlined
        clearable
        debounce="150"
        placeholder="Search bookings, guests, enquiries…"
        class="dash-search"
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>
      <div class="dash-chips">
        <button
          type="button"
          class="dash-chip"
          :class="{ active: focus === 'all' }"
          @click="focus = 'all'"
        >
          All
        </button>
        <button
          type="button"
          class="dash-chip"
          :class="{ active: focus === 'pending' }"
          @click="focus = 'pending'"
        >
          Pending ({{ pendingCount }})
        </button>
        <button
          type="button"
          class="dash-chip"
          :class="{ active: focus === 'today' }"
          @click="focus = 'today'"
        >
          Today ({{ todayCount }})
        </button>
        <button
          type="button"
          class="dash-chip"
          :class="{ active: focus === 'inbox' }"
          @click="focus = 'inbox'"
        >
          Inbox ({{ newEnquiryCount }})
        </button>
      </div>
    </div>

    <div
      v-if="attentionItems.length && focus === 'all'"
      v-reveal="{ delay: '100ms' }"
      class="dash-alert"
    >
      <div>
        <strong>Needs attention</strong>
        <p>{{ attentionCopy }}</p>
      </div>
      <div class="dash-alert__actions">
        <q-btn
          v-if="pendingCount && auth.can('bookings')"
          unelevated
          dense
          no-caps
          color="primary"
          label="Confirm all pending"
          @click="confirmAllPending"
        />
        <q-btn
          v-if="pendingCount"
          flat
          dense
          no-caps
          color="primary"
          label="Open pending"
          to="/admin/bookings?status=pending"
        />
        <q-btn
          v-if="newEnquiryCount"
          flat
          dense
          no-caps
          color="primary"
          label="Open inbox"
          to="/admin/enquiries?status=new"
        />
      </div>
    </div>

    <div v-reveal="{ delay: '120ms' }" class="dash-stats">
      <router-link
        v-for="(card, i) in cards"
        :key="card.label"
        v-reveal="{ delay: `${140 + i * 60}ms` }"
        :to="card.to"
        class="dash-stat"
      >
        <div class="dash-stat__icon">
          <q-icon :name="card.icon" size="22px" />
        </div>
        <div>
          <div class="dash-stat__label">{{ card.label }}</div>
          <div class="dash-stat__value">{{ card.value }}</div>
          <div v-if="card.hint" class="dash-stat__hint">{{ card.hint }}</div>
        </div>
      </router-link>
    </div>

    <section v-reveal="{ delay: '160ms' }" class="dash-section">
      <h2 class="dash-section__title">Quick actions</h2>
      <div class="dash-actions">
        <router-link
          v-for="(action, i) in quickActions"
          :key="action.to"
          v-reveal="{ delay: `${180 + i * 50}ms` }"
          :to="action.to"
          class="dash-action"
        >
          <q-icon :name="action.icon" size="20px" />
          <span>{{ action.label }}</span>
        </router-link>
      </div>
    </section>

    <div class="dash-panels">
      <!-- Bookings / arrivals -->
      <section v-reveal="{ delay: '220ms' }" class="dash-panel">
        <div class="dash-panel__head">
          <h2 class="dash-panel__title">{{ bookingsPanelTitle }}</h2>
          <router-link
            :to="bookingsPanelLink"
            class="dash-panel__link gy-link-arrow"
          >
            View all
          </router-link>
        </div>

        <div v-if="visibleBookings.length" class="dash-list">
          <div v-for="b in visibleBookings" :key="b.id" class="dash-row">
            <div class="dash-row__main">
              <div class="dash-row__title">{{ b.reference }}</div>
              <div class="dash-row__sub">
                {{ b.guest.fullName }} · {{ hotelName(b.hotelId) }}
              </div>
              <div class="dash-row__meta">{{ stayLabel(b) }}</div>
            </div>
            <div class="dash-row__side">
              <span class="dash-status" :class="`dash-status--${b.status}`">
                {{ b.status }}
              </span>
              <strong>${{ b.total.toFixed(2) }}</strong>
              <div v-if="auth.can('bookings')" class="dash-row__actions">
                <q-btn
                  v-if="b.status === 'pending'"
                  dense
                  flat
                  no-caps
                  color="positive"
                  label="Confirm"
                  @click="setBookingStatus(b.reference, 'confirmed')"
                />
                <q-btn
                  v-if="b.status === 'pending'"
                  dense
                  flat
                  no-caps
                  color="negative"
                  label="Cancel"
                  @click="setBookingStatus(b.reference, 'cancelled')"
                />
                <q-btn
                  v-if="b.status === 'confirmed' && isArrivalToday(b)"
                  dense
                  flat
                  no-caps
                  color="primary"
                  label="Check in done"
                  @click="setBookingStatus(b.reference, 'completed')"
                />
                <q-btn
                  dense
                  flat
                  no-caps
                  icon="content_copy"
                  @click="copyText(b.reference)"
                >
                  <q-tooltip>Copy reference</q-tooltip>
                </q-btn>
              </div>
            </div>
          </div>
        </div>
        <p v-else class="dash-empty">Nothing to show for this view.</p>
      </section>

      <!-- Enquiries -->
      <section v-reveal="{ delay: '280ms' }" class="dash-panel">
        <div class="dash-panel__head">
          <h2 class="dash-panel__title">{{ enquiriesPanelTitle }}</h2>
          <router-link
            :to="
              focus === 'inbox'
                ? '/admin/enquiries?status=new'
                : '/admin/enquiries'
            "
            class="dash-panel__link gy-link-arrow"
          >
            View all
          </router-link>
        </div>

        <div v-if="visibleEnquiries.length" class="dash-list">
          <div v-for="e in visibleEnquiries" :key="e.id" class="dash-row">
            <div class="dash-row__main">
              <div class="dash-row__title">{{ e.name }}</div>
              <div class="dash-row__sub">{{ e.locationName || e.subject }}</div>
              <div class="dash-row__meta">
                {{ e.email }} · {{ formatDateTime(e.createdAt) }}
              </div>
              <p v-if="e.message" class="dash-row__message">{{ e.message }}</p>
            </div>
            <div class="dash-row__side">
              <span class="dash-status" :class="`dash-status--${e.status}`">
                {{ e.status.replaceAll("_", " ") }}
              </span>
              <div v-if="auth.can('enquiries')" class="dash-row__actions">
                <q-btn
                  v-if="e.status === 'new'"
                  dense
                  flat
                  no-caps
                  color="primary"
                  label="Start"
                  @click="setEnquiryStatus(e.id, 'in_progress')"
                />
                <q-btn
                  v-if="e.status !== 'closed'"
                  dense
                  flat
                  no-caps
                  color="positive"
                  label="Close"
                  @click="setEnquiryStatus(e.id, 'closed')"
                />
                <q-btn
                  dense
                  flat
                  no-caps
                  icon="mail"
                  :href="`mailto:${e.email}?subject=Re: ${encodeURIComponent(e.subject)}`"
                >
                  <q-tooltip>Email guest</q-tooltip>
                </q-btn>
              </div>
            </div>
          </div>
        </div>
        <p v-else class="dash-empty">No enquiries in this view.</p>
      </section>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useQuasar } from "quasar";
import { useAuthStore } from "@/stores/auth-store";
import { useCmsStore } from "@/stores/cms-store";
import type { Booking, BookingStatus, EnquiryStatus } from "@/types/greyon";
import { formatDateTime, formatStayRange } from "@/utils/datetime";

type Focus = "all" | "pending" | "today" | "inbox";

const auth = useAuthStore();
const cms = useCmsStore();
const $q = useQuasar();
const search = ref("");
const focus = ref<Focus>("all");
const loading = ref(true);

onMounted(async () => {
  loading.value = true;
  try {
    await cms.ensureDashboardData();
  } finally {
    loading.value = false;
  }
});

const today = new Date().toISOString().slice(0, 10);

const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
});

const myHotels = computed(() => auth.scopedHotels);
const myBookings = computed(() => auth.scopedBookings);
const myEnquiries = computed(() => auth.scopedEnquiries);

const pendingCount = computed(
  () => myBookings.value.filter(b => b.status === "pending").length
);
const newEnquiryCount = computed(
  () => myEnquiries.value.filter(e => e.status === "new").length
);
const arrivalsToday = computed(() =>
  myBookings.value.filter(
    b =>
      b.checkIn === today &&
      (b.status === "pending" || b.status === "confirmed")
  )
);
const departuresToday = computed(() =>
  myBookings.value.filter(
    b =>
      b.checkOut === today &&
      (b.status === "confirmed" || b.status === "completed")
  )
);
const todayCount = computed(
  () => arrivalsToday.value.length + departuresToday.value.length
);
const publishedHotels = computed(
  () => myHotels.value.filter(h => h.status === "published").length
);
const draftHotels = computed(
  () => myHotels.value.filter(h => h.status === "draft").length
);
const monthRevenue = computed(() => {
  const prefix = today.slice(0, 7);
  return myBookings.value
    .filter(
      b =>
        b.createdAt.startsWith(prefix) &&
        (b.status === "confirmed" ||
          b.status === "completed" ||
          b.status === "pending")
    )
    .reduce((sum, b) => sum + b.total, 0);
});

const attentionItems = computed(() => {
  const items: string[] = [];
  if (pendingCount.value) items.push("pending");
  if (newEnquiryCount.value) items.push("enquiries");
  return items;
});

const attentionCopy = computed(() => {
  const parts: string[] = [];
  if (pendingCount.value) {
    parts.push(
      `${pendingCount.value} pending booking${pendingCount.value === 1 ? "" : "s"}`
    );
  }
  if (newEnquiryCount.value) {
    parts.push(
      `${newEnquiryCount.value} new enquir${newEnquiryCount.value === 1 ? "y" : "ies"}`
    );
  }
  return parts.join(" and ") + " waiting for review.";
});

const cards = computed(() => [
  {
    label: "Hotels",
    value: myHotels.value.length,
    hint: draftHotels.value
      ? `${publishedHotels.value} live · ${draftHotels.value} draft`
      : `${publishedHotels.value} published`,
    icon: "hotel",
    to: "/admin/hotels"
  },
  {
    label: "Bookings",
    value: myBookings.value.length,
    hint: pendingCount.value ? `${pendingCount.value} pending` : "All clear",
    icon: "book_online",
    to: pendingCount.value
      ? "/admin/bookings?status=pending"
      : "/admin/bookings"
  },
  {
    label: "Enquiries",
    value: myEnquiries.value.length,
    hint: newEnquiryCount.value
      ? `${newEnquiryCount.value} new`
      : "Inbox clear",
    icon: "mail",
    to: newEnquiryCount.value
      ? "/admin/enquiries?status=new"
      : "/admin/enquiries"
  },
  {
    label: "Month total",
    value: `$${monthRevenue.value.toFixed(0)}`,
    hint: "Pending + confirmed + completed",
    icon: "payments",
    to: "/admin/bookings"
  }
]);

const quickActions = computed(() =>
  [
    {
      label: "Add hotel",
      to: "/admin/hotels",
      icon: "add_business",
      perm: "hotels"
    },
    {
      label: "Prices & rooms",
      to: "/admin/rates",
      icon: "calendar_month",
      perm: "rates"
    },
    {
      label: "Create booking",
      to: "/admin/bookings?create=1",
      icon: "event_available",
      perm: "bookings"
    },
    {
      label: "Write news",
      to: "/admin/news",
      icon: "edit_note",
      perm: "news"
    },
    {
      label: "Hero slides",
      to: "/admin/hero-slides",
      icon: "view_carousel",
      perm: "settings"
    },
    {
      label: "Site settings",
      to: "/admin/settings",
      icon: "tune",
      perm: "settings"
    }
  ].filter(a =>
    a.label === "Create booking"
      ? auth.canAction("bookings", "create")
      : auth.can(a.perm)
  )
);

const q = computed(() => search.value.trim().toLowerCase());

function matchesBooking(b: Booking) {
  if (!q.value) return true;
  return (
    b.reference.toLowerCase().includes(q.value) ||
    b.guest.fullName.toLowerCase().includes(q.value) ||
    b.guest.email.toLowerCase().includes(q.value) ||
    hotelName(b.hotelId).toLowerCase().includes(q.value)
  );
}

function matchesEnquiry(e: {
  name: string;
  subject: string;
  locationName?: string;
  email: string;
  message: string;
}) {
  if (!q.value) return true;
  return `${e.name} ${e.subject} ${e.locationName ?? ""} ${e.email} ${e.message}`
    .toLowerCase()
    .includes(q.value);
}

const visibleBookings = computed(() => {
  let list = [...myBookings.value].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
  if (focus.value === "pending") {
    list = list.filter(b => b.status === "pending");
  } else if (focus.value === "today") {
    list = list.filter(
      b =>
        (b.checkIn === today || b.checkOut === today) &&
        b.status !== "cancelled"
    );
  } else if (focus.value === "inbox") {
    list = [];
  }
  return list.filter(matchesBooking).slice(0, 8);
});

const visibleEnquiries = computed(() => {
  let list = [...myEnquiries.value].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
  if (focus.value === "inbox" || focus.value === "all") {
    if (focus.value === "inbox") list = list.filter(e => e.status === "new");
  } else if (focus.value === "pending" || focus.value === "today") {
    // keep showing recent inbox alongside booking focus
    list = list.filter(e => e.status === "new" || e.status === "in_progress");
  }
  return list.filter(matchesEnquiry).slice(0, 8);
});

const bookingsPanelTitle = computed(() => {
  if (focus.value === "pending") return "Pending bookings";
  if (focus.value === "today") return "Arrivals & departures today";
  if (focus.value === "inbox") return "Bookings";
  return "Recent bookings";
});

const bookingsPanelLink = computed(() => {
  if (focus.value === "pending") return "/admin/bookings?status=pending";
  return "/admin/bookings";
});

const enquiriesPanelTitle = computed(() =>
  focus.value === "inbox" ? "New enquiries" : "Latest enquiries"
);

function hotelName(id: string) {
  return cms.getHotelById(id)?.name ?? "Hotel";
}

function stayLabel(b: Booking) {
  const hotel = cms.getHotelById(b.hotelId);
  return formatStayRange(b.checkIn, b.checkOut, {
    checkInTime: hotel?.checkInTime,
    checkOutTime: hotel?.checkOutTime
  });
}

function isArrivalToday(b: Booking) {
  return b.checkIn === today;
}

async function setBookingStatus(reference: string, status: BookingStatus) {
  await cms.updateBookingStatus(reference, status);
  $q.notify({
    type: "positive",
    message: `Booking ${reference} → ${status}`
  });
}

function confirmAllPending() {
  const pending = myBookings.value.filter(b => b.status === "pending");
  if (!pending.length) return;
  $q.dialog({
    title: "Confirm all pending bookings?",
    message: `This will confirm ${pending.length} reservation${pending.length === 1 ? "" : "s"}.`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await Promise.all(
      pending.map(b => cms.updateBookingStatus(b.reference, "confirmed"))
    );
    $q.notify({
      type: "positive",
      message: `Confirmed ${pending.length} booking${pending.length === 1 ? "" : "s"}.`
    });
  });
}

async function setEnquiryStatus(id: string, status: EnquiryStatus) {
  await cms.updateEnquiry(id, { status });
  $q.notify({
    type: "positive",
    message: `Enquiry marked ${status.replaceAll("_", " ")}.`
  });
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    $q.notify({ type: "positive", message: "Copied to clipboard." });
  } catch {
    $q.notify({ type: "negative", message: "Could not copy." });
  }
}

function resetData() {
  $q.dialog({
    title: "Re-sync from engine?",
    message:
      "Clears the local cache and reloads catalog data from greyon-engine. Does not reset the database.",
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await cms.resetToSeed();
    $q.notify({ type: "positive", message: "Local cache re-synced." });
  });
}
</script>

<style scoped>
.dash {
  padding: clamp(1rem, 2.2vw, 1.5rem);
  width: 100%;
  max-width: none;
}

.dash__head {
  display: flex;
  justify-content: space-between;
  gap: 0.85rem;
  align-items: start;
  margin-bottom: 0.85rem;
  flex-wrap: wrap;
}

.dash__eyebrow {
  margin: 0 0 0.15rem;
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
}

.dash__title {
  margin: 0;
  font-size: clamp(1.45rem, 2.2vw, 1.85rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.15;
}

.dash__sub {
  margin: 0.25rem 0 0;
  color: var(--gy-muted);
  max-width: 32rem;
  font-size: 0.88rem;
}

.dash__head-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.dash__head-actions :deep(.q-btn) {
  border-radius: 8px;
}

.dash-btn-primary {
  background: var(--gy-forest) !important;
  color: #fff !important;
}

.dash-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  align-items: center;
  margin-bottom: 0.85rem;
}

.dash-search {
  flex: 1;
  min-width: min(100%, 260px);
  background: #fff;
}

.dash-search :deep(.q-field__control) {
  border-radius: 10px;
}

.dash-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.dash-chip {
  border: 1px solid rgba(28, 36, 33, 0.1);
  border-radius: 999px;
  background: #fff;
  color: var(--gy-muted);
  padding: 0.38rem 0.85rem;
  font: inherit;
  font-size: 0.8rem;
  cursor: pointer;
  transition:
    background 0.22s ease,
    border-color 0.22s ease,
    color 0.22s ease,
    transform 0.22s ease;
}

.dash-chip:hover {
  transform: translateY(-1px);
  border-color: rgba(154, 123, 60, 0.35);
  color: var(--gy-ink);
}

.dash-chip.active {
  background: var(--gy-forest);
  border-color: var(--gy-forest);
  color: #fff;
}

.dash-alert {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
  padding: 0.8rem 1rem;
  margin-bottom: 0.9rem;
  background: #fff8ef;
  border: 1px solid rgba(176, 141, 87, 0.3);
  border-radius: 12px;
}

.dash-alert p {
  margin: 0.2rem 0 0;
  color: var(--gy-muted);
  font-size: 0.88rem;
}

.dash-alert__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.dash-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.7rem;
  margin-bottom: 1rem;
}

.dash-stat {
  display: flex;
  gap: 0.75rem;
  align-items: start;
  padding: 0.9rem 0.95rem;
  background: #fff;
  border: 1px solid rgba(28, 36, 33, 0.07);
  border-radius: 14px;
  transition:
    border-color 0.3s ease,
    transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.35s ease;
}

.dash-stat:hover {
  border-color: rgba(154, 123, 60, 0.28);
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(26, 24, 20, 0.07);
}

.dash-stat__icon {
  width: 2.2rem;
  height: 2.2rem;
  display: grid;
  place-items: center;
  background: rgba(154, 123, 60, 0.1);
  color: var(--gy-forest);
  border-radius: 10px;
  flex-shrink: 0;
}

.dash-stat__label {
  font-size: 0.68rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--gy-muted);
}

.dash-stat__value {
  font-family: var(--font-display);
  font-size: 1.55rem;
  font-weight: 700;
  line-height: 1.1;
  margin-top: 0.1rem;
}

.dash-stat__hint {
  margin-top: 0.15rem;
  font-size: 0.76rem;
  color: var(--gy-muted);
}

.dash-section {
  margin-bottom: 1rem;
}

.dash-section__title,
.dash-panel__title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
}

.dash-actions {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.55rem;
  margin-top: 0.55rem;
}

.dash-action {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0.85rem;
  background: #fff;
  border: 1px solid rgba(28, 36, 33, 0.07);
  border-radius: 12px;
  font-size: 0.86rem;
  color: var(--gy-ink);
  transition:
    border-color 0.28s ease,
    background 0.28s ease,
    transform 0.3s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.3s ease;
}

.dash-action:hover {
  border-color: rgba(154, 123, 60, 0.3);
  background: rgba(154, 123, 60, 0.04);
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(26, 24, 20, 0.06);
}

.dash-action .q-icon {
  color: var(--gy-forest);
  transition: transform 0.25s ease;
}

.dash-action:hover .q-icon {
  transform: scale(1.1);
}

.dash-panels {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 0.7rem;
}

.dash-panel {
  background: #fff;
  border: 1px solid rgba(28, 36, 33, 0.07);
  border-radius: 14px;
  padding: 0.9rem 1rem 0.55rem;
  transition:
    box-shadow 0.35s ease,
    border-color 0.35s ease;
}

.dash-panel:hover {
  border-color: rgba(154, 123, 60, 0.2);
  box-shadow: 0 12px 28px rgba(26, 24, 20, 0.05);
}

.dash-panel__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.dash-panel__link {
  font-size: 0.8rem;
  color: var(--gy-forest);
  text-decoration: none;
}

.dash-panel__link:hover {
  text-decoration: underline;
}

.dash-list {
  display: grid;
}

.dash-row {
  display: flex;
  justify-content: space-between;
  gap: 0.85rem;
  padding: 0.75rem 0.4rem;
  margin: 0 -0.4rem;
  border-top: 1px solid rgba(28, 36, 33, 0.06);
  border-radius: 8px;
  transition: background 0.22s ease;
}

.dash-row:hover {
  background: rgba(154, 123, 60, 0.04);
}

.dash-row__title {
  font-weight: 600;
  font-size: 0.95rem;
}

.dash-row__sub,
.dash-row__meta {
  font-size: 0.82rem;
  color: var(--gy-muted);
  margin-top: 0.15rem;
}

.dash-row__message {
  margin: 0.45rem 0 0;
  font-size: 0.84rem;
  color: var(--gy-ink);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dash-row__side {
  display: grid;
  gap: 0.35rem;
  justify-items: end;
  align-content: start;
  text-align: right;
  flex-shrink: 0;
}

.dash-row__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.1rem;
  justify-content: end;
}

.dash-status {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  text-transform: capitalize;
  background: rgba(28, 36, 33, 0.06);
  border-radius: 999px;
}

.dash-status--pending,
.dash-status--new {
  background: rgba(176, 141, 87, 0.18);
  color: #7a5c2e;
}

.dash-status--confirmed,
.dash-status--closed {
  background: rgba(154, 123, 60, 0.12);
  color: var(--gy-forest);
}

.dash-status--cancelledled {
  background: rgba(139, 46, 46, 0.12);
  color: #8b2e2e;
}

.dash-status--in_progress {
  background: rgba(154, 123, 60, 0.08);
  color: var(--gy-moss);
}

.dash-empty {
  margin: 0.5rem 0 1rem;
  color: var(--gy-muted);
  font-size: 0.92rem;
}

@media (max-width: 1100px) {
  .dash-stats,
  .dash-actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dash-panels {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .dash-stats,
  .dash-actions {
    grid-template-columns: 1fr;
  }

  .dash-row {
    flex-direction: column;
  }

  .dash-row__side {
    justify-items: start;
    text-align: left;
  }

  .dash-row__actions {
    justify-content: start;
  }
}
</style>

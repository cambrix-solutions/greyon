<template>
  <q-page class="gy-section booking-page">
    <SeoHead
      title="Booking | Greyon"
      description="Search Greyon hotel availability and complete your reservation request."
    />
    <div class="gy-container booking-shell">
      <header v-reveal class="booking-head">
        <div>
          <p class="gy-eyebrow">Reservations</p>
          <h1 class="gy-display page-title">{{ stepTitle }}</h1>
          <p v-if="stepLead" class="booking-lead">{{ stepLead }}</p>
        </div>
      </header>

      <p
        v-if="!cms.settings.paymentEnabled && booking.step < 6"
        class="payment-note"
      >
        {{ cms.settings.paymentNote || $t("booking.paymentNotice") }}
      </p>

      <p v-if="booking.errorMessage" class="error">{{
        booking.errorMessage
      }}</p>

      <!-- 1 Search -->
      <section v-if="booking.step === 1" v-reveal class="panel">
        <BookingSearchWidget :navigate="false" />
      </section>

      <!-- 2 Results -->
      <section v-else-if="booking.step === 2" class="panel">
        <div class="panel__head">
          <div>
            <h2 class="gy-display panel-title">Available rooms</h2>
            <p class="gy-muted panel-sub">
              {{ staySummary }} · {{ booking.search.rooms }} room(s) ·
              {{ booking.search.adults }} adults
            </p>
          </div>
          <button
            class="gy-btn gy-btn--outline gy-btn--sm"
            type="button"
            @click="booking.step = 1"
          >
            Edit search
          </button>
        </div>

        <div v-if="booking.searching" class="results">
          <RoomCardSkeleton
            v-for="n in 3"
            :key="`result-skel-${n}`"
            variant="result"
          />
        </div>
        <div v-else-if="booking.results.length" class="results">
          <RoomOfferCard
            v-for="(result, idx) in booking.results"
            :key="idx"
            variant="result"
            :title="result.roomType.name"
            :subtitle="resultRoomSubtitle(result)"
            :images="result.roomType.images"
            :bed-type="result.roomType.bedType"
            :room-size="result.roomType.roomSize"
            :max-guests="result.roomType.maxGuests"
            :amenities="result.roomType.amenities"
            :amenity-limit="4"
            :badge="resultUrgencyBadge(result)"
            :meta="resultMeta(result)"
            :price-text="`$${result.total.toFixed(2)}`"
            :price-per-night="resultPerNight(result)"
            price-hint="incl. taxes & fees for your dates"
            cta-label="View room details"
            @cta="booking.selectResult(result)"
          />
        </div>
        <p v-else-if="!booking.errorMessage" class="empty-note">
          No rooms available for this search. Try different dates or occupancy.
        </p>
      </section>

      <!-- 3 Room -->
      <section v-else-if="booking.step === 3 && booking.selected" class="panel">
        <div class="summary-card">
          <div
            v-if="roomCover(booking.selected.roomType)"
            class="summary-card__media gy-card-media"
          >
            <img
              :src="roomCover(booking.selected.roomType)"
              :alt="booking.selected.roomType.name"
            />
          </div>
          <h2 class="gy-display panel-title">Selected room</h2>
          <p class="summary-card__hotel">{{ booking.selected.hotel.name }}</p>
          <p class="summary-card__room">
            {{ booking.selected.roomType.name }} ·
            {{ booking.selected.ratePlan.name }}
          </p>
          <p class="result-card__facts">
            {{ roomFactsLine(booking.selected.roomType) }}
          </p>
          <FeatureChips :items="booking.selected.roomType.amenities" />
          <p class="gy-muted summary-card__desc">
            {{ booking.selected.ratePlan.description }}
          </p>
          <div class="summary-card__total">
            <span
              >Total for {{ booking.selected.nights }} night{{
                booking.selected.nights === 1 ? "" : "s"
              }}</span
            >
            <strong>${{ booking.selected.total.toFixed(2) }}</strong>
          </div>
          <p class="breakdown">
            Subtotal ${{ booking.selected.subtotal.toFixed(2) }} + taxes/fees
            ${{ booking.selected.taxesFees.toFixed(2) }}
          </p>
          <p class="policy">{{
            booking.selected.ratePlan.cancellationPolicy
          }}</p>
        </div>
        <div class="panel-actions">
          <button
            class="gy-btn gy-btn--outline"
            type="button"
            @click="booking.step = 2"
          >
            Back
          </button>
          <button
            class="gy-btn gy-btn--light"
            type="button"
            @click="booking.goToGuestDetails()"
          >
            Continue
          </button>
        </div>
      </section>

      <!-- 4 Guest -->
      <section v-else-if="booking.step === 4" class="panel guest-step">
        <div class="guest-step__form">
          <h2 class="gy-display panel-title">Who’s staying</h2>
          <p class="panel-sub gy-muted">
            Lead guest details for this reservation — an account is optional.
          </p>

          <div
            v-if="customer.isAuthenticated"
            class="guest-account guest-account--in"
          >
            <p class="guest-account__title">Booking with your Greyon account</p>
            <p class="guest-account__copy">
              {{ customer.displayName }} · {{ customer.user?.email }}
            </p>
            <p class="guest-account__hint gy-muted">
              This stay will appear under My account. Confirm or edit the
              contact details below if someone else is the lead guest.
            </p>
          </div>
          <div v-else class="guest-account guest-account--out">
            <p class="guest-account__title">Save this stay to an account?</p>
            <p class="guest-account__copy gy-muted">
              Sign in so confirmation and details sync to My account. Or
              continue as a guest with the form below — no account required.
            </p>
            <div class="guest-account__actions">
              <router-link
                class="gy-btn gy-btn--outline"
                :to="{
                  name: 'sign-in',
                  query: { redirect: '/booking' }
                }"
                @click="booking.prepareAuthReturn()"
              >
                Sign in
              </router-link>
              <router-link
                class="guest-account__link"
                :to="{
                  name: 'sign-up',
                  query: { redirect: '/booking' }
                }"
                @click="booking.prepareAuthReturn()"
              >
                Create account
              </router-link>
            </div>
          </div>

          <form
            class="form-grid"
            novalidate
            @submit.prevent="booking.goToReview()"
          >
            <div class="form-row">
              <label :class="{ 'is-invalid': showGuestError('firstName') }">
                First name *
                <input
                  v-model="booking.guest.firstName"
                  required
                  autocomplete="given-name"
                />
                <span v-if="showGuestError('firstName')" class="field-error">
                  {{ booking.guestErrors.firstName }}
                </span>
              </label>
              <label :class="{ 'is-invalid': showGuestError('lastName') }">
                Last name *
                <input
                  v-model="booking.guest.lastName"
                  required
                  autocomplete="family-name"
                />
                <span v-if="showGuestError('lastName')" class="field-error">
                  {{ booking.guestErrors.lastName }}
                </span>
              </label>
            </div>
            <label :class="{ 'is-invalid': showGuestError('nationality') }">
              Nationality *
              <input
                v-model="booking.guest.nationality"
                required
                autocomplete="country-name"
              />
              <span v-if="showGuestError('nationality')" class="field-error">
                {{ booking.guestErrors.nationality }}
              </span>
            </label>
            <div class="form-row">
              <label :class="{ 'is-invalid': showGuestError('email') }">
                Email *
                <input
                  v-model="booking.guest.email"
                  type="email"
                  required
                  autocomplete="email"
                />
                <span v-if="showGuestError('email')" class="field-error">
                  {{ booking.guestErrors.email }}
                </span>
              </label>
              <label :class="{ 'is-invalid': showGuestError('phone') }">
                Phone *
                <input
                  v-model="booking.guest.phone"
                  required
                  autocomplete="tel"
                />
                <span v-if="showGuestError('phone')" class="field-error">
                  {{ booking.guestErrors.phone }}
                </span>
              </label>
            </div>
            <label :class="{ 'is-invalid': showGuestError('address') }">
              Address *
              <input
                v-model="booking.guest.address"
                required
                autocomplete="street-address"
              />
              <span v-if="showGuestError('address')" class="field-error">
                {{ booking.guestErrors.address }}
              </span>
            </label>
            <label :class="{ 'is-invalid': showGuestError('city') }">
              City of residence *
              <input
                v-model="booking.guest.city"
                required
                autocomplete="address-level2"
              />
              <span v-if="showGuestError('city')" class="field-error">
                {{ booking.guestErrors.city }}
              </span>
            </label>
            <label>
              Special requests
              <textarea
                v-model="booking.guest.specialRequests"
                rows="3"
                placeholder="Optional — arrival time, bed preference, etc."
              />
            </label>
            <div class="panel-actions">
              <button
                class="gy-btn gy-btn--outline"
                type="button"
                @click="booking.step = 3"
              >
                Back
              </button>
              <button class="gy-btn gy-btn--light" type="submit">
                Continue
              </button>
            </div>
          </form>
        </div>

        <aside
          v-if="booking.selected"
          class="guest-step__summary summary-card summary-card--aside"
        >
          <div
            v-if="roomCover(booking.selected.roomType)"
            class="summary-card__media gy-card-media"
          >
            <img
              :src="roomCover(booking.selected.roomType)"
              :alt="booking.selected.roomType.name"
            />
          </div>
          <p class="review-label">Selected room</p>
          <p class="summary-card__hotel">{{ booking.selected.hotel.name }}</p>
          <p class="summary-card__room">
            {{ booking.selected.roomType.name }} ·
            {{ booking.selected.ratePlan.name }}
          </p>
          <p class="gy-muted">{{ staySummary }}</p>
          <div class="summary-card__total">
            <span>Total</span>
            <strong>${{ booking.selected.total.toFixed(2) }}</strong>
          </div>
        </aside>
      </section>

      <!-- 5 Review -->
      <section v-else-if="booking.step === 5 && booking.selected" class="panel">
        <h2 class="gy-display panel-title">Review & confirm</h2>
        <div class="review-grid">
          <div class="review-block">
            <p class="review-label">Stay</p>
            <p>{{ reviewStay }}</p>
            <p class="gy-muted">
              {{ booking.search.adults }} adults ·
              {{ booking.search.children }} children ·
              {{ booking.search.rooms }} room(s)
            </p>
          </div>
          <div class="review-block">
            <p class="review-label">Hotel & room</p>
            <p>{{ booking.selected.hotel.name }}</p>
            <p class="gy-muted">
              {{ booking.selected.roomType.name }} /
              {{ booking.selected.ratePlan.name }}
            </p>
          </div>
          <div class="review-block">
            <p class="review-label">Lead guest</p>
            <p>{{ booking.guest.fullName }}</p>
            <p class="gy-muted">
              {{ booking.guest.email }} · {{ booking.guest.phone }}
            </p>
            <p v-if="booking.guest.nationality" class="gy-muted">
              {{ booking.guest.nationality }}
            </p>
            <p
              v-if="booking.guest.address || booking.guest.city"
              class="gy-muted"
            >
              {{
                [booking.guest.address, booking.guest.city]
                  .filter(Boolean)
                  .join(", ")
              }}
            </p>
          </div>
          <div class="review-block review-block--total">
            <p class="review-label">Total</p>
            <p class="review-total">${{ booking.selected.total.toFixed(2) }}</p>
            <p class="gy-muted">Includes taxes and fees</p>
          </div>
        </div>

        <p class="policy">{{ booking.selected.ratePlan.cancellationPolicy }}</p>
        <p
          v-if="!cms.settings.paymentEnabled"
          class="payment-note payment-note--inline"
        >
          {{ $t("booking.reservationOnly") }}
        </p>

        <label class="consent">
          <input v-model="booking.acceptedPolicy" type="checkbox" />
          <span>I accept the cancellation and modification policy.</span>
        </label>

        <div class="panel-actions">
          <button
            class="gy-btn gy-btn--outline"
            type="button"
            @click="booking.step = 4"
          >
            Back
          </button>
          <button
            class="gy-btn gy-btn--light"
            type="button"
            :disabled="booking.submitting || !booking.acceptedPolicy"
            @click="booking.confirm()"
          >
            {{ booking.submitting ? "Confirming…" : "Confirm reservation" }}
          </button>
        </div>
      </section>

      <!-- 6 Confirm -->
      <section
        v-else-if="booking.step === 6 && booking.confirmedBooking"
        class="panel success-panel"
      >
        <div class="success-mark" aria-hidden="true">✓</div>
        <h2 class="gy-display panel-title">Reservation received</h2>
        <p class="success-lead">
          Thank you. Your request is with the hotel team for confirmation.
        </p>

        <div class="success-ref">
          <span>Booking reference</span>
          <strong>{{ booking.confirmedBooking.reference }}</strong>
        </div>

        <div class="review-grid success-grid">
          <div class="review-block">
            <p class="review-label">Stay</p>
            <p>
              {{
                formatStayRange(
                  booking.confirmedBooking.checkIn,
                  booking.confirmedBooking.checkOut,
                  {
                    checkInTime: confirmHotel?.checkInTime,
                    checkOutTime: confirmHotel?.checkOutTime
                  }
                )
              }}
            </p>
          </div>
          <div class="review-block">
            <p class="review-label">Status</p>
            <p class="status-pill">{{ booking.confirmedBooking.status }}</p>
            <p class="gy-muted">
              You’ll receive an email once the hotel confirms your stay.
            </p>
          </div>
          <div class="review-block">
            <p class="review-label">Guest</p>
            <p>{{ booking.confirmedBooking.guest.fullName }}</p>
            <p class="gy-muted">{{ booking.confirmedBooking.guest.email }}</p>
          </div>
          <div class="review-block review-block--total">
            <p class="review-label">Total</p>
            <p class="review-total">
              ${{ booking.confirmedBooking.total.toFixed(2) }}
            </p>
          </div>
        </div>

        <div class="panel-actions">
          <router-link
            v-if="customer.isAuthenticated"
            :to="{
              name: 'account-booking',
              params: { reference: booking.confirmedBooking.reference }
            }"
            class="gy-btn"
          >
            View booking details
          </router-link>
          <router-link
            v-else
            :to="{
              name: 'sign-in',
              query: {
                redirect: `/account/bookings/${booking.confirmedBooking.reference}`
              }
            }"
            class="gy-btn"
          >
            Sign in to track stays
          </router-link>
          <router-link to="/" class="gy-btn gy-btn--outline"
            >Back home</router-link
          >
          <button
            class="gy-btn gy-btn--light"
            type="button"
            @click="booking.resetFlow()"
          >
            New search
          </button>
        </div>
      </section>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import BookingSearchWidget from "@/components/BookingSearchWidget.vue";
import FeatureChips from "@/components/FeatureChips.vue";
import RoomCardSkeleton from "@/components/RoomCardSkeleton.vue";
import RoomOfferCard from "@/components/RoomOfferCard.vue";
import SeoHead from "@/components/SeoHead.vue";
import { useBookingStore } from "@/stores/booking-store";
import { useCmsStore } from "@/stores/cms-store";
import { useCustomerStore } from "@/stores/customer-store";
import type { AvailabilityResult, RoomType } from "@/types/greyon";
import {
  queryHasSearchFields,
  searchParamsFromQuery,
  searchParamsToQuery
} from "@/utils/bookingSearchQuery";
import {
  formatStayRange,
  hotelCheckInTime,
  hotelCheckOutTime
} from "@/utils/datetime";

const booking = useBookingStore();
const cms = useCmsStore();
const customer = useCustomerStore();
const route = useRoute();
const router = useRouter();
customer.hydrate();

onMounted(() => {
  // Prefer explicit search query (deep links / home search) over a stale draft.
  if (queryHasSearchFields(route.query)) {
    booking.setSearch(searchParamsFromQuery(route.query));
    if (booking.search.checkIn && booking.search.checkOut) {
      void booking.runSearch();
    }
  } else {
    // After sign-in return: restore draft (if any) and fill account details.
    booking.restoreDraft();
  }
  if (customer.isAuthenticated && booking.step >= 4) {
    void booking.applyCustomerToGuest();
  }
});

watch(
  () => booking.search,
  value => {
    if (route.name !== "booking") return;
    const next = searchParamsToQuery(value);
    const same = Object.keys(next).every(
      k => String(route.query[k] ?? "") === String(next[k] ?? "")
    );
    if (!same) {
      void router.replace({ name: "booking", query: next });
    }
  },
  { deep: true }
);

watch(
  () => customer.isAuthenticated,
  ok => {
    if (ok && booking.step >= 4) void booking.applyCustomerToGuest();
  }
);

/** "1 bedroom · 45 sqm · Up to 3 guests" without stray dots for blank CMS fields. */
function roomFactsLine(room: RoomType) {
  return [
    room.bedType?.trim(),
    room.roomSize?.trim(),
    room.maxGuests ? `Up to ${room.maxGuests} guests` : ""
  ]
    .filter(Boolean)
    .join(" · ");
}

function resultRoomSubtitle(result: AvailabilityResult) {
  const hotel = result.hotel.name?.trim() || "";
  const rate = result.ratePlan.name?.trim() || "";
  if (hotel && rate) return `${hotel} · ${rate}`;
  return hotel || rate || "Available room";
}

function resultUrgencyBadge(result: AvailabilityResult) {
  if (result.availableUnits > 0 && result.availableUnits <= 8) {
    return `${result.availableUnits} left`;
  }
  return result.roomType.bedType?.trim() || "Available";
}

function resultMeta(result: AvailabilityResult) {
  return [
    result.ratePlan.mealBenefit,
    `${result.nights} night${result.nights === 1 ? "" : "s"}`
  ]
    .filter(Boolean)
    .join(" · ");
}

function resultPerNight(result: AvailabilityResult) {
  if (!result.nights) return "per night";
  return `$${(result.total / result.nights).toFixed(0)} per night`;
}

// Each step swaps the whole panel — start the new step at the top so mobile
// users don't land mid-page (e.g. after a long results list).
watch(
  () => booking.step,
  () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }
);

function roomCover(room: RoomType) {
  return room.images?.find(src => src?.trim())?.trim() || "";
}

const stepTitle = computed(() => {
  switch (booking.step) {
    case 1:
      return "Find a stay";
    case 2:
      return "Choose a room";
    case 3:
      return "Room details";
    case 4:
      return "Who’s staying";
    case 5:
      return "Review";
    case 6:
      return "Confirmed";
    default:
      return "Booking";
  }
});

const stepLead = computed(() => {
  switch (booking.step) {
    case 1:
      return "Search Greyon hotels by dates and destination.";
    case 2:
      return "Compare available rooms for your dates.";
    case 6:
      return "";
    default:
      return "";
  }
});

const staySummary = computed(() =>
  formatStayRange(booking.search.checkIn, booking.search.checkOut, {
    checkInTime: hotelCheckInTime(),
    checkOutTime: hotelCheckOutTime()
  })
);

const reviewStay = computed(() => {
  const hotel = booking.selected?.hotel;
  return formatStayRange(booking.search.checkIn, booking.search.checkOut, {
    checkInTime: hotel?.checkInTime,
    checkOutTime: hotel?.checkOutTime
  });
});

const confirmHotel = computed(() =>
  booking.confirmedBooking
    ? cms.getHotelById(booking.confirmedBooking.hotelId)
    : null
);

function showGuestError(
  field:
    | "firstName"
    | "lastName"
    | "email"
    | "phone"
    | "nationality"
    | "address"
    | "city"
) {
  return booking.guestAttempted && Boolean(booking.guestErrors[field]);
}
</script>

<style scoped>
.booking-shell {
  max-width: 1080px;
}

.page-title {
  margin: 0;
  font-size: clamp(2.3rem, 5vw, 3.4rem);
  line-height: 1.05;
}

.booking-lead {
  margin: 0.55rem 0 0;
  color: var(--gy-muted);
  max-width: 36rem;
}

.booking-head {
  margin-bottom: 1.25rem;
}

.payment-note {
  padding: 0.85rem 1rem;
  margin: 0 0 1.25rem;
  background: var(--gy-sand);
  color: var(--gy-ink);
  border-left: 3px solid var(--gy-gold);
  line-height: 1.55;
  font-size: 0.92rem;
}

.payment-note--inline {
  margin-top: 1rem;
}

.panel {
  background: var(--gy-white);
  border: 1px solid rgba(28, 36, 33, 0.08);
  padding: clamp(1.25rem, 3vw, 1.75rem);
}

.panel__head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: start;
  margin-bottom: 1.15rem;
}

.panel-title {
  margin: 0 0 0.35rem;
  font-size: clamp(1.7rem, 3vw, 2.1rem);
  line-height: 1.15;
}

.panel__head .gy-btn {
  flex-shrink: 0;
  white-space: nowrap;
}

.panel-sub {
  margin: 0;
  font-size: 0.92rem;
}

.panel-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.35rem;
}

.results {
  display: grid;
  gap: 1rem;
}

.summary-card__media {
  aspect-ratio: 16 / 9;
  margin-bottom: 0.85rem;
  background: var(--gy-sand);
}

.summary-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.guest-step {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 280px);
  gap: 1.5rem;
  align-items: start;
}

.guest-step__summary {
  position: sticky;
  top: 5.5rem;
}

.summary-card--aside {
  padding: 1rem;
  background: var(--gy-cream);
  border: 1px solid rgba(28, 36, 33, 0.08);
}

.result-card__facts {
  margin: 0;
  font-size: 0.88rem;
  color: var(--gy-muted);
  line-height: 1.45;
}

.empty-note {
  margin: 0.5rem 0 0;
  color: var(--gy-muted);
}

.summary-card__hotel {
  margin: 0.75rem 0 0.2rem;
  font-size: 1.15rem;
}

.summary-card__room {
  margin: 0 0 0.55rem;
  color: var(--gy-muted);
}

.summary-card__desc {
  margin: 0.75rem 0 0;
}

.summary-card__total {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-top: 1.15rem;
  padding-top: 0.9rem;
  border-top: 1px solid var(--gy-stone);
}

.summary-card__total strong {
  font-family: var(--font-display);
  font-size: 1.8rem;
  font-weight: 500;
}

.breakdown {
  margin: 0.35rem 0 0;
  font-size: 0.85rem;
  color: var(--gy-muted);
}

.form-grid {
  display: grid;
  gap: 0.95rem;
  max-width: 36rem;
  margin-top: 1rem;
}

.guest-account {
  max-width: 36rem;
  margin-top: 1rem;
  padding: 1rem 1.05rem;
  border: 1px solid rgba(28, 36, 33, 0.1);
  background: var(--gy-cream);
  display: grid;
  gap: 0.35rem;
}

.guest-account--in {
  border-color: rgba(111, 128, 103, 0.45);
  background: rgba(111, 128, 103, 0.08);
}

.guest-account__title {
  margin: 0;
  font-weight: 600;
  color: var(--gy-ink);
}

.guest-account__copy,
.guest-account__hint {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.45;
}

.guest-account__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 1rem;
  margin-top: 0.45rem;
}

.guest-account__link {
  color: var(--gy-gold-deep);
  font-weight: 600;
  text-decoration: none;
  font-size: 0.9rem;
}

.guest-account__link:hover {
  text-decoration: underline;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.95rem;
}

label {
  display: grid;
  gap: 0.4rem;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gy-muted);
}

label.is-invalid input {
  border-color: #b45309;
  background: #fffaf3;
}

.field-error {
  font-size: 0.78rem;
  letter-spacing: normal;
  text-transform: none;
  color: #9a3412;
}

input,
textarea {
  border: 1px solid var(--gy-stone);
  background: var(--gy-cream);
  padding: 0.65rem 0.75rem;
  font: inherit;
  text-transform: none;
  letter-spacing: normal;
  color: var(--gy-ink);
  transition:
    border-color 0.2s ease,
    background 0.2s ease;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: var(--gy-gold);
  background: white;
}

.review-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
  margin: 1rem 0 0;
}

.review-block {
  padding: 1rem 1.05rem;
  background: var(--gy-cream);
  border: 1px solid rgba(28, 36, 33, 0.06);
}

.review-block p {
  margin: 0;
  line-height: 1.45;
}

.review-label {
  margin-bottom: 0.4rem !important;
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--gy-muted);
}

.review-block--total {
  background: var(--gy-sand);
}

.review-total {
  font-family: var(--font-display);
  font-size: 1.85rem;
  line-height: 1.1;
}

.policy {
  padding: 0.9rem 1rem;
  background: var(--gy-cream);
  margin: 1.15rem 0 0;
  font-size: 0.92rem;
  line-height: 1.55;
  color: var(--gy-muted);
}

.consent {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.65rem;
  align-items: start;
  margin: 1.1rem 0 0;
  text-transform: none;
  letter-spacing: normal;
  font-size: 0.95rem;
  color: var(--gy-ink);
}

.consent input {
  margin-top: 0.2rem;
}

.error {
  color: var(--q-negative);
  margin-bottom: 1rem;
}

.success-panel {
  text-align: left;
}

.success-mark {
  width: 2.5rem;
  height: 2.5rem;
  display: grid;
  place-items: center;
  margin-bottom: 0.85rem;
  background: var(--gy-forest);
  color: white;
  font-size: 1.15rem;
}

.success-lead {
  margin: 0 0 1.25rem;
  color: var(--gy-muted);
  max-width: 34rem;
  line-height: 1.55;
}

.success-ref {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1rem 1.1rem;
  margin-bottom: 1rem;
  background: var(--gy-sand);
  border-left: 3px solid var(--gy-gold);
}

.success-ref span {
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--gy-muted);
}

.success-ref strong {
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 500;
  letter-spacing: 0.04em;
}

.status-pill {
  display: inline-block;
  margin: 0.15rem 0 0.35rem !important;
  padding: 0.2rem 0.55rem;
  background: rgba(84, 88, 89, 0.1);
  color: var(--gy-forest);
  font-size: 0.85rem;
  text-transform: capitalize;
}

@media (max-width: 900px) {
  .guest-step {
    grid-template-columns: 1fr;
  }

  .guest-step__summary {
    position: static;
    order: -1;
  }
}

@media (max-width: 800px) {
  .review-grid,
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>

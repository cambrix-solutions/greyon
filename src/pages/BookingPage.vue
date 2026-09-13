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

      <ol v-reveal="{ delay: '60ms' }" class="steps" aria-label="Booking steps">
        <li
          v-for="item in stepItems"
          :key="item.n"
          :class="{
            done: booking.step > item.n,
            current: booking.step === item.n
          }"
        >
          <span class="steps__num">{{ item.n }}</span>
          <span class="steps__label">{{ item.label }}</span>
        </li>
      </ol>

      <p
        v-if="!cms.settings.paymentEnabled && booking.step < 6"
        class="payment-note"
      >
        {{ cms.settings.paymentNote || $t("booking.paymentNotice") }}
      </p>

      <p v-if="booking.errorMessage" class="error">{{ booking.errorMessage }}</p>

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

        <div v-if="booking.results.length" class="results">
          <article
            v-for="(result, idx) in booking.results"
            :key="idx"
            class="result-card"
          >
            <div class="result-card__info">
              <h3 class="gy-display">{{ result.hotel.name }}</h3>
              <p class="result-card__room">
                {{ result.roomType.name }} · {{ result.ratePlan.name }}
              </p>
              <p class="result-card__facts">
                {{ result.roomType.bedType }}
                <span>·</span>
                {{ result.roomType.roomSize }}
                <span>·</span>
                Up to {{ result.roomType.maxGuests }} guests
              </p>
              <p class="result-card__tags">
                {{ result.roomType.amenities.slice(0, 4).join(" · ") }}
              </p>
              <p class="result-card__meta">
                {{ result.ratePlan.mealBenefit }}
                <span>·</span>
                {{ result.availableUnits }} left
                <span>·</span>
                {{ result.nights }} night{{ result.nights === 1 ? "" : "s" }}
              </p>
            </div>
            <div class="result-card__price">
              <strong>${{ result.total.toFixed(2) }}</strong>
              <span>incl. taxes/fees</span>
              <button
                class="gy-btn gy-btn--light gy-btn--sm"
                type="button"
                @click="booking.selectResult(result)"
              >
                Select
              </button>
            </div>
          </article>
        </div>
        <p v-else class="empty-note">
          No bookable inventory for this search. Try different dates or occupancy.
        </p>
      </section>

      <!-- 3 Room -->
      <section v-else-if="booking.step === 3 && booking.selected" class="panel">
        <div class="summary-card">
          <h2 class="gy-display panel-title">Selected room</h2>
          <p class="summary-card__hotel">{{ booking.selected.hotel.name }}</p>
          <p class="summary-card__room">
            {{ booking.selected.roomType.name }} ·
            {{ booking.selected.ratePlan.name }}
          </p>
          <p class="result-card__facts">
            {{ booking.selected.roomType.bedType }}
            <span>·</span>
            {{ booking.selected.roomType.roomSize }}
            <span>·</span>
            Up to {{ booking.selected.roomType.maxGuests }} guests
          </p>
          <p class="result-card__tags">
            {{ booking.selected.roomType.amenities.join(" · ") }}
          </p>
          <p class="gy-muted summary-card__desc">
            {{ booking.selected.ratePlan.description }}
          </p>
          <div class="summary-card__total">
            <span>Total</span>
            <strong>${{ booking.selected.total.toFixed(2) }}</strong>
          </div>
          <p class="breakdown">
            Subtotal ${{ booking.selected.subtotal.toFixed(2) }} + taxes/fees
            ${{ booking.selected.taxesFees.toFixed(2) }}
          </p>
          <p class="policy">{{ booking.selected.ratePlan.cancellationPolicy }}</p>
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
      <section v-else-if="booking.step === 4" class="panel">
        <h2 class="gy-display panel-title">Guest details</h2>
        <p class="panel-sub gy-muted">
          We’ll use these details for your reservation request.
        </p>
        <form class="form-grid" @submit.prevent="booking.goToReview()">
          <label :class="{ 'is-invalid': showGuestError('fullName') }">
            Full name *
            <input
              v-model="booking.guest.fullName"
              required
              autocomplete="name"
              aria-describedby="guest-name-error"
            />
            <span
              v-if="showGuestError('fullName')"
              id="guest-name-error"
              class="field-error"
            >
              {{ booking.guestErrors.fullName }}
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
                aria-describedby="guest-email-error"
              />
              <span
                v-if="showGuestError('email')"
                id="guest-email-error"
                class="field-error"
              >
                {{ booking.guestErrors.email }}
              </span>
            </label>
            <label :class="{ 'is-invalid': showGuestError('phone') }">
              Phone *
              <input
                v-model="booking.guest.phone"
                required
                autocomplete="tel"
                aria-describedby="guest-phone-error"
              />
              <span
                v-if="showGuestError('phone')"
                id="guest-phone-error"
                class="field-error"
              >
                {{ booking.guestErrors.phone }}
              </span>
            </label>
          </div>
          <label>
            Special requests
            <textarea v-model="booking.guest.specialRequests" rows="3" />
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
              Review booking
            </button>
          </div>
        </form>
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
          </div>
          <div class="review-block review-block--total">
            <p class="review-label">Total</p>
            <p class="review-total">${{ booking.selected.total.toFixed(2) }}</p>
            <p class="gy-muted">Includes taxes and fees</p>
          </div>
        </div>

        <p class="policy">{{ booking.selected.ratePlan.cancellationPolicy }}</p>
        <p v-if="!cms.settings.paymentEnabled" class="payment-note payment-note--inline">
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
          <router-link to="/" class="gy-btn">Back home</router-link>
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
import { computed } from "vue";
import BookingSearchWidget from "@/components/BookingSearchWidget.vue";
import SeoHead from "@/components/SeoHead.vue";
import { useBookingStore } from "@/stores/booking-store";
import { useCmsStore } from "@/stores/cms-store";
import {
  formatStayRange,
  hotelCheckInTime,
  hotelCheckOutTime
} from "@/utils/datetime";

const booking = useBookingStore();
const cms = useCmsStore();

const stepItems = [
  { n: 1, label: "Search" },
  { n: 2, label: "Results" },
  { n: 3, label: "Room" },
  { n: 4, label: "Guest" },
  { n: 5, label: "Review" },
  { n: 6, label: "Confirm" }
];

const stepTitle = computed(() => {
  switch (booking.step) {
    case 1:
      return "Find a stay";
    case 2:
      return "Choose a room";
    case 3:
      return "Room details";
    case 4:
      return "Guest details";
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

function showGuestError(field: "fullName" | "email" | "phone") {
  return booking.guestAttempted && Boolean(booking.guestErrors[field]);
}
</script>

<style scoped>
.booking-shell {
  max-width: 920px;
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

.steps {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.45rem;
  list-style: none;
  padding: 0;
  margin: 0 0 1.35rem;
}

.steps li {
  display: grid;
  gap: 0.3rem;
  justify-items: center;
  padding: 0.55rem 0.35rem;
  background: transparent;
  border-bottom: 2px solid var(--gy-stone);
  color: var(--gy-muted);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.7;
}

.steps__num {
  width: 1.45rem;
  height: 1.45rem;
  display: grid;
  place-items: center;
  border-radius: 999px;
  border: 1px solid currentColor;
  font-size: 0.7rem;
}

.steps li.done {
  opacity: 1;
  color: var(--gy-forest);
  border-bottom-color: var(--gy-forest);
}

.steps li.done .steps__num {
  background: var(--gy-forest);
  border-color: var(--gy-forest);
  color: white;
}

.steps li.current {
  opacity: 1;
  color: var(--gy-ink);
  border-bottom-color: var(--gy-gold);
}

.steps li.current .steps__num {
  background: var(--gy-gold);
  border-color: var(--gy-gold);
  color: var(--gy-ink);
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
  gap: 0.85rem;
}

.result-card {
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  gap: 1.5rem;
  background: var(--gy-cream);
  padding: 1.15rem 1.25rem;
  border: 1px solid rgba(28, 36, 33, 0.06);
}

.result-card__info {
  display: grid;
  gap: 0.3rem;
  min-width: 0;
  flex: 1;
}

.result-card h3 {
  margin: 0;
  font-size: 1.45rem;
  line-height: 1.15;
}

.result-card__room {
  margin: 0;
  font-size: 0.95rem;
}

.result-card__facts,
.result-card__tags,
.result-card__meta {
  margin: 0;
  font-size: 0.88rem;
  color: var(--gy-muted);
  line-height: 1.45;
}

.result-card__facts span,
.result-card__meta span {
  margin: 0 0.2rem;
  opacity: 0.7;
}

.result-card__price {
  display: grid;
  gap: 0.3rem;
  justify-items: end;
  align-content: center;
  flex-shrink: 0;
}

.result-card__price strong {
  font-family: var(--font-display);
  font-size: 1.7rem;
  font-weight: 500;
  line-height: 1;
}

.result-card__price span {
  font-size: 0.78rem;
  color: var(--gy-muted);
}

.result-card__price .gy-btn {
  margin-top: 0.35rem;
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
  transition: border-color 0.2s ease, background 0.2s ease;
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
  color: #8b2e2e;
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
  background: rgba(154, 123, 60, 0.1);
  color: var(--gy-forest);
  font-size: 0.85rem;
  text-transform: capitalize;
}

@media (max-width: 800px) {
  .steps {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .review-grid,
  .form-row {
    grid-template-columns: 1fr;
  }

  .result-card {
    flex-direction: column;
  }

  .result-card__price {
    justify-items: start;
    align-content: start;
    padding-top: 0.5rem;
    border-top: 1px solid var(--gy-stone);
  }
}

@media (max-width: 520px) {
  .steps__label {
    font-size: 0.65rem;
  }
}
</style>

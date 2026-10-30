<template>
  <q-page class="gy-section booking-page">
    <SeoHead
      title="Booking | Greyon"
      description="Search Greyon apartel availability and complete your reservation request."
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

      <!-- 2 Choose a room (search + results; former Find a stay merged here) -->
      <section v-if="booking.step === 2" class="panel choose-room">
        <BookingSearchWidget :navigate="false" />

        <div class="choose-room__layout">
          <div class="choose-room__main">
            <div class="panel__head">
              <div>
                <h2 class="gy-display panel-title">Available rooms</h2>
                <p class="gy-muted panel-sub">
                  {{ staySummary }} · {{ booking.search.rooms }} room(s) ·
                  {{ booking.search.adults }} adults
                </p>
              </div>
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
                cta-label="Book now"
                :detail-to="roomDetailPath(result.hotel, result.roomType)"
                :show-view-details="true"
                @cta="booking.selectResult(result)"
              />
            </div>
            <p v-else-if="!booking.errorMessage" class="empty-note">
              Search dates and destination above to see available rooms, or try
              different dates or occupancy.
            </p>
          </div>

          <aside class="choose-room__aside" aria-label="Your stay summary">
            <div class="stay-card">
              <p class="stay-card__eyebrow">Your stay</p>
              <h3 class="gy-display stay-card__hotel">
                {{ staySidebar.hotelName }}
              </h3>
              <p v-if="staySidebar.city" class="stay-card__city">{{
                staySidebar.city
              }}</p>
              <p
                v-if="booking.search.checkIn && booking.search.checkOut"
                class="stay-card__dates"
              >
                {{ formatStayShort(booking.search.checkIn) }} –
                {{ formatStayShort(booking.search.checkOut) }}
              </p>
              <p class="stay-card__times">
                Check-in {{ staySidebar.checkInTime }} · Check-out
                {{ staySidebar.checkOutTime }}
              </p>
              <div v-if="staySidebar.priced" class="stay-card__price">
                <strong>${{ staySidebar.priced.total.toFixed(0) }}</strong>
                <span>
                  {{ staySidebar.priced.roomType.name }} · incl. taxes ·
                  {{ staySidebar.priced.nights }} night{{
                    staySidebar.priced.nights === 1 ? "" : "s"
                  }}
                </span>
              </div>
              <p v-else class="stay-card__pending">
                Choose dates to see live rates.
              </p>
              <button
                class="gy-btn gy-btn--light stay-card__cta"
                type="button"
                :disabled="!staySidebar.priced"
                @click="bookFromSidebar"
              >
                Book
              </button>
            </div>

            <div class="assist-card">
              <p class="stay-card__eyebrow">Need assistance</p>
              <p class="assist-card__copy">
                Our reservations team can help with availability and special
                requests.
              </p>
              <a
                v-if="assistPhone"
                class="assist-card__link"
                :href="`tel:${assistPhone}`"
              >
                {{ assistPhone }}
              </a>
              <a
                v-if="assistEmail"
                class="assist-card__link"
                :href="`mailto:${assistEmail}`"
              >
                {{ assistEmail }}
              </a>
              <router-link class="assist-card__link" to="/contact">
                Contact page
              </router-link>
            </div>
          </aside>
        </div>
      </section>

      <!-- 3 Room details -->
      <section
        v-else-if="booking.step === 3 && booking.selected"
        class="panel room-detail-step"
      >
        <div class="room-detail-step__layout">
          <div class="room-detail-step__main">
            <div class="room-detail-step__gallery">
              <RoomMediaCarousel
                :images="booking.selected.roomType.images"
                :alt="booking.selected.roomType.name"
                fill
                lightbox
              />
            </div>

            <p class="room-detail-step__hotel">{{
              booking.selected.hotel.name
            }}</p>
            <h2 class="gy-display room-detail-step__title">
              {{ booking.selected.roomType.name }}
            </h2>
            <p class="room-detail-step__rate">{{
              booking.selected.ratePlan.name
            }}</p>
            <RoomFacts
              :bed-type="booking.selected.roomType.bedType"
              :room-size="booking.selected.roomType.roomSize"
              :max-guests="booking.selected.roomType.maxGuests"
            />

            <div
              v-if="booking.selected.roomType.amenities.length"
              class="amenities-block"
            >
              <h3 class="gy-display amenities-block__title">Amenities</h3>
              <ul class="amenities-grid">
                <li
                  v-for="item in booking.selected.roomType.amenities"
                  :key="item"
                >
                  {{ item }}
                </li>
              </ul>
            </div>

            <p
              v-if="booking.selected.ratePlan.description"
              class="gy-muted room-detail-step__desc"
            >
              {{ booking.selected.ratePlan.description }}
            </p>
            <p
              v-if="booking.selected.ratePlan.cancellationPolicy"
              class="policy"
            >
              {{ booking.selected.ratePlan.cancellationPolicy }}
            </p>

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
                Book now
              </button>
            </div>
          </div>

          <aside
            class="room-detail-step__aside stay-card"
            aria-label="Booking summary"
          >
            <p class="stay-card__eyebrow">Your stay</p>
            <div class="stay-card__price">
              <strong>${{ booking.selected.total.toFixed(0) }}</strong>
              <span>
                Total for {{ booking.selected.nights }} night{{
                  booking.selected.nights === 1 ? "" : "s"
                }}
                · incl. taxes &amp; fees
              </span>
            </div>
            <p class="breakdown">
              Subtotal ${{ booking.selected.subtotal.toFixed(2) }} + taxes/fees
              ${{ booking.selected.taxesFees.toFixed(2) }}
            </p>
            <p class="stay-card__dates">
              {{ formatStayShort(booking.search.checkIn) }} –
              {{ formatStayShort(booking.search.checkOut) }}
            </p>
            <p class="stay-card__times">
              Check-in
              {{ hotelCheckInTime(booking.selected.hotel.checkInTime) }}
              · Check-out
              {{ hotelCheckOutTime(booking.selected.hotel.checkOutTime) }}
            </p>
            <p class="stay-card__room-line">
              {{ booking.selected.roomType.name }}
            </p>
            <button
              class="gy-btn gy-btn--light stay-card__cta"
              type="button"
              @click="booking.goToGuestDetails()"
            >
              Book now
            </button>
          </aside>
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
            <p class="review-label">Apartel & room</p>
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
          Thank you. Your request is with the apartel team for confirmation.
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
              You’ll receive an email once the apartel confirms your stay.
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
import RoomCardSkeleton from "@/components/RoomCardSkeleton.vue";
import RoomFacts from "@/components/RoomFacts.vue";
import RoomMediaCarousel from "@/components/RoomMediaCarousel.vue";
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
import { roomDetailPath } from "@/utils/roomPath";

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
    } else if (booking.step < 2) {
      booking.step = 2;
    }
  } else {
    // After sign-in return: restore draft (if any) and fill account details.
    booking.restoreDraft();
  }
  // Legacy Find a stay (step 1) redirects into Choose a room.
  if (booking.step <= 1) booking.step = 2;
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
// Legacy Find a stay (step 1) always redirects into Choose a room.
watch(
  () => booking.step,
  value => {
    if (value <= 1) {
      booking.step = 2;
      return;
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }
);

function roomCover(room: RoomType) {
  return room.images?.find(src => src?.trim())?.trim() || "";
}

function formatStayShort(ymd: string) {
  if (!ymd) return "";
  const d = new Date(`${ymd}T12:00:00`);
  if (Number.isNaN(d.getTime())) return ymd;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short"
  });
}

const stepTitle = computed(() => {
  switch (booking.step) {
    case 1:
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
    case 2:
      return "Search by destination and dates, then compare available rooms.";
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

/** Sidebar preview: selected result, else first availability hit. */
const staySidebar = computed(() => {
  const priced = booking.selected ?? booking.results[0] ?? null;
  const hotelFromSearch = booking.search.hotelSlug
    ? cms.getHotelBySlug(booking.search.hotelSlug)
    : undefined;
  const hotel = priced?.hotel ?? hotelFromSearch;
  const loc = hotel
    ? cms.getLocationById(hotel.locationId)
    : booking.search.locationSlug
      ? cms.getLocationBySlug(booking.search.locationSlug)
      : undefined;
  return {
    priced,
    hotelName: hotel?.name || "Greyon apartel",
    city: (loc?.name || "").trim(),
    checkInTime: hotelCheckInTime(hotel?.checkInTime),
    checkOutTime: hotelCheckOutTime(hotel?.checkOutTime)
  };
});

const assistPhone = computed(
  () =>
    staySidebar.value.priced?.hotel.phone?.trim() ||
    cms.settings.contactPhone?.trim() ||
    ""
);

const assistEmail = computed(
  () =>
    staySidebar.value.priced?.hotel.email?.trim() ||
    cms.settings.contactEmail?.trim() ||
    ""
);

function bookFromSidebar() {
  const priced = staySidebar.value.priced;
  if (!priced) return;
  booking.selectResult(priced);
}

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
  max-width: 1180px;
}

.page-title {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: var(--gy-text-display);
  line-height: 1.05;
  color: var(--gy-forest);
}

.booking-lead {
  margin: 0.55rem 0 0;
  font-family: var(--font-body);
  color: var(--gy-forest);
  max-width: 36rem;
}

.booking-head {
  margin-bottom: 1.25rem;
}

.payment-note {
  padding: 0.85rem 1rem;
  margin: 0 0 1.25rem;
  background: var(--gy-sand);
  color: var(--gy-forest);
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
  margin: 1.35rem 0 1.15rem;
}

.panel-title {
  margin: 0 0 0.35rem;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: var(--gy-text-2xl);
  line-height: 1.15;
  color: var(--gy-forest);
}

.panel__head .gy-btn {
  flex-shrink: 0;
  white-space: nowrap;
}

.panel-sub {
  margin: 0;
  font-family: var(--font-body);
  font-size: 0.92rem;
}

.panel-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.35rem;
}

.choose-room__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(240px, 280px);
  gap: 1.25rem;
  align-items: start;
}

.choose-room__aside {
  display: grid;
  gap: 1rem;
  position: sticky;
  top: 5.5rem;
}

.stay-card,
.assist-card {
  display: grid;
  gap: 0.4rem;
  padding: 1.2rem 1.15rem 1.15rem;
  border-radius: 16px;
  background: var(--gy-cream);
  border: 1px solid rgba(28, 36, 33, 0.08);
}

.stay-card__eyebrow {
  margin: 0;
  font-family: var(--font-display);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--gy-gold);
}

.stay-card__hotel {
  margin: 0;
  font-size: var(--gy-text-xl);
  font-weight: 700;
  line-height: 1.25;
  color: var(--gy-forest);
}

.stay-card__city {
  margin: 0;
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--gy-gold);
}

.stay-card__dates {
  margin: 0.15rem 0 0;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.2rem;
  letter-spacing: -0.02em;
  color: var(--gy-forest);
}

.stay-card__times,
.stay-card__pending,
.stay-card__price span,
.stay-card__room-line {
  margin: 0;
  font-family: var(--font-body);
  font-size: 0.82rem;
  line-height: 1.45;
  color: var(--gy-forest);
}

.stay-card__price {
  display: grid;
  gap: 0.15rem;
  margin-top: 0.35rem;
}

.stay-card__price strong {
  font-family: var(--font-display);
  font-size: 2.2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.05;
  color: var(--gy-forest);
}

.stay-card__cta {
  width: 100%;
  margin-top: 0.55rem;
}

.stay-card__cta:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.assist-card__copy {
  margin: 0;
  font-family: var(--font-body);
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--gy-forest);
}

.assist-card__link {
  display: block;
  font-family: var(--font-display);
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--gy-gold);
  text-decoration: none;
}

.assist-card__link:hover {
  text-decoration: underline;
}

.results {
  display: grid;
  gap: 1rem;
}

.room-detail-step__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(240px, 300px);
  gap: 1.5rem;
  align-items: start;
}

.room-detail-step__gallery {
  overflow: hidden;
  border-radius: 16px;
  margin-bottom: 1.15rem;
  min-height: 240px;
  background: var(--gy-sand);
}

.room-detail-step__gallery :deep(.room-media),
.room-detail-step__gallery :deep(.room-media.room-media--fill) {
  aspect-ratio: 16 / 10;
  min-height: 260px;
  max-height: 440px;
  height: auto;
  border-radius: 16px;
}

.room-detail-step__hotel {
  margin: 0 0 0.25rem;
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--gy-gold);
}

.room-detail-step__title {
  margin: 0 0 0.35rem;
  font-size: var(--gy-text-4xl);
  font-weight: 700;
  color: var(--gy-forest);
}

.room-detail-step__rate {
  margin: 0 0 0.85rem;
  font-family: var(--font-body);
  color: var(--gy-forest);
}

.room-detail-step__desc {
  margin: 1rem 0 0;
  font-family: var(--font-body);
  line-height: 1.55;
}

.room-detail-step__aside {
  position: sticky;
  top: 5.5rem;
}

.amenities-block {
  margin-top: 1.35rem;
}

.amenities-block__title {
  margin: 0 0 0.75rem;
  font-size: var(--gy-text-xl);
  font-weight: 700;
  color: var(--gy-forest);
}

.amenities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.55rem 0.85rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.amenities-grid li {
  position: relative;
  padding-left: 0.95rem;
  font-family: var(--font-body);
  font-size: 0.9rem;
  line-height: 1.4;
  color: var(--gy-forest);
}

.amenities-grid li::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0.55em;
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  background: var(--gy-gold);
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
  color: var(--gy-forest);
  line-height: 1.45;
}

.empty-note {
  margin: 0.5rem 0 0;
  color: var(--gy-forest);
}

.summary-card__hotel {
  margin: 0.75rem 0 0.2rem;
  font-size: 1.15rem;
}

.summary-card__room {
  margin: 0 0 0.55rem;
  color: var(--gy-forest);
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
  color: var(--gy-forest);
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
  font-weight: 700;
  color: var(--gy-forest);
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
  color: var(--gy-gold);
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
  color: var(--gy-gold);
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
  color: var(--gy-forest);
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
  color: var(--gy-gold);
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
  color: var(--gy-forest);
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
  color: var(--gy-forest);
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
  color: var(--gy-forest);
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
  color: var(--gy-gold);
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
  .choose-room__layout,
  .room-detail-step__layout,
  .guest-step {
    grid-template-columns: 1fr;
  }

  .choose-room__aside,
  .room-detail-step__aside,
  .guest-step__summary {
    position: static;
  }

  .choose-room__aside {
    order: 1;
  }

  .guest-step__summary {
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

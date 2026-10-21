<template>
  <q-page v-if="hotel && room" class="room-detail">
    <SeoHead
      :title="seoTitle"
      :description="seoDescription"
      :image="coverImage"
      :json-ld="jsonLd"
    />

    <div class="gy-container room-detail__inner">
      <nav v-reveal class="room-crumb" aria-label="Breadcrumb">
        <router-link to="/hotels">Hotels</router-link>
        <span class="room-crumb__sep" aria-hidden="true">›</span>
        <router-link :to="`/hotels/${hotel.slug}`">{{
          hotel.name
        }}</router-link>
        <span class="room-crumb__sep" aria-hidden="true">›</span>
        <span class="room-crumb__current" aria-current="page">{{
          room.name
        }}</span>
      </nav>

      <div class="room-detail__layout">
        <div class="room-detail__main">
          <section v-reveal class="room-gallery-block">
            <RoomMediaCarousel
              class="room-gallery-block__carousel"
              :images="room.images"
              :alt="room.name"
              :badge="galleryBadge"
            />
          </section>

          <header v-reveal="{ delay: '60ms' }" class="room-header">
            <p class="gy-eyebrow">{{ hotel.name }}</p>
            <h1 class="gy-display">{{ room.name }}</h1>
            <RoomFacts
              :bed-type="room.bedType"
              :room-size="room.roomSize"
              :max-guests="room.maxGuests"
            />
            <p v-if="roomDescription" class="room-header__desc">
              {{ roomDescription }}
            </p>
          </header>

          <section
            v-if="room.amenities.length"
            v-reveal="{ delay: '90ms' }"
            class="room-block"
          >
            <div class="room-block__head">
              <h2 class="gy-display">Amenities</h2>
              <p class="gy-muted">Everything included with this room type.</p>
            </div>
            <FeatureChips
              :items="room.amenities"
              :limit="room.amenities.length"
              :expandable="false"
              size="md"
              sheet-title="Room amenities"
            />
          </section>

          <section
            v-if="hotel.policies.length"
            v-reveal="{ delay: '110ms' }"
            class="room-block"
          >
            <div class="room-block__head">
              <h2 class="gy-display">Stay policies</h2>
              <p class="gy-muted"
                >House rules for your stay at this property.</p
              >
            </div>
            <FeatureChips
              :items="hotel.policies"
              :show-icons="false"
              wrap
              :limit="hotel.policies.length"
              :expandable="false"
              sheet-title="Stay policies"
            />
          </section>

          <section
            v-if="otherRooms.length"
            v-reveal
            class="room-block room-block--others"
          >
            <div class="room-block__head">
              <h2 class="gy-display">Other rooms at this hotel</h2>
              <p class="gy-muted"
                >Compare similar options at {{ hotel.name }}.</p
              >
            </div>
            <div class="room-others">
              <RoomOfferCard
                v-for="other in otherRooms"
                :key="other.id"
                variant="detail"
                :title="other.name"
                :subtitle="roomSubtitle(other)"
                :images="other.images"
                :bed-type="other.bedType"
                :room-size="other.roomSize"
                :max-guests="other.maxGuests"
                :amenities="other.amenities"
                :amenity-limit="4"
                :detail-to="roomDetailPath(hotel, other)"
                :show-view-details="true"
                :price-text="roomPriceText(other.id)"
                :price-per-night="roomPricePerNight(other.id)"
                :cta-label="
                  hasSearchedDates && pricedRoom(other.id)
                    ? 'Book'
                    : 'Check availability'
                "
                :cta-outline="!(hasSearchedDates && pricedRoom(other.id))"
                @cta="bookRoom(other.id)"
              />
            </div>
          </section>

          <p v-reveal class="room-back">
            <router-link :to="`/hotels/${hotel.slug}`" class="room-back__link">
              ← Back to {{ hotel.name }}
            </router-link>
          </p>
        </div>

        <aside
          v-reveal="{ delay: '80ms' }"
          class="room-book"
          aria-label="Book this room"
        >
          <div class="room-book__card">
            <div class="room-book__price">
              <template v-if="priced">
                <span class="room-book__from">Total for your dates</span>
                <strong>${{ priced.total.toFixed(0) }}</strong>
                <span class="room-book__hint">
                  ${{ perNightLabel }} / night · {{ priced.nights }} night{{
                    priced.nights === 1 ? "" : "s"
                  }}
                  · incl. taxes &amp; fees
                </span>
              </template>
              <template v-else-if="fromPrice">
                <span class="room-book__from">From</span>
                <strong>${{ fromPrice.toFixed(0) }}</strong>
                <span class="room-book__hint">per night · before taxes</span>
              </template>
              <template v-else>
                <span class="room-book__from">Rates</span>
                <strong>On request</strong>
                <span class="room-book__hint"
                  >Choose dates to see live availability</span
                >
              </template>
            </div>

            <dl class="room-book__meta">
              <div>
                <dt>Check-in</dt>
                <dd>{{ formatStayDate(booking.search.checkIn) }}</dd>
              </div>
              <div>
                <dt>Check-out</dt>
                <dd>{{ formatStayDate(booking.search.checkOut) }}</dd>
              </div>
              <div>
                <dt>Guests</dt>
                <dd>{{ guestsLabel }}</dd>
              </div>
            </dl>

            <button
              class="gy-btn gy-btn--light room-book__cta"
              type="button"
              :disabled="booking.searching"
              @click="bookThisRoom"
            >
              {{ bookCtaLabel }}
            </button>
            <p v-if="booking.errorMessage" class="room-book__error">
              {{ booking.errorMessage }}
            </p>
          </div>
        </aside>
      </div>
    </div>

    <div class="room-book-bar" role="region" aria-label="Book this room">
      <div class="room-book-bar__price">
        <template v-if="priced">
          <strong>${{ priced.total.toFixed(0) }}</strong>
          <span
            >total · {{ priced.nights }} night{{
              priced.nights === 1 ? "" : "s"
            }}</span
          >
        </template>
        <template v-else-if="fromPrice">
          <strong>From ${{ fromPrice.toFixed(0) }}</strong>
          <span>per night</span>
        </template>
        <template v-else>
          <strong>Check dates</strong>
          <span>See live rates</span>
        </template>
      </div>
      <button
        class="gy-btn gy-btn--light room-book-bar__cta"
        type="button"
        :disabled="booking.searching"
        @click="bookThisRoom"
      >
        {{ bookCtaLabel }}
      </button>
    </div>
  </q-page>

  <q-page v-else-if="catalogReady" class="gy-section gy-container room-missing">
    <SeoHead
      title="Room not found | Greyon"
      description="We couldn’t find that room. Browse Greyon hotels to continue."
    />
    <p class="gy-eyebrow">Room</p>
    <h1 class="gy-display">We couldn’t find that room</h1>
    <p class="gy-muted room-missing__copy">
      It may have been removed or the link is out of date. Head back to the
      hotel or browse all Greyon properties.
    </p>
    <div class="room-missing__actions">
      <router-link
        v-if="hotel"
        :to="`/hotels/${hotel.slug}`"
        class="gy-btn gy-btn--light"
      >
        Back to {{ hotel.name }}
      </router-link>
      <router-link to="/hotels" class="gy-btn gy-btn--outline"
        >All hotels</router-link
      >
    </div>
  </q-page>

  <q-page v-else class="gy-section gy-container room-missing">
    <SeoHead title="Room | Greyon" description="Loading room details." />
    <p class="gy-muted">Loading room details…</p>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import FeatureChips from "@/components/FeatureChips.vue";
import RoomFacts from "@/components/RoomFacts.vue";
import RoomMediaCarousel from "@/components/RoomMediaCarousel.vue";
import RoomOfferCard from "@/components/RoomOfferCard.vue";
import SeoHead from "@/components/SeoHead.vue";
import { useBookingStore } from "@/stores/booking-store";
import { useCmsStore } from "@/stores/cms-store";
import type { RoomType } from "@/types/greyon";
import { roomDetailPath } from "@/utils/roomPath";

const route = useRoute();
const router = useRouter();
const booking = useBookingStore();
const cms = useCmsStore();
const catalogReady = ref(false);

const hotelSlug = computed(() => String(route.params.hotelSlug || ""));
const roomSlug = computed(() => String(route.params.roomSlug || ""));

const hotel = computed(() => cms.getHotelBySlug(hotelSlug.value));
const room = computed(() => {
  if (!hotel.value) return undefined;
  return cms.getRoomTypeByHotelAndKey(hotel.value.id, roomSlug.value);
});

watch(
  hotelSlug,
  slug => {
    if (!slug) return;
    void (async () => {
      try {
        await cms.ensurePublicCatalog();
        await cms.hydrateHotelDetail(slug);
      } catch {
        /* list catalog still usable */
      } finally {
        catalogReady.value = true;
      }
    })();
  },
  { immediate: true }
);

watch(
  hotel,
  h => {
    if (!h) return;
    const loc = cms.getLocationById(h.locationId);
    if (booking.search.hotelSlug !== h.slug) {
      booking.setSearch({
        hotelSlug: h.slug,
        locationSlug: loc?.slug ?? ""
      });
    }
  },
  { immediate: true }
);

const coverImage = computed(
  () =>
    room.value?.images.find(src => src.trim()) || hotel.value?.heroImage || ""
);

const roomDescription = computed(() => {
  const desc = room.value?.description?.trim() || "";
  const name = room.value?.name?.trim() || "";
  if (!desc || desc.toLowerCase() === name.toLowerCase()) return "";
  return desc;
});

const seoTitle = computed(() =>
  room.value && hotel.value
    ? `${room.value.name} · ${hotel.value.name} | Greyon`
    : "Room | Greyon"
);

const seoDescription = computed(() => {
  if (!room.value || !hotel.value) return "";
  return (
    roomDescription.value ||
    `${room.value.name} at ${hotel.value.name}. ${
      room.value.bedType || "Comfortable stay"
    }${room.value.maxGuests ? ` · up to ${room.value.maxGuests} guests` : ""}.`
  );
});

const jsonLd = computed(() =>
  room.value && hotel.value
    ? {
        "@context": "https://schema.org",
        "@type": "HotelRoom",
        name: room.value.name,
        description: seoDescription.value,
        image: room.value.images,
        occupancy: {
          "@type": "QuantitativeValue",
          maxValue: room.value.maxGuests
        },
        containedInPlace: {
          "@type": "Hotel",
          name: hotel.value.name,
          url: `https://greyon.site/hotels/${hotel.value.slug}`
        }
      }
    : null
);

const otherRooms = computed(() => {
  if (!hotel.value || !room.value) return [];
  return cms
    .getRoomTypesByHotelId(hotel.value.id)
    .filter(r => r.id !== room.value?.id)
    .slice(0, 4);
});

const hasSearchedDates = computed(
  () =>
    Boolean(booking.search.checkIn && booking.search.checkOut) &&
    booking.results.length > 0 &&
    booking.results.some(r => r.hotel.id === hotel.value?.id)
);

function pricedRoom(roomTypeId: string) {
  if (!hotel.value) return null;
  return (
    booking.results.find(
      r => r.hotel.id === hotel.value?.id && r.roomType.id === roomTypeId
    ) ?? null
  );
}

const priced = computed(() => (room.value ? pricedRoom(room.value.id) : null));

const fromPrice = computed(() => {
  if (!room.value) return null;
  const plan = cms.getRatePlanByRoomTypeId(room.value.id);
  if (!plan || !(plan.basePrice > 0)) return null;
  return plan.basePrice;
});

const perNightLabel = computed(() => {
  if (!priced.value || !priced.value.nights) return "0";
  return (priced.value.total / priced.value.nights).toFixed(0);
});

const galleryBadge = computed(() => {
  if (
    priced.value &&
    priced.value.availableUnits > 0 &&
    priced.value.availableUnits <= 8
  ) {
    return `${priced.value.availableUnits} left`;
  }
  return room.value?.bedType?.trim() || "";
});

const guestsLabel = computed(() => {
  const { adults, children, rooms } = booking.search;
  const parts = [
    `${adults} adult${adults === 1 ? "" : "s"}`,
    children > 0 ? `${children} child${children === 1 ? "" : "ren"}` : "",
    rooms > 1 ? `${rooms} rooms` : ""
  ].filter(Boolean);
  return parts.join(" · ");
});

const bookCtaLabel = computed(() => {
  if (booking.searching) return "Checking…";
  if (priced.value) return "Book";
  return "Check availability";
});

function formatStayDate(ymd: string) {
  if (!ymd) return "—";
  const d = new Date(`${ymd}T12:00:00`);
  if (Number.isNaN(d.getTime())) return ymd;
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

function roomSubtitle(r: RoomType) {
  const desc = r.description?.trim() || "";
  const name = r.name?.trim() || "";
  if (desc && desc.toLowerCase() !== name.toLowerCase()) return desc;
  if (r.roomSize && r.bedType) return `${r.bedType} · ${r.roomSize}`;
  if (r.roomSize) return r.roomSize;
  if (r.maxGuests) return `Sleeps up to ${r.maxGuests}`;
  return "Comfortable Greyon stay";
}

function roomPriceText(roomTypeId: string) {
  const match = pricedRoom(roomTypeId);
  return match ? `$${match.total.toFixed(2)}` : "";
}

function roomPricePerNight(roomTypeId: string) {
  const match = pricedRoom(roomTypeId);
  if (!match || !match.nights) return "";
  return `$${(match.total / match.nights).toFixed(0)} per night`;
}

async function bookRoom(roomTypeId: string) {
  if (!hotel.value) return;
  const loc = cms.getLocationById(hotel.value.locationId);
  booking.startFromHotel(hotel.value.slug, loc?.slug ?? "");
  const match = pricedRoom(roomTypeId);
  if (match) {
    booking.selectResult(match);
    void router.push({ name: "booking" });
    return;
  }
  await booking.runSearch();
  const found = booking.results.find(r => r.roomType.id === roomTypeId);
  if (found) booking.selectResult(found);
  void router.push({ name: "booking" });
}

async function bookThisRoom() {
  if (!room.value) return;
  await bookRoom(room.value.id);
}
</script>

<style scoped>
.room-detail {
  padding-bottom: 6rem;
  background:
    radial-gradient(
      ellipse 80% 40% at 10% 0%,
      rgba(196, 163, 90, 0.08),
      transparent 55%
    ),
    linear-gradient(
      180deg,
      var(--gy-cream) 0%,
      #f6f4f1 40%,
      var(--gy-sand) 100%
    );
}

.room-detail__inner {
  padding-top: 1.25rem;
  padding-bottom: 2.5rem;
}

.room-crumb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.45rem;
  margin: 0 0 1.25rem;
  font-size: 0.82rem;
  line-height: 1.4;
  color: var(--gy-muted);
}

.room-crumb a {
  color: var(--gy-forest);
  text-decoration: none;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  transition: color 0.2s ease;
}

.room-crumb a:hover {
  color: var(--gy-ink);
  text-decoration: underline;
}

.room-crumb__sep {
  opacity: 0.55;
}

.room-crumb__current {
  color: var(--gy-ink);
  font-weight: 600;
}

.room-detail__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.75rem;
  align-items: start;
}

.room-detail__main {
  min-width: 0;
}

.room-gallery-block__carousel {
  width: 100%;
  max-width: 100%;
  aspect-ratio: 16 / 10;
  border-radius: 18px;
  box-shadow:
    0 1px 2px rgba(69, 76, 75, 0.05),
    0 16px 40px rgba(69, 76, 75, 0.1);
}

.room-header {
  margin-top: 1.5rem;
  display: grid;
  gap: 0.75rem;
}

.room-header h1 {
  margin: 0;
  font-size: clamp(1.85rem, 4vw, 2.65rem);
  line-height: 1.15;
}

.room-header__desc {
  margin: 0.25rem 0 0;
  max-width: 42rem;
  font-size: 1.05rem;
  line-height: 1.7;
  color: var(--gy-ink);
}

.room-block {
  margin-top: 2.25rem;
}

.room-block__head {
  margin-bottom: 1rem;
}

.room-block__head h2 {
  margin: 0 0 0.35rem;
  font-size: clamp(1.45rem, 2.5vw, 1.85rem);
}

.room-block__head .gy-muted {
  margin: 0;
}

.room-others {
  display: grid;
  gap: 1rem;
}

.room-back {
  margin: 2.5rem 0 0;
}

.room-back__link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: var(--gy-forest);
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s ease;
}

.room-back__link:hover {
  color: var(--gy-ink);
  text-decoration: underline;
}

.room-book {
  display: none;
}

.room-book__card {
  position: sticky;
  top: 5.5rem;
  display: grid;
  gap: 1.1rem;
  padding: 1.25rem 1.2rem 1.35rem;
  background: var(--gy-white);
  border-radius: 16px;
  box-shadow:
    0 1px 2px rgba(69, 76, 75, 0.05),
    0 18px 40px rgba(69, 76, 75, 0.1);
}

.room-book__price {
  display: grid;
  gap: 0.2rem;
}

.room-book__from {
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gy-muted);
  font-weight: 600;
}

.room-book__price strong {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 600;
  line-height: 1.05;
  letter-spacing: -0.02em;
  color: var(--gy-ink);
}

.room-book__hint {
  font-size: 0.8rem;
  color: var(--gy-muted);
  line-height: 1.4;
}

.room-book__meta {
  display: grid;
  gap: 0.65rem;
  margin: 0;
  padding: 0.85rem 0;
  border-top: 1px solid rgba(69, 76, 75, 0.08);
  border-bottom: 1px solid rgba(69, 76, 75, 0.08);
}

.room-book__meta > div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: baseline;
}

.room-book__meta dt {
  margin: 0;
  font-size: 0.78rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--gy-muted);
}

.room-book__meta dd {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--gy-ink);
  text-align: right;
}

.room-book__cta {
  width: 100%;
  min-height: 48px;
}

.room-book__error {
  margin: 0;
  font-size: 0.85rem;
  color: #9a3b2f;
  line-height: 1.4;
}

.room-book-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
  padding: 0.85rem 1rem calc(0.85rem + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.97);
  border-top: 1px solid rgba(69, 76, 75, 0.1);
  box-shadow: 0 -12px 28px rgba(69, 76, 75, 0.1);
  backdrop-filter: blur(10px);
}

.room-book-bar__price {
  display: grid;
  gap: 0.1rem;
  min-width: 0;
}

.room-book-bar__price strong {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.1;
  color: var(--gy-ink);
}

.room-book-bar__price span {
  font-size: 0.72rem;
  color: var(--gy-muted);
}

.room-book-bar__cta {
  flex-shrink: 0;
  min-height: 44px;
  min-width: 9.5rem;
  padding-inline: 1rem;
  font-size: 0.72rem;
}

.room-missing h1 {
  margin: 0 0 0.75rem;
  font-size: clamp(1.85rem, 4vw, 2.5rem);
}

.room-missing__copy {
  max-width: 32rem;
  margin: 0 0 1.5rem;
  line-height: 1.6;
}

.room-missing__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

@media (min-width: 900px) {
  .room-detail {
    padding-bottom: 2.5rem;
  }

  .room-detail__layout {
    grid-template-columns: minmax(0, 1fr) minmax(260px, 320px);
    gap: 2rem;
  }

  .room-book {
    display: block;
  }

  .room-book-bar {
    display: none;
  }

  .room-gallery-block__carousel {
    aspect-ratio: 16 / 9;
    min-height: 320px;
  }
}

@media (max-width: 389px) {
  .room-book-bar__cta {
    min-width: 0;
    padding-inline: 0.75rem;
  }
}
</style>

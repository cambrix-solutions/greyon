<template>
  <q-page v-if="hotel">
    <SeoHead
      :title="`${hotel.name} | Greyon`"
      :description="hotel.shortDescription"
      :image="hotel.heroImage"
      :json-ld="jsonLd"
    />

    <section class="detail-hero gy-card-media">
      <img :src="hotel.heroImage" :alt="hotel.name" />
      <div class="detail-hero__veil" />
      <div class="gy-container detail-hero__content">
        <p v-reveal class="gy-eyebrow">{{ locationName }}</p>
        <h1 v-reveal="{ delay: '80ms' }" class="gy-display">{{ hotel.name }}</h1>
        <p v-reveal="{ delay: '140ms' }" class="detail-hero__lead">{{ hotel.shortDescription }}</p>
      </div>
    </section>

    <div class="gy-container gy-section detail-wrap">
      <div v-reveal="{ delay: '60ms' }" class="detail-top">
        <div>
          <p class="lead">{{ hotel.description }}</p>
          <div class="meta-grid">
            <div>
              <span class="meta-label">Address</span>
              <p>{{ hotel.address }}</p>
            </div>
            <div>
              <span class="meta-label">Contact</span>
              <p>{{ hotel.phone }}</p>
              <p>{{ hotel.email }}</p>
            </div>
            <div>
              <span class="meta-label">Stay times</span>
              <p>Check-in {{ hotel.checkInTime }}</p>
              <p>Check-out {{ hotel.checkOutTime }}</p>
            </div>
            <div v-if="fromPrice !== null">
              <span class="meta-label">Rates from</span>
              <p class="meta-price">${{ fromPrice }} / night</p>
            </div>
          </div>
        </div>
        <div class="actions">
          <button class="gy-btn gy-btn--light" type="button" @click="bookHotel">
            Book now
          </button>
          <router-link to="/hotels" class="gy-btn gy-btn--outline"
            >All hotels</router-link
          >
        </div>
      </div>

      <section v-reveal class="block">
        <div class="block-head">
          <h2 class="gy-display">Hotel features</h2>
          <p class="gy-muted">Amenities guests can expect during their stay.</p>
        </div>
        <p class="feature-line">{{ hotel.amenities.join(" · ") }}</p>
      </section>

      <section v-reveal class="block">
        <div class="block-head">
          <h2 class="gy-display">Gallery</h2>
        </div>
        <div class="gallery">
          <div
            v-for="(img, idx) in gallery"
            :key="idx"
            v-reveal="{ delay: `${Math.min(idx, 5) * 70}ms` }"
            class="gy-card-media gallery__item"
          >
            <img :src="img" :alt="`${hotel.name} gallery ${idx + 1}`" loading="lazy" />
          </div>
        </div>
      </section>

      <section v-reveal class="block">
        <div class="block-head">
          <h2 class="gy-display">Rooms & features</h2>
          <p class="gy-muted">
            Compare room size, occupancy, and in-room features before you book.
          </p>
        </div>
        <BookingSearchWidget :navigate="false" submit-label="Update search" />
        <div class="room-list">
          <article v-for="room in rooms" :key="room.id" class="room-card">
            <div class="gy-card-media room-card__media">
              <img :src="room.images[0]" :alt="room.name" loading="lazy" />
              <span v-if="rateFor(room.id)" class="room-card__badge">
                From ${{ rateFor(room.id)?.basePrice }}/night
              </span>
            </div>
            <div class="room-card__body">
              <h3 class="gy-display">{{ room.name }}</h3>
              <p class="room-card__desc">{{ room.description }}</p>
              <p class="room-card__facts">
                {{ room.bedType }}
                <span>·</span>
                {{ room.roomSize }}
                <span>·</span>
                Up to {{ room.maxGuests }} guests
              </p>
              <p class="room-card__tags">
                {{ room.amenities.join(" · ") }}
              </p>
              <p v-if="rateFor(room.id)" class="room-card__meal">
                {{ rateFor(room.id)?.mealBenefit }}
              </p>
              <div class="room-card__actions">
                <button
                  class="gy-btn gy-btn--light"
                  type="button"
                  @click="bookRoom(room.id)"
                >
                  Book this room
                </button>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section class="block policies-block">
        <div>
          <h2 class="gy-display">Stay policies</h2>
          <ul class="policy-list">
            <li v-for="item in hotel.policies" :key="item">{{ item }}</li>
          </ul>
        </div>
        <div>
          <h2 class="gy-display">Location</h2>
          <p class="gy-muted">{{ hotel.address }}</p>
          <MapEmbed
            class="q-mt-md"
            :lat="hotel.coordinates.lat"
            :lng="hotel.coordinates.lng"
          />
        </div>
      </section>

      <section v-if="related.length" class="block">
        <div class="block-head">
          <h2 class="gy-display">Nearby Greyon hotels</h2>
        </div>
        <div class="gy-grid-3">
          <HotelCard v-for="item in related" :key="item.id" :hotel="item" />
        </div>
      </section>
    </div>
  </q-page>
  <q-page v-else class="gy-section gy-container">
    <h1 class="gy-display">Hotel not found</h1>
    <router-link to="/hotels" class="gy-btn">Back to hotels</router-link>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import BookingSearchWidget from "@/components/BookingSearchWidget.vue";
import HotelCard from "@/components/HotelCard.vue";
import MapEmbed from "@/components/MapEmbed.vue";
import SeoHead from "@/components/SeoHead.vue";
import { useBookingStore } from "@/stores/booking-store";
import { useCmsStore } from "@/stores/cms-store";

const route = useRoute();
const router = useRouter();
const booking = useBookingStore();
const cms = useCmsStore();

const hotel = computed(() => cms.getHotelBySlug(String(route.params.slug)));
const locationName = computed(
  () =>
    cms.getLocationById(hotel.value?.locationId ?? "")?.name ?? "Cambodia"
);
const rooms = computed(() =>
  hotel.value ? cms.getRoomTypesByHotelId(hotel.value.id) : []
);
const gallery = computed(() =>
  hotel.value ? [hotel.value.heroImage, ...hotel.value.gallery] : []
);
const related = computed(() => {
  if (!hotel.value) return [];
  return cms.publishedHotels
    .filter(
      h => h.locationId === hotel.value?.locationId && h.id !== hotel.value?.id
    )
    .slice(0, 3);
});

const fromPrice = computed(() => {
  const prices = rooms.value
    .map(r => cms.getRatePlanByRoomTypeId(r.id)?.basePrice)
    .filter((n): n is number => typeof n === "number");
  if (!prices.length) return null;
  return Math.min(...prices);
});

const jsonLd = computed(() =>
  hotel.value
    ? {
        "@context": "https://schema.org",
        "@type": "Hotel",
        name: hotel.value.name,
        description: hotel.value.shortDescription,
        address: hotel.value.address,
        telephone: hotel.value.phone,
        image: hotel.value.heroImage
      }
    : null
);

function rateFor(roomTypeId: string) {
  return cms.getRatePlanByRoomTypeId(roomTypeId);
}

function bookHotel() {
  if (!hotel.value) return;
  const loc = cms.getLocationById(hotel.value.locationId);
  booking.startFromHotel(hotel.value.slug, loc?.slug ?? "");
  void router.push({ name: "booking" });
}

async function bookRoom(roomTypeId: string) {
  bookHotel();
  await booking.runSearch();
  const match = booking.results.find(r => r.roomType.id === roomTypeId);
  if (match) booking.selectResult(match);
}
</script>

<style scoped>
.detail-hero {
  position: relative;
  height: min(68vh, 620px);
  color: var(--gy-white);
}

.detail-hero__veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(18, 24, 22, 0.15) 0%,
    rgba(18, 24, 22, 0.72) 100%
  );
}

.detail-hero__content {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 2.25rem;
  z-index: 1;
}

.detail-hero__content .gy-eyebrow {
  color: var(--gy-gold);
}

.detail-hero h1 {
  margin: 0 0 0.55rem;
  font-size: clamp(2.5rem, 5.5vw, 4rem);
  line-height: 1.05;
}

.detail-hero__lead {
  margin: 0;
  max-width: 36rem;
  font-size: 1.08rem;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.9);
}

.detail-top {
  display: grid;
  grid-template-columns: 1.5fr auto;
  gap: 1.5rem 2rem;
  align-items: start;
}

.lead {
  max-width: 48rem;
  margin: 0 0 1.5rem;
  font-size: 1.08rem;
  line-height: 1.75;
  color: var(--gy-ink);
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem 1.25rem;
}

.meta-label {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--gy-muted);
}

.meta-grid p {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.45;
}

.meta-price {
  font-family: var(--font-display);
  font-size: 1.45rem !important;
  color: var(--gy-forest);
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  min-width: 11rem;
}

.block {
  margin-top: 3rem;
}

.block-head {
  margin-bottom: 1.15rem;
}

.block-head h2,
.block h2 {
  margin: 0 0 0.4rem;
  font-size: clamp(1.85rem, 3vw, 2.25rem);
}

.block-head .gy-muted {
  margin: 0;
  max-width: 36rem;
}

.gallery {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;
}

.gallery__item {
  aspect-ratio: 4 / 3;
}

.room-list {
  display: grid;
  gap: 1.35rem;
  margin-top: 1.5rem;
}

.room-card {
  display: grid;
  grid-template-columns: minmax(240px, 320px) 1fr;
  gap: 1.35rem;
  padding: 1.1rem;
  background: var(--gy-white);
  border: 1px solid rgba(28, 36, 33, 0.08);
}

.room-card__media {
  position: relative;
  aspect-ratio: 4 / 3;
  align-self: start;
}

.room-card__badge {
  position: absolute;
  left: 0.75rem;
  bottom: 0.75rem;
  z-index: 1;
  padding: 0.35rem 0.55rem;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  background: rgba(255, 255, 255, 0.94);
  color: var(--gy-ink);
}

.room-card__body {
  display: grid;
  gap: 0.75rem;
  align-content: start;
}

.room-card h3 {
  margin: 0;
  font-size: clamp(1.55rem, 2.4vw, 1.9rem);
  line-height: 1.15;
}

.room-card__desc {
  margin: 0;
  color: var(--gy-muted);
  line-height: 1.6;
}

.room-card__facts,
.room-card__tags,
.feature-line {
  margin: 0;
  font-size: 0.92rem;
  color: var(--gy-muted);
  line-height: 1.5;
}

.room-card__facts span {
  margin: 0 0.2rem;
  opacity: 0.7;
}

.room-card__meal {
  margin: 0;
  font-size: 0.9rem;
  color: var(--gy-forest);
}

.room-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 0.15rem;
}

.policies-block {
  display: grid;
  grid-template-columns: 1fr 1.1fr;
  gap: 2rem;
}

.policy-list {
  margin: 0.75rem 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.55rem;
}

.policy-list li {
  padding: 0.75rem 0.9rem;
  background: var(--gy-sand);
  border-left: 2px solid var(--gy-gold);
  line-height: 1.5;
}

@media (max-width: 960px) {
  .detail-top,
  .meta-grid,
  .policies-block {
    grid-template-columns: 1fr;
  }

  .actions {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .gallery {
    grid-template-columns: 1fr 1fr;
  }

  .room-card {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .gallery {
    grid-template-columns: 1fr;
  }
}
</style>

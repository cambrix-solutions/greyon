<template>
  <q-page v-if="hotel">
    <SeoHead
      :title="`${hotel.name} | Greyon`"
      :description="hotel.shortDescription"
      :image="coverImage"
      :json-ld="jsonLd"
    />

    <section class="detail-hero gy-card-media">
      <img v-if="coverImage" :src="coverImage" :alt="hotel.name" />
      <div class="detail-hero__veil" />
      <div class="gy-container detail-hero__content">
        <p v-reveal class="gy-eyebrow">{{ locationName }}</p>
        <h1 v-reveal="{ delay: '80ms' }" class="gy-display">{{
          hotel.name
        }}</h1>
        <div
          v-if="hotel.propertyType || starLabel"
          v-reveal="{ delay: '110ms' }"
          class="detail-hero__badges"
        >
          <span v-if="hotel.propertyType" class="hero-badge">{{
            hotel.propertyType
          }}</span>
          <span v-if="starLabel" class="hero-badge hero-badge--stars">{{
            starLabel
          }}</span>
        </div>
        <p v-reveal="{ delay: '140ms' }" class="detail-hero__lead">{{
          hotel.shortDescription
        }}</p>
      </div>
    </section>

    <div class="gy-container gy-section detail-wrap">
      <div v-reveal="{ delay: '60ms' }" class="detail-top">
        <div>
          <p class="lead">{{ hotel.description }}</p>
          <div class="meta-grid">
            <div>
              <span class="meta-label">Address</span>
              <p v-if="hotel.area" class="meta-area">{{ hotel.area }}</p>
              <p>{{ hotel.address }}</p>
            </div>
            <div>
              <span class="meta-label">Contact</span>
              <p>{{ hotel.phone || "—" }}</p>
              <p>{{ hotel.email || "—" }}</p>
            </div>
            <div>
              <span class="meta-label">Stay times</span>
              <p>Check-in {{ hotel.checkInTime || "—" }}</p>
              <p>Check-out {{ hotel.checkOutTime || "—" }}</p>
            </div>
          </div>
        </div>
        <div class="actions">
          <button
            class="gy-btn gy-btn--light"
            type="button"
            @click="scrollToRooms"
          >
            View rooms
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
        <FeatureChips :items="hotel.amenities" />
      </section>

      <section v-if="hotelServices.length" v-reveal class="block">
        <div class="block-head">
          <h2 class="gy-display">Services</h2>
          <p class="gy-muted"
            >Experiences and facilities available at this property.</p
          >
        </div>
        <ul class="service-chips">
          <li v-for="svc in hotelServices" :key="svc.id">
            <q-icon :name="svc.icon || 'spa'" size="14px" />
            <span>{{ svc.name }}</span>
          </li>
        </ul>
      </section>

      <section v-if="hotelProducts.length" v-reveal class="block">
        <div class="block-head">
          <h2 class="gy-display">Products</h2>
          <p class="gy-muted"
            >Add-ons and items you can request with your stay.</p
          >
        </div>
        <div class="product-grid">
          <article
            v-for="product in hotelProducts"
            :key="product.id"
            class="product-card"
          >
            <div
              class="product-card__media"
              :class="{ 'product-card__media--icon': !product.imageUrl }"
            >
              <img
                v-if="product.imageUrl"
                :src="product.imageUrl"
                :alt="product.name"
                loading="lazy"
              />
              <div v-else class="product-card__placeholder" aria-hidden="true">
                <q-icon :name="product.icon || 'storefront'" size="28px" />
              </div>
            </div>
            <div class="product-card__body">
              <h3 class="product-card__title">{{ product.name }}</h3>
              <p v-if="product.description" class="product-card__desc">
                {{ product.description }}
              </p>
              <p v-if="productPriceLabel(product)" class="product-card__price">
                {{ productPriceLabel(product) }}
              </p>
            </div>
          </article>
        </div>
      </section>

      <section v-if="landmarks.length" v-reveal class="block">
        <div class="block-head">
          <h2 class="gy-display">Nearby landmarks</h2>
          <p class="gy-muted">
            Distances from the property to places guests ask about most.
          </p>
        </div>
        <ul class="landmark-list">
          <li v-for="item in landmarks" :key="`${item.place}-${item.distance}`">
            <span class="landmark-list__place">{{ item.place }}</span>
            <span class="landmark-list__distance">{{ item.distance }}</span>
          </li>
        </ul>
      </section>

      <section v-if="gallery.length" v-reveal class="block">
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
            <img
              :src="img"
              :alt="`${hotel.name} gallery ${idx + 1}`"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section id="rooms" v-reveal class="block">
        <div class="block-head">
          <h2 class="gy-display">Rooms & features</h2>
          <p class="gy-muted">
            Select dates to see live rates, then open room details before
            booking.
          </p>
        </div>
        <BookingSearchWidget
          :navigate="false"
          submit-label="Check availability"
        />
        <p v-if="!hasSearchedDates" class="gy-muted room-price-hint">
          Prices appear after you choose check-in and check-out dates.
        </p>
        <div v-if="roomsLoading" class="room-list">
          <RoomCardSkeleton
            v-for="n in 2"
            :key="`skel-${n}`"
            variant="detail"
          />
        </div>
        <div v-else class="room-list">
          <RoomOfferCard
            v-for="room in rooms"
            :key="room.id"
            variant="detail"
            :title="room.name"
            :subtitle="roomSubtitle(room)"
            :images="room.images"
            :bed-type="room.bedType"
            :room-size="room.roomSize"
            :max-guests="room.maxGuests"
            :amenities="room.amenities"
            :amenity-limit="5"
            :badge="roomBadge(room.id, room)"
            :meta="pricedRoom(room.id)?.ratePlan.mealBenefit || ''"
            :price-text="roomPriceText(room.id)"
            :price-per-night="roomPricePerNight(room.id)"
            :price-hint="
              pricedRoom(room.id) ? 'incl. taxes & fees for your dates' : ''
            "
            :cta-label="
              hasSearchedDates && pricedRoom(room.id)
                ? 'View room details'
                : 'Check availability'
            "
            :cta-outline="!(hasSearchedDates && pricedRoom(room.id))"
            @cta="
              hasSearchedDates && pricedRoom(room.id)
                ? openRoom(room.id)
                : focusSearch()
            "
          />
        </div>
      </section>

      <div
        v-if="stickyBarVisible"
        class="room-sticky"
        role="region"
        aria-label="Room booking summary"
      >
        <div class="room-sticky__price">
          <template v-if="stickyPriced">
            <strong>${{ stickyPriced.total.toFixed(0) }}</strong>
            <span
              >incl. taxes · {{ stickyPriced.nights }} night{{
                stickyPriced.nights === 1 ? "" : "s"
              }}</span
            >
          </template>
          <template v-else>
            <strong>Check dates</strong>
            <span>See live rates for this stay</span>
          </template>
        </div>
        <button
          class="gy-btn gy-btn--light room-sticky__cta"
          type="button"
          @click="
            stickyPriced ? openRoom(stickyPriced.roomType.id) : focusSearch()
          "
        >
          {{ stickyPriced ? "View room details" : "Check availability" }}
        </button>
      </div>

      <section class="block policies-block">
        <div>
          <h2 class="gy-display">Stay policies</h2>
          <FeatureChips
            v-if="hotel.policies.length"
            :items="hotel.policies"
            :show-icons="false"
          />
          <p v-else class="gy-muted">Policies will appear here when set.</p>
        </div>
        <div>
          <h2 class="gy-display">Destination</h2>
          <p v-if="hotel.area" class="meta-area">{{ hotel.area }}</p>
          <p class="gy-muted">{{ hotel.address }}</p>
          <MapEmbed
            class="q-mt-md"
            :lat="hotel.coordinates.lat"
            :lng="hotel.coordinates.lng"
            :embed-url="hotel.mapEmbedUrl"
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
import { computed, watch } from "vue";
import { useQuasar } from "quasar";
import { useRoute, useRouter } from "vue-router";
import BookingSearchWidget from "@/components/BookingSearchWidget.vue";
import FeatureChips from "@/components/FeatureChips.vue";
import HotelCard from "@/components/HotelCard.vue";
import MapEmbed from "@/components/MapEmbed.vue";
import RoomCardSkeleton from "@/components/RoomCardSkeleton.vue";
import RoomOfferCard from "@/components/RoomOfferCard.vue";
import SeoHead from "@/components/SeoHead.vue";
import { useBookingStore } from "@/stores/booking-store";
import { useCmsStore } from "@/stores/cms-store";
import type { HotelProductRef, RoomType } from "@/types/greyon";

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const booking = useBookingStore();
const cms = useCmsStore();

const hotel = computed(() => cms.getHotelBySlug(String(route.params.slug)));

watch(
  () => String(route.params.slug),
  slug => {
    if (!slug) return;
    void cms.hydrateHotelDetail(slug).catch(() => {
      /* catalog list still usable if detail enrich fails */
    });
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

function compareLinked(
  a: { name: string; sortOrder?: number },
  b: { name: string; sortOrder?: number }
) {
  const ao = a.sortOrder;
  const bo = b.sortOrder;
  if (ao !== undefined && bo !== undefined && ao !== bo) return ao - bo;
  if (ao !== undefined && bo === undefined) return -1;
  if (ao === undefined && bo !== undefined) return 1;
  return a.name.localeCompare(b.name);
}

const hotelServices = computed(() =>
  [...(hotel.value?.services ?? [])].sort(compareLinked)
);

const hotelProducts = computed(() =>
  [...(hotel.value?.products ?? [])].sort(compareLinked)
);

/** Price only when the API included it on the product. */
function productPriceLabel(product: HotelProductRef) {
  if (product.price === null || product.price === undefined) return "";
  const cur = (product.currency || "USD").toUpperCase();
  if (cur === "KHR") {
    return `${Math.round(product.price).toLocaleString()} KHR`;
  }
  return `$${Number(product.price).toFixed(2)}`;
}
const locationName = computed(
  () => cms.getLocationById(hotel.value?.locationId ?? "")?.name ?? "Cambodia"
);
const rooms = computed(() =>
  hotel.value ? cms.getRoomTypesByHotelId(hotel.value.id) : []
);
const coverImage = computed(
  () =>
    hotel.value?.heroImage?.trim() ||
    hotel.value?.gallery.find(src => src.trim()) ||
    ""
);
const gallery = computed(() => {
  if (!hotel.value) return [];
  const urls = [hotel.value.heroImage, ...hotel.value.gallery]
    .map(src => src.trim())
    .filter(Boolean);
  return [...new Set(urls)];
});
const landmarks = computed(() => hotel.value?.nearbyLandmarks ?? []);
const starLabel = computed(() => {
  const n = hotel.value?.starRating;
  if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) return "";
  const stars = Math.min(5, Math.max(1, Math.round(n)));
  return `${"★".repeat(stars)}${"☆".repeat(5 - stars)} ${stars}-star`;
});
const related = computed(() => {
  if (!hotel.value) return [];
  return cms.publishedHotels
    .filter(
      h => h.locationId === hotel.value?.locationId && h.id !== hotel.value?.id
    )
    .slice(0, 3);
});

const hasSearchedDates = computed(
  () =>
    Boolean(booking.search.checkIn && booking.search.checkOut) &&
    booking.results.length > 0 &&
    booking.results.some(r => r.hotel.id === hotel.value?.id)
);

const roomsLoading = computed(() => booking.searching);

const hotelResults = computed(() =>
  hotel.value ? booking.results.filter(r => r.hotel.id === hotel.value?.id) : []
);

const stickyPriced = computed(() => {
  if (!hotelResults.value.length) return null;
  return [...hotelResults.value].sort((a, b) => a.total - b.total)[0] ?? null;
});

const stickyBarVisible = computed(
  () => $q.screen.lt.sm && Boolean(hotel.value) && rooms.value.length > 0
);

const jsonLd = computed(() =>
  hotel.value
    ? {
        "@context": "https://schema.org",
        "@type": "Hotel",
        name: hotel.value.name,
        description: hotel.value.shortDescription,
        address: hotel.value.address,
        telephone: hotel.value.phone,
        image: coverImage.value
      }
    : null
);

function pricedRoom(roomTypeId: string) {
  if (!hotel.value) return null;
  return (
    booking.results.find(
      r => r.hotel.id === hotel.value?.id && r.roomType.id === roomTypeId
    ) ?? null
  );
}

/** Avoid repeating the room name / bed type already shown in facts. */
function roomSubtitle(room: RoomType) {
  const desc = room.description?.trim() || "";
  const name = room.name?.trim() || "";
  const bed = room.bedType?.trim() || "";
  const size = room.roomSize?.trim() || "";
  const lower = desc.toLowerCase();
  if (
    desc &&
    lower !== name.toLowerCase() &&
    lower !== bed.toLowerCase() &&
    !lower.startsWith(name.toLowerCase())
  ) {
    return desc;
  }
  if (size && bed && size.toLowerCase() !== bed.toLowerCase()) {
    return `${bed} · ${size}`;
  }
  if (size) return size;
  if (room.maxGuests) return `Sleeps up to ${room.maxGuests}`;
  return "Comfortable Greyon stay";
}

function roomBadge(roomTypeId: string, room: RoomType) {
  const priced = pricedRoom(roomTypeId);
  if (priced && priced.availableUnits > 0 && priced.availableUnits <= 8) {
    return `${priced.availableUnits} left`;
  }
  if (room.bedType?.trim()) return room.bedType.trim();
  return "Room";
}

function roomPriceText(roomTypeId: string) {
  const priced = pricedRoom(roomTypeId);
  if (!priced) return "";
  return `$${priced.total.toFixed(2)}`;
}

function roomPricePerNight(roomTypeId: string) {
  const priced = pricedRoom(roomTypeId);
  if (!priced || !priced.nights) return "";
  const per = priced.total / priced.nights;
  return `$${per.toFixed(0)} per night`;
}

function scrollToRooms() {
  document.getElementById("rooms")?.scrollIntoView({ behavior: "smooth" });
}

function focusSearch() {
  scrollToRooms();
  document
    .querySelector<HTMLElement>("#rooms .gy-search, #rooms form")
    ?.focus();
}

async function openRoom(roomTypeId: string) {
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

.detail-hero__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin: 0 0 0.85rem;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.28rem 0.65rem;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--gy-ink);
  background: rgba(255, 255, 255, 0.92);
  border-radius: 4px;
}

.hero-badge--stars {
  letter-spacing: 0.04em;
  text-transform: none;
  color: var(--gy-gold-deep);
}

.meta-area {
  margin: 0 0 0.2rem !important;
  font-weight: 600;
  color: var(--gy-gold-deep);
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
  border-radius: var(--gy-radius-media);
}

.room-list {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
}

.room-price-hint {
  margin: 0.75rem 0 0;
  font-size: 0.9rem;
}

.room-sticky {
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
  background: rgba(255, 255, 255, 0.96);
  border-top: 1px solid rgba(69, 76, 75, 0.1);
  box-shadow: 0 -12px 28px rgba(69, 76, 75, 0.1);
  backdrop-filter: blur(10px);
}

.room-sticky__price {
  display: grid;
  gap: 0.1rem;
  min-width: 0;
}

.room-sticky__price strong {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.1;
  color: var(--gy-ink);
}

.room-sticky__price span {
  font-size: 0.72rem;
  color: var(--gy-muted);
}

.room-sticky__cta {
  flex-shrink: 0;
  min-height: 2.65rem;
  padding-inline: 1rem;
  font-size: 0.72rem;
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

.landmark-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.55rem;
}

.landmark-list li {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: baseline;
  padding: 0.75rem 0.9rem;
  background: var(--gy-sand);
  border-left: 2px solid var(--gy-gold);
}

.landmark-list__place {
  font-size: 0.95rem;
  line-height: 1.45;
}

.landmark-list__distance {
  flex-shrink: 0;
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--gy-gold-deep);
  white-space: nowrap;
}

.service-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.service-chips li {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  max-width: 100%;
  padding: 0.38rem 0.78rem;
  border-radius: 999px;
  font-size: 0.78rem;
  line-height: 1.25;
  color: var(--gy-ink);
  background: var(--gy-sand);
}

.service-chips li .q-icon {
  flex-shrink: 0;
  color: var(--gy-forest);
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.product-card {
  display: grid;
  grid-template-rows: auto 1fr;
  background: #fff;
  border: 1px solid rgba(18, 17, 16, 0.08);
  border-radius: 14px;
  overflow: hidden;
}

.product-card__media {
  aspect-ratio: 4 / 3;
  background: var(--gy-sand);
}

.product-card__media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-card__placeholder {
  display: grid;
  place-items: center;
  height: 100%;
  color: var(--gy-forest);
}

.product-card__body {
  display: grid;
  gap: 0.35rem;
  padding: 0.85rem 0.95rem 1rem;
  align-content: start;
}

.product-card__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 650;
  line-height: 1.25;
}

.product-card__desc {
  margin: 0;
  font-size: 0.85rem;
  color: var(--gy-muted);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-card__price {
  margin: 0.15rem 0 0;
  font-size: 0.95rem;
  font-weight: 650;
  color: var(--gy-ink);
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
}

@media (max-width: 600px) {
  .gallery {
    grid-template-columns: 1fr;
  }

  .detail-wrap {
    padding-bottom: 5.5rem;
  }
}
</style>

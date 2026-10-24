<template>
  <q-page v-if="hotel" class="hotel-luxe home-motion">
    <SeoHead
      :title="`${hotel.name} | Greyon`"
      :description="hotel.shortDescription"
      :image="coverImage"
      :json-ld="jsonLd"
    />

    <section v-spot class="hero" data-sheet="Hero">
      <div class="hero__media">
        <img v-if="coverImage" class="hero__img" :src="coverImage" alt="" />
        <div class="hero__veil" />
        <div class="hero__spot" />
      </div>

      <div class="gy-container hero__content">
        <p v-reveal class="eyebrow eyebrow--light">{{ locationName }}</p>
        <h1 v-reveal="{ delay: '80ms' }">{{ hotel.name }}</h1>
        <div
          v-if="hotel.propertyType || starLabel"
          v-reveal="{ delay: '120ms' }"
          class="hero__badges"
        >
          <span v-if="hotel.propertyType" class="pill">{{
            hotel.propertyType
          }}</span>
          <span v-if="starLabel" class="pill pill--stars">{{ starLabel }}</span>
        </div>
        <p v-reveal="{ delay: '150ms' }" class="hero__lead">{{
          hotel.shortDescription
        }}</p>
        <div v-reveal="{ delay: '190ms' }" class="hero__actions">
          <button
            v-magnetic
            class="gy-btn gy-btn--light"
            type="button"
            @click="scrollToRooms"
          >
            View rooms
          </button>
        </div>
      </div>

      <div class="gy-container hero__facts">
        <article class="fact glass-edge">
          <span class="fact__label">Address</span>
          <p v-if="hotel.area" class="fact__area">{{ hotel.area }}</p>
          <p>{{ hotel.address }}</p>
        </article>
        <article class="fact glass-edge">
          <span class="fact__label">Contact</span>
          <p v-if="hotel.phone">
            <a :href="`tel:${hotel.phone}`">{{ hotel.phone }}</a>
          </p>
          <p v-if="hotel.email">
            <a :href="`mailto:${hotel.email}`">{{ hotel.email }}</a>
          </p>
          <p v-if="!hotel.phone && !hotel.email">—</p>
        </article>
        <article class="fact glass-edge">
          <span class="fact__label">Stay times</span>
          <p>Check-in {{ hotel.checkInTime || "—" }}</p>
          <p>Check-out {{ hotel.checkOutTime || "—" }}</p>
        </article>
      </div>
      <SectionDivider />
    </section>

    <section class="story" data-sheet="Overview">
      <div class="gy-container story__grid">
        <div class="story__copy">
          <p v-reveal class="eyebrow">Overview</p>
          <p v-reveal="{ delay: '80ms' }" class="story__body">{{
            hotel.description
          }}</p>
          <div v-reveal="{ delay: '140ms' }" class="story__actions">
            <button
              v-magnetic
              class="gy-btn gy-btn--light"
              type="button"
              @click="scrollToRooms"
            >
              View rooms
            </button>
            <router-link to="/hotels" class="gy-btn gy-btn--outline">
              All hotels
            </router-link>
          </div>
        </div>
        <figure
          v-if="portraitImage"
          v-tilt="{ max: 7 }"
          class="portrait hd-tilt"
        >
          <div ref="portraitFrame" class="portrait__frame">
            <img
              :src="portraitImage"
              :alt="hotel.name"
              :style="portraitStyle"
            />
          </div>
        </figure>
      </div>
    </section>

    <HotelAmenityBand :items="hotel.amenities" />

    <section v-if="hotelServices.length" class="panel" data-sheet="Services">
      <div class="gy-container">
        <p v-reveal class="eyebrow">On site</p>
        <h2 v-reveal="{ delay: '60ms' }">Services</h2>
        <p v-reveal="{ delay: '100ms' }" class="panel__lead">
          Experiences and facilities available at this property.
        </p>
        <ul class="card-grid">
          <li
            v-for="svc in hotelServices"
            :key="svc.id"
            v-tilt="{ max: 6 }"
            class="info-card hd-tilt glass-edge"
          >
            <q-icon :name="svc.icon || 'spa'" size="22px" />
            <h3>{{ svc.name }}</h3>
            <p v-if="svc.description">{{ svc.description }}</p>
          </li>
        </ul>
      </div>
    </section>

    <section v-if="hotelProducts.length" class="panel" data-sheet="Products">
      <div class="gy-container">
        <p v-reveal class="eyebrow">With your stay</p>
        <h2 v-reveal="{ delay: '60ms' }">Products</h2>
        <p v-reveal="{ delay: '100ms' }" class="panel__lead">
          Add-ons and items you can request with your stay.
        </p>
        <div class="product-grid">
          <article
            v-for="product in hotelProducts"
            :key="product.id"
            v-tilt="{ max: 6 }"
            class="product-card hd-tilt"
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
              <h3>{{ product.name }}</h3>
              <p v-if="product.description">{{ product.description }}</p>
              <p v-if="productPriceLabel(product)" class="product-card__price">
                {{ productPriceLabel(product) }}
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section v-if="landmarks.length" class="landmarks" data-sheet="Landmarks">
      <div class="gy-container">
        <p v-reveal class="eyebrow">{{ locationName }}</p>
        <h2 v-reveal="{ delay: '60ms' }">Nearby landmarks</h2>
        <p v-reveal="{ delay: '100ms' }" class="panel__lead">
          Distances from the property to places guests ask about most.
        </p>
      </div>
      <ul ref="landmarkTrack" class="landmark-rail">
        <li
          v-for="(item, index) in landmarks"
          :key="`${item.place}-${item.distance}`"
          v-tilt="{ max: 6 }"
          class="landmark hd-tilt glass-edge"
        >
          <span class="landmark__index">{{
            String(index + 1).padStart(2, "0")
          }}</span>
          <span class="landmark__place">{{ item.place }}</span>
          <span class="landmark__distance">{{ item.distance }}</span>
        </li>
      </ul>
    </section>

    <HotelGallery :images="gallery" :name="hotel.name" />

    <section id="rooms" class="rooms" data-sheet="Rooms">
      <div class="rooms__wrap">
        <header class="rooms__head">
          <p v-reveal class="eyebrow">Stay</p>
          <h2 v-reveal="{ delay: '60ms' }">Rooms & features</h2>
          <p v-reveal="{ delay: '100ms' }" class="panel__lead">
            Select dates to see live rates, then open room details before
            booking.
          </p>
        </header>
        <BookingSearchWidget
          :navigate="false"
          submit-label="Check availability"
        />
        <p v-if="!hasSearchedDates" class="room-price-hint">
          Prices appear after you choose check-in and check-out dates.
        </p>

        <div class="rooms__layout">
          <aside class="summary glass-edge" aria-label="Room booking summary">
            <p class="eyebrow">Your stay</p>
            <h3>{{ hotel.name }}</h3>
            <p class="summary__where">{{ locationName }}</p>
            <p
              v-if="booking.search.checkIn && booking.search.checkOut"
              class="summary__dates"
            >
              {{ formatStay(booking.search.checkIn) }} –
              {{ formatStay(booking.search.checkOut) }}
            </p>
            <p class="summary__times">
              Check-in {{ hotel.checkInTime || "—" }} · Check-out
              {{ hotel.checkOutTime || "—" }}
            </p>
            <div v-if="stickyPriced" class="summary__price">
              <strong>${{ stickyPriced.total.toFixed(0) }}</strong>
              <span>
                {{ stickyPriced.roomType.name }} · incl. taxes ·
                {{ stickyPriced.nights }} night{{
                  stickyPriced.nights === 1 ? "" : "s"
                }}
              </span>
            </div>
            <p v-else class="summary__pending">
              Choose dates to see live rates.
            </p>
            <button
              v-magnetic
              class="gy-btn gy-btn--light summary__cta"
              type="button"
              @click="
                stickyPriced
                  ? openRoom(stickyPriced.roomType.id)
                  : focusSearch()
              "
            >
              {{ stickyPriced ? "Book" : "Check availability" }}
            </button>
          </aside>

          <div>
            <div v-if="roomsLoading" class="room-list">
              <RoomCardSkeleton
                v-for="n in 2"
                :key="`skel-${n}`"
                variant="detail"
              />
            </div>
            <div v-else class="room-list">
              <div
                v-for="room in rooms"
                :key="room.id"
                v-tilt="{ max: 4 }"
                class="room-tilt hd-tilt"
              >
                <RoomOfferCard
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
                    pricedRoom(room.id)
                      ? 'incl. taxes & fees for your dates'
                      : ''
                  "
                  :detail-to="roomDetailPath(hotel, room)"
                  :show-view-details="true"
                  :cta-label="
                    hasSearchedDates && pricedRoom(room.id)
                      ? 'Book'
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
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="place" data-sheet="Stay & destination">
      <div class="place__copy">
        <p v-reveal class="eyebrow">Good to know</p>
        <h2 v-reveal="{ delay: '60ms' }">Stay policies</h2>
        <FeatureChips
          v-if="hotel.policies.length"
          :items="hotel.policies"
          :show-icons="false"
          wrap
          :limit="4"
          sheet-title="Stay policies"
        />
        <p v-else class="panel__lead">Policies will appear here when set.</p>
        <span class="place__slash" aria-hidden="true" />
      </div>
      <div class="place__map">
        <p class="eyebrow eyebrow--light">{{ locationName }}</p>
        <h2>Destination</h2>
        <p v-if="hotel.area" class="place__area">{{ hotel.area }}</p>
        <p class="place__address">{{ hotel.address }}</p>
        <MapEmbed
          :lat="hotel.coordinates.lat"
          :lng="hotel.coordinates.lng"
          :embed-url="hotel.mapEmbedUrl"
        />
      </div>
    </section>

    <section v-if="related.length" class="related" data-sheet="Nearby hotels">
      <div class="gy-container">
        <p v-reveal class="eyebrow">{{ locationName }}</p>
        <h2 v-reveal="{ delay: '60ms' }">Nearby Greyon hotels</h2>
        <div class="gy-grid-3">
          <HotelCard v-for="item in related" :key="item.id" :hotel="item" />
        </div>
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
          <span>
            incl. taxes · {{ stickyPriced.nights }} night{{
              stickyPriced.nights === 1 ? "" : "s"
            }}
          </span>
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
        {{ stickyPriced ? "Book" : "Check availability" }}
      </button>
    </div>
  </q-page>
  <q-page v-else class="hotel-missing gy-section gy-container">
    <h1>Hotel not found</h1>
    <router-link to="/hotels" class="gy-btn">Back to hotels</router-link>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useQuasar } from "quasar";
import { useRoute, useRouter } from "vue-router";
import BookingSearchWidget from "@/components/BookingSearchWidget.vue";
import FeatureChips from "@/components/FeatureChips.vue";
import HotelCard from "@/components/HotelCard.vue";
import { useDragScroll } from "@/components/home/useDragScroll";
import { useParallax } from "@/components/home/useParallax";
import HotelAmenityBand from "@/components/hotel/HotelAmenityBand.vue";
import HotelGallery from "@/components/hotel/HotelGallery.vue";
import SectionDivider from "@/components/hotel/SectionDivider.vue";
import MapEmbed from "@/components/MapEmbed.vue";
import RoomCardSkeleton from "@/components/RoomCardSkeleton.vue";
import RoomOfferCard from "@/components/RoomOfferCard.vue";
import SeoHead from "@/components/SeoHead.vue";
import { useBookingStore } from "@/stores/booking-store";
import { useCmsStore } from "@/stores/cms-store";
import type { HotelProductRef, RoomType } from "@/types/greyon";
import { roomDetailPath } from "@/utils/roomPath";

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const booking = useBookingStore();
const cms = useCmsStore();

const portraitFrame = ref<HTMLElement | null>(null);
const portraitOffset = useParallax(portraitFrame, 110);
const landmarkTrack = ref<HTMLElement | null>(null);
useDragScroll(landmarkTrack, { momentum: true });

const portraitStyle = computed(() => ({
  transform: `translate3d(0, ${portraitOffset.value}px, 0)`
}));

const hotel = computed(() => cms.getHotelBySlug(String(route.params.slug)));

watch(
  () => String(route.params.slug),
  slug => {
    if (!slug) return;
    void (async () => {
      try {
        // Wait for the list catalog so a later applyCatalog cannot race past
        // this detail enrich and drop services/products.
        await cms.ensurePublicCatalog();
        await cms.hydrateHotelDetail(slug);
      } catch {
        /* catalog list still usable if detail enrich fails */
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
const portraitImage = computed(
  () => gallery.value.find(src => src !== coverImage.value) ?? ""
);
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

function formatStay(ymd: string) {
  const [year, month, day] = ymd.split("-").map(Number);
  if (!year || !month || !day) return ymd;
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short"
  });
}

function scrollToRooms() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("rooms")?.scrollIntoView({
    behavior: reduce ? "auto" : "smooth"
  });
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

<style src="@/components/home/home-motion.css"></style>

<style scoped>
.hotel-luxe {
  position: relative;
  background:
    radial-gradient(
      ellipse at 100% 0%,
      rgba(196, 163, 90, 0.09),
      transparent 32%
    ),
    var(--gy-cream);
  color: var(--gy-ink);
}

.hotel-luxe h1,
.hotel-luxe h2,
.hotel-luxe h3 {
  font-family: var(--font-display);
  font-weight: 800;
  letter-spacing: -0.035em;
}

.eyebrow {
  margin: 0 0 0.85rem;
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-style: normal;
  font-weight: 700;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
}

.eyebrow::after {
  content: "";
  display: block;
  width: 0;
  height: 1px;
  margin-top: 0.8rem;
  background: linear-gradient(90deg, var(--gy-gold), var(--gy-forest));
  transition: width 0.9s cubic-bezier(0.22, 1, 0.36, 1);
}

.eyebrow.gy-reveal--in::after {
  width: 3.25rem;
}

.eyebrow--light {
  color: var(--gy-gold);
}

.hero {
  --spot-x: 68%;
  --spot-y: 34%;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: calc(100vh - 5.5rem);
  min-height: calc(100svh - 5.5rem);
  color: #fff;
  background: #1c1916;
  isolation: isolate;
}

.hero__media {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}

.hero__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform-origin: 50% 40%;
  animation: hero-ken 22s ease-in-out infinite alternate;
}

.hero__veil,
.hero__spot {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hero__veil {
  background: linear-gradient(
    180deg,
    rgba(12, 11, 10, 0.28) 0%,
    rgba(12, 11, 10, 0.08) 34%,
    rgba(12, 11, 10, 0.62) 72%,
    rgba(12, 11, 10, 0.84) 100%
  );
}

.hero__spot {
  background: radial-gradient(
    circle 10rem at var(--spot-x) var(--spot-y),
    rgba(196, 163, 90, 0.34),
    transparent 70%
  );
  mix-blend-mode: soft-light;
  opacity: 0;
}

.hero__content,
.hero__facts {
  position: relative;
  z-index: 2;
}

.hero__content {
  padding-top: clamp(3rem, 8vh, 6rem);
}

.hero h1 {
  max-width: 12em;
  margin: 0;
  font-size: clamp(2.35rem, 6vw, 4.94rem);
  line-height: 1;
}

.hero__lead {
  max-width: 38rem;
  margin: 1rem 0 0;
  font-family: var(--font-body);
  font-size: 1.02rem;
  font-weight: 500;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.88);
}

.hero__badges,
.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-top: 1rem;
}

.pill {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  padding: 0.3rem 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.38);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(12px);
  font-family: var(--font-display);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.pill--stars {
  letter-spacing: 0.04em;
  text-transform: none;
  color: #f3e6c4;
}

.hero__facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;
  margin-top: 1.75rem;
}

.fact {
  min-width: 0;
  padding: 1rem 1.05rem 0.95rem;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.86);
  color: var(--gy-ink);
  box-shadow: 0 18px 40px rgba(12, 11, 10, 0.16);
  backdrop-filter: blur(16px) saturate(1.15);
}

.fact p,
.summary p,
.place__address,
.place__area {
  margin: 0;
}

.fact p {
  font-size: 0.92rem;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.fact__label,
.summary__times,
.summary__where {
  display: block;
  margin-bottom: 0.4rem;
  font-family: var(--font-display);
  font-size: 0.68rem;
  font-style: normal;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
}

.fact__area,
.place__area,
.summary__where {
  margin-bottom: 0.2rem !important;
  color: var(--gy-gold-deep);
  font-weight: 600;
}

.fact a {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 0.16em;
}

.glass-edge {
  position: relative;
}

.glass-edge::before {
  content: "";
  position: absolute;
  inset: 0;
  padding: 1px;
  border-radius: inherit;
  background: linear-gradient(
    145deg,
    var(--gy-gold),
    var(--gy-forest) 55%,
    rgba(255, 255, 255, 0.65)
  );
  pointer-events: none;
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  mask-composite: exclude;
}

.story {
  position: relative;
  z-index: 2;
  padding: clamp(2.5rem, 6vw, 4.5rem) 0 clamp(3.5rem, 7vw, 5.5rem);
  background: var(--gy-cream);
}

.story__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(0, 0.92fr);
  gap: clamp(1.5rem, 4vw, 4rem);
  align-items: start;
}

.story__body {
  margin: 0;
  max-width: 38rem;
  font-family: var(--font-display);
  font-size: clamp(1.55rem, 2.5vw, 2.2rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.35;
}

.story__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
  margin-top: 1.75rem;
}

.portrait {
  margin-top: -5.5rem;
  margin-right: calc(-1 * clamp(0rem, 3vw, 2.5rem));
  padding: 0.7rem;
  background: linear-gradient(
    145deg,
    rgba(196, 163, 90, 0.95),
    rgba(98, 112, 99, 0.9) 58%,
    rgba(255, 255, 255, 0.45)
  );
  box-shadow: 0 28px 60px rgba(22, 21, 19, 0.18);
}

.portrait__frame {
  overflow: hidden;
  aspect-ratio: 3 / 4;
  background: #2c312e;
}

.portrait__frame img {
  width: 100%;
  height: 130%;
  object-fit: cover;
}

.panel {
  padding: clamp(3rem, 6vw, 5rem) 0;
}

.panel h2,
.landmarks h2,
.rooms h2,
.place h2,
.related h2 {
  margin: 0 0 0.75rem;
  font-size: clamp(2.35rem, 6vw, 4.2rem);
  line-height: 1;
}

.panel__lead {
  max-width: 38rem;
  margin: 0 0 1.4rem;
  font-family: var(--font-body);
  font-size: 0.98rem;
  font-weight: 500;
  line-height: 1.65;
  color: var(--gy-muted);
}

.card-grid,
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.9rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.info-card,
.product-card {
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 16px 40px rgba(36, 48, 42, 0.08);
  backdrop-filter: blur(12px);
}

.info-card {
  display: grid;
  align-content: start;
  gap: 0.55rem;
  min-height: 11rem;
  padding: 1.15rem 1.1rem 1.2rem;
}

.info-card .q-icon {
  color: var(--gy-forest);
}

.info-card h3,
.product-card h3 {
  margin: 0;
  font-size: 1.7rem;
  line-height: 1.05;
}

.info-card p,
.product-card__body p {
  margin: 0;
  font-family: var(--font-body);
  font-size: 0.88rem;
  font-style: normal;
  font-weight: 500;
  line-height: 1.5;
  color: var(--gy-muted);
}

.product-card {
  display: grid;
  grid-template-rows: auto 1fr;
  overflow: hidden;
}

.product-card__media {
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: var(--gy-sand);
}

.product-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 1.1s cubic-bezier(0.22, 1, 0.36, 1);
}

.product-card__placeholder {
  display: grid;
  place-items: center;
  height: 100%;
  color: var(--gy-forest);
}

.product-card__body {
  display: grid;
  align-content: start;
  gap: 0.4rem;
  padding: 0.95rem 1rem 1.1rem;
}

.product-card__price {
  color: var(--gy-ink) !important;
  font-weight: 650;
}

.landmarks {
  padding: clamp(2rem, 5vw, 3.5rem) 0 0.5rem;
  overflow: hidden;
}

.landmark-rail {
  display: flex;
  gap: 0.85rem;
  margin: 0.4rem 0 0;
  padding: 0.75rem clamp(1rem, 4vw, 3rem) 1.6rem;
  list-style: none;
  overflow-x: auto;
  scroll-snap-type: x proximity;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  cursor: grab;
}

.landmark-rail::-webkit-scrollbar {
  display: none;
}

.landmark-rail.is-dragging,
.landmark-rail.is-coasting {
  cursor: grabbing;
  scroll-snap-type: none;
}

.landmark {
  display: flex;
  flex: 0 0 min(72vw, 18.5rem);
  flex-direction: column;
  justify-content: space-between;
  gap: 1.4rem;
  min-height: 15rem;
  padding: 1.15rem 1.15rem 1.1rem;
  scroll-snap-align: start;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 18px 40px rgba(36, 48, 42, 0.08);
  backdrop-filter: blur(10px);
}

.landmark__index {
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: -0.02em;
  font-size: 2rem;
  line-height: 1.05;
  color: var(--gy-gold-deep);
}

.landmark__place {
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: -0.02em;
  font-size: clamp(1.55rem, 2vw, 1.9rem);
  line-height: 1.05;
}

.landmark__distance {
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-style: normal;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--gy-forest);
}

.rooms {
  scroll-margin-top: 6.5rem;
  padding: clamp(3.5rem, 7vw, 5.5rem) 0 clamp(3rem, 6vw, 5rem);
  background:
    linear-gradient(180deg, rgba(98, 112, 99, 0.1), transparent 9rem),
    var(--gy-white);
}

.rooms__wrap {
  width: min(1280px, calc(100% - 2.5rem));
  margin-inline: auto;
}

.rooms__head {
  margin-bottom: 1.25rem;
}

.room-price-hint {
  margin: 0.85rem 0 0;
  font-family: var(--font-body);
  font-size: 0.9rem;
  color: var(--gy-muted);
}

.rooms__layout {
  display: grid;
  grid-template-columns: minmax(240px, 280px) minmax(0, 1fr);
  gap: 1.15rem;
  align-items: start;
  margin-top: 1.25rem;
}

.summary {
  position: sticky;
  top: 6.5rem;
  display: grid;
  gap: 0.45rem;
  padding: 1.2rem 1.15rem 1.15rem;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 22px 50px rgba(36, 48, 42, 0.1);
  backdrop-filter: blur(16px) saturate(1.1);
}

.summary h3 {
  margin: 0;
  font-size: 2rem;
  line-height: 0.95;
}

.summary__dates {
  margin: 0.2rem 0 0;
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: -0.02em;
  font-size: 1.35rem;
}

.summary__times,
.summary__pending,
.summary__price span {
  margin: 0;
  font-family: var(--font-display);
  font-size: 0.78rem;
  font-style: normal;
  font-weight: 500;
  letter-spacing: 0.02em;
  line-height: 1.45;
  text-transform: none;
  color: var(--gy-muted);
}

.summary__price {
  display: grid;
  gap: 0.15rem;
  margin-top: 0.35rem;
}

.summary__price strong {
  font-family: var(--font-display);
  font-size: 2.6rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.05;
}

.summary__cta {
  width: 100%;
  margin-top: 0.45rem;
}

.room-list {
  display: grid;
  gap: 1rem;
}

.room-tilt {
  min-width: 0;
}

.rooms :deep(.room-offer__title) {
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: -0.02em;
  font-size: clamp(1.55rem, 2vw, 2rem);
}

.place {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  background: linear-gradient(120deg, #24302a 0%, #1a1816 58%, #3a3228 100%);
  color: #fff;
}

.place__copy {
  position: relative;
  z-index: 1;
  padding: clamp(3rem, 6vw, 5rem) clamp(1.4rem, 4vw, 3.5rem);
  background: var(--gy-cream);
  color: var(--gy-ink);
}

.place__slash {
  position: absolute;
  top: 0;
  right: 0;
  width: min(18%, 7rem);
  height: 100%;
  background: var(--gy-cream);
  clip-path: polygon(0 0, 100% 0, 0 100%);
  transform: translateX(99%);
}

.place__map {
  display: grid;
  align-content: center;
  gap: 0.45rem;
  padding: clamp(2.5rem, 5vw, 4rem) clamp(1.4rem, 4vw, 3rem)
    clamp(2.5rem, 5vw, 4rem) clamp(3rem, 7vw, 5.5rem);
}

.place__map h2 {
  color: #fff;
}

.place__area {
  color: var(--gy-gold);
  font-family: var(--font-display);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.place__address {
  max-width: 34rem;
  margin-bottom: 0.85rem;
  font-family: var(--font-body);
  font-size: 0.95rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.82);
}

.place__map :deep(.map-embed) {
  padding: 0.7rem;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.94);
}

.place__map :deep(.map-embed__frame) {
  min-height: 320px;
  border-radius: 12px;
}

.related {
  padding: clamp(3.5rem, 7vw, 5.5rem) 0;
}

.related .gy-grid-3 {
  margin-top: 1.25rem;
}

.hd-tilt {
  transition: transform 0.18s linear;
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
  background: rgba(20, 18, 16, 0.94);
  color: #fff;
  box-shadow: 0 -16px 40px rgba(12, 11, 10, 0.28);
  backdrop-filter: blur(16px);
}

.room-sticky__price {
  display: grid;
  gap: 0.1rem;
  min-width: 0;
}

.room-sticky__price strong {
  font-family: var(--font-display);
  font-size: 1.45rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.05;
}

.room-sticky__price span {
  font-family: var(--font-display);
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.72);
}

.room-sticky__cta {
  flex-shrink: 0;
  min-height: 2.75rem;
  padding-inline: 1rem;
  font-size: 0.72rem;
}

.hotel-missing h1 {
  margin: 0 0 1rem;
  font-family: var(--font-display);
  font-size: clamp(2.6rem, 6vw, 4rem);
  font-weight: 800;
  letter-spacing: -0.035em;
}

@keyframes hero-ken {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.12);
  }
}

@media (hover: hover) and (prefers-reduced-motion: no-preference) {
  .hero:hover .hero__veil {
    -webkit-mask-image: radial-gradient(
      circle 11rem at var(--spot-x) var(--spot-y),
      transparent 0%,
      rgba(0, 0, 0, 0.25) 46%,
      #000 74%
    );
    mask-image: radial-gradient(
      circle 11rem at var(--spot-x) var(--spot-y),
      transparent 0%,
      rgba(0, 0, 0, 0.25) 46%,
      #000 74%
    );
  }

  .hero:hover .hero__spot {
    opacity: 1;
  }

  .product-card:hover img {
    transform: scale(1.08);
  }
}

@media (max-width: 960px) {
  .hero__facts,
  .story__grid,
  .rooms__layout,
  .place {
    grid-template-columns: 1fr;
  }

  .portrait {
    margin: 1.5rem 0 0;
  }

  .summary {
    position: static;
  }

  .place__slash {
    display: none;
  }

  .place__map {
    padding: 2rem 1.25rem 2.5rem;
  }
}

@media (max-width: 720px) {
  .hero__facts {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    overscroll-behavior-x: contain;
    scrollbar-width: none;
    padding-bottom: 0.2rem;
  }

  .hero__facts::-webkit-scrollbar {
    display: none;
  }

  .fact {
    flex: 0 0 min(78vw, 18rem);
    scroll-snap-align: start;
  }

  .portrait__frame {
    aspect-ratio: 4 / 5;
    max-height: 72vh;
  }
}

@media (max-width: 599px) {
  .hotel-luxe {
    padding-bottom: 5.75rem;
  }

  .summary {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero__img,
  .product-card__media img,
  .hd-tilt,
  .eyebrow::after {
    animation: none;
    transition: none;
  }

  .eyebrow::after {
    width: 3.25rem;
  }

  .portrait__frame img {
    height: 100%;
    transform: none !important;
  }
}
</style>

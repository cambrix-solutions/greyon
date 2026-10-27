<template>
  <q-page
    v-if="hotel && room"
    class="dest-luxe home-motion rooms-luxe room-page"
  >
    <SeoHead
      :title="seoTitle"
      :description="seoDescription"
      :image="coverImage"
      :json-ld="jsonLd"
    />

    <section
      class="stage"
      data-sheet="Gallery"
      tabindex="0"
      aria-labelledby="room-title"
      @keydown="onStageKey"
    >
      <div class="stage__media">
        <img
          v-if="activeSrc"
          :key="activeSrc"
          class="stage__img"
          :src="activeSrc"
          :alt="`${room.name} photo ${activePhoto + 1}`"
        />
        <div class="stage__veil" />
        <button
          v-if="photos.length"
          type="button"
          class="stage__open"
          :aria-label="`Open photo ${activePhoto + 1} of ${photos.length}`"
          @click="galleryOpen = true"
        />
      </div>

      <div class="dest-wrap stage__content">
        <nav class="crumb" aria-label="Breadcrumb">
          <router-link to="/hotels">Hotels</router-link>
          <span aria-hidden="true">/</span>
          <router-link :to="`/hotels/${hotel.slug}`">{{
            hotel.name
          }}</router-link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{{ room.name }}</span>
        </nav>
        <p v-reveal class="eyebrow eyebrow--light">{{ hotel.name }}</p>
        <RevealWords id="room-title" tag="h1" :text="room.name" />
        <RoomFacts
          tone="light"
          :bed-type="room.bedType"
          :room-size="room.roomSize"
          :max-guests="room.maxGuests"
        />
        <div v-if="photos.length > 1" class="stage__tools">
          <p class="stage__pos" aria-live="polite">
            {{ pad(activePhoto + 1) }} / {{ pad(photos.length) }}
          </p>
          <div class="stage__nav">
            <button
              type="button"
              aria-label="Previous photo"
              @click="stepPhoto(-1)"
            >
              <q-icon name="chevron_left" size="22px" />
            </button>
            <button type="button" aria-label="Next photo" @click="stepPhoto(1)">
              <q-icon name="chevron_right" size="22px" />
            </button>
          </div>
        </div>
        <ul
          v-if="photos.length > 1"
          ref="filmstrip"
          class="stage__film"
          aria-label="Room photographs"
        >
          <li v-for="(src, index) in photos" :key="`${src}-${index}`">
            <button
              type="button"
              :class="{ 'is-active': activePhoto === index }"
              :aria-label="`Show photo ${index + 1}`"
              :aria-current="activePhoto === index ? 'true' : undefined"
              @click="activePhoto = index"
            >
              <img :src="src" alt="" />
            </button>
          </li>
        </ul>
      </div>
      <SectionDivider
        :fill="room.amenities.length ? '#1a211e' : 'var(--gy-cream)'"
      />
    </section>

    <HotelAmenityBand
      v-if="room.amenities.length"
      :items="room.amenities"
      eyebrow="In the room"
      title="Amenities"
      lead="Everything included with this room type."
      sheet="Amenities"
    />

    <section class="dossier">
      <div class="dest-wrap dossier__grid">
        <div>
          <article class="story spin-edge" data-sheet="The room">
            <p v-reveal class="eyebrow">The room</p>
            <h2 v-reveal>{{ room.name }}</h2>
            <p v-if="roomDescription" class="story__body">{{
              roomDescription
            }}</p>
            <RoomFacts
              :bed-type="room.bedType"
              :room-size="room.roomSize"
              :max-guests="room.maxGuests"
            />
          </article>

          <div class="dates-block">
            <p v-reveal class="eyebrow">Dates</p>
            <h2 v-reveal>Check availability</h2>
            <BookingSearchWidget
              :navigate="false"
              submit-label="Check availability"
            />
          </div>

          <section
            v-if="policies.length"
            class="policies"
            data-sheet="Policies"
            aria-labelledby="policy-title"
          >
            <p v-reveal class="eyebrow">House rules</p>
            <h2 id="policy-title" v-reveal>Stay policies</h2>
            <ul ref="policyRail" class="policy-grid">
              <li
                v-for="(policy, index) in policies"
                :key="`${index}-${policy}`"
                class="policy-card rooms-tilt glass-edge"
              >
                <p>{{ policy }}</p>
              </li>
            </ul>
          </section>

          <section
            v-if="otherRooms.length"
            class="others"
            data-sheet="Other rooms"
            aria-labelledby="others-title"
          >
            <p v-reveal class="eyebrow">Also here</p>
            <h2 id="others-title" v-reveal> Other rooms at this hotel </h2>
            <ul ref="otherRail" class="other-rail">
              <li
                v-for="other in otherRooms"
                :key="other.id"
                class="other-card rooms-tilt"
              >
                <router-link
                  class="other-card__media photo-reveal"
                  :to="roomDetailPath(hotel, other)"
                  :aria-label="`View ${other.name}`"
                >
                  <img
                    v-if="coverOf(other)"
                    :src="coverOf(other)"
                    :alt="other.name"
                    loading="lazy"
                  />
                  <img
                    v-if="revealOf(other)"
                    class="photo-reveal__alt"
                    :src="revealOf(other)"
                    alt=""
                    loading="lazy"
                  />
                </router-link>
                <div class="other-card__body">
                  <h3>
                    <router-link :to="roomDetailPath(hotel, other)">
                      {{ other.name }}
                    </router-link>
                  </h3>
                  <RoomFacts
                    compact
                    :bed-type="other.bedType"
                    :room-size="other.roomSize"
                    :max-guests="other.maxGuests"
                  />
                  <p v-if="roomPriceText(other.id)" class="other-card__price">
                    {{ roomPriceText(other.id) }}
                  </p>
                  <div class="other-card__actions">
                    <button
                      class="gy-btn gy-btn--sm"
                      :class="
                        hasSearchedDates && pricedRoom(other.id)
                          ? 'gy-btn--light'
                          : 'gy-btn--outline'
                      "
                      type="button"
                      @click="bookRoom(other.id)"
                    >
                      {{
                        hasSearchedDates && pricedRoom(other.id)
                          ? "Book"
                          : "Check availability"
                      }}
                    </button>
                    <router-link
                      class="gy-btn gy-btn--outline gy-btn--sm"
                      :to="roomDetailPath(hotel, other)"
                    >
                      View details
                    </router-link>
                  </div>
                </div>
              </li>
            </ul>
          </section>

          <router-link class="back-link" :to="`/hotels/${hotel.slug}`">
            Back to {{ hotel.name }}
          </router-link>
        </div>

        <aside class="price-card glass-edge" data-sheet="Availability">
          <p class="eyebrow">Your stay</p>
          <template v-if="priced">
            <h2>${{ priced.total.toFixed(0) }}</h2>
            <p class="price-card__hint">
              ${{ perNightLabel }} / night · {{ priced.nights }} night{{
                priced.nights === 1 ? "" : "s"
              }}
              · incl. taxes &amp; fees
            </p>
            <p v-if="priced.availableUnits > 0" class="price-card__units">
              {{ priced.availableUnits }} available
            </p>
          </template>
          <template v-else-if="fromPrice">
            <h2>${{ fromPrice.toFixed(0) }}</h2>
            <p class="price-card__hint">per night · before taxes</p>
          </template>
          <template v-else>
            <h2>On request</h2>
            <p class="price-card__hint"
              >Choose dates to see live availability</p
            >
          </template>
          <p v-if="planLabel" class="price-card__plan">{{ planLabel }}</p>
          <p v-if="planPolicy" class="price-card__policy">{{ planPolicy }}</p>
          <dl>
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
            class="gy-btn gy-btn--light price-card__cta"
            type="button"
            :disabled="booking.searching"
            @click="bookThisRoom"
          >
            {{ bookCtaLabel }}
          </button>
          <p v-if="booking.errorMessage" class="price-card__error">
            {{ booking.errorMessage }}
          </p>
        </aside>
      </div>
    </section>

    <div class="book-bar" role="region" aria-label="Book this room">
      <div class="book-bar__price">
        <template v-if="priced">
          <strong>${{ priced.total.toFixed(0) }}</strong>
          <span>
            total · {{ priced.nights }} night{{
              priced.nights === 1 ? "" : "s"
            }}
          </span>
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
        class="gy-btn gy-btn--light"
        type="button"
        :disabled="booking.searching"
        @click="bookThisRoom"
      >
        {{ bookCtaLabel }}
      </button>
    </div>

    <q-dialog
      v-model="galleryOpen"
      maximized
      transition-show="fade"
      transition-hide="fade"
    >
      <div
        class="lb"
        role="dialog"
        aria-label="Room photo gallery"
        @keydown="onStageKey"
      >
        <button
          type="button"
          class="lb__close"
          aria-label="Close gallery"
          @click="galleryOpen = false"
        >
          <q-icon name="close" size="22px" />
        </button>
        <button
          v-if="photos.length > 1"
          type="button"
          class="lb__nav"
          aria-label="Previous photo"
          @click="stepPhoto(-1)"
        >
          <q-icon name="chevron_left" size="28px" />
        </button>
        <figure>
          <img
            v-if="activeSrc"
            :src="activeSrc"
            :alt="`${room.name} photo ${activePhoto + 1}`"
          />
        </figure>
        <button
          v-if="photos.length > 1"
          type="button"
          class="lb__nav"
          aria-label="Next photo"
          @click="stepPhoto(1)"
        >
          <q-icon name="chevron_right" size="28px" />
        </button>
        <p class="lb__count">{{ activePhoto + 1 }} / {{ photos.length }}</p>
      </div>
    </q-dialog>
  </q-page>

  <q-page v-else-if="catalogReady" class="dest-luxe rooms-luxe room-state">
    <SeoHead
      title="Room not found | Greyon"
      description="We couldn’t find that room. Browse Greyon hotels to continue."
    />
    <div class="dest-wrap">
      <p class="eyebrow">Room</p>
      <h1>We couldn’t find that room</h1>
      <p>
        It may have been removed or the link is out of date. Head back to the
        hotel or browse all Greyon properties.
      </p>
      <div class="room-state__actions">
        <router-link
          v-if="hotel"
          :to="`/hotels/${hotel.slug}`"
          class="gy-btn gy-btn--light"
        >
          Back to {{ hotel.name }}
        </router-link>
        <router-link to="/hotels" class="gy-btn gy-btn--outline">
          All hotels
        </router-link>
      </div>
    </div>
  </q-page>

  <q-page v-else class="dest-luxe rooms-luxe room-state">
    <SeoHead title="Room | Greyon" description="Loading room details." />
    <div class="dest-wrap">
      <p>Loading room details…</p>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import RevealWords from "@/components/home/RevealWords.vue";
import { useDragScroll } from "@/components/home/useDragScroll";
import BookingSearchWidget from "@/components/BookingSearchWidget.vue";
import HotelAmenityBand from "@/components/hotel/HotelAmenityBand.vue";
import SectionDivider from "@/components/hotel/SectionDivider.vue";
import RoomFacts from "@/components/RoomFacts.vue";
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
const activePhoto = ref(0);
const galleryOpen = ref(false);

const filmstrip = ref<HTMLElement | null>(null);
const policyRail = ref<HTMLElement | null>(null);
const otherRail = ref<HTMLElement | null>(null);
useDragScroll(filmstrip, { momentum: true });
useDragScroll(policyRail, { momentum: true });
useDragScroll(otherRail, { momentum: true });

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

watch(room, () => {
  activePhoto.value = 0;
  galleryOpen.value = false;
});

const photos = computed(() => {
  const urls = (room.value?.images ?? [])
    .map(src => src.trim())
    .filter(Boolean);
  return [...new Set(urls)];
});

const activeSrc = computed(() => photos.value[activePhoto.value] ?? "");

const coverImage = computed(
  () => photos.value[0] || hotel.value?.heroImage || ""
);

const roomDescription = computed(() => {
  const desc = room.value?.description?.trim() || "";
  const name = room.value?.name?.trim() || "";
  if (!desc || desc.toLowerCase() === name.toLowerCase()) return "";
  return desc;
});

const policies = computed(() =>
  (hotel.value?.policies ?? []).map(item => item.trim()).filter(Boolean)
);

const seoTitle = computed(() =>
  room.value && hotel.value
    ? `${room.value.name} · ${hotel.value.name} | Greyon`
    : "Room | Greyon"
);

const seoDescription = computed(() => {
  if (!room.value || !hotel.value) return "";
  if (roomDescription.value) return roomDescription.value;
  const bits = [
    room.value.bedType,
    room.value.maxGuests ? `up to ${room.value.maxGuests} guests` : ""
  ].filter(Boolean);
  return bits.length
    ? `${room.value.name} at ${hotel.value.name}. ${bits.join(" · ")}.`
    : `${room.value.name} at ${hotel.value.name}.`;
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
    .filter(item => item.id !== room.value?.id);
});

const hasSearchedDates = computed(
  () =>
    Boolean(booking.search.checkIn && booking.search.checkOut) &&
    booking.results.length > 0 &&
    booking.results.some(item => item.hotel.id === hotel.value?.id)
);

function pricedRoom(roomTypeId: string) {
  if (!hotel.value) return null;
  return (
    booking.results.find(
      item =>
        item.hotel.id === hotel.value?.id && item.roomType.id === roomTypeId
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

const planLabel = computed(() => {
  const name =
    priced.value?.ratePlan.name?.trim() ||
    (room.value
      ? cms.getRatePlanByRoomTypeId(room.value.id)?.name?.trim()
      : "") ||
    "";
  return name;
});

const planPolicy = computed(() => {
  const text =
    priced.value?.ratePlan.cancellationPolicy?.trim() ||
    (room.value
      ? cms.getRatePlanByRoomTypeId(room.value.id)?.cancellationPolicy?.trim()
      : "") ||
    "";
  return text;
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

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function coverOf(item: RoomType) {
  return item.images.find(src => src.trim())?.trim() ?? "";
}

function revealOf(item: RoomType) {
  const cover = coverOf(item);
  return (
    item.images.find(src => src.trim() && src.trim() !== cover)?.trim() ?? ""
  );
}

function stepPhoto(delta: number) {
  const total = photos.value.length;
  if (total < 2) return;
  activePhoto.value = (activePhoto.value + delta + total) % total;
}

function onStageKey(event: KeyboardEvent) {
  if (event.key === "ArrowRight") stepPhoto(1);
  else if (event.key === "ArrowLeft") stepPhoto(-1);
  else if (event.key === "Escape") galleryOpen.value = false;
}

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

function roomPriceText(roomTypeId: string) {
  const match = pricedRoom(roomTypeId);
  return match ? `$${match.total.toFixed(2)}` : "";
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
  const found = booking.results.find(item => item.roomType.id === roomTypeId);
  if (found) booking.selectResult(found);
  void router.push({ name: "booking" });
}

async function bookThisRoom() {
  if (!room.value) return;
  await bookRoom(room.value.id);
}
</script>

<style src="@/components/home/home-motion.css"></style>
<style src="./destination-luxe.css"></style>
<style src="./rooms-luxe.css"></style>

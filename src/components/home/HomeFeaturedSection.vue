<template>
  <section
    v-if="featuredHotels.length"
    id="home-featured"
    class="featured home-motion"
    aria-labelledby="home-featured-title"
  >
    <article
      v-for="(hotel, hotelIndex) in featuredHotels"
      :key="hotel.id"
      class="property"
    >
      <div
        class="property__media"
        @touchstart.passive="onTouchStart"
        @touchend.passive="onTouchEnd($event, hotel.id)"
      >
        <img
          v-if="photoFor(hotel)"
          :key="photoFor(hotel)"
          class="property__img"
          :src="photoFor(hotel)"
          :alt="hotel.name"
        />
        <div class="property__veil" />
        <template v-if="photosFor(hotel).length > 1">
          <button
            type="button"
            class="shot-nav shot-nav--prev"
            aria-label="Previous photo"
            @click="stepPhoto(hotel.id, -1, photosFor(hotel).length)"
          >
            <q-icon name="chevron_left" size="26px" />
          </button>
          <button
            type="button"
            class="shot-nav shot-nav--next"
            aria-label="Next photo"
            @click="stepPhoto(hotel.id, 1, photosFor(hotel).length)"
          >
            <q-icon name="chevron_right" size="26px" />
          </button>
          <p class="property__count">
            {{ indexFor(hotel.id) + 1 }} / {{ photosFor(hotel).length }}
          </p>
        </template>
        <h2
          :id="hotelIndex === 0 ? 'home-featured-title' : undefined"
          class="property__name"
        >
          <router-link :to="hotelPath(hotel)">{{ hotel.name }}</router-link>
        </h2>
      </div>

      <div class="property__float">
        <div class="glass-frame">
          <div class="glass-frame__in property__card">
            <p v-if="metaLine(hotel)" class="property__meta">
              {{ metaLine(hotel) }}
            </p>
            <p v-if="hotel.shortDescription" class="property__lead">
              {{ hotel.shortDescription }}
            </p>
            <FeatureChips
              v-if="hotel.amenities.length"
              :items="hotel.amenities"
              :limit="6"
              size="sm"
              on-dark
              sheet-title="Amenities"
            />
            <p v-if="hasTimes(hotel)" class="property__times">
              <span v-if="hotel.checkInTime">
                {{ $t("home.checkIn") }} {{ formatTime(hotel.checkInTime) }}
              </span>
              <span
                v-if="hotel.checkInTime && hotel.checkOutTime"
                aria-hidden="true"
                >·</span
              >
              <span v-if="hotel.checkOutTime">
                {{ $t("home.checkOut") }} {{ formatTime(hotel.checkOutTime) }}
              </span>
            </p>
            <router-link class="gy-btn gy-btn--light" :to="hotelPath(hotel)">
              View Hotel
            </router-link>
          </div>
        </div>
      </div>
    </article>

    <div
      v-if="rooms.length"
      id="home-rooms"
      class="rooms"
      aria-roledescription="carousel"
      :aria-label="$t('home.rooms')"
    >
      <div class="rooms__sticky">
        <div class="rooms__head">
          <p class="eyebrow">{{ $t("home.featured") }}</p>
          <h2 id="home-rooms-title" class="rooms__title">{{
            $t("home.rooms")
          }}</h2>
        </div>
        <div ref="roomTrack" class="rooms__track">
          <router-link
            v-for="room in rooms"
            :key="room.id"
            :to="roomLink(room)"
            class="room"
          >
            <span class="room__media">
              <img
                v-if="roomImage(room)"
                :src="roomImage(room)"
                :alt="room.name"
                loading="lazy"
              />
            </span>
            <span class="room__shade">
              <span class="room__name">{{ room.name }}</span>
              <span v-if="roomDetail(room)" class="room__detail">{{
                roomDetail(room)
              }}</span>
            </span>
          </router-link>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import FeatureChips from "@/components/FeatureChips.vue";
import { useDragScroll } from "@/components/home/useDragScroll";
import { useCmsStore } from "@/stores/cms-store";
import type { Hotel, RoomType } from "@/types/greyon";
import { formatTime } from "@/utils/datetime";
import { roomDetailPath } from "@/utils/roomPath";

const SWIPE_PX = 48;

const cms = useCmsStore();
const { t } = useI18n();
const photoIndex = ref<Record<string, number>>({});
const roomTrack = ref<HTMLElement | null>(null);
let touchX: number | null = null;

useDragScroll(roomTrack, { momentum: true });

const featuredHotels = computed(() =>
  cms.publishedHotels.filter(hotel => hotel.featured)
);

const rooms = computed(() => {
  const ids = new Set(featuredHotels.value.map(hotel => hotel.id));
  return cms.roomTypes.filter(
    room => ids.has(room.hotelId) && room.status === "published"
  );
});

function photosFor(hotel: Hotel) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of [hotel.heroImage, ...hotel.gallery]) {
    const src = raw?.trim();
    if (!src || seen.has(src)) continue;
    seen.add(src);
    out.push(src);
  }
  return out;
}

function indexFor(id: string) {
  return photoIndex.value[id] ?? 0;
}

function photoFor(hotel: Hotel) {
  const photos = photosFor(hotel);
  return photos[indexFor(hotel.id)] ?? "";
}

function stepPhoto(id: string, dir: -1 | 1, total: number) {
  if (total < 2) return;
  const next = (indexFor(id) + dir + total) % total;
  photoIndex.value = { ...photoIndex.value, [id]: next };
}

function onTouchStart(event: TouchEvent) {
  touchX = event.changedTouches[0]?.clientX ?? null;
}

function onTouchEnd(event: TouchEvent, id: string) {
  if (touchX === null) return;
  const endX = event.changedTouches[0]?.clientX ?? touchX;
  const delta = endX - touchX;
  touchX = null;
  const hotel = featuredHotels.value.find(item => item.id === id);
  if (!hotel || Math.abs(delta) < SWIPE_PX) return;
  stepPhoto(id, delta < 0 ? 1 : -1, photosFor(hotel).length);
}

function locationName(hotel: Hotel) {
  return cms.getLocationById(hotel.locationId)?.name ?? "";
}

function metaLine(hotel: Hotel) {
  const parts: string[] = [];
  const place = locationName(hotel);
  if (place) parts.push(place);
  if (hotel.propertyType?.trim()) parts.push(hotel.propertyType.trim());
  if (
    typeof hotel.starRating === "number" &&
    hotel.starRating >= 1 &&
    hotel.starRating <= 5
  ) {
    parts.push(t("home.starClass", { n: hotel.starRating }));
  }
  if (hotel.area?.trim()) parts.push(hotel.area.trim());
  return parts.join("  ·  ");
}

function hasTimes(hotel: Hotel) {
  return Boolean(hotel.checkInTime?.trim() || hotel.checkOutTime?.trim());
}

function hotelPath(hotel: Hotel) {
  return `/hotels/${hotel.slug}`;
}

function hotelForRoom(room: RoomType) {
  return featuredHotels.value.find(hotel => hotel.id === room.hotelId);
}

function roomLink(room: RoomType) {
  const hotel = hotelForRoom(room);
  return hotel ? roomDetailPath(hotel, room) : "/hotels";
}

function roomImage(room: RoomType) {
  return room.images.find(src => src.trim())?.trim() ?? "";
}

function roomDetail(room: RoomType) {
  const hotel = hotelForRoom(room);
  const bits = [room.bedType.trim(), room.roomSize.trim()].filter(Boolean);
  if (featuredHotels.value.length > 1 && hotel) bits.unshift(hotel.name);
  return bits.join("  ·  ");
}
</script>

<style scoped>
.featured {
  background: #121413;
  color: #f6f1e7;
}

.property__media {
  position: relative;
  height: min(92vh, 920px);
  min-height: 560px;
  overflow: hidden;
  background: #1a1c1b;
}

.property__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.property__veil {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      180deg,
      rgba(12, 12, 11, 0.15),
      rgba(12, 12, 11, 0.2) 40%,
      #121413 100%
    ),
    linear-gradient(90deg, rgba(12, 12, 11, 0.45), transparent 55%);
}

.shot-nav {
  position: absolute;
  z-index: 3;
  top: 50%;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 999px;
  background: rgba(12, 12, 11, 0.28);
  color: #fff;
  cursor: pointer;
  transform: translateY(-50%);
}

.shot-nav--prev {
  left: 1rem;
}

.shot-nav--next {
  right: 1rem;
}

.property__count {
  position: absolute;
  z-index: 3;
  top: 6.2rem;
  left: 50%;
  margin: 0;
  transform: translateX(-50%);
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.18em;
}

.property__name {
  position: absolute;
  z-index: 3;
  left: clamp(1.2rem, 5vw, 4rem);
  right: 28%;
  bottom: 36%;
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--gy-text-4xl);
  font-weight: 500;
  letter-spacing: normal;
  line-height: 1;
}

.property__name a {
  color: #fff;
}

.property__float {
  position: relative;
  z-index: 4;
  width: min(760px, calc(100% - 2rem));
  margin: -13rem auto 0;
  padding-bottom: 1rem;
}

.property__card {
  display: grid;
  gap: 1rem;
  padding: clamp(1.3rem, 2.5vw, 1.8rem);
  color: #f6f1e7;
}

.property__meta,
.property__times {
  margin: 0;
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--gy-gold);
}

.property__lead {
  margin: 0;
  font-family: var(--font-body);
  font-weight: 400;
  letter-spacing: normal;
  font-size: var(--gy-text-2xl);
  line-height: 1.25;
}

.property__times {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem 0.7rem;
  letter-spacing: 0.08em;
  text-transform: none;
  color: rgba(246, 241, 231, 0.82);
}

.property__card .gy-btn {
  justify-self: start;
}

.rooms {
  position: relative;
  background: #f4efe6;
  color: var(--gy-forest);
}

.rooms.is-pinned .rooms__sticky {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100vh;
  overflow: hidden;
}

.rooms__head {
  padding: 1.5rem clamp(1.2rem, 4vw, 3rem) 0.6rem;
}

.eyebrow {
  margin: 0 0 0.35rem;
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--gy-gold);
}

.rooms__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--gy-text-4xl);
  font-weight: 500;
  letter-spacing: normal;
  line-height: 1;
}

.rooms__track {
  display: flex;
  gap: 1rem;
  padding: 0.6rem clamp(1.2rem, 4vw, 3rem) 1.4rem;
}

.rooms.is-pinned .rooms__track {
  width: max-content;
  overflow: visible;
}

.rooms:not(.is-pinned) .rooms__track {
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}

.rooms__track::-webkit-scrollbar {
  display: none;
}

.room {
  position: relative;
  flex: 0 0 min(68vw, 28rem);
  height: min(58vh, 460px);
  min-height: 280px;
  overflow: hidden;
  border-radius: 22px;
  color: #fff;
  background: #2a2e2c;
  scroll-snap-align: start;
}

.room__media,
.room__media img,
.room__shade {
  position: absolute;
  inset: 0;
}

.room__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.8s ease;
}

.room__shade {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.35rem;
  padding: 1.2rem;
  background: linear-gradient(to top, rgba(8, 8, 7, 0.82), transparent 62%);
}

.room__name {
  font-family: var(--font-display);
  font-weight: 500;
  letter-spacing: normal;
  font-size: 1.1rem;
  line-height: 1.3;
}

.room__detail {
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

@media (hover: hover) {
  .room:hover img {
    transform: scale(1.08);
  }
}

@media (max-width: 860px) {
  .property__media {
    height: 78vh;
    min-height: 520px;
  }

  .property__name {
    right: 1.1rem;
    bottom: 38%;
    font-size: var(--gy-text-4xl);
  }

  .property__float {
    margin-top: -7.5rem;
  }

  .room {
    flex-basis: 82vw;
    height: 58vh;
  }
}

@media (prefers-reduced-motion: reduce) {
  .property__img,
  .room__media img {
    animation: none !important;
    transition: none !important;
    transform: none !important;
  }
}
</style>

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
        <div
          class="property__frame"
          :ref="el => setFrame(hotel.id, el)"
          :style="frameStyle(hotel.id)"
        >
          <img
            v-if="photoFor(hotel)"
            :key="photoFor(hotel)"
            class="property__img"
            :src="photoFor(hotel)"
            :alt="hotel.name"
          />
        </div>
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
        <div class="property__copy">
          <div>
            <p v-if="metaLine(hotel)" v-reveal class="property__meta">
              {{ metaLine(hotel) }}
            </p>
            <h2
              :id="hotelIndex === 0 ? 'home-featured-title' : undefined"
              class="property__name"
            >
              <router-link :to="hotelPath(hotel)">
                <RevealWords tag="span" :text="hotel.name" />
              </router-link>
            </h2>
          </div>
          <router-link
            v-reveal="{ delay: '160ms' }"
            v-magnetic
            class="gy-btn gy-btn--ghost property__cta"
            :to="hotelPath(hotel)"
          >
            View Hotel
          </router-link>
        </div>
      </div>

      <div class="property__note">
        <p v-if="hotel.shortDescription" v-reveal class="property__lead">
          {{ hotel.shortDescription }}
        </p>
        <div v-reveal="{ delay: '140ms' }" class="property__facts">
          <FeatureChips
            v-if="hotel.amenities.length"
            :items="hotel.amenities"
            :limit="6"
            size="sm"
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
      <div class="rooms__head">
        <p v-reveal class="eyebrow">{{ $t("home.featured") }}</p>
        <RevealWords
          id="home-rooms-title"
          class="rooms__title"
          :text="$t('home.rooms')"
        />
      </div>
      <div class="rooms__frame">
        <button
          v-if="rooms.length > 1"
          type="button"
          class="shot-nav shot-nav--prev rooms__arrow"
          aria-label="Previous rooms"
          @click="scrollRooms(-1)"
        >
          <q-icon name="chevron_left" size="26px" />
        </button>
        <div ref="roomTrack" class="rooms__track" :class="{ 'is-in': roomsIn }">
          <router-link
            v-for="(room, roomIndex) in rooms"
            :key="room.id"
            :to="roomLink(room)"
            class="room"
            :style="{ '--i': Math.min(roomIndex, 8) }"
          >
            <span class="room__rise">
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
            </span>
          </router-link>
        </div>
        <button
          v-if="rooms.length > 1"
          type="button"
          class="shot-nav shot-nav--next rooms__arrow"
          aria-label="Next rooms"
          @click="scrollRooms(1)"
        >
          <q-icon name="chevron_right" size="26px" />
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import FeatureChips from "@/components/FeatureChips.vue";
import RevealWords from "@/components/home/RevealWords.vue";
import { useDragScroll } from "@/components/home/useDragScroll";
import { useInView } from "@/components/home/useInView";
import { useParallaxGroup } from "@/components/home/useParallax";
import { useCmsStore } from "@/stores/cms-store";
import type { Hotel, RoomType } from "@/types/greyon";
import { formatTime } from "@/utils/datetime";
import { roomDetailPath } from "@/utils/roomPath";

const SWIPE_PX = 48;

const cms = useCmsStore();
const { t } = useI18n();
const photoIndex = ref<Record<string, number>>({});
const roomTrack = ref<HTMLElement | null>(null);
const roomsIn = useInView(roomTrack);
const { setFrame, offsets } = useParallaxGroup(180);
let touchX: number | null = null;

useDragScroll(roomTrack, { momentum: true });

function frameStyle(id: string) {
  const y = offsets.value[id] ?? 0;
  return { transform: `translate3d(0, ${y}px, 0)` };
}

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

function scrollRooms(dir: -1 | 1) {
  const track = roomTrack.value;
  if (!track) return;
  const card = track.querySelector<HTMLElement>(".room");
  const delta = (card?.offsetWidth ?? 480) + 14;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  track.scrollBy({ left: dir * delta, behavior: reduce ? "auto" : "smooth" });
}
</script>

<style scoped>
.featured {
  --serif: "Cormorant Garamond", "Lora", Georgia, serif;
  --sans: "Montserrat", system-ui, sans-serif;
  background: var(--gy-cream);
  color: var(--gy-ink);
}

.property__media {
  position: relative;
  height: min(88vh, 920px);
  min-height: 560px;
  overflow: hidden;
  background: #2c312e;
  color: #fff;
}

.property__frame {
  position: absolute;
  inset: -20% 0;
}

.property__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform-origin: center center;
  animation: ken 16s ease-in-out infinite alternate;
}

.property__veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(12, 11, 10, 0.78) 0%,
    rgba(12, 11, 10, 0.18) 46%,
    rgba(12, 11, 10, 0.28) 100%
  );
  pointer-events: none;
}

.shot-nav {
  position: absolute;
  z-index: 2;
  display: inline-grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 999px;
  background: rgba(12, 11, 10, 0.2);
  color: #fff;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition:
    background 0.3s ease,
    transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.property__media > .shot-nav {
  top: 50%;
  transform: translateY(-50%);
  transition:
    background 0.3s ease,
    transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.property__media > .shot-nav:hover {
  transform: translateY(-50%) scale(1.08);
  background: rgba(255, 255, 255, 0.22);
}

.shot-nav--prev {
  left: 1.1rem;
}

.shot-nav--next {
  right: 1.1rem;
}

.shot-nav:hover {
  background: rgba(255, 255, 255, 0.18);
}

.shot-nav:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: 3px;
}

.property__count {
  position: absolute;
  top: 6.5rem;
  left: 50%;
  z-index: 2;
  margin: 0;
  transform: translateX(-50%);
  font-family: var(--sans);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.18em;
}

.property__copy {
  position: absolute;
  left: clamp(1.25rem, 5vw, 4.5rem);
  right: clamp(1.25rem, 5vw, 4.5rem);
  bottom: clamp(1.5rem, 5vw, 3.75rem);
  z-index: 2;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.5rem;
}

.property__meta {
  margin: 0 0 0.65rem;
  font-family: var(--sans);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.82);
}

.property__name {
  margin: 0;
  max-width: 14ch;
  font-family: var(--serif);
  font-size: clamp(2.8rem, 6vw, 5.4rem);
  font-weight: 500;
  letter-spacing: -0.03em;
  line-height: 0.92;
}

.property__name a {
  background-image: linear-gradient(currentColor, currentColor);
  background-repeat: no-repeat;
  background-position: 0 92%;
  background-size: 0 1px;
  transition:
    color 0.3s ease,
    background-size 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

.property__name a:hover,
.property__name a:focus-visible {
  color: var(--gy-gold);
  background-size: 100% 1px;
}

.property__cta {
  flex-shrink: 0;
  min-height: 44px;
}

.property__note {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  gap: clamp(1.5rem, 4vw, 4rem);
  align-items: start;
  width: min(1180px, calc(100% - 2.5rem));
  margin: 0 auto;
  padding: clamp(2.75rem, 6vw, 4.5rem) 0;
}

.property__lead {
  margin: 0;
  font-family: var(--serif);
  font-size: clamp(1.55rem, 2.5vw, 2.15rem);
  font-style: italic;
  font-weight: 500;
  line-height: 1.35;
}

.property__facts {
  display: grid;
  gap: 1rem;
}

.property__times {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem 0.6rem;
  margin: 0;
  font-family: var(--sans);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
}

.rooms {
  padding: 0 0 clamp(3.5rem, 7vw, 5.5rem);
}

.rooms__head {
  width: min(1180px, calc(100% - 2.5rem));
  margin: 0 auto 1.25rem;
}

.eyebrow {
  margin: 0 0 0.35rem;
  font-family: var(--sans);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
}

.rooms__title {
  margin: 0;
  font-family: var(--serif);
  font-size: clamp(2.6rem, 5vw, 4.2rem);
  font-weight: 500;
  letter-spacing: -0.03em;
  line-height: 0.95;
}

.rooms__frame {
  position: relative;
}

.rooms__arrow {
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.92);
  color: var(--gy-ink);
  border-color: transparent;
}

.rooms__arrow.shot-nav--prev {
  left: 1rem;
}

.rooms__arrow.shot-nav--next {
  right: 1rem;
}

.rooms__arrow:hover {
  transform: translateY(-50%) scale(1.08);
}

.rooms__track {
  display: flex;
  gap: 0.85rem;
  overflow-x: auto;
  scroll-snap-type: x proximity;
  overscroll-behavior-x: contain;
  padding: 0.6rem clamp(1rem, 4vw, 3rem) 0.8rem;
  cursor: grab;
  scrollbar-width: none;
}

.rooms__track.is-dragging,
.rooms__track.is-coasting {
  scroll-snap-type: none;
  cursor: grabbing;
}

.rooms__track::-webkit-scrollbar {
  display: none;
}

.rooms__track:active {
  cursor: grabbing;
}

.room {
  position: relative;
  flex: 0 0 min(72vw, 34rem);
  height: min(72vh, 560px);
  min-height: 380px;
  scroll-snap-align: start;
  overflow: hidden;
  background: #2c312e;
  color: #fff;
  transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

.room__rise {
  position: absolute;
  inset: 0;
  opacity: 0;
  transform: translateY(56px);
  transition:
    opacity 0.95s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.95s cubic-bezier(0.22, 1, 0.36, 1);
  transition-delay: calc(var(--i) * 90ms);
}

.rooms__track.is-in .room__rise {
  opacity: 1;
  transform: none;
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
  transition: transform 1.15s cubic-bezier(0.22, 1, 0.36, 1);
}

.room__shade {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.35rem;
  padding: 1.4rem 1.35rem 1.5rem;
  background: linear-gradient(
    to top,
    rgba(12, 11, 10, 0.78) 0%,
    rgba(12, 11, 10, 0.05) 58%
  );
}

.room__name {
  font-family: var(--serif);
  font-size: clamp(1.7rem, 2.4vw, 2.35rem);
  font-weight: 500;
  line-height: 1.05;
}

.room__detail {
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  font-family: var(--sans);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  transform: translateY(10px);
  transition:
    max-height 0.5s ease,
    opacity 0.5s ease,
    transform 0.5s ease;
}

.room:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: -4px;
}

@keyframes ken {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.12);
  }
}

@media (hover: hover) {
  .room:hover {
    transform: translateY(-10px);
  }

  .room:hover img {
    transform: scale(1.14);
  }

  .room:hover .room__shade {
    background: linear-gradient(
      to top,
      rgba(12, 11, 10, 0.9) 0%,
      rgba(12, 11, 10, 0.22) 68%
    );
  }

  .room:hover .room__detail {
    max-height: 4rem;
    opacity: 1;
    transform: none;
  }
}

@media (hover: none) {
  .room__detail {
    max-height: 3.5rem;
    opacity: 1;
    transform: none;
  }
}

@media (max-width: 800px) {
  .property__media {
    height: 78vh;
    min-height: 520px;
  }

  .property__copy {
    flex-direction: column;
    align-items: flex-start;
  }

  .property__note {
    grid-template-columns: 1fr;
    width: min(100% - 2.2rem, 1180px);
  }

  .room {
    flex-basis: 86vw;
    height: 68vh;
    min-height: 420px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .property__frame,
  .property__img,
  .room__rise,
  .room,
  .room__media img,
  .room__detail,
  .shot-nav {
    animation: none !important;
    transition: none !important;
    transform: none !important;
  }

  .room__rise {
    opacity: 1;
  }

  .property__media > .shot-nav,
  .rooms__arrow {
    transform: translateY(-50%) !important;
  }
}
</style>

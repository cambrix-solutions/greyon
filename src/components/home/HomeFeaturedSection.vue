<template>
  <section
    class="gy-section featured-section"
    aria-labelledby="home-featured-title"
  >
    <div class="gy-container">
      <header v-reveal class="section-head">
        <div>
          <p class="gy-eyebrow section-kicker">{{ $t("home.featured") }}</p>
          <h2 id="home-featured-title" class="gy-display section-title">
            {{ $t("home.stayWith") }}
          </h2>
        </div>
        <router-link to="/hotels" class="gy-link-arrow">
          {{ $t("home.viewHotels") }}
          <span aria-hidden="true">→</span>
        </router-link>
      </header>

      <div
        v-if="featuredLocations.length > 1"
        v-reveal="{ delay: '70ms' }"
        ref="filterTabs"
        class="filter-row"
        role="tablist"
        :aria-label="$t('home.featured')"
      >
        <button
          type="button"
          role="tab"
          class="filter-chip"
          :class="{ 'is-active': locationFilter === '' }"
          :aria-selected="locationFilter === ''"
          @click="locationFilter = ''"
          @keydown="onFilterKey"
        >
          {{ $t("home.allFeatured") }}
        </button>
        <button
          v-for="loc in featuredLocations"
          :key="loc.id"
          type="button"
          role="tab"
          class="filter-chip"
          :class="{ 'is-active': locationFilter === loc.id }"
          :aria-selected="locationFilter === loc.id"
          @click="locationFilter = loc.id"
          @keydown="onFilterKey"
        >
          {{ loc.name }}
          <span class="filter-chip__count">{{ countFor(loc.id) }}</span>
        </button>
      </div>

      <article
        v-if="spotlight"
        :key="spotlight.id"
        v-reveal="{ delay: '90ms' }"
        class="spotlight"
      >
        <div
          class="spotlight__media gy-card-media"
          @touchstart.passive="onShotTouchStart"
          @touchend.passive="onShotTouchEnd"
        >
          <img v-if="activePhoto" :src="activePhoto" :alt="spotlight.name" />
          <router-link
            class="spotlight__shot"
            :to="hotelPath(spotlight)"
            :aria-label="spotlight.name"
          />
          <template v-if="photos.length > 1">
            <button
              type="button"
              class="shot-nav shot-nav--prev"
              aria-label="Previous photo"
              @click="stepPhoto(-1)"
            >
              <q-icon name="chevron_left" size="26px" />
            </button>
            <button
              type="button"
              class="shot-nav shot-nav--next"
              aria-label="Next photo"
              @click="stepPhoto(1)"
            >
              <q-icon name="chevron_right" size="26px" />
            </button>
            <p class="spotlight__count" aria-live="polite">
              {{ photoIndex + 1 }} / {{ photos.length }}
            </p>
          </template>
          <span v-if="locationName(spotlight)" class="spotlight__loc">
            {{ locationName(spotlight) }}
          </span>
        </div>

        <div class="spotlight__body">
          <h3 class="gy-display spotlight__name">
            <router-link :to="hotelPath(spotlight)">{{
              spotlight.name
            }}</router-link>
          </h3>
          <ul v-if="metaChips(spotlight).length" class="meta-chips">
            <li v-for="chip in metaChips(spotlight)" :key="chip">{{ chip }}</li>
          </ul>
          <p v-if="spotlight.shortDescription" class="spotlight__desc">
            {{ spotlight.shortDescription }}
          </p>
          <p v-if="hasTimes(spotlight)" class="spotlight__times">
            <q-icon name="schedule" size="16px" />
            <span v-if="spotlight.checkInTime">
              {{ $t("home.checkIn") }} {{ formatTime(spotlight.checkInTime) }}
            </span>
            <span
              v-if="spotlight.checkInTime && spotlight.checkOutTime"
              aria-hidden="true"
              >·</span
            >
            <span v-if="spotlight.checkOutTime">
              {{ $t("home.checkOut") }}
              {{ formatTime(spotlight.checkOutTime) }}
            </span>
          </p>
          <FeatureChips
            v-if="spotlight.amenities.length"
            :items="spotlight.amenities"
            :limit="5"
            size="sm"
            sheet-title="Amenities"
          />
          <div class="spotlight__cta">
            <router-link
              class="gy-btn gy-btn--light gy-btn--sm"
              :to="hotelPath(spotlight)"
            >
              View Hotel
            </router-link>
          </div>
        </div>
      </article>

      <div
        v-else-if="visibleHotels.length"
        class="stay-grid"
        :class="{
          'stay-grid--two': visibleHotels.length === 2,
          'stay-grid--many': visibleHotels.length >= 3
        }"
      >
        <div
          v-for="(hotel, i) in visibleHotels"
          :key="hotel.id"
          v-reveal="{ delay: `${Math.min(i, 5) * 80}ms` }"
          class="stay-grid__item"
        >
          <article class="stay-card">
            <router-link
              :to="hotelPath(hotel)"
              class="stay-card__media gy-card-media"
            >
              <img
                v-if="coverImage(hotel)"
                :src="coverImage(hotel)"
                :alt="hotel.name"
                loading="lazy"
              />
              <span v-if="locationName(hotel)" class="stay-card__loc">{{
                locationName(hotel)
              }}</span>
            </router-link>
            <div class="stay-card__body">
              <h3 class="gy-display">
                <router-link :to="hotelPath(hotel)">{{
                  hotel.name
                }}</router-link>
              </h3>
              <ul v-if="metaChips(hotel).length" class="meta-chips">
                <li v-for="chip in metaChips(hotel)" :key="chip">{{ chip }}</li>
              </ul>
              <p v-if="hotel.shortDescription" class="stay-card__desc">
                {{ hotel.shortDescription }}
              </p>
              <FeatureChips
                v-if="hotel.amenities.length"
                :items="hotel.amenities"
                :limit="3"
                size="sm"
                sheet-title="Amenities"
              />
              <router-link
                class="gy-btn gy-btn--light gy-btn--sm stay-card__cta"
                :to="hotelPath(hotel)"
              >
                View Hotel
              </router-link>
            </div>
          </article>
        </div>
      </div>

      <div
        v-if="spotlight && spotlightRooms.length"
        class="rooms"
        aria-roledescription="carousel"
        :aria-label="$t('home.rooms')"
      >
        <div class="rooms__bar">
          <h3 class="gy-display rooms__title">{{ $t("home.rooms") }}</h3>
          <div v-if="spotlightRooms.length > 1" class="rooms__nav">
            <button
              type="button"
              class="round-btn"
              aria-label="Previous rooms"
              @click="scrollRooms(-1)"
            >
              <q-icon name="chevron_left" size="22px" />
            </button>
            <button
              type="button"
              class="round-btn"
              aria-label="Next rooms"
              @click="scrollRooms(1)"
            >
              <q-icon name="chevron_right" size="22px" />
            </button>
          </div>
        </div>
        <div ref="roomTrack" class="rooms__track">
          <router-link
            v-for="room in spotlightRooms"
            :key="room.id"
            :to="roomDetailPath(spotlight, room)"
            class="room-card"
          >
            <span class="room-card__media gy-card-media">
              <img
                v-if="roomImage(room)"
                :src="roomImage(room)"
                :alt="room.name"
                loading="lazy"
              />
            </span>
            <span class="room-card__name">{{ room.name }}</span>
            <span v-if="roomMeta(room)" class="room-card__meta">{{
              roomMeta(room)
            }}</span>
          </router-link>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import FeatureChips from "@/components/FeatureChips.vue";
import { useCmsStore } from "@/stores/cms-store";
import type { Hotel, RoomType } from "@/types/greyon";
import { formatTime } from "@/utils/datetime";
import { roomDetailPath } from "@/utils/roomPath";

const SWIPE_PX = 48;

const cms = useCmsStore();
const { t } = useI18n();

const locationFilter = ref("");
const photoIndex = ref(0);
const filterTabs = ref<HTMLElement | null>(null);
const roomTrack = ref<HTMLElement | null>(null);
let touchX: number | null = null;

const featuredHotels = computed(() =>
  cms.publishedHotels.filter(hotel => hotel.featured)
);

const featuredLocations = computed(() => {
  const ids = new Set(featuredHotels.value.map(hotel => hotel.locationId));
  return cms.publishedLocations.filter(loc => ids.has(loc.id));
});

const visibleHotels = computed(() => {
  if (!locationFilter.value) return featuredHotels.value;
  return featuredHotels.value.filter(
    hotel => hotel.locationId === locationFilter.value
  );
});

const spotlight = computed(() =>
  visibleHotels.value.length === 1 ? visibleHotels.value[0] : null
);

const photos = computed(() =>
  spotlight.value ? galleryFor(spotlight.value) : []
);

const activePhoto = computed(() => photos.value[photoIndex.value] ?? "");

const spotlightRooms = computed(() => {
  const hotel = spotlight.value;
  if (!hotel) return [];
  return cms.roomTypes.filter(
    room => room.hotelId === hotel.id && room.status === "published"
  );
});

watch(spotlight, () => {
  photoIndex.value = 0;
});

watch(featuredLocations, locs => {
  if (
    locationFilter.value &&
    !locs.some(loc => loc.id === locationFilter.value)
  ) {
    locationFilter.value = "";
  }
});

function countFor(locationId: string) {
  return featuredHotels.value.filter(hotel => hotel.locationId === locationId)
    .length;
}

function locationName(hotel: Hotel) {
  return cms.getLocationById(hotel.locationId)?.name ?? "";
}

function hotelPath(hotel: Hotel) {
  return `/hotels/${hotel.slug}`;
}

function galleryFor(hotel: Hotel) {
  const seen = new Set<string>();
  const photosOut: string[] = [];
  for (const raw of [hotel.heroImage, ...hotel.gallery]) {
    const src = raw?.trim();
    if (!src || seen.has(src)) continue;
    seen.add(src);
    photosOut.push(src);
  }
  return photosOut;
}

function coverImage(hotel: Hotel) {
  return galleryFor(hotel)[0] ?? "";
}

function metaChips(hotel: Hotel) {
  const chips: string[] = [];
  if (hotel.propertyType?.trim()) chips.push(hotel.propertyType.trim());
  if (
    typeof hotel.starRating === "number" &&
    hotel.starRating >= 1 &&
    hotel.starRating <= 5
  ) {
    chips.push(t("home.starClass", { n: hotel.starRating }));
  }
  if (hotel.area?.trim()) chips.push(hotel.area.trim());
  return chips;
}

function hasTimes(hotel: Hotel) {
  return Boolean(hotel.checkInTime?.trim() || hotel.checkOutTime?.trim());
}

function stepPhoto(dir: -1 | 1) {
  const total = photos.value.length;
  if (total < 2) return;
  photoIndex.value = (photoIndex.value + dir + total) % total;
}

function onShotTouchStart(event: TouchEvent) {
  touchX = event.changedTouches[0]?.clientX ?? null;
}

function onShotTouchEnd(event: TouchEvent) {
  if (touchX === null) return;
  const endX = event.changedTouches[0]?.clientX ?? touchX;
  const delta = endX - touchX;
  touchX = null;
  if (Math.abs(delta) < SWIPE_PX) return;
  stepPhoto(delta < 0 ? 1 : -1);
}

function onFilterKey(event: KeyboardEvent) {
  if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
  const tabs = [
    ...(filterTabs.value?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ??
      [])
  ];
  if (!tabs.length) return;
  event.preventDefault();
  const current = tabs.findIndex(tab => tab === document.activeElement);
  const start = current >= 0 ? current : 0;
  let next = start;
  if (event.key === "Home") next = 0;
  else if (event.key === "End") next = tabs.length - 1;
  else if (event.key === "ArrowRight") next = (start + 1) % tabs.length;
  else next = (start - 1 + tabs.length) % tabs.length;
  tabs[next]?.focus();
  tabs[next]?.click();
}

function roomImage(room: RoomType) {
  return room.images.find(src => src.trim())?.trim() ?? "";
}

function roomMeta(room: RoomType) {
  return [room.bedType.trim(), room.roomSize.trim()]
    .filter(Boolean)
    .join(" · ");
}

function scrollRooms(dir: -1 | 1) {
  const track = roomTrack.value;
  if (!track) return;
  const card = track.querySelector<HTMLElement>(".room-card");
  const delta = (card?.offsetWidth ?? 220) + 14;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  track.scrollBy({ left: dir * delta, behavior: reduce ? "auto" : "smooth" });
}
</script>

<style scoped>
.featured-section {
  background:
    radial-gradient(
      900px 320px at 100% 0%,
      rgba(196, 163, 90, 0.14),
      transparent 70%
    ),
    var(--gy-cream);
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 0.75rem 1.5rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

.section-kicker {
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
}

.section-kicker::after {
  content: "";
  width: 2.25rem;
  height: 1px;
  background: var(--gy-gold);
}

.section-title {
  margin: 0;
  font-size: clamp(2.15rem, 4.6vw, 3.35rem);
  line-height: 0.98;
  letter-spacing: -0.03em;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 44px;
  padding: 0.35rem 0.95rem;
  border-radius: 999px;
  border: 1px solid rgba(69, 76, 75, 0.16);
  background: var(--gy-white);
  color: var(--gy-ink);
  font-family: var(--font-display);
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition:
    background 0.25s ease,
    border-color 0.25s ease,
    color 0.25s ease,
    transform 0.25s ease;
}

.filter-chip__count {
  display: inline-grid;
  place-items: center;
  min-width: 1.35rem;
  height: 1.35rem;
  padding: 0 0.3rem;
  border-radius: 999px;
  background: rgba(98, 112, 99, 0.12);
  color: var(--gy-forest);
  font-size: 0.7rem;
}

.filter-chip.is-active {
  background: var(--gy-forest);
  border-color: var(--gy-forest);
  color: var(--gy-white);
}

.filter-chip.is-active .filter-chip__count {
  background: rgba(255, 255, 255, 0.2);
  color: var(--gy-white);
}

.filter-chip:hover {
  transform: translateY(-1px);
}

.filter-chip:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: 3px;
}

.spotlight {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  background: var(--gy-white);
  border: 1px solid rgba(69, 76, 75, 0.08);
  border-radius: 22px;
  overflow: hidden;
  box-shadow: 0 18px 50px rgba(69, 76, 75, 0.08);
}

.spotlight__media {
  position: relative;
  min-height: 360px;
  background: var(--gy-sand);
}

.spotlight__media img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 1.1s cubic-bezier(0.22, 1, 0.36, 1);
}

.spotlight:hover .spotlight__media img {
  transform: scale(1.05);
}

.spotlight__shot {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.spotlight__loc,
.stay-card__loc {
  position: absolute;
  left: 0.9rem;
  bottom: 0.9rem;
  z-index: 2;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  background: rgba(18, 16, 14, 0.45);
  color: #fff;
  font-family: var(--font-display);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  backdrop-filter: blur(8px);
  pointer-events: none;
}

.shot-nav,
.round-btn {
  display: inline-grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.94);
  color: var(--gy-ink);
  cursor: pointer;
  box-shadow: 0 8px 22px rgba(18, 16, 14, 0.16);
  transition:
    color 0.2s ease,
    transform 0.2s ease;
}

.shot-nav {
  position: absolute;
  top: 50%;
  z-index: 2;
  transform: translateY(-50%);
}

.shot-nav--prev {
  left: 0.75rem;
}

.shot-nav--next {
  right: 0.75rem;
}

.shot-nav:hover,
.round-btn:hover {
  color: var(--gy-forest);
}

.shot-nav:focus-visible,
.round-btn:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: 3px;
}

.spotlight__count {
  position: absolute;
  right: 0.9rem;
  bottom: 0.9rem;
  z-index: 2;
  margin: 0;
  padding: 0.3rem 0.65rem;
  border-radius: 999px;
  background: rgba(18, 16, 14, 0.5);
  color: #fff;
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  pointer-events: none;
}

.spotlight__body {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  min-width: 0;
  padding: clamp(1.25rem, 2.4vw, 2rem);
}

.spotlight__name {
  margin: 0;
  font-size: clamp(1.7rem, 2.4vw, 2.35rem);
  line-height: 1.08;
}

.spotlight__name a:hover,
.stay-card__body h3 a:hover {
  color: var(--gy-gold-deep);
}

.meta-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.meta-chips li {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  min-height: 1.7rem;
  padding: 0.15rem 0.65rem;
  border: 1px solid rgba(143, 115, 64, 0.45);
  border-radius: 999px;
  color: var(--gy-gold-deep);
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  line-height: 1.3;
}

.spotlight__desc,
.stay-card__desc {
  margin: 0;
  color: var(--gy-muted);
  font-size: 0.98rem;
  line-height: 1.65;
}

.spotlight__times {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem 0.5rem;
  margin: 0;
  color: var(--gy-ink);
  font-family: var(--font-display);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.spotlight__times .q-icon {
  color: var(--gy-forest);
}

.spotlight__cta {
  margin-top: auto;
  padding-top: 0.35rem;
}

.spotlight__cta .gy-btn,
.stay-card__cta {
  min-height: 44px;
}

.stay-grid {
  display: grid;
  gap: 1.25rem;
}

.stay-grid__item {
  min-width: 0;
  height: 100%;
}

.stay-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  padding: 0.7rem 0.7rem 1rem;
  background: var(--gy-white);
  border: 1px solid rgba(69, 76, 75, 0.08);
  border-radius: 20px;
  box-shadow: 0 12px 32px rgba(69, 76, 75, 0.06);
  transition:
    transform 0.45s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.45s ease;
}

.stay-card__media {
  position: relative;
  aspect-ratio: 4 / 3;
  border-radius: 14px;
}

.stay-card__media img {
  transition: transform 1s cubic-bezier(0.22, 1, 0.36, 1);
}

.stay-card__body {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  min-width: 0;
  padding: 0.95rem 0.35rem 0.15rem;
  flex: 1;
}

.stay-card__body h3 {
  margin: 0;
  font-size: clamp(1.35rem, 2vw, 1.7rem);
  line-height: 1.12;
}

.stay-card__desc {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.stay-card__cta {
  align-self: flex-start;
  margin-top: auto;
}

.rooms {
  margin-top: 1.75rem;
}

.rooms__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}

.rooms__title {
  margin: 0;
  font-size: 1.35rem;
}

.rooms__nav {
  display: flex;
  gap: 0.45rem;
}

.rooms__nav .round-btn {
  border: 1px solid rgba(69, 76, 75, 0.12);
  box-shadow: none;
}

.rooms__track {
  display: flex;
  gap: 0.9rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-padding-inline: 0.15rem;
  overscroll-behavior-x: contain;
  padding: 0.2rem 0.15rem 0.85rem;
  scrollbar-width: thin;
}

.room-card {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  flex: 0 0 min(78%, 230px);
  scroll-snap-align: start;
  min-width: 0;
  padding: 0.45rem;
  background: var(--gy-white);
  border: 1px solid rgba(69, 76, 75, 0.08);
  border-radius: 16px;
  box-shadow: 0 8px 22px rgba(69, 76, 75, 0.05);
  transition:
    transform 0.4s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.4s ease;
}

.room-card__media {
  aspect-ratio: 4 / 3;
  border-radius: 12px;
  background: var(--gy-sand);
}

.room-card__media img {
  transition: transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}

.room-card__name {
  font-family: var(--font-display);
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.01em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.room-card__meta {
  color: var(--gy-muted);
  font-size: 0.78rem;
  line-height: 1.35;
}

.room-card:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: 3px;
}

@media (hover: hover) {
  .stay-card:hover {
    transform: translateY(-7px);
    box-shadow: 0 22px 46px rgba(69, 76, 75, 0.12);
  }

  .stay-card:hover .stay-card__media img,
  .room-card:hover .room-card__media img {
    transform: scale(1.06);
  }

  .room-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 32px rgba(69, 76, 75, 0.1);
  }
}

@media (min-width: 800px) {
  .stay-grid--two,
  .stay-grid--many {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .room-card {
    flex-basis: 240px;
  }
}

@media (min-width: 1100px) {
  .stay-grid--many {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .room-card {
    flex-basis: calc((100% - 2.7rem) / 4);
  }
}

@media (max-width: 860px) {
  .spotlight {
    grid-template-columns: 1fr;
  }

  .spotlight__media {
    min-height: 0;
    aspect-ratio: 4 / 3;
  }
}

@media (prefers-reduced-motion: reduce) {
  .spotlight__media img,
  .stay-card,
  .stay-card__media img,
  .room-card,
  .room-card__media img,
  .filter-chip {
    transition: none;
  }
}
</style>

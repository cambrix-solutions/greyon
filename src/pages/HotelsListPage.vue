<template>
  <q-page class="listing-luxe home-motion">
    <SeoHead
      title="Hotels | Greyon"
      description="Browse Greyon hotel portfolio across Cambodia."
    />

    <section class="mast" data-sheet="Masthead">
      <div class="mast__media">
        <img v-if="mastImage" class="mast__img" :src="mastImage" alt="" />
        <div class="mast__veil" />
      </div>

      <div class="listing-wrap mast__content">
        <p v-reveal class="eyebrow eyebrow--light">Portfolio</p>
        <RevealWords tag="h1" text="Greyon hotels" />
        <p v-reveal class="mast__lead">
          Published properties, ready to filter by destination or name.
        </p>
        <div v-reveal class="mast__actions">
          <button
            class="gy-btn gy-btn--light"
            type="button"
            @click="scrollToResults"
          >
            Explore stays
          </button>
        </div>
      </div>
      <SectionDivider />
    </section>

    <section
      v-if="cms.publishedLocations.length"
      class="destinations"
      data-sheet="Destinations"
    >
      <div class="listing-wrap destinations__head">
        <p v-reveal class="eyebrow">Places</p>
        <h2 v-reveal>Destinations</h2>
        <p v-reveal class="section-lead">
          Drag across the places, then choose one to narrow the list.
        </p>
      </div>
      <div
        ref="destRail"
        class="dest-rail"
        tabindex="0"
        aria-label="Destinations"
      >
        <button
          type="button"
          class="dest-card"
          :class="{ 'is-active': !locationFilter }"
          :aria-pressed="!locationFilter"
          @click="setLocation('')"
        >
          <span
            class="dest-card__media dest-card__media--all"
            aria-hidden="true"
          />
          <span class="dest-card__name">All destinations</span>
        </button>
        <button
          v-for="loc in cms.publishedLocations"
          :key="loc.id"
          type="button"
          class="dest-card"
          :class="{ 'is-active': locationFilter === loc.id }"
          :aria-pressed="locationFilter === loc.id"
          @click="chooseDestination(loc.id)"
        >
          <span class="dest-card__media">
            <img
              v-if="loc.heroImage"
              :src="loc.heroImage"
              :alt="loc.name"
              loading="lazy"
            />
          </span>
          <span class="dest-card__name">{{ loc.name }}</span>
        </button>
      </div>
    </section>

    <SectionDivider kind="angle" fill="var(--gy-white)" />

    <section id="listing-results" class="results-band">
      <div class="listing-wrap">
        <div class="filters" data-sheet="Filters">
          <div class="filters__bar" role="search">
            <label class="field field--search">
              <span>Keyword</span>
              <input
                v-model="keyword"
                type="search"
                placeholder="Hotel name"
                autocomplete="off"
                enterkeyhint="search"
              />
            </label>
            <label class="field">
              <span>Destination</span>
              <GySelect
                :model-value="locationFilter"
                :options="locationOptions"
                emit-value
                map-options
                outlined
                hide-bottom-space
                aria-label="Destination"
                @update:model-value="onLocationChange"
              />
            </label>
            <label class="field">
              <span>Sort</span>
              <GySelect
                v-model="sortKey"
                :options="sortOptions"
                emit-value
                map-options
                outlined
                hide-bottom-space
                aria-label="Sort"
              />
            </label>
          </div>

          <div
            v-if="propertyTypes.length > 1"
            class="chip-row"
            role="group"
            aria-label="Property type"
          >
            <button
              type="button"
              class="chip"
              :class="{ 'is-active': !propertyFilter }"
              :aria-pressed="!propertyFilter"
              @click="propertyFilter = ''"
            >
              All types
            </button>
            <button
              v-for="type in propertyTypes"
              :key="type"
              type="button"
              class="chip"
              :class="{ 'is-active': propertyFilter === type }"
              :aria-pressed="propertyFilter === type"
              @click="propertyFilter = propertyFilter === type ? '' : type"
            >
              {{ type }}
            </button>
          </div>

          <div class="filters__foot">
            <p class="filters__count" aria-live="polite">{{ resultLabel }}</p>
            <div
              v-if="mapAvailable"
              class="view-toggle"
              role="group"
              aria-label="Results view"
            >
              <button
                type="button"
                :aria-pressed="viewMode === 'list'"
                :class="{ 'is-active': viewMode === 'list' }"
                @click="viewMode = 'list'"
              >
                List
              </button>
              <button
                type="button"
                :aria-pressed="viewMode === 'map'"
                :class="{ 'is-active': viewMode === 'map' }"
                @click="viewMode = 'map'"
              >
                Map
              </button>
            </div>
          </div>
        </div>

        <div data-sheet="Results">
          <header class="results-head">
            <p v-reveal class="eyebrow">Stays</p>
            <h2 v-reveal>In the portfolio</h2>
          </header>

          <Transition name="swap" mode="out-in">
            <div
              v-if="viewMode === 'map' && mapAvailable"
              key="map"
              class="map-stage"
            >
              <DestinationsMap
                canvas-only
                :hotels="filtered"
                :initial-slug="activeSlug"
              />
            </div>
            <div v-else key="list">
              <p v-if="showLoading" class="empty">Loading properties…</p>
              <p v-else-if="showError" class="empty" role="alert">{{
                cms.catalogError
              }}</p>
              <TransitionGroup
                v-else-if="filtered.length"
                name="result"
                tag="div"
                class="results"
              >
                <div
                  v-for="hotel in filtered"
                  :key="hotel.id"
                  class="result-slot"
                >
                  <div class="result-tilt">
                    <HotelCard live :hotel="hotel" />
                  </div>
                </div>
              </TransitionGroup>
              <p v-else class="empty">No hotels found.</p>
            </div>
          </Transition>
        </div>
      </div>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import DestinationsMap from "@/components/DestinationsMap.vue";
import GySelect from "@/components/GySelect.vue";
import RevealWords from "@/components/home/RevealWords.vue";
import { useDragScroll } from "@/components/home/useDragScroll";
import SectionDivider from "@/components/hotel/SectionDivider.vue";
import HotelCard from "@/components/HotelCard.vue";
import SeoHead from "@/components/SeoHead.vue";
import { useBookingStore } from "@/stores/booking-store";
import { useCmsStore } from "@/stores/cms-store";
import type { Hotel } from "@/types/greyon";
import {
  queryHasSearchFields,
  searchParamsFromQuery
} from "@/utils/bookingSearchQuery";

const cms = useCmsStore();
const booking = useBookingStore();
const route = useRoute();
const router = useRouter();

const locationFilter = ref("");
const keyword = ref("");
const propertyFilter = ref("");
const sortKey = ref<"featured" | "az" | "za">("featured");
const sortOptions = [
  { label: "Featured", value: "featured" },
  { label: "Name A–Z", value: "az" },
  { label: "Name Z–A", value: "za" }
] as const;
const locationOptions = computed(() => [
  { label: "All destinations", value: "" },
  ...cms.publishedLocations.map(loc => ({ label: loc.name, value: loc.id }))
]);
const viewMode = ref<"list" | "map">("list");

const destRail = ref<HTMLElement | null>(null);
useDragScroll(destRail, { momentum: true });

function hasCoords(hotel: Hotel) {
  const { lat, lng } = hotel.coordinates ?? { lat: 0, lng: 0 };
  return (
    Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)
  );
}

function applyLocationSlugFromQuery() {
  const slug =
    typeof route.query.locationSlug === "string"
      ? route.query.locationSlug
      : "";
  if (!slug) {
    locationFilter.value = "";
    return;
  }
  const loc = cms.publishedLocations.find(l => l.slug === slug);
  if (loc) locationFilter.value = loc.id;
}

function setLocation(id: string) {
  const y = window.scrollY;
  locationFilter.value = id;
  const loc = cms.publishedLocations.find(l => l.id === id);
  const nextQuery = { ...route.query } as Record<string, string | string[]>;
  if (loc) nextQuery.locationSlug = loc.slug;
  else delete nextQuery.locationSlug;
  void router.replace({ query: nextQuery }).then(() => {
    window.scrollTo(0, y);
    requestAnimationFrame(() => window.scrollTo(0, y));
  });
}

function chooseDestination(id: string) {
  setLocation(locationFilter.value === id ? "" : id);
}

function onLocationChange(value: string | null) {
  setLocation(value ?? "");
}

function scrollToResults() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelector("#listing-results")?.scrollIntoView({
    behavior: reduce ? "auto" : "smooth"
  });
}

onMounted(() => {
  if (queryHasSearchFields(route.query)) {
    booking.setSearch(searchParamsFromQuery(route.query));
  }
  applyLocationSlugFromQuery();
});

watch(
  () => [route.query.locationSlug, cms.publishedLocations.length] as const,
  () => applyLocationSlugFromQuery()
);

const mastImage = computed(() => {
  const featured = cms.publishedHotels.find(
    hotel => hotel.featured && hotel.heroImage?.trim()
  );
  if (featured?.heroImage?.trim()) return featured.heroImage.trim();
  const hotel = cms.publishedHotels.find(item => item.heroImage?.trim());
  if (hotel?.heroImage?.trim()) return hotel.heroImage.trim();
  return (
    cms.publishedLocations
      .find(loc => loc.heroImage?.trim())
      ?.heroImage.trim() ?? ""
  );
});

const mapAvailable = computed(() => cms.publishedHotels.some(hasCoords));

const activeSlug = computed(
  () =>
    cms.publishedLocations.find(loc => loc.id === locationFilter.value)?.slug ??
    ""
);

const propertyTypes = computed(() => {
  const names = new Set<string>();
  for (const hotel of cms.publishedHotels) {
    if (locationFilter.value && hotel.locationId !== locationFilter.value) {
      continue;
    }
    const type = hotel.propertyType?.trim();
    if (type) names.add(type);
  }
  return [...names].sort((a, b) => a.localeCompare(b));
});

watch(propertyTypes, types => {
  if (propertyFilter.value && !types.includes(propertyFilter.value)) {
    propertyFilter.value = "";
  }
});

const filtered = computed(() => {
  const query = keyword.value.trim().toLowerCase();
  const list = cms.publishedHotels.filter(hotel => {
    if (locationFilter.value && hotel.locationId !== locationFilter.value) {
      return false;
    }
    if (
      propertyFilter.value &&
      (hotel.propertyType ?? "").trim() !== propertyFilter.value
    ) {
      return false;
    }
    if (query) {
      const place = cms.getLocationById(hotel.locationId)?.name ?? "";
      const hay =
        `${hotel.name} ${hotel.shortDescription} ${hotel.area ?? ""} ${place}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
  return [...list].sort((a, b) => {
    if (sortKey.value === "za") return b.name.localeCompare(a.name);
    if (sortKey.value === "az") return a.name.localeCompare(b.name);
    const featured = Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    if (featured) return featured;
    return a.name.localeCompare(b.name);
  });
});

const resultLabel = computed(() => {
  const count = filtered.value.length;
  const noun = count === 1 ? "property" : "properties";
  const place = cms.publishedLocations.find(
    loc => loc.id === locationFilter.value
  )?.name;
  return place ? `${place} · ${count} ${noun}` : `${count} ${noun}`;
});

const showLoading = computed(
  () => cms.catalogSyncing && !cms.publishedHotels.length
);
const showError = computed(
  () =>
    Boolean(cms.catalogError) &&
    !cms.catalogSyncing &&
    !cms.publishedHotels.length
);
</script>

<style src="@/components/home/home-motion.css"></style>

<style scoped>
.listing-luxe {
  background:
    radial-gradient(
      ellipse at 100% 0%,
      rgba(196, 163, 90, 0.1),
      transparent 28%
    ),
    var(--gy-cream);
  color: var(--gy-forest);
}

.listing-luxe h1,
.listing-luxe h2,
.listing-luxe :deep(h1) {
  font-family: var(--font-display);
  font-weight: 500;
  letter-spacing: normal;
}

.listing-wrap {
  width: min(1240px, calc(100% - 2.5rem));
  margin-inline: auto;
}

.eyebrow {
  margin: 0 0 0.85rem;
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-style: normal;
  font-weight: 700;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--gy-gold);
}

.eyebrow--light {
  color: var(--gy-gold);
}

.section-lead,
.mast__lead {
  max-width: 36rem;
  margin: 0.9rem 0 0;
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.6;
}

.mast {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: min(86svh, 52rem);
  color: #fff;
  background: #161311;
  isolation: isolate;
}

.mast__media,
.mast__veil {
  position: absolute;
  inset: 0;
}

.mast__media {
  overflow: hidden;
  pointer-events: none;
}

.mast__img {
  width: 100%;
  height: 125%;
  object-fit: cover;
  object-position: center 30%;
}

.mast__veil {
  background:
    linear-gradient(
      100deg,
      rgba(18, 28, 24, 0.55) 0%,
      rgba(12, 11, 10, 0.12) 48%,
      rgba(12, 11, 10, 0.28) 100%
    ),
    linear-gradient(
      180deg,
      rgba(12, 11, 10, 0.18) 0%,
      rgba(12, 11, 10, 0.08) 36%,
      rgba(12, 11, 10, 0.72) 100%
    );
}

.mast__content {
  position: relative;
  z-index: 2;
  padding: clamp(3.5rem, 10vh, 6.5rem) 0 clamp(1.5rem, 4vh, 2.5rem);
}

.listing-luxe :deep(h1) {
  max-width: 9em;
  margin: 0;
  font-size: var(--gy-text-display);
  line-height: 1;
}

.mast__lead {
  color: rgba(255, 255, 255, 0.9);
}

.mast__actions {
  margin-top: 1.4rem;
}

.destinations {
  position: relative;
  z-index: 2;
  padding: clamp(1.4rem, 4vw, 2.8rem) 0 0.25rem;
  overflow: hidden;
}

.destinations h2,
.results-head h2 {
  margin: 0;
  font-size: var(--gy-text-4xl);
  line-height: 1;
}

.section-lead {
  margin-bottom: 0.4rem;
  color: var(--gy-forest);
}

.dest-rail {
  display: flex;
  gap: 0.9rem;
  margin-top: 1.2rem;
  padding: 0.35rem max(1.25rem, calc((100% - 1240px) / 2)) 1.5rem;
  overflow-x: auto;
  scroll-snap-type: x proximity;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  cursor: grab;
}

.dest-rail::-webkit-scrollbar {
  display: none;
}

.dest-rail:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: -4px;
}

.dest-rail.is-dragging,
.dest-rail.is-coasting {
  cursor: grabbing;
  scroll-snap-type: none;
}

.dest-card {
  position: relative;
  flex: 0 0 min(78vw, 22rem);
  padding: 0;
  border: 0;
  border-radius: 22px;
  overflow: hidden;
  scroll-snap-align: start;
  background: #24302a;
  color: #fff;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 16px 36px rgba(22, 21, 19, 0.12);
}

.dest-card:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: 3px;
}

.dest-card.is-active {
  box-shadow:
    0 0 0 2px var(--gy-gold),
    0 18px 40px rgba(22, 21, 19, 0.16);
}

.dest-card__media {
  display: block;
  aspect-ratio: 3 / 4;
  background:
    linear-gradient(160deg, rgba(196, 163, 90, 0.35), transparent 42%), #2a3330;
}

.dest-card__media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dest-card__media--all {
  background:
    radial-gradient(
      circle at 30% 20%,
      rgba(196, 163, 90, 0.7),
      transparent 42%
    ),
    linear-gradient(160deg, var(--gy-forest), #1c2420 70%);
}

.dest-card__name {
  position: absolute;
  left: 0.9rem;
  right: 0.9rem;
  bottom: 0.95rem;
  font-family: var(--font-display);
  font-weight: 500;
  letter-spacing: normal;
  font-size: 1.1rem;
  line-height: 1.3;
}

.results-band {
  position: relative;
  z-index: 1;
  padding: 0.25rem 0 clamp(4rem, 8vw, 6.5rem);
  background:
    linear-gradient(180deg, rgba(98, 112, 99, 0.09), transparent 8rem),
    var(--gy-white);
}

.filters {
  position: relative;
  display: grid;
  gap: 0.8rem;
  margin: 0.4rem 0 1.6rem;
  padding: 0.95rem 1rem 0.9rem;
  border-radius: 24px;
  background: rgba(250, 248, 246, 0.78);
  box-shadow: 0 18px 50px rgba(28, 24, 18, 0.1);
  backdrop-filter: blur(18px) saturate(1.2);
}

.filters::before {
  content: "";
  position: absolute;
  inset: 0;
  padding: 2.5px;
  border-radius: inherit;
  background: conic-gradient(
    from 40deg,
    var(--gy-gold),
    var(--gy-forest) 32%,
    rgba(255, 255, 255, 0.2) 58%,
    var(--gy-gold-deep),
    var(--gy-gold)
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

.filters__bar {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr) minmax(9rem, 0.8fr);
  gap: 0.75rem;
  align-items: end;
}

.filters__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem 1rem;
}

.field {
  display: grid;
  gap: 0.35rem;
  min-width: 0;
  font-family: var(--font-display);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--gy-gold);
}

.field input,
.field select {
  min-height: 44px;
  width: 100%;
  border: 1px solid rgba(69, 76, 75, 0.16);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.92);
  padding: 0.45rem 0.7rem;
  color: var(--gy-forest);
  font: inherit;
  font-size: 0.92rem;
  font-weight: 500;
  letter-spacing: 0;
  text-transform: none;
}

.field input:focus-visible,
.field select:focus-visible,
.chip:focus-visible,
.view-toggle button:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: 2px;
}

.view-toggle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  flex: 0 0 auto;
  min-height: 44px;
  padding: 0.2rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: inset 0 0 0 1px rgba(69, 76, 75, 0.12);
}

.view-toggle button {
  min-height: 40px;
  min-width: 4.5rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--gy-forest);
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  cursor: pointer;
}

.view-toggle button.is-active {
  background: var(--gy-forest);
  color: #fff;
}

.chip-row {
  display: flex;
  gap: 0.45rem;
  overflow-x: auto;
  scrollbar-width: none;
}

.chip-row::-webkit-scrollbar {
  display: none;
}

.chip {
  flex: 0 0 auto;
  min-height: 44px;
  padding: 0.4rem 0.9rem;
  border: 1px solid rgba(69, 76, 75, 0.16);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.8);
  color: var(--gy-forest);
  font-family: var(--font-display);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}

.chip.is-active {
  border-color: var(--gy-forest);
  background: var(--gy-forest);
  color: #fff;
}

.filters__count {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: -0.02em;
  font-size: var(--gy-text-stat);
  line-height: 1.05;
}

.results-head {
  margin-bottom: 1.15rem;
}

.results {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.35rem;
}

.result-tilt {
  height: 100%;
}

.map-stage {
  position: relative;
  z-index: 1;
  overflow: hidden;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 22px 50px rgba(28, 24, 18, 0.08);
}

.empty {
  margin: 0.5rem 0 0;
  color: var(--gy-forest);
  font-family: var(--font-display);
}

.swap-enter-active,
.swap-leave-active,
.result-enter-active,
.result-leave-active {
  transition:
    opacity 0.5s ease,
    transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

.swap-enter-from,
.result-enter-from {
  opacity: 0;
  transform: translateY(22px);
}

.swap-leave-to,
.result-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

.result-move {
  transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

#listing-results {
  scroll-margin-top: 5.6rem;
}

@media (max-width: 900px) {
  .filters__bar {
    grid-template-columns: 1fr 1fr;
  }

  .field--search {
    grid-column: 1 / -1;
  }

  .results {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 599px) {
  .filters {
    gap: 0.55rem;
    margin-bottom: 1.1rem;
    padding: 0.7rem 0.7rem 0.65rem;
  }

  #listing-results {
    scroll-margin-top: 4.6rem;
  }

  .filters__count {
    font-size: 1.35rem;
  }

  .eyebrow {
    letter-spacing: 0.16em;
  }

  .listing-wrap {
    width: min(1240px, calc(100% - 1.5rem));
  }
}

@media (prefers-reduced-motion: reduce) {
  .filters::before,
  .result-tilt,
  .swap-enter-active,
  .swap-leave-active,
  .result-enter-active,
  .result-leave-active,
  .result-move {
    animation: none;
    transition: none;
  }

  .mast__img {
    height: 100%;
    transform: none !important;
  }

  .swap-enter-from,
  .swap-leave-to,
  .result-enter-from,
  .result-leave-to {
    opacity: 1;
    transform: none;
  }
}
</style>

<template>
  <section
    v-if="image && (words.length || destinations.length)"
    id="home-amenities"
    class="band home-motion"
    :aria-label="amenities.length ? $t('home.amenities') : $t('home.exploreBy')"
  >
    <div ref="frame" class="band__frame">
      <img class="band__img" :src="image" alt="" :style="imageStyle" />
    </div>
    <div class="band__veil" />
    <div class="band__content">
      <p class="eyebrow">Greyon</p>
      <h2 id="home-amenities-title" class="band__title">
        {{ $t("home.amenities") }}
      </h2>
      <div
        v-if="destinations.length"
        class="dest-switch"
        role="tablist"
        :aria-label="$t('home.amenities')"
      >
        <button
          v-for="loc in destinations"
          :key="loc.id"
          type="button"
          class="dest-switch__btn"
          :class="{ 'is-active': loc.slug === selectedSlug }"
          role="tab"
          :aria-selected="loc.slug === selectedSlug"
          @click="selectDestination(loc.slug)"
        >
          {{ loc.name }}
        </button>
      </div>
      <ul
        v-if="amenities.length"
        class="amenity-list"
        :aria-label="
          selectedLocation
            ? `${$t('home.amenities')} — ${selectedLocation.name}`
            : $t('home.amenities')
        "
      >
        <li v-for="item in amenities" :key="item" class="chip">
          <q-icon :name="iconFor(item)" size="22px" />
          {{ item }}
        </li>
      </ul>
      <div v-if="words.length" class="places">
        <router-link
          v-for="word in words"
          :key="word.key"
          :to="`/locations/${word.slug}`"
          class="places__link"
        >
          {{ word.label }}
        </router-link>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useParallax } from "@/components/home/useParallax";
import { useBookingStore } from "@/stores/booking-store";
import { useCmsStore } from "@/stores/cms-store";
import type { Location } from "@/types/greyon";

const cms = useCmsStore();
const booking = useBookingStore();
const frame = ref<HTMLElement | null>(null);
const offset = useParallax(frame, 180);

const imageStyle = computed(() => ({
  transform: `translate3d(0, ${offset.value}px, 0) scale(1.15)`
}));

/** Client-supplied drone photo of the Greyon building (replaces the 3D render). */
const image = "/images/greyon-building.webp";

const destinations = computed(() => cms.publishedLocations);
const overrideSlug = ref("");

function defaultSlug(): string {
  const fromBooking = booking.search.locationSlug.trim();
  if (
    fromBooking &&
    destinations.value.some((loc: Location) => loc.slug === fromBooking)
  ) {
    return fromBooking;
  }
  return (
    destinations.value.find((loc: Location) => loc.slug === "phnom-penh")
      ?.slug ??
    destinations.value[0]?.slug ??
    ""
  );
}

const selectedSlug = computed(() => {
  if (
    overrideSlug.value &&
    destinations.value.some((loc: Location) => loc.slug === overrideSlug.value)
  ) {
    return overrideSlug.value;
  }
  return defaultSlug();
});

function selectDestination(slug: string) {
  overrideSlug.value = slug;
}

const selectedLocation = computed(() =>
  destinations.value.find((loc: Location) => loc.slug === selectedSlug.value)
);

const words = computed(() =>
  cms.publishedLocations.flatMap((loc: Location) =>
    loc.highlights
      .map((label: string) => label.trim())
      .filter(Boolean)
      .map((label: string) => ({
        key: `${loc.id}-${label}`,
        label,
        slug: loc.slug
      }))
  )
);

const amenities = computed(() =>
  (selectedLocation.value?.amenities ?? [])
    .map((label: string) => label.trim())
    .filter(Boolean)
);

function iconFor(label: string) {
  const key = label.toLowerCase();
  const word = (re: RegExp) => re.test(key);
  if (key.includes("wifi") || key.includes("wi-fi") || key.includes("wi‑fi"))
    return "wifi";
  if (key.includes("pool")) return "pool";
  if (key.includes("gym") || key.includes("fitness")) return "fitness_center";
  if (key.includes("park")) return "local_parking";
  if (word(/\bspa\b/)) return "spa";
  if (key.includes("playground") || word(/\bkids?\b|children/)) return "toys";
  if (key.includes("tennis")) return "sports_tennis";
  if (key.includes("billiard")) return "sports";
  if (key.includes("bbq") || key.includes("grill") || key.includes("kitchen"))
    return "outdoor_grill";
  if (key.includes("security") || key.includes("24/7")) return "security";
  if (key.includes("rooftop") || key.includes("roof")) return "roofing";
  if (key.includes("elevator") || key.includes("lift")) return "elevator";
  if (key.includes("fire")) return "local_fire_department";
  return "check";
}
</script>
<style scoped>
.band {
  position: relative;
  display: flex;
  align-items: flex-end;
  min-height: 100vh;
  /* Sit flush on destinations (same dark family) — no elliptical lid. */
  margin-top: -1px;
  overflow: hidden;
  color: #fff;
  background: #0c0e0d;
}

.band__frame {
  position: absolute;
  inset: 0;
}

.band__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* Keep the rooftop GREYON sign in frame. */
  object-position: 58% 34%;
  will-change: transform;
}

.band__veil {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      to top,
      rgba(8, 9, 8, 0.82) 0%,
      rgba(8, 9, 8, 0.28) 46%,
      rgba(8, 9, 8, 0.45) 100%
    ),
    radial-gradient(
      600px 240px at 20% 80%,
      rgba(196, 163, 90, 0.22),
      transparent 70%
    );
}

.band__content {
  position: relative;
  z-index: 1;
  width: 100%;
  padding: clamp(4.5rem, 10vh, 7rem) 0 clamp(3.5rem, 7vh, 5rem);
}

.eyebrow {
  margin: 0 0 0.6rem;
  padding-inline: clamp(1.25rem, 6vw, 5rem);
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--gy-gold);
}

.band__title {
  margin: 0 0 1.6rem;
  padding-inline: clamp(1.25rem, 6vw, 5rem);
  font-family: var(--font-display);
  font-size: var(--gy-text-4xl);
  font-weight: 700;
  letter-spacing: normal;
  line-height: 1;
  background: linear-gradient(
    100deg,
    #f6f1e7 10%,
    var(--gy-gold) 55%,
    #9aaf9c 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: var(--gy-white);
}

.amenity-list {
  display: grid;
  grid-auto-flow: column;
  grid-template-rows: repeat(5, auto);
  grid-auto-columns: max-content;
  gap: 0.75rem 1.15rem;
  margin: 0;
  padding: 0 clamp(1.25rem, 6vw, 5rem);
  list-style: none;
}

@media (max-width: 600px) {
  .amenity-list {
    grid-auto-flow: row;
    grid-template-rows: none;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.6rem;
  }

  .amenity-list .chip {
    white-space: normal;
    letter-spacing: 0.12em;
  }
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  flex: 0 0 auto;
  padding: 0.7rem 1.15rem;
  border: 1px solid rgba(246, 241, 231, 0.28);
  border-radius: 0;
  background: rgba(16, 18, 16, 0.4);
  backdrop-filter: blur(10px);
  font-family: var(--font-display);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  white-space: nowrap;
}

.chip .q-icon {
  color: var(--gy-gold);
}

.places {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.5rem;
  margin-top: clamp(1.35rem, 3.5vw, 2.25rem);
  padding-inline: clamp(1.25rem, 6vw, 5rem);
}

.places__link {
  font-family: var(--font-display);
  font-size: var(--gy-text-2xl);
  font-weight: 600;
  letter-spacing: normal;
  line-height: 1.1;
  color: var(--gy-gold);
}

.places__link:hover,
.places__link:focus-visible {
  color: var(--gy-gold);
}

.places__link:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: 4px;
}

@media (prefers-reduced-motion: reduce) {
  .band__img {
    transform: none !important;
  }
}

@media (max-width: 600px) {
  .band__img {
    object-position: 60% 38%;
  }
}

.dest-switch {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 0.35rem;
  margin: -0.4rem 0 1.35rem;
  padding-inline: clamp(1.25rem, 6vw, 5rem);
}

.dest-switch__btn {
  appearance: none;
  margin: 0;
  padding: 0.35rem 0.85rem;
  border: 1px solid transparent;
  border-radius: 0;
  background: transparent;
  color: rgba(246, 241, 231, 0.62);
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  cursor: pointer;
}

.dest-switch__btn:hover,
.dest-switch__btn:focus-visible {
  color: #f6f1e7;
}

.dest-switch__btn:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: 4px;
}

.dest-switch__btn.is-active {
  color: var(--gy-gold);
  border-color: rgba(196, 163, 90, 0.55);
  background: rgba(16, 18, 16, 0.4);
}
</style>

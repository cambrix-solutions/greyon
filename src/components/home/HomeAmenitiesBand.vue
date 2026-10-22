<template>
  <section
    v-if="image && (words.length || amenities.length)"
    id="home-amenities"
    class="band"
    :aria-label="amenities.length ? $t('home.amenities') : $t('home.exploreBy')"
  >
    <div ref="frame" class="band__frame">
      <img class="band__img" :src="image" alt="" :style="imageStyle" />
    </div>
    <div class="band__veil" />
    <div class="band__content">
      <div v-if="words.length" ref="wordTrack" class="word-row">
        <router-link
          v-for="word in words"
          :key="word.key"
          :to="`/locations/${word.slug}`"
          class="word"
        >
          {{ word.label }}
        </router-link>
      </div>
      <div v-if="amenities.length" class="amenity-block">
        <h2 id="home-amenities-title" class="amenity-block__title">
          {{ $t("home.amenities") }}
        </h2>
        <ul ref="iconTrack" class="icon-row">
          <li v-for="item in amenities" :key="item">
            <q-icon :name="iconFor(item)" size="30px" />
            <span>{{ item }}</span>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useDragScroll } from "@/components/home/useDragScroll";
import { useParallax } from "@/components/home/useParallax";
import { useCmsStore } from "@/stores/cms-store";

const cms = useCmsStore();
const frame = ref<HTMLElement | null>(null);
const wordTrack = ref<HTMLElement | null>(null);
const iconTrack = ref<HTMLElement | null>(null);
const offset = useParallax(frame);
useDragScroll(wordTrack);
useDragScroll(iconTrack);

const imageStyle = computed(() => ({
  transform: `translate3d(0, ${offset.value}px, 0) scale(1.12)`
}));

const featured = computed(() =>
  cms.publishedHotels.find(hotel => hotel.featured)
);

const image = computed(() => {
  const gallery = featured.value?.gallery.find(src => src.trim())?.trim();
  if (gallery) return gallery;
  const other = cms.publishedLocations.find(
    loc => loc.heroImage && loc.id !== featured.value?.locationId
  );
  return other?.heroImage || featured.value?.heroImage || "";
});

const words = computed(() =>
  cms.publishedLocations.flatMap(loc =>
    loc.highlights
      .map(label => label.trim())
      .filter(Boolean)
      .map(label => ({
        key: `${loc.id}-${label}`,
        label,
        slug: loc.slug
      }))
  )
);

const amenities = computed(() => {
  const seen = new Set<string>();
  const out: string[] = [];
  const hotels = [
    ...cms.publishedHotels.filter(hotel => hotel.featured),
    ...cms.publishedHotels.filter(hotel => !hotel.featured)
  ];
  for (const hotel of hotels) {
    for (const raw of hotel.amenities) {
      const label = raw.trim();
      const key = label.toLowerCase();
      if (!label || seen.has(key)) continue;
      seen.add(key);
      out.push(label);
    }
  }
  return out;
});

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
  --serif: "Cormorant Garamond", "Lora", Georgia, serif;
  --sans: "Montserrat", system-ui, sans-serif;
  position: relative;
  display: flex;
  align-items: flex-end;
  min-height: 100vh;
  overflow: hidden;
  color: #fff;
  background: #2c312e;
}

.band__frame {
  position: absolute;
  inset: -14% 0;
}

.band__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  will-change: transform;
}

.band__veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(12, 11, 10, 0.78) 0%,
    rgba(12, 11, 10, 0.28) 48%,
    rgba(12, 11, 10, 0.35) 100%
  );
}

.band__content {
  position: relative;
  z-index: 1;
  width: 100%;
  padding: 12vh 0 7vh;
}

.word-row,
.icon-row {
  display: flex;
  gap: clamp(1.5rem, 4vw, 3.25rem);
  overflow-x: auto;
  max-width: 100%;
  overscroll-behavior-x: contain;
  scroll-snap-type: x proximity;
  padding: 0 clamp(1.25rem, 6vw, 5rem);
  scrollbar-width: none;
  cursor: grab;
}

.word-row::-webkit-scrollbar,
.icon-row::-webkit-scrollbar {
  display: none;
}

.word-row:active,
.icon-row:active {
  cursor: grabbing;
}

.word {
  flex: 0 0 auto;
  scroll-snap-align: start;
  font-family: var(--serif);
  font-size: clamp(2.1rem, 4.6vw, 3.8rem);
  font-weight: 500;
  font-style: italic;
  letter-spacing: -0.03em;
  line-height: 1;
  color: #fff;
  white-space: nowrap;
}

.word:hover {
  color: var(--gy-gold);
}

.word:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: 4px;
}

.amenity-block {
  margin-top: clamp(2.5rem, 6vw, 4.5rem);
}

.amenity-block__title {
  margin: 0 0 1.25rem;
  padding-inline: clamp(1.25rem, 6vw, 5rem);
  font-family: var(--sans);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--gy-gold);
}

.icon-row {
  list-style: none;
  margin: 0;
  padding-bottom: 0.4rem;
}

.icon-row li {
  display: grid;
  justify-items: center;
  gap: 0.65rem;
  flex: 0 0 auto;
  min-width: 6.5rem;
  max-width: 9rem;
  scroll-snap-align: start;
  text-align: center;
}

.icon-row .q-icon {
  color: var(--gy-gold);
}

.icon-row span {
  font-family: var(--sans);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  line-height: 1.35;
}

@media (prefers-reduced-motion: reduce) {
  .band__img {
    transform: none !important;
  }
}
</style>

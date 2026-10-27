<template>
  <section
    v-if="image && (words.length || amenities.length)"
    id="home-amenities"
    class="band home-motion"
    :aria-label="amenities.length ? $t('home.amenities') : $t('home.exploreBy')"
  >
    <div class="band__frame">
      <img class="band__img" :src="image" alt="" />
    </div>
    <div class="band__veil" />
    <div class="band__content">
      <p class="eyebrow">Greyon</p>
      <h2 id="home-amenities-title" class="band__title">
        {{ $t("home.amenities") }}
      </h2>
      <div
        v-if="amenities.length"
        class="marquee"
        :aria-label="$t('home.amenities')"
      >
        <div class="marquee__track">
          <span v-for="item in amenities" :key="item" class="chip">
            <q-icon :name="iconFor(item)" size="22px" />
            {{ item }}
          </span>
        </div>
      </div>
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
import { computed } from "vue";
import { useCmsStore } from "@/stores/cms-store";

const cms = useCmsStore();

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
  position: relative;
  display: flex;
  align-items: flex-end;
  min-height: 100vh;
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

.band::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  z-index: 2;
  height: 74px;
  background: #f7f3ec;
  clip-path: ellipse(72% 100% at 50% 100%);
  pointer-events: none;
}

.band__content {
  position: relative;
  z-index: 1;
  width: 100%;
  padding: 18vh 0 11vh;
}

.eyebrow {
  margin: 0 0 0.6rem;
  padding-inline: clamp(1.25rem, 6vw, 5rem);
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: #e4d2a4;
}

.band__title {
  margin: 0 0 1.6rem;
  padding-inline: clamp(1.25rem, 6vw, 5rem);
  font-family: var(--font-display);
  font-size: var(--gy-text-display);
  font-weight: 600;
  letter-spacing: normal;
  line-height: 1;
  color: var(--gy-white);
}

.band .marquee {
  overflow: visible;
  mask-image: none;
  -webkit-mask-image: none;
  padding-inline: clamp(1.25rem, 6vw, 5rem);
}

.band .marquee__track {
  flex-wrap: wrap;
  width: auto;
  max-width: 100%;
  gap: 0.75rem;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  flex: 0 0 auto;
  margin-right: 1.15rem;
  padding: 0.7rem 1.15rem;
  border: 1px solid rgba(246, 241, 231, 0.28);
  border-radius: 999px;
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
  color: #e4d2a4;
}

.places {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.5rem;
  margin-top: clamp(2rem, 5vw, 3.4rem);
  padding-inline: clamp(1.25rem, 6vw, 5rem);
}

.places__link {
  font-family: var(--font-display);
  font-size: var(--gy-text-2xl);
  font-weight: 600;
  letter-spacing: normal;
  line-height: 1.1;
  color: rgba(255, 255, 255, 0.92);
}

.places__link:hover,
.places__link:focus-visible {
  color: #e4d2a4;
}

.places__link:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: 4px;
}

@media (prefers-reduced-motion: reduce) {
  .band__img {
    transform: none !important;
  }

  .band .marquee {
    overflow: visible;
    mask-image: none;
    padding-inline: clamp(1.25rem, 6vw, 5rem);
  }

  .band .marquee__track {
    flex-wrap: wrap;
    width: auto;
    max-width: 100%;
    animation: none;
  }

  .marquee__clone {
    display: none;
  }
}
</style>

<template>
  <section
    v-if="locations.length"
    id="home-destinations"
    class="dest home-motion"
    aria-labelledby="home-destinations-title"
  >
    <header class="dest__head">
      <div>
        <p v-reveal class="eyebrow">{{ $t("home.exploreBy") }}</p>
        <RevealWords
          id="home-destinations-title"
          class="dest__title"
          :text="$t('home.destinationsCount', locations.length)"
        />
      </div>
      <router-link
        v-reveal="{ delay: '140ms' }"
        to="/locations"
        class="text-link"
      >
        {{ $t("home.allDestinations") }}
        <span aria-hidden="true">→</span>
      </router-link>
    </header>

    <div class="bento" :class="`bento--${Math.min(locations.length, 3)}`">
      <router-link
        v-for="(loc, i) in locations"
        :key="loc.id"
        v-reveal="{ delay: `${i * 140}ms` }"
        :to="`/locations/${loc.slug}`"
        class="bento__item"
      >
        <span
          v-if="loc.heroImage"
          class="bento__parallax"
          :ref="el => setFrame(loc.id, el)"
          :style="frameStyle(loc.id)"
        >
          <img :src="loc.heroImage" :alt="loc.name" loading="lazy" />
        </span>
        <span class="bento__shade">
          <span class="bento__kicker" v-if="hotelCount(loc.id)">
            {{ $t("home.hotelsCount", hotelCount(loc.id)) }}
          </span>
          <span class="bento__name">{{ loc.name }}</span>
          <span class="bento__detail">
            <span v-if="loc.description">{{ loc.description }}</span>
            <span v-if="loc.highlights.length" class="bento__highlights">
              {{ loc.highlights.join("  ·  ") }}
            </span>
            <span
              v-for="hotel in hotelsFor(loc.id)"
              :key="hotel.id"
              class="bento__hotel"
            >
              {{ hotel.name }}
            </span>
          </span>
        </span>
      </router-link>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import RevealWords from "@/components/home/RevealWords.vue";
import { useParallaxGroup } from "@/components/home/useParallax";
import { useCmsStore } from "@/stores/cms-store";

const cms = useCmsStore();
const { setFrame, offsets } = useParallaxGroup(140);

function frameStyle(id: string) {
  const y = offsets.value[id] ?? 0;
  return { transform: `translate3d(0, ${y}px, 0)` };
}

const locations = computed(() => {
  const locs = cms.publishedLocations;
  const rank = (id: string) =>
    cms.publishedHotels.some(hotel => hotel.locationId === id) ? 0 : 1;
  return [...locs].sort((a, b) => rank(a.id) - rank(b.id));
});

function hotelCount(locationId: string) {
  return cms.publishedHotels.filter(hotel => hotel.locationId === locationId)
    .length;
}

function hotelsFor(locationId: string) {
  return cms.publishedHotels.filter(hotel => hotel.locationId === locationId);
}
</script>

<style scoped>
.dest {
  --serif: "Cormorant Garamond", "Lora", Georgia, serif;
  --sans: "Montserrat", system-ui, sans-serif;
  padding: clamp(4.5rem, 9vw, 7rem) clamp(0.65rem, 1.6vw, 1.1rem)
    clamp(1rem, 2vw, 1.4rem);
  background: var(--gy-white);
  color: var(--gy-ink);
}

.dest__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem 2rem;
  width: min(1400px, 100%);
  margin: 0 auto 1.35rem;
  padding-inline: 0.35rem;
}

.eyebrow {
  margin: 0 0 0.45rem;
  font-family: var(--sans);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
}

.dest__title {
  margin: 0;
  font-family: var(--serif);
  font-size: clamp(2.8rem, 6vw, 4.8rem);
  font-weight: 500;
  letter-spacing: -0.03em;
  line-height: 0.92;
}

.text-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 44px;
  font-family: var(--sans);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--gy-forest);
}

.text-link span {
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

.text-link:hover span,
.text-link:focus-visible span {
  transform: translateX(12px);
}

.bento {
  display: grid;
  gap: 0.65rem;
  min-height: min(88vh, 860px);
}

.bento--1 {
  grid-template-columns: 1fr;
}

.bento--2 {
  grid-template-columns: 1.15fr 0.85fr;
}

.bento--3,
.bento:not(.bento--1):not(.bento--2) {
  grid-template-columns: 1.35fr 1fr;
  grid-template-rows: 1fr 1fr;
}

.bento--3 .bento__item:first-child,
.bento:not(.bento--1):not(.bento--2) .bento__item:first-child {
  grid-row: 1 / span 2;
}

.bento__item {
  position: relative;
  display: block;
  min-height: 240px;
  overflow: hidden;
  background: #2c312e;
  color: #fff;
}

.bento__parallax {
  position: absolute;
  inset: -16% 0;
}

.bento__item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 1.15s cubic-bezier(0.22, 1, 0.36, 1);
}

.bento__shade {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.35rem;
  padding: clamp(1.1rem, 2vw, 1.8rem);
  background: linear-gradient(
    to top,
    rgba(12, 11, 10, 0.72) 0%,
    rgba(12, 11, 10, 0.05) 58%
  );
  transition: background 0.5s ease;
}

.bento__kicker {
  font-family: var(--sans);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--gy-gold);
}

.bento__name {
  font-family: var(--serif);
  font-size: clamp(2.2rem, 4vw, 3.6rem);
  font-weight: 500;
  letter-spacing: -0.03em;
  line-height: 0.95;
}

.bento__detail {
  display: grid;
  gap: 0.25rem;
  max-width: 36rem;
  font-family: var(--sans);
  font-size: 0.84rem;
  font-weight: 500;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.88);
}

.bento__highlights,
.bento__hotel {
  letter-spacing: 0.04em;
}

.bento__item:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: -4px;
}

@media (hover: hover) {
  .bento__detail {
    max-height: 0;
    overflow: hidden;
    opacity: 0;
    transform: translateY(18px);
    transition:
      max-height 0.55s ease,
      opacity 0.55s ease,
      transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .bento__item.gy-reveal--in:hover {
    transform: translateY(-8px);
  }

  .bento__item:hover img {
    transform: scale(1.14);
  }

  .bento__item:hover .bento__shade {
    background: linear-gradient(
      to top,
      rgba(12, 11, 10, 0.9) 0%,
      rgba(12, 11, 10, 0.28) 64%
    );
  }

  .bento__item:hover .bento__detail {
    max-height: 9rem;
    opacity: 1;
    transform: none;
  }
}

@media (max-width: 800px) {
  .dest__head {
    align-items: flex-start;
    flex-direction: column;
  }

  .bento,
  .bento--2,
  .bento--3,
  .bento:not(.bento--1):not(.bento--2) {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .bento__item,
  .bento--3 .bento__item:first-child,
  .bento:not(.bento--1):not(.bento--2) .bento__item:first-child {
    height: 78vw;
    min-height: 280px;
    grid-row: auto;
  }

  .bento__item:first-child {
    height: 100vw;
  }
}

@media (prefers-reduced-motion: reduce) {
  .bento__parallax,
  .bento__item,
  .bento__item img,
  .bento__detail,
  .text-link span {
    transition: none !important;
    transform: none !important;
  }
}
</style>

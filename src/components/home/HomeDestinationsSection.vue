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

    <div class="stack">
      <article
        v-for="(loc, i) in locations"
        :key="loc.id"
        class="stack__pin"
        :style="{ '--i': i, zIndex: i + 1 }"
      >
        <router-link
          :to="`/locations/${loc.slug}`"
          class="stack__tilt"
          @pointermove="onMove"
          @pointerleave="onLeave"
        >
          <span class="stack__media">
            <img
              v-if="loc.heroImage"
              :src="loc.heroImage"
              :alt="loc.name"
              loading="lazy"
            />
          </span>
          <span class="stack__index" aria-hidden="true">{{
            String(i + 1).padStart(2, "0")
          }}</span>
          <span class="stack__panel glass-frame">
            <span class="glass-frame__in stack__panel-in">
              <span v-if="hotelCount(loc.id)" class="stack__kicker">
                {{ $t("home.hotelsCount", hotelCount(loc.id)) }}
              </span>
              <span class="stack__name">{{ loc.name }}</span>
              <span v-if="loc.description" class="stack__desc">{{
                loc.description
              }}</span>
              <span v-if="loc.highlights.length" class="stack__highlights">
                {{ loc.highlights.join("  ·  ") }}
              </span>
              <span
                v-for="hotel in hotelsFor(loc.id)"
                :key="hotel.id"
                class="stack__hotel"
              >
                {{ hotel.name }}
              </span>
            </span>
          </span>
        </router-link>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import RevealWords from "@/components/home/RevealWords.vue";
import { useTilt } from "@/components/home/useTilt";
import { useCmsStore } from "@/stores/cms-store";

const cms = useCmsStore();
const { onMove, onLeave } = useTilt();

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
  position: relative;
  padding: clamp(4.5rem, 9vw, 7rem) 0 6rem;
  background:
    radial-gradient(
      700px 280px at 90% 0%,
      rgba(196, 163, 90, 0.18),
      transparent 60%
    ),
    #121413;
  color: #f6f1e7;
  overflow-x: clip;
}

.dest::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  z-index: 5;
  height: 78px;
  background: #0c0e0d;
  clip-path: ellipse(74% 100% at 50% 100%);
  pointer-events: none;
}

.dest__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem 2rem;
  width: min(1100px, calc(100% - 2.5rem));
  margin: 0 auto 2.5rem;
}

.eyebrow {
  margin: 0 0 0.55rem;
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: #e4d2a4;
}

.dest__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(2.58rem, 6vw, 4.86rem);
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1;
}

.text-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 44px;
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #e4d2a4;
}

.stack {
  width: min(1040px, calc(100% - 2rem));
  margin: 0 auto;
}

.stack__pin {
  position: sticky;
  top: calc(5.4rem + var(--i) * 4.6rem);
  height: min(70vh, 640px);
  margin-bottom: 14vh;
  perspective: 1400px;
}

.stack__pin:last-child {
  margin-bottom: 6vh;
}

.stack__tilt {
  position: relative;
  display: block;
  height: 100%;
  border-radius: 30px;
  color: inherit;
  transform-style: preserve-3d;
  transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}

.stack__media {
  display: block;
  height: 100%;
  overflow: hidden;
  border-radius: 30px;
  background: #2a2e2c;
}

.stack__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.stack__index {
  position: absolute;
  top: -0.35rem;
  left: 1.1rem;
  z-index: 2;
  font-family: var(--font-display);
  font-size: clamp(3.4rem, 6.8vw, 5.44rem);
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1;
  color: rgba(246, 241, 231, 0.92);
  text-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  pointer-events: none;
}

.stack__panel {
  position: absolute;
  right: 6%;
  bottom: -1.4rem;
  z-index: 3;
  width: min(400px, 78%);
  transform: rotate(-2.4deg);
}

.stack__panel-in {
  display: grid;
  gap: 0.35rem;
  padding: 1.15rem 1.25rem 1.2rem;
  color: #f6f1e7;
}

.stack__kicker,
.stack__hotel,
.stack__highlights {
  font-family: var(--font-display);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #e4d2a4;
}

.stack__name {
  font-family: var(--font-display);
  font-size: clamp(2.2rem, 4vw, 3.2rem);
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1;
}

.stack__desc {
  font-family: var(--font-body);
  font-size: 0.88rem;
  font-weight: 500;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.stack__tilt:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: 4px;
}

@media (max-width: 800px) {
  .dest__head {
    align-items: flex-start;
    flex-direction: column;
  }

  .stack__pin {
    top: calc(4.4rem + var(--i) * 2.6rem);
    height: 78vw;
    min-height: 420px;
    margin-bottom: 3.5rem;
  }

  .stack__panel {
    right: 0.75rem;
    left: 0.75rem;
    width: auto;
    bottom: 0.75rem;
    transform: none;
  }

  .stack__index {
    font-size: 4.2rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .stack__tilt {
    transition: none;
  }
}
</style>

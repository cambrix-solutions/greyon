<template>
  <section class="gy-section story-section" aria-labelledby="home-story-title">
    <div class="gy-container story-layout">
      <div v-reveal class="story-copy">
        <p class="gy-eyebrow section-kicker">{{ $t("home.storyEyebrow") }}</p>
        <h2 id="home-story-title" class="gy-display section-title">
          {{ $t("home.storyTitle") }}
        </h2>
        <p class="story-body">{{ $t("home.storyBody") }}</p>
        <p class="story-note">{{ $t("home.laterPhase") }}</p>
        <router-link
          v-if="auth.featureEnabled('contact_public')"
          to="/contact"
          class="gy-btn gy-btn--outline"
          >{{ $t("home.enquire") }}</router-link
        >
      </div>

      <div
        v-if="frames.length"
        v-reveal="{ delay: '120ms' }"
        class="story-mosaic"
        :class="`story-mosaic--${frames.length}`"
      >
        <router-link
          v-for="frame in frames"
          :key="frame.id"
          :to="`/locations/${frame.slug}`"
          class="story-frame gy-card-media"
        >
          <img :src="frame.heroImage" :alt="frame.name" loading="lazy" />
          <span class="story-frame__name">{{ frame.name }}</span>
        </router-link>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useAuthStore } from "@/stores/auth-store";
import { useCmsStore } from "@/stores/cms-store";

const cms = useCmsStore();
const auth = useAuthStore();

const frames = computed(() =>
  cms.publishedLocations
    .filter(loc => loc.heroImage?.trim())
    .slice(0, 3)
    .map(loc => ({
      id: loc.id,
      slug: loc.slug,
      name: loc.name,
      heroImage: loc.heroImage
    }))
);
</script>

<style scoped>
.story-section {
  background:
    linear-gradient(180deg, rgba(98, 112, 99, 0.08), rgba(98, 112, 99, 0.02)),
    var(--gy-cream);
}

.story-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: clamp(1.5rem, 4vw, 3.5rem);
  align-items: center;
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

.story-body {
  margin: 1rem 0 0.85rem;
  max-width: 38rem;
  font-size: 1.12rem;
  line-height: 1.75;
  color: var(--gy-ink);
}

.story-note {
  margin: 0 0 1.4rem;
  max-width: 36rem;
  color: var(--gy-muted);
  font-size: 0.98rem;
  line-height: 1.6;
}

.story-copy .gy-btn {
  min-height: 44px;
}

.story-mosaic {
  display: grid;
  gap: 0.75rem;
  min-width: 0;
}

.story-mosaic--1 {
  grid-template-columns: 1fr;
}

.story-mosaic--2 {
  grid-template-columns: 1fr 1fr;
}

.story-mosaic--3 {
  grid-template-columns: 1.35fr 1fr;
  grid-template-rows: 1fr 1fr;
}

.story-mosaic--3 .story-frame:first-child {
  grid-row: 1 / span 2;
  min-height: 420px;
}

.story-frame {
  position: relative;
  display: block;
  min-height: 190px;
  border-radius: 18px;
  background: var(--gy-stone);
}

.story-frame img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 1s cubic-bezier(0.22, 1, 0.36, 1);
}

.story-frame::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(transparent 42%, rgba(18, 16, 14, 0.62));
  pointer-events: none;
}

.story-frame__name {
  position: absolute;
  left: 0.9rem;
  right: 0.9rem;
  bottom: 0.85rem;
  z-index: 1;
  color: #fff;
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.story-frame:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: 3px;
}

@media (hover: hover) {
  .story-frame:hover img {
    transform: scale(1.06);
  }
}

@media (max-width: 860px) {
  .story-layout {
    grid-template-columns: 1fr;
  }

  .story-mosaic,
  .story-mosaic--2,
  .story-mosaic--3 {
    display: flex;
    grid-template-columns: none;
    grid-template-rows: none;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    overscroll-behavior-x: contain;
    padding-bottom: 0.35rem;
  }

  .story-frame,
  .story-mosaic--3 .story-frame:first-child {
    flex: 0 0 82%;
    min-height: 230px;
    height: 230px;
    scroll-snap-align: start;
    grid-row: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .story-frame img {
    transition: none;
  }
}
</style>

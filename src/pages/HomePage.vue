<template>
  <q-page class="home-page">
    <SeoHead
      title="Greyon | Hotels in Cambodia"
      description="Discover and book Greyon hotels across Phnom Penh, Siem Reap, Sihanoukville, and more."
      :image="heroImage"
    />

    <section id="home-hero" class="home-hero">
      <div class="home-hero__slides" aria-hidden="true">
        <img
          v-for="(slide, i) in heroSlides"
          :key="`${i}-${slide.src}`"
          class="home-hero__image"
          :class="{ 'is-active': i === heroIndex }"
          :src="slide.src"
          :alt="slide.alt || 'Greyon hotel stay'"
        />
      </div>
      <div class="home-hero__veil" />
      <div class="gy-container home-hero__content">
        <div v-reveal class="home-hero__intro">
          <h1 class="home-hero__brand gy-display">Greyon</h1>
          <p class="home-hero__lead">{{ $t("home.subhead") }}</p>
          <div class="home-hero__cta">
            <router-link
              v-if="auth.featureEnabled('booking_public')"
              to="/booking"
              class="gy-btn gy-btn--light"
              >{{ $t("nav.bookNow") }}</router-link
            >
            <router-link to="/hotels" class="gy-btn gy-btn--ghost">{{
              $t("home.viewHotels")
            }}</router-link>
          </div>
        </div>
        <BookingSearchWidget
          v-if="auth.featureEnabled('booking_public')"
          v-reveal="{ delay: '120ms' }"
          compact
          class="home-hero__search"
        />
        <div
          v-if="heroSlides.length > 1"
          class="home-hero__dots"
          role="tablist"
          aria-label="Hero slides"
        >
          <button
            v-for="(slide, i) in heroSlides"
            :key="`dot-${i}`"
            type="button"
            class="home-hero__dot"
            :class="{ 'is-active': i === heroIndex }"
            :aria-label="`Show slide ${i + 1}`"
            :aria-selected="i === heroIndex"
            role="tab"
            @click="goToSlide(i)"
          />
        </div>
      </div>
    </section>

    <section class="gy-section featured-section">
      <div class="gy-container">
        <header v-reveal class="section-intro">
          <p class="gy-eyebrow">{{ $t("home.featured") }}</p>
          <h2 class="gy-display section-title">{{ $t("home.stayWith") }}</h2>
        </header>
        <div class="featured-grid gy-reveal-stagger">
          <HotelCard
            v-for="(hotel, i) in featuredHotels"
            :key="hotel.id"
            v-reveal="{ delay: `${i * 90}ms` }"
            :hotel="hotel"
          />
        </div>
        <div v-reveal class="section-more">
          <router-link to="/hotels" class="gy-link-arrow">
            {{ $t("home.viewHotels") }}
            <span aria-hidden="true">→</span>
          </router-link>
        </div>
      </div>
    </section>

    <section class="locations-band">
      <div class="gy-container locations-band__intro">
        <header v-reveal class="section-intro section-intro--row">
          <div>
            <p class="gy-eyebrow">{{ $t("home.exploreBy") }}</p>
            <h2 class="gy-display section-title">
              {{ $t("home.destinationsCount", locations.length) }}
            </h2>
          </div>
          <router-link to="/locations" class="gy-link-arrow">
            All destinations
            <span aria-hidden="true">→</span>
          </router-link>
        </header>
      </div>
      <div
        class="location-strip"
        :style="{ '--loc-count': Math.max(locations.length, 1) }"
      >
        <router-link
          v-for="(loc, i) in locations"
          :key="loc.id"
          v-reveal="{ delay: `${i * 60}ms` }"
          :to="`/locations/${loc.slug}`"
          class="location-tile gy-card-media"
        >
          <img :src="loc.heroImage" :alt="loc.name" loading="lazy" />
          <span class="location-tile__name">{{ loc.name }}</span>
        </router-link>
      </div>
    </section>

    <section class="gy-section story-section">
      <div class="gy-container story-block">
        <div v-reveal class="story-copy">
          <p class="gy-eyebrow">{{ $t("home.storyEyebrow") }}</p>
          <h2 class="gy-display section-title">{{ $t("home.storyTitle") }}</h2>
          <p class="story-body">{{ $t("home.storyBody") }}</p>
          <router-link
            v-if="auth.featureEnabled('contact_public')"
            to="/contact"
            class="gy-btn gy-btn--outline"
            >{{ $t("home.enquire") }}</router-link
          >
        </div>
      </div>
    </section>

    <section
      v-if="auth.featureEnabled('news_public')"
      class="gy-section news-preview"
    >
      <div class="gy-container">
        <header v-reveal class="section-intro section-intro--row">
          <div>
            <p class="gy-eyebrow">{{ $t("home.latestNews") }}</p>
            <h2 class="gy-display section-title">{{
              $t("home.fromGreyon")
            }}</h2>
          </div>
          <router-link to="/news" class="gy-link-arrow">
            {{ $t("home.allNews") }}
            <span aria-hidden="true">→</span>
          </router-link>
        </header>
        <div class="news-list">
          <article
            v-for="(item, i) in latestNews"
            :key="item.id"
            v-reveal="{ delay: `${i * 80}ms` }"
            class="news-row"
          >
            <router-link
              :to="`/news/${item.slug}`"
              class="gy-card-media news-row__media"
            >
              <img :src="item.coverImage" :alt="item.title" loading="lazy" />
            </router-link>
            <div class="news-row__copy">
              <p class="gy-eyebrow">{{ item.publishedAt }}</p>
              <h3 class="gy-display">
                <router-link :to="`/news/${item.slug}`">{{
                  item.title
                }}</router-link>
              </h3>
              <p class="news-row__excerpt">{{ item.excerpt }}</p>
            </div>
          </article>
        </div>
      </div>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import BookingSearchWidget from "@/components/BookingSearchWidget.vue";
import HotelCard from "@/components/HotelCard.vue";
import SeoHead from "@/components/SeoHead.vue";
import { useAuthStore } from "@/stores/auth-store";
import { useCmsStore } from "@/stores/cms-store";

const FALLBACK_HERO =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2000&q=80";

const cms = useCmsStore();
const auth = useAuthStore();

const heroSlides = computed(() => {
  const slides = cms.settings.heroSlides?.filter(s => s.src) ?? [];
  if (slides.length) return slides;
  return [{ src: FALLBACK_HERO, alt: "Greyon hotel stay" }];
});

const heroImage = computed(() => heroSlides.value[0]?.src ?? FALLBACK_HERO);

const heroIndex = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;

function clearTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function startTimer() {
  clearTimer();
  if (heroSlides.value.length < 2) return;
  timer = setInterval(() => {
    heroIndex.value = (heroIndex.value + 1) % heroSlides.value.length;
  }, 6500);
}

function goToSlide(i: number) {
  heroIndex.value = i;
  startTimer();
}

watch(
  heroSlides,
  slides => {
    if (heroIndex.value >= slides.length) heroIndex.value = 0;
    startTimer();
  },
  { immediate: true }
);

onMounted(() => {
  void cms.ensurePublicCatalog();
  startTimer();
});

onUnmounted(() => clearTimer());

const featuredHotels = computed(() =>
  cms.publishedHotels.filter(h => h.featured).slice(0, 3)
);
const locations = computed(() => cms.publishedLocations);
const latestNews = computed(() => cms.publishedNews.slice(0, 3));
</script>

<style scoped>
.home-page {
  padding: 0;
  min-height: 100vh;
  background: var(--gy-white);
}

.home-hero {
  position: relative;
  width: 100%;
  height: 100dvh;
  min-height: 100dvh;
  max-height: 100dvh;
  display: grid;
  align-items: end;
  color: var(--gy-white);
  overflow: hidden;
}

.home-hero__slides {
  position: absolute;
  inset: 0;
}

.home-hero__image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transform: scale(1.06);
  transition: opacity 1.1s ease;
  animation: none;
}

.home-hero__image.is-active {
  opacity: 1;
  animation: hero-ken 22s ease-out forwards;
  z-index: 0;
}

.home-hero__dots {
  position: relative;
  z-index: 2;
  display: flex;
  gap: 0.45rem;
  justify-content: flex-start;
  margin-top: 0.35rem;
}

.home-hero__dot {
  width: 0.55rem;
  height: 0.55rem;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.2s ease,
    width 0.2s ease;
}

.home-hero__dot.is-active {
  width: 1.35rem;
  background: var(--gy-gold);
}

.home-hero__dot:hover {
  background: rgba(255, 255, 255, 0.75);
}

.home-hero__veil {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      105deg,
      rgba(12, 11, 10, 0.72) 0%,
      rgba(12, 11, 10, 0.18) 52%,
      rgba(12, 11, 10, 0.4) 100%
    ),
    linear-gradient(
      180deg,
      rgba(12, 11, 10, 0.15) 0%,
      rgba(12, 11, 10, 0.72) 100%
    );
}

.home-hero__content {
  position: relative;
  z-index: 1;
  display: grid;
  gap: clamp(1rem, 2.2vh, 1.75rem);
  padding: clamp(5.5rem, 10vh, 7rem) 0 clamp(1.1rem, 2.5vh, 1.75rem);
}

.home-hero__intro {
  max-width: min(34rem, 100%);
}

.home-hero__brand {
  margin: 0;
  font-size: clamp(2.85rem, 6.5vw, 4.6rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 0.94;
  color: #fff;
  text-shadow: 0 18px 48px rgba(0, 0, 0, 0.35);
  animation: hero-title 1.1s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.home-hero__lead {
  margin: 0.7rem 0 0;
  max-width: 26rem;
  font-size: clamp(0.95rem, 1.35vw, 1.08rem);
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.82);
  animation: hero-title 1.1s 0.12s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.home-hero__cta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 1.1rem;
  animation: hero-title 1.1s 0.22s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.home-hero__cta .gy-btn {
  min-height: 2.7rem;
  padding: 0.65rem 1.35rem;
}

.home-hero__search {
  width: 100%;
  max-width: 100%;
}

.section-intro {
  margin-bottom: 2.25rem;
}

.section-intro--row {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 1rem;
  flex-wrap: wrap;
}

.section-title {
  margin: 0;
  font-size: clamp(2.4rem, 5vw, 3.6rem);
  line-height: 0.98;
  letter-spacing: -0.03em;
}

.section-more {
  display: flex;
  justify-content: center;
  margin-top: 2.75rem;
}

.featured-section {
  background: var(--gy-white);
}

.featured-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.75rem 1.5rem;
}

.locations-band {
  padding: clamp(3.5rem, 7vw, 5.5rem) 0 0;
  background: #11100e;
  color: #fff;
}

.locations-band__intro {
  margin-bottom: 1.75rem;
}

.locations-band .gy-eyebrow,
.locations-band .section-title,
.locations-band .gy-link-arrow {
  color: #fff;
}

.locations-band .gy-eyebrow {
  color: var(--gy-gold);
}

.locations-band .gy-link-arrow:hover {
  color: var(--gy-gold);
}

.location-strip {
  display: grid;
  grid-template-columns: repeat(var(--loc-count, 3), minmax(140px, 1fr));
  gap: 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.location-tile {
  position: relative;
  aspect-ratio: 3 / 4.4;
  color: #fff;
  min-width: 140px;
}

.location-tile img {
  transition: transform 1.1s cubic-bezier(0.22, 1, 0.36, 1);
}

.location-tile:hover img {
  transform: scale(1.08);
}

.location-tile__name {
  position: absolute;
  left: 1rem;
  right: 1rem;
  bottom: 1.1rem;
  z-index: 1;
  font-family: var(--font-display);
  font-size: clamp(1.2rem, 1.8vw, 1.55rem);
  font-weight: 700;
  line-height: 1.1;
}

.location-tile::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(transparent 35%, rgba(0, 0, 0, 0.72));
}

.story-section {
  background: var(--gy-white);
}

.story-block {
  max-width: 42rem;
}

.story-body {
  margin: 1.1rem 0 1.75rem;
  font-size: 1.12rem;
  line-height: 1.75;
  color: var(--gy-muted);
}

.news-preview {
  background: #f7f6f3;
}

.news-list {
  display: grid;
  gap: 0;
}

.news-row {
  display: grid;
  grid-template-columns: minmax(140px, 220px) 1fr;
  gap: 1.5rem;
  align-items: center;
  padding: 1.5rem 0;
  border-top: 1px solid rgba(26, 24, 20, 0.1);
}

.news-row:last-child {
  border-bottom: 1px solid rgba(26, 24, 20, 0.1);
}

.news-row__media {
  aspect-ratio: 4 / 3;
}

.news-row__copy h3 {
  margin: 0.2rem 0 0.45rem;
  font-size: clamp(1.45rem, 2.4vw, 1.9rem);
  line-height: 1.15;
}

.news-row__excerpt {
  margin: 0;
  color: var(--gy-muted);
  line-height: 1.55;
  max-width: 40rem;
}

@keyframes hero-title {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes hero-ken {
  from {
    transform: scale(1.04);
  }
  to {
    transform: scale(1.12);
  }
}

@media (max-width: 960px) {
  .featured-grid {
    grid-template-columns: 1fr;
    max-width: 420px;
  }

  .location-strip {
    grid-template-columns: repeat(var(--loc-count, 3), minmax(160px, 1fr));
  }
}

@media (max-width: 700px) {
  .news-row {
    grid-template-columns: 1fr;
  }

  .home-hero {
    height: auto;
    min-height: 100dvh;
    max-height: none;
  }

  .home-hero__content {
    padding-bottom: 1.25rem;
  }
}

@media (max-height: 780px) and (min-width: 701px) {
  .home-hero__brand {
    font-size: clamp(2.5rem, 5.5vw, 3.6rem);
  }

  .home-hero__lead {
    margin-top: 0.45rem;
    font-size: 0.95rem;
  }

  .home-hero__cta {
    margin-top: 0.75rem;
  }

  .home-hero__content {
    gap: 0.85rem;
    padding-top: 5rem;
    padding-bottom: 0.85rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-hero__image,
  .home-hero__brand,
  .home-hero__lead,
  .home-hero__cta {
    animation: none !important;
  }
}
</style>

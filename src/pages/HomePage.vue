<template>
  <q-page class="home-page">
    <SeoHead
      title="Greyon | Apartels in Cambodia"
      description="Discover and book Greyon apartels across Phnom Penh, Siem Reap, Sihanoukville, and more."
      :image="heroImage"
    />

    <section id="home-hero" class="home-hero">
      <!-- Client video "for now". Set HERO_VIDEO = false to bring the slider back. -->
      <div v-if="HERO_VIDEO" class="home-hero__slides" aria-hidden="true">
        <img
          v-if="reduceMotion"
          class="home-hero__image home-hero__video is-static"
          :src="HERO_POSTER"
          alt=""
        />
        <video
          v-else
          class="home-hero__image home-hero__video is-static"
          :src="heroVideoSrc"
          :poster="HERO_POSTER"
          autoplay
          muted
          loop
          playsinline
          preload="metadata"
        />
      </div>
      <div v-else class="home-hero__slides" aria-hidden="true">
        <img
          v-for="(slide, i) in heroSlides"
          :key="`${slide.id || i}-${slide.src}`"
          class="home-hero__image"
          :class="{ 'is-active': i === heroIndex }"
          :src="slide.src"
          :alt="slide.alt || 'Greyon apartel stay'"
        />
      </div>
      <div class="home-hero__veil" />
      <div class="gy-container home-hero__content">
        <div v-reveal class="home-hero__intro">
          <h1 class="home-hero__brand">
            <img
              class="home-hero__logo"
              src="/logo/Logo white V1-05.png"
              alt="Greyon"
              width="280"
              height="100"
            />
          </h1>
          <p class="home-hero__tagline">Always on, always home</p>
          <h2 v-if="activeSlide?.title" class="home-hero__slide-title">
            {{ activeSlide.title }}
          </h2>
          <p class="home-hero__lead">
            {{ activeSlide?.subtitle || $t("home.subhead") }}
          </p>
          <div class="home-hero__cta">
            <router-link
              v-if="slideCtaInternal"
              :to="activeSlide?.ctaUrl || '/'"
              class="gy-btn gy-btn--light"
              ><span class="home-hero__cta-label">{{
                activeSlide?.ctaLabel
              }}</span></router-link
            >
            <a
              v-else-if="slideHasCta"
              class="gy-btn gy-btn--light"
              :href="activeSlide?.ctaUrl"
              target="_blank"
              rel="noopener noreferrer"
              ><span class="home-hero__cta-label">{{
                activeSlide?.ctaLabel
              }}</span></a
            >
            <router-link
              v-if="auth.featureEnabled('booking_public')"
              to="/booking"
              class="gy-btn"
              :class="slideHasCta ? 'gy-btn--ghost' : 'gy-btn--light'"
              ><span class="home-hero__cta-label">{{
                $t("nav.bookNow")
              }}</span></router-link
            >
            <router-link
              v-if="!slideHasCta"
              to="/hotels"
              class="gy-btn gy-btn--ghost"
              ><span class="home-hero__cta-label">{{
                $t("home.viewHotels")
              }}</span></router-link
            >
          </div>
        </div>
        <BookingSearchWidget
          v-if="auth.featureEnabled('booking_public')"
          v-reveal="{ delay: '120ms' }"
          compact
          class="home-hero__search"
        />
        <div
          v-if="!HERO_VIDEO && heroSlides.length > 1"
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

    <HomeStorySection />
    <HomeFeaturedSection />
    <HomeDestinationsSection />
    <HomeAmenitiesBand />
    <CustomerReviewsSection />
    <HomeNewsSection v-if="auth.featureEnabled('news_public')" />
    <HomeCtaBand />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import BookingSearchWidget from "@/components/BookingSearchWidget.vue";
import CustomerReviewsSection from "@/components/CustomerReviewsSection.vue";
import HomeAmenitiesBand from "@/components/home/HomeAmenitiesBand.vue";
import HomeCtaBand from "@/components/home/HomeCtaBand.vue";
import HomeDestinationsSection from "@/components/home/HomeDestinationsSection.vue";
import HomeFeaturedSection from "@/components/home/HomeFeaturedSection.vue";
import HomeNewsSection from "@/components/home/HomeNewsSection.vue";
import HomeStorySection from "@/components/home/HomeStorySection.vue";
import SeoHead from "@/components/SeoHead.vue";
import {
  fetchPublicHeroSlides,
  type PublicHeroSlide
} from "@/services/engine/heroSlides";
import { useAuthStore } from "@/stores/auth-store";
import { useCmsStore } from "@/stores/cms-store";

/** Show the client hero video instead of the image slider (slider code kept below). */
const HERO_VIDEO = true;
const HERO_POSTER = "/videos/hero-poster.jpg";
const heroVideoSrc = ref("");
const reduceMotion = ref(false);
let smallQuery: MediaQueryList | null = null;

function pickHeroVideo() {
  heroVideoSrc.value = smallQuery?.matches
    ? "/videos/hero-720.mp4"
    : "/videos/hero-1080.mp4";
}

const FALLBACK_HERO =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2000&q=80";

const cms = useCmsStore();
const auth = useAuthStore();
const publicSlides = ref<PublicHeroSlide[] | null>(null);

type HomeHeroSlide = {
  id?: string;
  src: string;
  alt: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaUrl: string;
};

const heroSlides = computed<HomeHeroSlide[]>(() => {
  const published = publicSlides.value?.filter(slide => slide.image) ?? [];
  if (published.length) {
    return published.map(slide => ({
      id: slide.id,
      src: slide.image,
      alt: slide.title || "Greyon apartel stay",
      title: slide.title,
      subtitle: slide.subtitle,
      ctaLabel: slide.ctaLabel,
      ctaUrl: slide.ctaUrl
    }));
  }
  const fallback = cms.settings.heroSlides?.filter(slide => slide.src) ?? [];
  if (fallback.length) {
    return fallback.map(slide => ({
      src: slide.src,
      alt: slide.alt || "Greyon apartel stay",
      title: "",
      subtitle: "",
      ctaLabel: "",
      ctaUrl: ""
    }));
  }
  return [
    {
      src: FALLBACK_HERO,
      alt: "Greyon apartel stay",
      title: "",
      subtitle: "",
      ctaLabel: "",
      ctaUrl: ""
    }
  ];
});

const activeSlide = computed(
  () => heroSlides.value[heroIndex.value] ?? heroSlides.value[0]
);

const slideHasCta = computed(() => {
  const label = activeSlide.value?.ctaLabel?.trim() ?? "";
  const url = activeSlide.value?.ctaUrl?.trim() ?? "";
  return Boolean(label && url);
});

const slideCtaInternal = computed(() => {
  const url = activeSlide.value?.ctaUrl?.trim() ?? "";
  return Boolean(
    slideHasCta.value && url.startsWith("/") && !url.startsWith("//")
  );
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
  if (HERO_VIDEO || heroSlides.value.length < 2) return;
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
  if (HERO_VIDEO) {
    reduceMotion.value = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    smallQuery = window.matchMedia("(max-width: 768px)");
    pickHeroVideo();
    smallQuery.addEventListener("change", pickHeroVideo);
  }
  void cms.ensurePublicCatalog();
  void loadPublicHero();
  startTimer();
});

async function loadPublicHero() {
  try {
    const slides = await fetchPublicHeroSlides();
    if (slides && slides.length) publicSlides.value = slides;
  } catch {
    publicSlides.value = null;
  }
}

onUnmounted(() => {
  clearTimer();
  smallQuery?.removeEventListener("change", pickHeroVideo);
});
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

.home-hero__video.is-static {
  opacity: 1;
  transform: none;
  animation: none;
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
  position: relative;
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

.home-hero__dot::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  width: 44px;
  height: 44px;
  transform: translate(-50%, -50%);
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
  line-height: 0;
  animation: hero-title 1.1s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.home-hero__logo {
  display: block;
  height: clamp(3.75rem, 11vw, 6rem);
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 18px 48px rgba(0, 0, 0, 0.35));
}

.home-hero__slide-title {
  margin: 0.85rem 0 0;
  max-width: 18ch;
  font-family: var(--font-display);
  font-size: clamp(1.7rem, 3.4vw, 2.6rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.05;
  color: #fff;
  text-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
}

.home-hero__tagline {
  margin: 0.85rem 0 0;
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.78);
  animation: hero-title 1.1s 0.08s cubic-bezier(0.22, 1, 0.36, 1) both;
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

@media (max-width: 700px) {
  .home-hero {
    height: auto;
    min-height: 100dvh;
    max-height: none;
  }

  .home-hero__content {
    padding-bottom: 1.25rem;
  }

  .home-hero__cta {
    flex-wrap: nowrap;
    gap: 0.45rem;
  }

  .home-hero__cta .gy-btn {
    flex: 1 1 0;
    min-width: 0;
    padding: 0.55rem;
    font-size: 0.68rem;
    letter-spacing: 0.04em;
  }

  .home-hero__cta-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }
}

@media (max-height: 780px) and (min-width: 701px) {
  .home-hero__logo {
    height: clamp(3rem, 8vw, 4.25rem);
  }

  .home-hero__tagline {
    margin-top: 0.55rem;
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

<style src="@/components/home/home-motion.css"></style>

<template>
  <section
    v-if="reviews.length"
    class="gy-section reviews-section"
    aria-roledescription="carousel"
    aria-label="Guest reviews"
    @mouseenter="pause"
    @mouseleave="resume"
    @focusin="pause"
    @focusout="onFocusOut"
  >
    <div class="gy-container">
      <header v-reveal class="section-head">
        <div>
          <p class="gy-eyebrow section-kicker">Guest voices</p>
          <h2 class="gy-display section-title">What guests say</h2>
        </div>
      </header>

      <div
        ref="trackEl"
        class="reviews-track"
        :class="{
          'is-single': reviews.length === 1,
          'is-pair': reviews.length === 2
        }"
        :aria-live="paused ? 'polite' : 'off'"
        @scroll.passive="onTrackScroll"
        @touchstart.passive="pause"
        @touchend.passive="resume"
      >
        <article
          v-for="review in reviews"
          :key="review.id"
          class="reviews-card"
        >
          <div
            class="reviews-card__stars"
            :aria-label="`${review.rating} out of 5 stars`"
          >
            <q-icon
              v-for="star in 5"
              :key="star"
              :name="star <= review.rating ? 'star' : 'star_border'"
              size="18px"
            />
          </div>
          <blockquote class="reviews-card__quote">
            <p>{{ review.text }}</p>
          </blockquote>
          <footer class="reviews-card__meta">
            <p class="reviews-card__name">{{ review.reviewerName }}</p>
            <p class="reviews-card__hotel">{{ review.hotelName }}</p>
          </footer>
        </article>
      </div>

      <div v-if="reviews.length > 1" class="reviews-nav">
        <button
          type="button"
          class="round-btn"
          aria-label="Previous review"
          @click="goPrev"
        >
          <q-icon name="chevron_left" size="24px" />
        </button>
        <div class="reviews-dots" role="tablist" aria-label="Review slides">
          <button
            v-for="(review, i) in reviews"
            :key="`dot-${review.id}`"
            type="button"
            class="reviews-dots__dot"
            :class="{ 'is-active': i === index }"
            role="tab"
            :aria-selected="i === index"
            :aria-label="`Show review ${i + 1}`"
            @click="goTo(i)"
          />
        </div>
        <button
          type="button"
          class="round-btn"
          aria-label="Next review"
          @click="goNext"
        >
          <q-icon name="chevron_right" size="24px" />
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import {
  fetchPublicReviews,
  type GuestReview
} from "@/services/engine/reviews";

const AUTO_MS = 6000;

const reviews = ref<GuestReview[]>([]);
const index = ref(0);
const paused = ref(false);
const trackEl = ref<HTMLElement | null>(null);

let timer: ReturnType<typeof setInterval> | null = null;
let scrollTimer: ReturnType<typeof setTimeout> | null = null;
let programmatic = false;
let reduceMotion = false;

function clearTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function startTimer() {
  clearTimer();
  if (reduceMotion || paused.value || reviews.value.length < 2) return;
  timer = setInterval(() => {
    goTo(index.value + 1, false);
  }, AUTO_MS);
}

function pause() {
  paused.value = true;
  clearTimer();
}

function resume() {
  paused.value = false;
  startTimer();
}

function onFocusOut(event: FocusEvent) {
  const root = trackEl.value?.closest(".reviews-section");
  const next = event.relatedTarget as Node | null;
  if (root && next && root.contains(next)) return;
  resume();
}

function scrollToIndex(i: number) {
  const track = trackEl.value;
  const card = track?.querySelectorAll<HTMLElement>(".reviews-card")[i];
  if (!track || !card) return;
  programmatic = true;
  track.scrollTo({ left: card.offsetLeft });
}

function goTo(i: number, restart = true) {
  if (!reviews.value.length) return;
  index.value =
    ((i % reviews.value.length) + reviews.value.length) % reviews.value.length;
  scrollToIndex(index.value);
  if (restart) startTimer();
}

function goNext() {
  goTo(index.value + 1);
}

function goPrev() {
  goTo(index.value - 1);
}

function syncIndex() {
  const track = trackEl.value;
  if (!track) return;
  const cards = [...track.querySelectorAll<HTMLElement>(".reviews-card")];
  let best = 0;
  let bestDist = Number.POSITIVE_INFINITY;
  cards.forEach((card, i) => {
    const dist = Math.abs(card.offsetLeft - track.scrollLeft);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  });
  index.value = best;
}

function onTrackScroll() {
  if (scrollTimer) clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => {
    if (programmatic) {
      programmatic = false;
      return;
    }
    syncIndex();
  }, 120);
}

onMounted(async () => {
  reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  try {
    reviews.value = await fetchPublicReviews();
  } catch {
    reviews.value = [];
  }
  if (reviews.value.length) startTimer();
});

onUnmounted(() => {
  clearTimer();
  if (scrollTimer) clearTimeout(scrollTimer);
});
</script>

<style scoped>
.reviews-section {
  background: linear-gradient(180deg, var(--gy-cream) 0%, var(--gy-white) 100%);
}

.section-head {
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

.reviews-track {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  padding-bottom: 0.35rem;
}

.reviews-track::-webkit-scrollbar {
  display: none;
}

.reviews-card {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  flex: 0 0 100%;
  scroll-snap-align: start;
  min-width: 0;
  padding: clamp(1.25rem, 2.5vw, 1.75rem);
  border-radius: 20px;
  background: var(--gy-white);
  border: 1px solid rgba(69, 76, 75, 0.08);
  box-shadow: 0 16px 40px rgba(69, 76, 75, 0.07);
  transition:
    transform 0.4s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.4s ease;
}

.reviews-card__stars {
  display: flex;
  gap: 0.12rem;
  color: var(--gy-gold-deep);
}

.reviews-card__quote {
  margin: 0;
  flex: 1;
}

.reviews-card__quote p {
  margin: 0;
  font-size: clamp(1.02rem, 1.6vw, 1.18rem);
  line-height: 1.65;
  color: var(--gy-ink);
}

.reviews-card__quote p::before {
  content: "“";
  margin-right: 0.15rem;
  color: var(--gy-gold);
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-weight: 700;
  line-height: 0;
}

.reviews-card__meta {
  padding-top: 0.85rem;
  border-top: 1px solid rgba(69, 76, 75, 0.1);
}

.reviews-card__name {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.95rem;
}

.reviews-card__hotel {
  margin: 0.2rem 0 0;
  color: var(--gy-muted);
  font-size: 0.88rem;
}

.reviews-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 1.1rem;
}

.round-btn {
  display: inline-grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1px solid rgba(69, 76, 75, 0.14);
  border-radius: 999px;
  background: var(--gy-white);
  color: var(--gy-ink);
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    color 0.2s ease;
}

.round-btn:hover,
.round-btn:focus-visible {
  border-color: var(--gy-forest);
  color: var(--gy-forest);
  outline: none;
}

.reviews-dots {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.4rem;
}

.reviews-dots__dot {
  position: relative;
  width: 0.55rem;
  height: 0.55rem;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: rgba(69, 76, 75, 0.25);
  cursor: pointer;
  transition:
    background 0.2s ease,
    width 0.2s ease;
}

.reviews-dots__dot::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  width: 44px;
  height: 44px;
  transform: translate(-50%, -50%);
}

.reviews-dots__dot.is-active {
  width: 1.35rem;
  background: var(--gy-gold-deep);
}

.reviews-track.is-single {
  justify-content: center;
}

.reviews-track.is-single .reviews-card {
  flex-basis: min(100%, 42rem);
}

@media (hover: hover) {
  .reviews-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 44px rgba(69, 76, 75, 0.11);
  }
}

@media (min-width: 860px) {
  .reviews-card {
    flex-basis: calc((100% - 1rem) / 2);
  }

  .reviews-track.is-pair .reviews-card {
    flex-basis: calc((100% - 1rem) / 2);
  }
}

@media (min-width: 1200px) {
  .reviews-card {
    flex-basis: calc((100% - 2rem) / 3);
  }

  .reviews-track.is-pair .reviews-card {
    flex-basis: calc((100% - 1rem) / 2);
  }
}

@media (prefers-reduced-motion: reduce) {
  .reviews-track {
    scroll-behavior: auto;
  }

  .reviews-card,
  .reviews-dots__dot {
    transition: none;
  }
}
</style>

<template>
  <section
    v-if="reviews.length"
    id="home-reviews"
    class="reviews-section home-motion"
    aria-roledescription="carousel"
    aria-labelledby="home-reviews-title"
  >
    <div class="gy-container">
      <header class="section-head">
        <div>
          <p v-reveal class="gy-eyebrow section-kicker">Guest voices</p>
          <RevealWords
            id="home-reviews-title"
            class="section-title"
            text="What guests say"
          />
        </div>
      </header>

      <div
        ref="trackEl"
        v-reveal
        class="reviews-track"
        :class="{
          'is-single': reviews.length === 1,
          'is-pair': reviews.length === 2
        }"
        aria-live="polite"
        @scroll.passive="onTrackScroll"
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
import RevealWords from "@/components/home/RevealWords.vue";
import {
  fetchPublicReviews,
  type GuestReview
} from "@/services/engine/reviews";

const reviews = ref<GuestReview[]>([]);
const index = ref(0);
const trackEl = ref<HTMLElement | null>(null);

let scrollTimer: ReturnType<typeof setTimeout> | null = null;
let programmatic = false;

function scrollToIndex(i: number) {
  const track = trackEl.value;
  const card = track?.querySelectorAll<HTMLElement>(".reviews-card")[i];
  if (!track || !card) return;
  programmatic = true;
  track.scrollTo({ left: card.offsetLeft });
}

function goTo(i: number) {
  if (!reviews.value.length) return;
  index.value =
    ((i % reviews.value.length) + reviews.value.length) % reviews.value.length;
  scrollToIndex(index.value);
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
  try {
    reviews.value = await fetchPublicReviews();
  } catch {
    reviews.value = [];
  }
});

onUnmounted(() => {
  if (scrollTimer) clearTimeout(scrollTimer);
});
</script>

<style scoped>
.reviews-section {
  padding: clamp(5rem, 10vw, 8rem) 0;
  background: var(--gy-cream);
  color: var(--gy-forest);
}

.section-head {
  margin-bottom: clamp(2rem, 5vw, 3.5rem);
}

.section-kicker {
  margin: 0 0 0.85rem;
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--gy-gold);
}

.section-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--gy-text-4xl);
  font-weight: 700;
  line-height: 1;
  letter-spacing: normal;
}

.reviews-track {
  display: flex;
  gap: 0;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
}

.reviews-track::-webkit-scrollbar {
  display: none;
}

.reviews-card {
  display: flex;
  flex: 0 0 100%;
  flex-direction: column;
  gap: 1.5rem;
  min-width: 0;
  scroll-snap-align: start;
  padding: 0.25rem 0 0;
  background: transparent;
}

.reviews-card__stars {
  display: flex;
  gap: 0.15rem;
  color: var(--gy-gold);
}

.reviews-card__quote {
  margin: 0;
}

.reviews-card__quote p {
  margin: 0;
  max-width: 18em;
  font-family: var(--font-body);
  font-size: var(--gy-text-2xl);
  font-weight: 400;
  line-height: 1.15;
  letter-spacing: normal;
  color: var(--gy-forest);
}

.reviews-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.85rem;
  align-items: baseline;
}

.reviews-card__name {
  margin: 0;
  font-family: var(--font-display);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: normal;
}

.reviews-card__hotel {
  margin: 0;
  color: var(--gy-forest);
  font-family: var(--font-display);
  font-size: 0.85rem;
}

.reviews-nav {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 2rem;
}

.round-btn {
  display: inline-grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1px solid rgba(69, 76, 75, 0.2);
  border-radius: 999px;
  background: transparent;
  color: var(--gy-forest);
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    color 0.2s ease,
    background 0.2s ease;
}

.round-btn:hover,
.round-btn:focus-visible {
  border-color: var(--gy-forest);
  background: var(--gy-forest);
  color: #fff;
  outline: none;
}

.reviews-dots {
  display: flex;
  flex-wrap: wrap;
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

@media (prefers-reduced-motion: reduce) {
  .reviews-track {
    scroll-behavior: auto;
  }

  .reviews-dots__dot,
  .round-btn {
    transition: none;
  }
}
</style>

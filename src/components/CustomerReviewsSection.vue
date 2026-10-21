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
      <header v-reveal class="reviews-section__intro">
        <p class="gy-eyebrow">Guest voices</p>
        <h2 class="gy-display reviews-section__title">What guests say</h2>
      </header>

      <div
        ref="viewportEl"
        class="reviews-carousel"
        @touchstart.passive="onTouchStart"
        @touchend.passive="onTouchEnd"
      >
        <button
          type="button"
          class="reviews-carousel__arrow reviews-carousel__arrow--prev"
          aria-label="Previous review"
          @click="goPrev"
        >
          <q-icon name="chevron_left" size="28px" />
        </button>

        <div class="reviews-carousel__track" :aria-live="paused ? 'polite' : 'off'">
          <article
            v-for="(review, i) in reviews"
            :key="review.id"
            class="reviews-card"
            :class="{ 'is-active': i === index }"
            :aria-hidden="i !== index"
          >
            <div
              class="reviews-card__stars"
              :aria-label="`${review.rating} out of 5 stars`"
            >
              <q-icon
                v-for="star in 5"
                :key="star"
                :name="star <= review.rating ? 'star' : 'star_border'"
                size="20px"
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

        <button
          type="button"
          class="reviews-carousel__arrow reviews-carousel__arrow--next"
          aria-label="Next review"
          @click="goNext"
        >
          <q-icon name="chevron_right" size="28px" />
        </button>
      </div>

      <div
        v-if="reviews.length > 1"
        class="reviews-carousel__dots"
        role="tablist"
        aria-label="Review slides"
      >
        <button
          v-for="(review, i) in reviews"
          :key="`dot-${review.id}`"
          type="button"
          class="reviews-carousel__dot"
          :class="{ 'is-active': i === index }"
          role="tab"
          :aria-selected="i === index"
          :aria-label="`Show review ${i + 1}`"
          @click="goTo(i)"
        />
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
const SWIPE_PX = 48;

const reviews = ref<GuestReview[]>([]);
const index = ref(0);
const paused = ref(false);
const viewportEl = ref<HTMLElement | null>(null);

let timer: ReturnType<typeof setInterval> | null = null;
let touchX: number | null = null;
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
    index.value = (index.value + 1) % reviews.value.length;
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
  const root = viewportEl.value?.closest(".reviews-section");
  const next = event.relatedTarget as Node | null;
  if (root && next && root.contains(next)) return;
  resume();
}

function goTo(i: number) {
  if (!reviews.value.length) return;
  index.value = ((i % reviews.value.length) + reviews.value.length) % reviews.value.length;
  startTimer();
}

function goNext() {
  goTo(index.value + 1);
}

function goPrev() {
  goTo(index.value - 1);
}

function onTouchStart(event: TouchEvent) {
  touchX = event.changedTouches[0]?.clientX ?? null;
}

function onTouchEnd(event: TouchEvent) {
  if (touchX === null) return;
  const endX = event.changedTouches[0]?.clientX ?? touchX;
  const delta = endX - touchX;
  touchX = null;
  if (Math.abs(delta) < SWIPE_PX) return;
  if (delta < 0) goNext();
  else goPrev();
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

onUnmounted(() => clearTimer());
</script>

<style scoped>
.reviews-section {
  background: linear-gradient(180deg, #f7f6f3 0%, var(--gy-white) 100%);
}

.reviews-section__intro {
  text-align: center;
  margin-bottom: 2rem;
}

.reviews-section__title {
  margin: 0;
  font-size: clamp(2.2rem, 4.5vw, 3.2rem);
  line-height: 1;
  letter-spacing: -0.03em;
}

.reviews-carousel {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.75rem;
  max-width: 52rem;
  margin: 0 auto;
}

.reviews-carousel__track {
  position: relative;
  min-height: 16rem;
}

.reviews-card {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
  padding: clamp(1.5rem, 3vw, 2.25rem);
  border-radius: var(--gy-radius-card);
  background: var(--gy-white);
  box-shadow: var(--gy-shadow);
  border: 1px solid rgba(26, 24, 20, 0.06);
  opacity: 0;
  transform: translateY(12px);
  pointer-events: none;
  transition:
    opacity 0.45s ease,
    transform 0.45s ease;
}

.reviews-card.is-active {
  position: relative;
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
  z-index: 1;
}

.reviews-card__stars {
  display: flex;
  gap: 0.15rem;
  color: var(--gy-gold-deep);
}

.reviews-card__quote {
  margin: 0;
}

.reviews-card__quote p {
  margin: 0;
  font-family: var(--font-body);
  font-size: clamp(1.05rem, 2vw, 1.25rem);
  line-height: 1.65;
  color: var(--gy-ink);
}

.reviews-card__meta {
  margin-top: 0.25rem;
}

.reviews-card__name {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: 0.02em;
}

.reviews-card__hotel {
  margin: 0.2rem 0 0;
  font-size: 0.88rem;
  color: var(--gy-muted);
}

.reviews-carousel__arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border: 1px solid rgba(26, 24, 20, 0.12);
  border-radius: 999px;
  background: var(--gy-white);
  color: var(--gy-ink);
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    color 0.2s ease,
    background 0.2s ease;
}

.reviews-carousel__arrow:hover,
.reviews-carousel__arrow:focus-visible {
  border-color: var(--gy-gold-deep);
  color: var(--gy-gold-deep);
  outline: none;
}

.reviews-carousel__dots {
  display: flex;
  justify-content: center;
  gap: 0.45rem;
  margin-top: 1.35rem;
}

.reviews-carousel__dot {
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

.reviews-carousel__dot::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  width: 44px;
  height: 44px;
  transform: translate(-50%, -50%);
}

.reviews-carousel__dot.is-active {
  width: 1.35rem;
  background: var(--gy-gold-deep);
}

@media (max-width: 700px) {
  .reviews-carousel {
    grid-template-columns: 1fr;
    gap: 0.85rem;
  }

  .reviews-carousel__arrow {
    position: absolute;
    top: 50%;
    z-index: 2;
    transform: translateY(-50%);
    width: 2.4rem;
    height: 2.4rem;
    background: rgba(255, 255, 255, 0.92);
  }

  .reviews-carousel__arrow--prev {
    left: 0.35rem;
  }

  .reviews-carousel__arrow--next {
    right: 0.35rem;
  }

  .reviews-carousel__track {
    min-height: 18rem;
  }

  .reviews-card {
    padding-inline: 2.75rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .reviews-card {
    transition: none;
  }
}
</style>

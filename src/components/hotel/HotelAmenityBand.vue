<template>
  <section
    v-if="items.length"
    class="band"
    data-sheet="Amenities"
    aria-labelledby="hotel-amenities-title"
  >
    <div
      class="marquee"
      :class="{ 'is-static': reduceMotion, 'is-paused': paused }"
      aria-hidden="true"
      @pointerdown="paused = true"
      @pointerup="paused = false"
      @pointercancel="paused = false"
      @pointerleave="paused = false"
    >
      <div class="marquee__track" :style="trackStyle">
        <span
          v-for="(item, index) in loopItems"
          :key="`${index}-${item}`"
          class="marquee__item"
        >
          <em>{{ item }}</em>
          <i />
        </span>
      </div>
    </div>

    <div class="gy-container band__body">
      <p v-reveal class="eyebrow">During your stay</p>
      <h2 id="hotel-amenities-title" v-reveal="{ delay: '80ms' }">
        Hotel features
      </h2>
      <p v-reveal="{ delay: '120ms' }" class="band__lead">
        Amenities guests can expect during their stay.
      </p>
      <FeatureChips :items="items" on-dark />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import FeatureChips from "@/components/FeatureChips.vue";

const props = defineProps<{ items: string[] }>();

const reduceMotion = ref(
  typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
);
const paused = ref(false);

const items = computed(() =>
  props.items.map(item => item.trim()).filter(Boolean)
);

const half = computed(() => {
  if (!items.value.length || reduceMotion.value) return items.value;
  const repeats = Math.max(1, Math.ceil(6 / items.value.length));
  return Array.from({ length: repeats }, () => items.value).flat();
});

const loopItems = computed(() =>
  reduceMotion.value ? half.value : [...half.value, ...half.value]
);

const trackStyle = computed(() => {
  if (reduceMotion.value) return undefined;
  const seconds = Math.max(28, half.value.length * 3.4);
  return { animationDuration: `${seconds}s` };
});
</script>

<style scoped>
.band {
  position: relative;
  color: #fff;
  background:
    radial-gradient(
      ellipse at 8% 0%,
      rgba(196, 163, 90, 0.34),
      transparent 46%
    ),
    radial-gradient(
      ellipse at 100% 100%,
      rgba(98, 112, 99, 0.72),
      transparent 48%
    ),
    linear-gradient(155deg, #1a211e 0%, #2c312e 46%, #3a3228 100%);
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 4rem), 0 100%);
  padding: clamp(3.5rem, 7vw, 5.5rem) 0 clamp(5.5rem, 9vw, 7.5rem);
  overflow: hidden;
}

.marquee {
  overflow: hidden;
  margin-bottom: clamp(2rem, 5vw, 3.5rem);
  -webkit-mask-image: linear-gradient(
    90deg,
    transparent,
    #000 7%,
    #000 93%,
    transparent
  );
  mask-image: linear-gradient(
    90deg,
    transparent,
    #000 7%,
    #000 93%,
    transparent
  );
}

.marquee__track {
  display: flex;
  width: max-content;
  animation: amenity-marquee 36s linear infinite;
}

.marquee:hover .marquee__track,
.marquee.is-paused .marquee__track {
  animation-play-state: paused;
}

.marquee__item {
  display: inline-flex;
  align-items: center;
  gap: 1.1rem;
  padding-right: 1.1rem;
}

.marquee__item em {
  font-family: var(--font-display);
  font-size: clamp(2.15rem, 6vw, 3.86rem);
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1;
  white-space: nowrap;
  transition: color 0.3s ease;
}

.marquee__item:hover em {
  color: var(--gy-gold);
}

.marquee__item i {
  width: 0.45rem;
  height: 0.45rem;
  background: linear-gradient(135deg, var(--gy-gold), var(--gy-forest));
  transform: rotate(45deg);
}

.marquee.is-static {
  -webkit-mask-image: none;
  mask-image: none;
}

.marquee.is-static .marquee__track {
  width: auto;
  flex-wrap: wrap;
  gap: 0.35rem 0.2rem;
  padding-inline: clamp(1.25rem, 6vw, 5rem);
  animation: none;
}

.band__body {
  position: relative;
  z-index: 1;
}

.eyebrow {
  margin: 0 0 0.85rem;
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--gy-gold);
}

.eyebrow::after {
  content: "";
  display: block;
  width: 0;
  height: 1px;
  margin-top: 0.8rem;
  background: linear-gradient(90deg, var(--gy-gold), var(--gy-forest));
  transition: width 0.9s cubic-bezier(0.22, 1, 0.36, 1);
}

.eyebrow.gy-reveal--in::after {
  width: 3.25rem;
}

.band h2 {
  margin: 0 0 0.7rem;
  max-width: 12ch;
  font-family: var(--font-display);
  font-size: clamp(2.52rem, 6vw, 4.54rem);
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1;
}

.band__lead {
  max-width: 34rem;
  margin: 0 0 1.35rem;
  font-family: var(--font-body);
  font-size: 0.95rem;
  font-weight: 500;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.78);
}

@keyframes amenity-marquee {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

@media (max-width: 700px) {
  .band {
    clip-path: polygon(0 0, 100% 0, 100% calc(100% - 1.75rem), 0 100%);
    padding-bottom: 4.25rem;
  }

  .marquee__item em {
    font-size: clamp(1.8rem, 9vw, 2.4rem);
  }
}

@media (prefers-reduced-motion: reduce) {
  .marquee {
    -webkit-mask-image: none;
    mask-image: none;
  }

  .marquee__track {
    width: auto;
    flex-wrap: wrap;
    padding-inline: clamp(1.25rem, 6vw, 5rem);
    animation: none;
  }

  .marquee__item em,
  .eyebrow::after {
    transition: none;
  }

  .eyebrow::after {
    width: 3.25rem;
  }
}
</style>

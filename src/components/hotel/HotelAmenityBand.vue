<template>
  <section
    v-if="items.length"
    :id="id"
    class="band"
    :class="{ 'band--strip': !showCopy }"
    :data-sheet="sheet"
    :aria-labelledby="showCopy ? 'hotel-amenities-title' : undefined"
    :aria-hidden="showCopy ? undefined : true"
  >
    <div class="marquee is-static" :aria-label="items.join(', ')">
      <div class="marquee__track">
        <span v-for="item in items" :key="item" class="marquee__item">
          <em>{{ item }}</em>
          <i />
        </span>
      </div>
    </div>

    <div v-if="showCopy" class="gy-container band__body">
      <p v-reveal class="eyebrow">{{ eyebrow }}</p>
      <h2 id="hotel-amenities-title" v-reveal>
        {{ title }}
      </h2>
      <p v-if="lead" v-reveal class="band__lead">
        {{ lead }}
      </p>
      <FeatureChips :items="items" on-dark />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import FeatureChips from "@/components/FeatureChips.vue";

const props = withDefaults(
  defineProps<{
    items: string[];
    eyebrow?: string;
    title?: string;
    lead?: string;
    sheet?: string;
    /** False keeps only the amenity title band. */
    showCopy?: boolean;
    id?: string;
  }>(),
  {
    eyebrow: "During your stay",
    title: "Hotel features",
    lead: "Amenities guests can expect during their stay.",
    sheet: "Amenities",
    showCopy: true,
    id: undefined
  }
);

const items = computed(() =>
  props.items.map(item => item.trim()).filter(Boolean)
);
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

.band.band--strip {
  clip-path: none;
  padding: 1.35rem 0 1.5rem;
  overflow: visible;
}

.band.band--strip .marquee {
  margin-bottom: 0;
  padding-block: 0.2rem;
}

.band.band--strip .marquee__item em {
  line-height: 1.25;
}

.marquee {
  margin-bottom: clamp(2rem, 5vw, 3.5rem);
}

.marquee__track {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.2rem;
  padding-inline: clamp(1.25rem, 6vw, 5rem);
}

.marquee__item {
  display: inline-flex;
  align-items: center;
  gap: 1.1rem;
  padding-right: 1.1rem;
}

.marquee__item em {
  font-style: normal;
  font-family: var(--font-display);
  font-size: var(--gy-text-3xl);
  font-weight: 500;
  letter-spacing: normal;
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

.band h2 {
  margin: 0 0 0.7rem;
  max-width: 12ch;
  font-family: var(--font-display);
  font-size: var(--gy-text-4xl);
  font-weight: 500;
  letter-spacing: normal;
  line-height: 1;
}

.band__lead {
  max-width: 34rem;
  margin: 0 0 1.35rem;
  font-family: var(--font-body);
  font-size: 0.95rem;
  font-weight: 400;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.78);
}

@media (max-width: 700px) {
  .band {
    clip-path: polygon(0 0, 100% 0, 100% calc(100% - 1.75rem), 0 100%);
    padding-bottom: 4.25rem;
  }

  .marquee__item em {
    font-size: var(--gy-text-2xl);
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

  .marquee__item em {
    transition: none;
  }
}
</style>

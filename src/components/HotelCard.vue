<template>
  <article class="hotel-card gy-card" :class="{ 'hotel-card--live': live }">
    <router-link
      :to="`/hotels/${hotel.slug}`"
      class="gy-card-media hotel-card__media"
    >
      <img
        v-if="coverImage"
        class="hotel-card__cover"
        :src="coverImage"
        :alt="hotel.name"
        loading="lazy"
      />
      <img
        v-if="live && revealImage"
        class="hotel-card__reveal"
        :src="revealImage"
        :alt="`${hotel.name} photograph`"
        loading="lazy"
      />
      <span class="hotel-card__loc">{{ locationName }}</span>
    </router-link>

    <div class="hotel-card__body">
      <p v-if="live && metaLine" class="hotel-card__meta">{{ metaLine }}</p>
      <h3 class="gy-display">
        <router-link :to="`/hotels/${hotel.slug}`">{{
          hotel.name
        }}</router-link>
      </h3>
      <p class="hotel-card__desc">{{ hotel.shortDescription }}</p>
      <FeatureChips
        v-if="live && hotel.amenities.length"
        :items="hotel.amenities"
        :limit="3"
        size="sm"
      />

      <div class="hotel-card__foot">
        <router-link
          class="gy-btn gy-btn--light gy-btn--sm"
          :to="`/hotels/${hotel.slug}`"
        >
          View Hotel
        </router-link>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from "vue";
import FeatureChips from "@/components/FeatureChips.vue";
import { useCmsStore } from "@/stores/cms-store";
import type { Hotel } from "@/types/greyon";

const props = withDefaults(defineProps<{ hotel: Hotel; live?: boolean }>(), {
  live: false
});
const cms = useCmsStore();

const locationName = computed(
  () => cms.getLocationById(props.hotel.locationId)?.name ?? ""
);
const coverImage = computed(
  () =>
    props.hotel.heroImage?.trim() ||
    props.hotel.gallery.find(src => src.trim()) ||
    ""
);
const revealImage = computed(() => {
  const cover = coverImage.value;
  return (
    props.hotel.gallery
      .find(src => src.trim() && src.trim() !== cover)
      ?.trim() ?? ""
  );
});
const metaLine = computed(() => {
  const parts: string[] = [];
  if (props.hotel.propertyType?.trim())
    parts.push(props.hotel.propertyType.trim());
  if (props.hotel.featured) parts.push("Featured");
  return parts.join(" · ");
});
</script>

<style scoped>
.hotel-card {
  display: grid;
  gap: 0.85rem;
  height: 100%;
}

.hotel-card__media {
  position: relative;
  aspect-ratio: 4 / 5;
}

.hotel-card__body {
  display: grid;
  gap: 0.5rem;
  align-content: start;
  padding: 0.15rem 0.2rem 0.1rem;
}

.hotel-card__cover,
.hotel-card__reveal {
  transition: transform 1.2s cubic-bezier(0.22, 1, 0.36, 1);
}

.hotel-card:hover .hotel-card__cover {
  transform: scale(1.06);
}

.hotel-card__reveal {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  object-fit: cover;
  clip-path: inset(0 100% 0 0);
  transition:
    clip-path 0.95s cubic-bezier(0.22, 1, 0.36, 1),
    transform 1.2s cubic-bezier(0.22, 1, 0.36, 1);
}

.hotel-card--live:hover .hotel-card__reveal,
.hotel-card--live:focus-within .hotel-card__reveal {
  clip-path: inset(0 0 0 0);
}

.hotel-card__media::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 2;
  background: linear-gradient(
    180deg,
    transparent 45%,
    rgba(18, 16, 14, 0.55) 100%
  );
  pointer-events: none;
}

.hotel-card__loc {
  position: absolute;
  left: 1rem;
  bottom: 1rem;
  z-index: 1;
  font-size: 0.68rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.92);
}

.hotel-card__body h3 {
  margin: 0;
  font-size: clamp(1.55rem, 2.2vw, 1.9rem);
  line-height: 1.1;
  font-weight: 700;
}

.hotel-card__body h3 a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding-block: 0.2rem;
}

.hotel-card__body h3 a:hover {
  color: var(--gy-gold-deep);
}

.hotel-card__desc {
  margin: 0;
  color: var(--gy-muted);
  font-size: 0.95rem;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.hotel-card__foot {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.75rem;
  margin-top: 0.35rem;
}

.hotel-card--live {
  position: relative;
  isolation: isolate;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 22px 50px rgba(28, 24, 18, 0.08);
}

.hotel-card--live::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 4;
  padding: 2.5px;
  border-radius: inherit;
  background: conic-gradient(
    from var(--gy-spin),
    var(--gy-gold),
    var(--gy-forest) 35%,
    rgba(255, 255, 255, 0.15) 55%,
    var(--gy-gold-deep) 78%,
    var(--gy-gold)
  );
  pointer-events: none;
  animation: gy-card-spin 8s linear infinite;
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  mask-composite: exclude;
}

.hotel-card__meta {
  margin: 0;
  font-family: "Montserrat", system-ui, sans-serif;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
}

.hotel-card--live h3 {
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: -0.02em;
  font-size: clamp(2rem, 2.6vw, 2.75rem);
}

@media (prefers-reduced-motion: reduce) {
  .hotel-card__reveal {
    display: none;
  }

  .hotel-card--live::before {
    animation: none;
  }
}
</style>

<style>
@property --gy-spin {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}

@keyframes gy-card-spin {
  to {
    --gy-spin: 360deg;
  }
}
</style>

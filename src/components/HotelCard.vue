<template>
  <article class="hotel-card gy-card">
    <router-link
      :to="`/hotels/${hotel.slug}`"
      class="gy-card-media hotel-card__media"
    >
      <img
        v-if="coverImage"
        :src="coverImage"
        :alt="hotel.name"
        loading="lazy"
      />
      <span class="hotel-card__loc">{{ locationName }}</span>
    </router-link>

    <div class="hotel-card__body">
      <h3 class="gy-display">
        <router-link :to="`/hotels/${hotel.slug}`">{{
          hotel.name
        }}</router-link>
      </h3>
      <p class="hotel-card__desc">{{ hotel.shortDescription }}</p>

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
import { useCmsStore } from "@/stores/cms-store";
import type { Hotel } from "@/types/greyon";

const props = defineProps<{ hotel: Hotel }>();
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

.hotel-card__media img {
  transition: transform 1.2s cubic-bezier(0.22, 1, 0.36, 1);
}

.hotel-card:hover .hotel-card__media img {
  transform: scale(1.06);
}

.hotel-card__media::after {
  content: "";
  position: absolute;
  inset: 0;
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
</style>

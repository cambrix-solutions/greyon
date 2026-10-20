<template>
  <article
    class="room-offer"
    :class="[
      `room-offer--${variant}`,
      {
        'room-offer--priced': Boolean(priceText),
        'is-pressed': pressed
      }
    ]"
    @pointerdown="pressed = true"
    @pointerup="pressed = false"
    @pointerleave="pressed = false"
    @pointercancel="pressed = false"
  >
    <div class="room-offer__media">
      <RoomMediaCarousel :images="images" :alt="title" :badge="badge" fill />
    </div>

    <div class="room-offer__body">
      <div class="room-offer__copy">
        <h3 class="gy-display room-offer__title">{{ title }}</h3>
        <p v-if="subtitle" class="room-offer__subtitle">{{ subtitle }}</p>
        <RoomFacts
          :bed-type="bedType"
          :room-size="roomSize"
          :max-guests="maxGuests"
          compact
        />
        <FeatureChips
          v-if="amenities.length"
          :items="amenities"
          :limit="amenityLimit"
          size="sm"
          sheet-title="Room amenities"
        />
        <p v-if="meta" class="room-offer__meta">{{ meta }}</p>
      </div>

      <div class="room-offer__aside">
        <div v-if="priceText" class="room-offer__price">
          <strong>{{ priceText }}</strong>
          <span v-if="pricePerNight" class="room-offer__per">{{
            pricePerNight
          }}</span>
          <span v-if="priceHint" class="room-offer__hint">{{ priceHint }}</span>
        </div>
        <button
          class="gy-btn room-offer__cta"
          :class="ctaOutline ? 'gy-btn--outline' : 'gy-btn--light'"
          type="button"
          @click="emit('cta')"
        >
          {{ ctaLabel }}
        </button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import FeatureChips from "@/components/FeatureChips.vue";
import RoomFacts from "@/components/RoomFacts.vue";
import RoomMediaCarousel from "@/components/RoomMediaCarousel.vue";

const props = withDefaults(
  defineProps<{
    variant?: "detail" | "result";
    title: string;
    subtitle?: string;
    images?: string[];
    bedType?: string;
    roomSize?: string;
    maxGuests?: number;
    amenities?: string[];
    amenityLimit?: number;
    badge?: string;
    meta?: string;
    priceText?: string;
    pricePerNight?: string;
    priceHint?: string;
    ctaLabel?: string;
    ctaOutline?: boolean;
  }>(),
  {
    variant: "detail",
    subtitle: "",
    images: () => [],
    bedType: "",
    roomSize: "",
    amenities: () => [],
    amenityLimit: 5,
    badge: "",
    meta: "",
    priceText: "",
    pricePerNight: "",
    priceHint: "",
    ctaLabel: "View room details",
    ctaOutline: false
  }
);

const emit = defineEmits<{ (e: "cta"): void }>();

const pressed = ref(false);

const images = computed(() => props.images ?? []);
const amenities = computed(() => props.amenities ?? []);
</script>

<style scoped>
.room-offer {
  display: grid;
  gap: 0;
  overflow: hidden;
  background: var(--gy-white);
  border-radius: 16px;
  box-shadow:
    0 1px 2px rgba(69, 76, 75, 0.05),
    0 12px 32px rgba(69, 76, 75, 0.08);
  transition:
    transform 0.28s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.28s ease;
}

.room-offer:hover {
  transform: translateY(-3px);
  box-shadow:
    0 4px 10px rgba(69, 76, 75, 0.06),
    0 18px 40px rgba(69, 76, 75, 0.12);
}

.room-offer.is-pressed {
  transform: scale(0.988);
  box-shadow:
    0 1px 2px rgba(69, 76, 75, 0.05),
    0 8px 20px rgba(69, 76, 75, 0.08);
}

.room-offer__media {
  min-width: 0;
}

/* Stacked (mobile): keep a 4:3 photo plane even with fill mode. */
.room-offer__media :deep(.room-media) {
  aspect-ratio: 4 / 3;
  height: auto;
  min-height: 0;
  border-radius: 16px 16px 0 0;
}

.room-offer__body {
  display: grid;
  gap: 1rem;
  padding: 1rem 1.05rem 1.1rem;
  min-width: 0;
}

.room-offer__copy {
  display: grid;
  gap: 0.55rem;
  align-content: start;
  min-width: 0;
}

.room-offer__title {
  margin: 0;
  font-size: clamp(1.2rem, 2.4vw, 1.45rem);
  line-height: 1.2;
  color: var(--gy-ink);
}

.room-offer__subtitle {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.45;
  color: var(--gy-muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.room-offer__meta {
  margin: 0;
  font-size: 0.82rem;
  color: var(--gy-gold-deep);
  font-weight: 600;
}

.room-offer__aside {
  display: grid;
  gap: 0.65rem;
  align-content: end;
}

.room-offer__price {
  display: grid;
  gap: 0.12rem;
}

.room-offer__price strong {
  font-family: var(--font-display);
  font-size: 1.55rem;
  font-weight: 600;
  line-height: 1;
  color: var(--gy-ink);
  letter-spacing: -0.02em;
}

.room-offer__per {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--gy-forest);
}

.room-offer__hint {
  font-size: 0.75rem;
  color: var(--gy-muted);
}

.room-offer__cta {
  width: 100%;
}

/* Hotel detail: stack on phones; side-by-side media + body on wider. */
.room-offer--detail {
  grid-template-columns: 1fr;
}

@media (min-width: 600px) {
  .room-offer--detail {
    grid-template-columns: minmax(280px, 40%) minmax(0, 1fr);
    align-items: stretch;
  }

  .room-offer--detail .room-offer__media {
    align-self: stretch;
  }

  .room-offer--detail .room-offer__media :deep(.room-media) {
    height: 100%;
    min-height: 240px;
    aspect-ratio: 4 / 3;
    border-radius: 16px 0 0 16px;
  }

  .room-offer--detail .room-offer__body {
    grid-template-columns: minmax(0, 1fr) minmax(140px, 180px);
    gap: 1rem 1.15rem;
    padding: 1.15rem 1.25rem;
    align-items: stretch;
  }

  .room-offer--detail .room-offer__aside {
    justify-items: end;
    text-align: right;
    border-left: 1px solid rgba(69, 76, 75, 0.08);
    padding-left: 1rem;
  }

  .room-offer--detail .room-offer__cta {
    width: auto;
    min-width: 100%;
  }
}

/* Booking results: large media column from 600px up. */
.room-offer--result {
  grid-template-columns: 1fr;
}

@media (min-width: 600px) {
  .room-offer--result {
    grid-template-columns: minmax(280px, 42%) minmax(0, 1fr);
    align-items: stretch;
  }

  .room-offer--result .room-offer__media {
    align-self: stretch;
    max-width: 420px;
  }

  .room-offer--result .room-offer__media :deep(.room-media) {
    height: 100%;
    min-height: 240px;
    aspect-ratio: 4 / 3;
    max-height: none;
    border-radius: 16px 0 0 16px;
  }

  .room-offer--result .room-offer__body {
    grid-template-columns: minmax(0, 1fr) minmax(128px, 156px);
    gap: 0.75rem 0.85rem;
    padding: 0.95rem 1rem;
    align-items: center;
  }

  .room-offer--result .room-offer__aside {
    justify-items: end;
    text-align: right;
    align-content: center;
    gap: 0.45rem;
  }

  .room-offer--result .room-offer__price strong {
    font-size: 1.35rem;
  }

  .room-offer--result .room-offer__cta {
    width: auto;
    min-width: 100%;
    padding-inline: 0.75rem;
    font-size: 0.7rem;
  }
}

@media (hover: none) {
  .room-offer:hover {
    transform: none;
    box-shadow:
      0 1px 2px rgba(69, 76, 75, 0.05),
      0 12px 32px rgba(69, 76, 75, 0.08);
  }
}
</style>

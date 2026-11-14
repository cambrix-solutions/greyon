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
      <RoomMediaCarousel
        :images="images"
        :alt="title"
        :badge="badge"
        fill
        :lightbox="!detailTo"
      />
      <RoomPanoramaButton
        v-if="showPanorama"
        class="room-offer__pano"
        @open="openPanorama"
      />
    </div>

    <div class="room-offer__body">
      <div class="room-offer__copy">
        <h3 class="gy-display room-offer__title">
          <router-link
            v-if="detailTo"
            :to="detailTo"
            class="room-offer__title-link"
          >
            {{ title }}
          </router-link>
          <template v-else>{{ title }}</template>
        </h3>
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
        <router-link
          v-if="detailTo && showViewDetails"
          :to="detailTo"
          class="room-offer__details"
        >
          View details
        </router-link>
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
        <div class="room-offer__actions">
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
    </div>
  </article>
  <RoomPanoramaDialog
    v-if="showPanorama && panoramaSrc"
    v-model="panoOpen"
    :src="panoramaSrc"
    :title="title"
  />
  <RoomPanoramaSoonDialog v-else-if="showPanorama" v-model="panoSoonOpen" />
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { RouteLocationRaw } from "vue-router";
import FeatureChips from "@/components/FeatureChips.vue";
import RoomFacts from "@/components/RoomFacts.vue";
import RoomMediaCarousel from "@/components/RoomMediaCarousel.vue";
import RoomPanoramaButton from "@/components/RoomPanoramaButton.vue";
import RoomPanoramaDialog from "@/components/RoomPanoramaDialog.vue";
import RoomPanoramaSoonDialog from "@/components/RoomPanoramaSoonDialog.vue";

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
    /** When set, the title (and View details) link to the room detail page. */
    detailTo?: RouteLocationRaw | "";
    /** Show the secondary View details action under amenities. */
    showViewDetails?: boolean;
    /** Opt-in 360° control (hotel detail room cards only). */
    showPanorama?: boolean;
    /** Equirectangular photo. Empty still shows the button (coming soon). */
    panoramaUrl?: string | null;
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
    ctaLabel: "Check availability",
    ctaOutline: false,
    detailTo: "",
    showViewDetails: false,
    showPanorama: false,
    panoramaUrl: null
  }
);

const emit = defineEmits<{ (e: "cta"): void }>();

const pressed = ref(false);
const panoOpen = ref(false);
const panoSoonOpen = ref(false);

const images = computed(() => props.images ?? []);
const amenities = computed(() => props.amenities ?? []);
const panoramaSrc = computed(() => props.panoramaUrl?.trim() || "");

function openPanorama() {
  if (panoramaSrc.value) {
    panoOpen.value = true;
    return;
  }
  panoSoonOpen.value = true;
}
</script>

<style scoped>
/*
  Stacked by default (phones + tablets): photo → content → price/CTA.
  Side-by-side only from the wide breakpoint so mid widths never squeeze
  a min-width media column over the copy.
*/
.room-offer {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto auto;
  gap: 0;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  background: var(--gy-white);
  border-radius: 0;
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
  position: relative;
  z-index: 0;
  display: block;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  isolation: isolate;
  color: inherit;
  text-decoration: none;
}

.room-offer__pano {
  position: absolute;
  right: 0.55rem;
  bottom: 0.55rem;
  z-index: 5;
}

/* Stacked: fixed 16:10 plane — never stretch/fill the whole card. */
.room-offer__media :deep(.room-media),
.room-offer__media :deep(.room-media.room-media--fill) {
  position: relative;
  width: 100%;
  max-width: 100%;
  aspect-ratio: 16 / 10;
  height: auto;
  min-height: 0;
  max-height: none;
  border-radius: 0;
}

.room-offer__body {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
  padding: 1rem 1.05rem 1.1rem;
  min-width: 0;
  background: var(--gy-white);
}

.room-offer__copy {
  display: grid;
  gap: 0.55rem;
  align-content: start;
  min-width: 0;
}

.room-offer__title {
  margin: 0;
  max-width: 100%;
  min-width: 0;
  font-size: 1.2rem;
  line-height: 1.3;
  color: var(--gy-forest);
  overflow-wrap: anywhere;
  word-break: break-word;
  white-space: normal;
}

.room-offer__title-link {
  display: inline;
  color: inherit;
  text-decoration: none;
  overflow-wrap: anywhere;
  word-break: break-word;
  white-space: normal;
  transition: color 0.2s ease;
}

.room-offer__title-link:hover {
  color: var(--gy-forest);
}

.room-offer__title-link:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: 3px;
  border-radius: 0;
}

.room-offer__subtitle {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.45;
  color: var(--gy-forest);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.room-offer__details {
  justify-self: start;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  color: var(--gy-forest);
  font-family: var(--font-display);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-decoration: underline;
  text-underline-offset: 0.18em;
}

.room-offer__details:hover,
.room-offer__details:focus-visible {
  color: var(--gy-gold-deep);
}

.room-offer__details:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: 3px;
}

.room-offer__meta {
  margin: 0;
  font-size: 0.82rem;
  color: var(--gy-gold);
  font-weight: 600;
}

.room-offer__aside {
  display: grid;
  gap: 0.65rem;
  align-content: end;
  min-width: 0;
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
  color: var(--gy-forest);
  letter-spacing: -0.02em;
}

.room-offer__per {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--gy-forest);
}

.room-offer__hint {
  font-size: 0.75rem;
  color: var(--gy-forest);
}

.room-offer__actions {
  display: grid;
  gap: 0.5rem;
  width: 100%;
}

.room-offer__cta {
  width: 100%;
  min-height: 44px;
  text-decoration: none;
  box-sizing: border-box;
}

@media (min-width: 900px) {
  .room-offer--detail,
  .room-offer--result {
    grid-template-columns: minmax(0, 42%) minmax(0, 1fr);
    grid-template-rows: minmax(280px, auto);
    align-items: stretch;
  }

  .room-offer--detail {
    grid-template-columns: minmax(0, 40%) minmax(0, 1fr);
  }

  .room-offer__media {
    align-self: stretch;
    max-width: none;
    min-height: 280px;
    max-height: 420px;
  }

  .room-offer--result .room-offer__media {
    max-width: 420px;
  }

  .room-offer__media :deep(.room-media),
  .room-offer__media :deep(.room-media.room-media--fill) {
    aspect-ratio: auto;
    width: 100%;
    max-width: 100%;
    height: 100%;
    min-height: 280px;
    max-height: 420px;
    border-radius: 0;
  }

  .room-offer__body {
    grid-template-columns: minmax(0, 1fr);
    gap: 1rem;
    padding: 1.15rem 1.25rem;
    align-content: space-between;
  }

  .room-offer__aside {
    justify-items: stretch;
    text-align: left;
    border-left: 0;
    padding-left: 0;
  }

  .room-offer__actions {
    max-width: 16rem;
  }

  .room-offer--result .room-offer__body {
    padding: 0.95rem 1rem;
  }

  .room-offer--result .room-offer__price strong {
    font-size: 1.35rem;
  }
}

@media (min-width: 1100px) {
  .room-offer--detail .room-offer__body,
  .room-offer--result .room-offer__body {
    grid-template-columns: minmax(0, 1fr) minmax(140px, 180px);
    gap: 1rem 1.15rem;
    align-items: stretch;
  }

  .room-offer--result .room-offer__body {
    grid-template-columns: minmax(0, 1fr) minmax(128px, 156px);
    gap: 0.75rem 0.85rem;
    align-items: center;
  }

  .room-offer__aside {
    justify-items: end;
    text-align: right;
    border-left: 1px solid rgba(69, 76, 75, 0.08);
    padding-left: 1rem;
    align-content: end;
  }

  .room-offer--result .room-offer__aside {
    align-content: center;
    gap: 0.45rem;
  }

  .room-offer__actions {
    max-width: none;
    width: 100%;
  }

  .room-offer--result .room-offer__cta {
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

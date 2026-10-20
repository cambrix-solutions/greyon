<template>
  <div
    class="room-media"
    :class="{
      'room-media--empty': !hasImages || allBroken,
      'room-media--fill': fill
    }"
  >
    <!-- Always under the carousel so broken CMS urls still feel intentional. -->
    <div class="room-media__placeholder" aria-hidden="true">
      <q-icon name="apartment" size="42px" />
      <span>Photos coming soon</span>
    </div>

    <q-carousel
      v-if="hasImages && !allBroken"
      v-model="slide"
      class="room-media__carousel"
      animated
      swipeable
      infinite
      :navigation="images.length > 1"
      navigation-position="bottom"
      transition-prev="slide-right"
      transition-next="slide-left"
      control-color="white"
      height="100%"
    >
      <q-carousel-slide
        v-for="(src, idx) in images"
        :key="`${src}-${idx}`"
        :name="idx"
        class="room-media__slide"
      >
        <button
          type="button"
          class="room-media__tap"
          :aria-label="`View photo ${Number(idx) + 1} of ${images.length}`"
          @click="openGallery(Number(idx))"
        >
          <img
            :src="src"
            :alt="`${alt} photo ${Number(idx) + 1}`"
            :loading="idx === 0 ? 'eager' : 'lazy'"
            decoding="async"
            @error="markBroken(src)"
            @load="markLoaded(src)"
          />
        </button>
      </q-carousel-slide>
    </q-carousel>

    <div v-if="badge" class="room-media__badge">{{ badge }}</div>

    <q-dialog
      v-if="hasImages && !allBroken"
      v-model="galleryOpen"
      maximized
      transition-show="fade"
      transition-hide="fade"
    >
      <div class="room-gallery" role="dialog" aria-label="Room photo gallery">
        <button
          type="button"
          class="room-gallery__close"
          aria-label="Close gallery"
          @click="galleryOpen = false"
        >
          <q-icon name="close" size="28px" />
        </button>
        <q-carousel
          v-model="gallerySlide"
          class="room-gallery__carousel"
          animated
          swipeable
          infinite
          arrows
          navigation
          control-color="white"
          height="100%"
        >
          <q-carousel-slide
            v-for="(src, idx) in images"
            :key="`g-${src}-${idx}`"
            :name="idx"
            class="room-gallery__slide"
          >
            <img
              :src="src"
              :alt="`${alt} photo ${Number(idx) + 1}`"
              loading="lazy"
              decoding="async"
            />
          </q-carousel-slide>
        </q-carousel>
        <p class="room-gallery__count">
          {{ Number(gallerySlide) + 1 }} / {{ images.length }}
        </p>
      </div>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    images?: string[];
    alt?: string;
    badge?: string;
    /** Stretch to parent height (horizontal card layouts). */
    fill?: boolean;
  }>(),
  {
    images: () => [],
    alt: "Room",
    badge: "",
    fill: false
  }
);

const slide = ref(0);
const galleryOpen = ref(false);
const gallerySlide = ref(0);
const broken = ref<Set<string>>(new Set());
const loaded = ref<Set<string>>(new Set());

const images = computed(
  () => (props.images ?? []).map(src => src?.trim()).filter(Boolean) as string[]
);
const hasImages = computed(() => images.value.length > 0);
const allBroken = computed(
  () =>
    hasImages.value &&
    images.value.every(src => broken.value.has(src)) &&
    loaded.value.size + broken.value.size >= images.value.length
);

watch(
  images,
  list => {
    slide.value = 0;
    broken.value = new Set();
    loaded.value = new Set();
    // Probe every URL up front so lazy slides can't leave a dotted empty carousel.
    list.forEach(src => {
      const img = new Image();
      img.onload = () => markLoaded(src);
      img.onerror = () => markBroken(src);
      img.src = src;
    });
  },
  { immediate: true }
);

function markBroken(src: string) {
  const next = new Set(broken.value);
  next.add(src);
  broken.value = next;
}

function markLoaded(src: string) {
  const next = new Set(loaded.value);
  next.add(src);
  loaded.value = next;
}

function openGallery(idx: number) {
  if (!hasImages.value || allBroken.value) return;
  gallerySlide.value = idx;
  galleryOpen.value = true;
}
</script>

<style scoped>
.room-media {
  position: relative;
  overflow: hidden;
  background: var(--gy-sand);
  aspect-ratio: 4 / 3;
  border-radius: 12px;
}

.room-media--fill {
  aspect-ratio: auto;
  height: 100%;
  min-height: 200px;
  border-radius: 0;
}

.room-media__carousel {
  position: relative;
  z-index: 1;
  height: 100%;
  background: transparent;
}

.room-media__carousel :deep(.q-carousel__navigation) {
  bottom: 0.55rem;
  padding: 0;
}

.room-media__carousel :deep(.q-carousel__navigation .q-btn) {
  margin: 0 0.12rem;
  padding: 0;
  min-height: 0;
  min-width: 0;
}

.room-media__carousel :deep(.q-carousel__navigation-icon) {
  font-size: 8px !important;
  opacity: 0.55;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.45);
}

.room-media__carousel :deep(.q-carousel__navigation-icon--active) {
  opacity: 1;
}

.room-media__slide {
  padding: 0;
  height: 100%;
}

.room-media__tap {
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: zoom-in;
}

.room-media__tap img,
.room-gallery__slide img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.room-media__placeholder {
  position: absolute;
  inset: 0;
  z-index: 0;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 0.45rem;
  width: 100%;
  height: 100%;
  min-height: inherit;
  color: var(--gy-forest);
  background:
    radial-gradient(
      circle at 30% 25%,
      rgba(98, 112, 99, 0.14),
      transparent 55%
    ),
    linear-gradient(145deg, var(--gy-sand), #e6e8e5 55%, var(--gy-stone));
}

.room-media__placeholder span {
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gy-muted);
}

.room-media__badge {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  z-index: 2;
  max-width: calc(100% - 1.5rem);
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  font-family: var(--font-display);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--gy-ink);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 6px 18px rgba(69, 76, 75, 0.16);
  backdrop-filter: blur(6px);
}

.room-gallery {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: #121816;
  color: var(--gy-white);
}

.room-gallery__close {
  position: absolute;
  top: max(0.75rem, env(safe-area-inset-top));
  right: 0.75rem;
  z-index: 3;
  display: inline-grid;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  color: var(--gy-white);
  cursor: pointer;
}

.room-gallery__carousel {
  flex: 1;
  background: transparent;
}

.room-gallery__slide {
  display: grid;
  place-items: center;
  padding: 3.5rem 1rem 4rem;
  height: 100%;
}

.room-gallery__slide img {
  width: auto;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.room-gallery__count {
  position: absolute;
  left: 0;
  right: 0;
  bottom: max(1rem, env(safe-area-inset-bottom));
  margin: 0;
  text-align: center;
  font-family: var(--font-display);
  font-size: 0.85rem;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.78);
  pointer-events: none;
}
</style>

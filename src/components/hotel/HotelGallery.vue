<template>
  <section
    v-if="images.length"
    class="gallery"
    data-sheet="Gallery"
    aria-labelledby="hotel-gallery-title"
  >
    <div class="gy-container gallery__head">
      <p v-reveal class="eyebrow">Photographs</p>
      <h2 id="hotel-gallery-title" v-reveal="{ delay: '70ms' }">Gallery</h2>
    </div>

    <div
      ref="track"
      class="gallery__track"
      @pointerdown="onTrackDown"
      @pointerup="onTrackUp"
    >
      <button
        v-for="(src, index) in images"
        :key="src"
        type="button"
        class="shot"
        :data-shot="index"
        :class="{ 'is-pinned': pinned === index }"
        :aria-label="`Open photo ${index + 1} of ${images.length}`"
        @mouseenter="pinned = index"
        @focus="pinned = index"
        @click="openAt(index)"
      >
        <img
          :src="src"
          :alt="`${name} gallery ${index + 1}`"
          :loading="index < 2 ? 'eager' : 'lazy'"
        />
        <span class="shot__meta">
          <em>{{ String(index + 1).padStart(2, "0") }}</em>
          <span>{{ name }}</span>
        </span>
      </button>
    </div>

    <q-dialog v-model="open" maximized>
      <div class="lb">
        <h2 class="sr-only">{{ name }} gallery</h2>
        <button
          type="button"
          class="lb__close"
          aria-label="Close gallery"
          @click="open = false"
        >
          <q-icon name="close" size="22px" />
        </button>
        <button
          v-if="images.length > 1"
          type="button"
          class="lb__nav lb__nav--prev"
          aria-label="Previous photo"
          @click="step(-1)"
        >
          <q-icon name="chevron_left" size="28px" />
        </button>
        <figure class="lb__stage">
          <img
            :key="`${active}-${images[active]}`"
            class="lb__img"
            :src="images[active]"
            :alt="`${name} gallery ${active + 1}`"
          />
        </figure>
        <button
          v-if="images.length > 1"
          type="button"
          class="lb__nav lb__nav--next"
          aria-label="Next photo"
          @click="step(1)"
        >
          <q-icon name="chevron_right" size="28px" />
        </button>
        <p class="lb__count" aria-live="polite">
          {{ active + 1 }} / {{ images.length }}
        </p>
      </div>
    </q-dialog>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useDragScroll } from "@/components/home/useDragScroll";

const props = defineProps<{ images: string[]; name: string }>();

const track = ref<HTMLElement | null>(null);
useDragScroll(track, { momentum: true });

const pinned = ref(0);
const open = ref(false);
const active = ref(0);
let pressX = 0;
let pressY = 0;

function openAt(index: number) {
  if (!Number.isFinite(index) || index < 0 || index >= props.images.length) {
    return;
  }
  active.value = index;
  pinned.value = index;
  open.value = true;
}

function onTrackDown(event: PointerEvent) {
  pressX = event.clientX;
  pressY = event.clientY;
}

function onTrackUp(event: PointerEvent) {
  const dx = Math.abs(event.clientX - pressX);
  const dy = Math.abs(event.clientY - pressY);
  if (dx > 8 || dy > 8) return;
  const el = document.elementFromPoint(event.clientX, event.clientY);
  const shot = el?.closest<HTMLElement>("[data-shot]");
  if (!shot) return;
  openAt(Number(shot.dataset.shot));
}

function step(dir: -1 | 1) {
  const count = props.images.length;
  if (!count) return;
  active.value = (active.value + dir + count) % count;
}

function onKey(event: KeyboardEvent) {
  if (!open.value) return;
  if (event.key === "ArrowRight") step(1);
  if (event.key === "ArrowLeft") step(-1);
}

onMounted(() => window.addEventListener("keydown", onKey));
onUnmounted(() => window.removeEventListener("keydown", onKey));
</script>

<style scoped>
.gallery {
  --serif: "Cormorant Garamond", "Lora", Georgia, serif;
  --sans: "Montserrat", system-ui, sans-serif;
  color: #fff;
  background:
    radial-gradient(
      ellipse at 0% 100%,
      rgba(98, 112, 99, 0.45),
      transparent 42%
    ),
    #141210;
  clip-path: polygon(0 3rem, 100% 0, 100% calc(100% - 3.5rem), 0 100%);
  padding: clamp(4.5rem, 8vw, 6.5rem) 0 clamp(5rem, 8vw, 6.75rem);
}

.gallery__head {
  margin-bottom: 1.25rem;
}

.eyebrow {
  margin: 0 0 0.75rem;
  font-family: var(--sans);
  font-size: 0.72rem;
  font-weight: 600;
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

.gallery h2 {
  margin: 0;
  font-family: var(--serif);
  font-size: clamp(3rem, 6.5vw, 5.4rem);
  font-weight: 500;
  font-style: italic;
  letter-spacing: -0.03em;
  line-height: 0.9;
}

.gallery__track {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  max-width: 100%;
  padding: 0.4rem clamp(1rem, 4vw, 3rem) 0.8rem;
  scroll-snap-type: x proximity;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  cursor: grab;
}

.gallery__track::-webkit-scrollbar {
  display: none;
}

.gallery__track.is-dragging,
.gallery__track.is-coasting {
  cursor: grabbing;
  scroll-snap-type: none;
}

.gallery__track:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: 4px;
}

.shot {
  position: relative;
  flex: 0 0 min(32vw, 20rem);
  height: min(68vh, 540px);
  min-height: 280px;
  padding: 0;
  border: 0;
  overflow: hidden;
  scroll-snap-align: start;
  background: #2c312e;
  color: #fff;
  text-align: left;
  cursor: pointer;
  transition: flex-basis 0.7s cubic-bezier(0.22, 1, 0.36, 1);
}

.shot.is-pinned {
  flex-basis: min(58vw, 42rem);
}

.shot img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 1.15s cubic-bezier(0.22, 1, 0.36, 1);
}

.shot__meta {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  padding: 2.5rem 1rem 1rem;
  background: linear-gradient(to top, rgba(12, 11, 10, 0.78), transparent);
  font-family: var(--sans);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.shot__meta em {
  flex-shrink: 0;
  font-family: var(--serif);
  font-size: 1.35rem;
  font-style: italic;
  font-weight: 500;
  letter-spacing: 0;
  text-transform: none;
  color: var(--gy-gold);
}

.shot__meta span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.shot:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: -4px;
}

.lb {
  --serif: "Cormorant Garamond", "Lora", Georgia, serif;
  --sans: "Montserrat", system-ui, sans-serif;
  position: relative;
  display: grid;
  place-items: center;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  background: #0c0b0a;
  color: #fff;
}

.lb__stage {
  margin: 0;
  width: min(92vw, 1280px);
  height: min(78vh, 820px);
  overflow: hidden;
  background: #141210;
}

.lb__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  transform-origin: center center;
  animation: gallery-ken 16s ease-in-out infinite alternate;
}

.lb__close,
.lb__nav {
  position: absolute;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  cursor: pointer;
  backdrop-filter: blur(12px);
}

.lb__close {
  top: 1rem;
  right: 1rem;
}

.lb__nav--prev {
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
}

.lb__nav--next {
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
}

.lb__close:focus-visible,
.lb__nav:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: 3px;
}

.lb__count {
  position: absolute;
  left: 50%;
  bottom: 1.25rem;
  margin: 0;
  transform: translateX(-50%);
  font-family: var(--sans);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.18em;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@keyframes gallery-ken {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.08);
  }
}

@media (hover: hover) {
  .shot.is-pinned img {
    transform: scale(1.06);
  }
}

@media (max-width: 700px) {
  .gallery {
    clip-path: polygon(0 1.25rem, 100% 0, 100% calc(100% - 1.25rem), 0 100%);
    padding-top: 3.25rem;
    padding-bottom: 3.5rem;
  }

  .shot,
  .shot.is-pinned {
    flex-basis: 84vw;
    height: 70vw;
    min-height: 220px;
  }

  .lb__stage {
    height: min(68vh, 70dvh);
  }

  .lb__nav--prev,
  .lb__nav--next {
    top: auto;
    bottom: 4.25rem;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .shot,
  .shot img,
  .eyebrow::after {
    transition: none;
  }

  .eyebrow::after {
    width: 3.25rem;
  }

  .lb__img {
    animation: none;
  }
}
</style>

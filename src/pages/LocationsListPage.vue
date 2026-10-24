<template>
  <q-page class="dest-luxe home-motion places">
    <SeoHead title="Destinations | Greyon" :description="seoDescription" />

    <section v-spot class="mast" data-sheet="Mast">
      <div ref="mastFrame" class="mast__media">
        <img
          v-if="mastBase"
          class="mast__img"
          :src="mastBase.heroImage"
          alt=""
          :style="mastStyle"
        />
        <div class="mast__veil" />
        <img
          v-if="mastReveal"
          class="mast__lens"
          :src="mastReveal"
          alt=""
          :style="mastStyle"
        />
        <div class="mast__spot" />
      </div>

      <p v-if="mastReveal" class="mast__hint">Move across the photograph</p>

      <div class="dest-wrap mast__content">
        <p v-if="mastBase" v-reveal class="mast__chip">{{ mastBase.name }}</p>
        <p v-reveal class="eyebrow eyebrow--light">Greyon</p>
        <RevealWords tag="h1" text="Destinations" />
        <p v-reveal="{ delay: '140ms' }" class="mast__lead">
          Published places in the Greyon portfolio.
        </p>
        <div
          v-if="locations.length"
          v-reveal="{ delay: '200ms' }"
          class="mast__actions"
        >
          <button
            v-magnetic
            class="gy-btn gy-btn--light"
            type="button"
            @click="scrollToJourney"
          >
            Take the route
          </button>
        </div>
      </div>
      <SectionDivider fill="#1a211e" />
    </section>

    <section
      v-if="locations.length"
      id="dest-journey"
      ref="pinRoot"
      class="journey"
      :class="canPin ? 'is-pin' : 'is-flow'"
      data-sheet="Journey"
      aria-labelledby="journey-title"
    >
      <div ref="stickyEl" class="journey__sticky">
        <header class="journey__head">
          <div>
            <p v-reveal class="eyebrow eyebrow--light">The route</p>
            <h2 id="journey-title" v-reveal="{ delay: '60ms' }">
              Places in view
            </h2>
          </div>
          <nav class="journey__nav" aria-label="Destinations">
            <button
              v-for="(loc, i) in locations"
              :key="loc.id"
              type="button"
              :class="{ 'is-active': activeIndex === i }"
              :aria-current="activeIndex === i ? 'true' : undefined"
              @click="goToPanel(i)"
            >
              <span>{{ pad(i + 1) }}</span>
              {{ loc.name }}
            </button>
          </nav>
        </header>
        <div class="journey__progress" aria-hidden="true">
          <span ref="barEl" />
        </div>
        <div
          ref="railEl"
          class="journey__viewport"
          :tabindex="canPin ? -1 : 0"
          :aria-label="canPin ? undefined : 'Destinations'"
        >
          <div ref="trackEl" class="journey__track">
            <router-link
              v-for="(loc, i) in locations"
              :key="loc.id"
              class="journey__panel glass-edge"
              :class="{ 'is-active': activeIndex === i }"
              :to="`/locations/${loc.slug}`"
            >
              <div class="journey__media">
                <img
                  v-if="loc.heroImage"
                  :src="loc.heroImage"
                  alt=""
                  :loading="i === 0 ? 'eager' : 'lazy'"
                />
              </div>
              <div class="journey__copy">
                <span class="journey__index">{{ pad(i + 1) }}</span>
                <h3>{{ loc.name }}</h3>
                <p v-if="loc.description">{{ loc.description }}</p>
                <span class="text-link"><span>View destination</span></span>
              </div>
            </router-link>
          </div>
        </div>
      </div>
      <div
        class="journey__spacer"
        :style="spacer ? { height: `${spacer}px` } : undefined"
        aria-hidden="true"
      />
      <SectionDivider kind="angle" fill="var(--gy-cream)" />
    </section>

    <section v-else class="state">
      <div class="dest-wrap">
        <p v-if="cms.catalogSyncing">Loading destinations…</p>
        <p v-else-if="cms.catalogError" role="alert">{{ cms.catalogError }}</p>
        <p v-else>No destinations published yet.</p>
      </div>
    </section>

    <section
      v-if="locations.length"
      id="dest-index"
      class="index"
      data-sheet="Index"
      aria-labelledby="index-title"
    >
      <div class="dest-wrap index__head">
        <p v-reveal class="eyebrow">Index</p>
        <h2 id="index-title" v-reveal="{ delay: '60ms' }">Stacked places</h2>
        <p v-reveal="{ delay: '110ms' }" class="section-lead">
          Each published destination, held so the next one covers the last.
        </p>
      </div>
      <div class="dest-wrap index__deck">
        <article
          v-for="(loc, i) in locations"
          :key="loc.id"
          class="index-card glass-edge"
          :style="stackStyle(i)"
        >
          <header class="index-card__bar">
            <span>{{ pad(i + 1) }}</span>
            <strong>{{ loc.name }}</strong>
          </header>
          <div class="index-card__main">
            <div class="index-card__media">
              <img
                v-if="loc.heroImage"
                :src="loc.heroImage"
                :alt="loc.name"
                loading="lazy"
              />
            </div>
            <div class="index-card__body">
              <h3>{{ loc.name }}</h3>
              <p v-if="loc.description">{{ loc.description }}</p>
              <ul v-if="loc.highlights.length" class="index-card__notes">
                <li v-for="item in loc.highlights" :key="item">{{ item }}</li>
              </ul>
              <p v-if="hotelsFor(loc.id).length" class="index-card__stays">
                <router-link
                  v-for="hotel in hotelsFor(loc.id)"
                  :key="hotel.id"
                  :to="`/hotels/${hotel.slug}`"
                >
                  {{ hotel.name }}
                </router-link>
              </p>
              <router-link
                class="gy-btn"
                :to="`/locations/${loc.slug}`"
                :aria-label="`Open ${loc.name}`"
              >
                Open destination
              </router-link>
            </div>
          </div>
        </article>
      </div>
      <div class="dest-wrap index__more">
        <router-link class="gy-btn gy-btn--outline" to="/hotels">
          View hotels
        </router-link>
      </div>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import RevealWords from "@/components/home/RevealWords.vue";
import { useDragScroll } from "@/components/home/useDragScroll";
import { useParallax } from "@/components/home/useParallax";
import SectionDivider from "@/components/hotel/SectionDivider.vue";
import SeoHead from "@/components/SeoHead.vue";
import { useCmsStore } from "@/stores/cms-store";
import type { Hotel } from "@/types/greyon";

const cms = useCmsStore();

const locations = computed(() => cms.publishedLocations);
const canPin = ref(false);
const spacer = ref(0);
const activeIndex = ref(0);

const pinRoot = ref<HTMLElement | null>(null);
const stickyEl = ref<HTMLElement | null>(null);
const railEl = ref<HTMLElement | null>(null);
const trackEl = ref<HTMLElement | null>(null);
const barEl = ref<HTMLElement | null>(null);
const dragTarget = ref<HTMLElement | null>(null);
const mastFrame = ref<HTMLElement | null>(null);

const mastOffset = useParallax(mastFrame, 150);
const mastStyle = computed(() => ({
  transform: `translate3d(0, ${mastOffset.value}px, 0)`
}));

useDragScroll(dragTarget, { momentum: true });

const hotelsByLocation = computed(() => {
  const map = new Map<string, Hotel[]>();
  for (const hotel of cms.publishedHotels) {
    const list = map.get(hotel.locationId) ?? [];
    list.push(hotel);
    map.set(hotel.locationId, list);
  }
  return map;
});

const mastBase = computed(
  () => locations.value.find(loc => loc.heroImage.trim()) ?? null
);

const mastReveal = computed(() => {
  const base = mastBase.value;
  if (!base) return "";
  const hero = base.heroImage.trim();
  const fromGallery = base.gallery.find(
    src => src.trim() && src.trim() !== hero
  );
  if (fromGallery) return fromGallery.trim();
  const other = locations.value.find(
    loc => loc.id !== base.id && loc.heroImage.trim()
  );
  return other?.heroImage.trim() ?? "";
});

const seoDescription = computed(() => {
  const names = locations.value.map(loc => loc.name).filter(Boolean);
  return names.length
    ? `Explore Greyon destinations: ${names.join(", ")}.`
    : "Explore Greyon destinations.";
});

function hotelsFor(id: string) {
  return hotelsByLocation.value.get(id) ?? [];
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function stackStyle(index: number) {
  const capped = Math.min(index, 3);
  return {
    top: `calc(var(--header-offset) + ${capped} * var(--stack-step))`,
    zIndex: index + 1
  };
}

function headerOffset() {
  const header = document.querySelector(".gy-header");
  if (header instanceof HTMLElement)
    return header.getBoundingClientRect().height;
  return 88;
}

function syncPinMode() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wide = window.matchMedia("(min-width: 900px)").matches;
  canPin.value = wide && !reduce && locations.value.length > 1;
}

function syncDrag() {
  dragTarget.value = canPin.value ? null : railEl.value;
}

function paintProgress(progress: number, shiftPx: number) {
  const track = trackEl.value;
  if (track) {
    track.style.transform = canPin.value
      ? `translate3d(${(-shiftPx).toFixed(2)}px, 0, 0)`
      : "";
  }
  if (barEl.value) {
    const count = Math.max(locations.value.length, 1);
    barEl.value.style.transform = `scaleX(${Math.max(progress, 1 / count)})`;
  }
  const count = locations.value.length;
  const next =
    count <= 1 ? 0 : Math.min(count - 1, Math.round(progress * (count - 1)));
  if (activeIndex.value !== next) activeIndex.value = next;
}

function onScroll() {
  const root = pinRoot.value;
  const view = railEl.value;
  const track = trackEl.value;
  if (!canPin.value || !root || !view || !track) return;
  const distance = Math.max(0, track.scrollWidth - view.clientWidth);
  const scrolled = Math.min(
    Math.max(headerOffset() - root.getBoundingClientRect().top, 0),
    distance
  );
  const progress = distance > 0 ? scrolled / distance : 0;
  paintProgress(progress, distance * progress);
}

function onRailScroll() {
  if (canPin.value) return;
  const view = railEl.value;
  if (!view) return;
  const max = view.scrollWidth - view.clientWidth;
  const progress = max > 0 ? view.scrollLeft / max : 0;
  paintProgress(progress, 0);
}

let ticking = false;
function requestScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    onScroll();
  });
}

function layoutPin() {
  syncPinMode();
  syncDrag();
  const view = railEl.value;
  const track = trackEl.value;
  if (!view || !track || !canPin.value) {
    spacer.value = 0;
    paintProgress(0, 0);
    if (!canPin.value) onRailScroll();
    return;
  }
  const distance = Math.max(0, track.scrollWidth - view.clientWidth);
  if (Math.abs(spacer.value - distance) > 1) spacer.value = distance;
  onScroll();
}

async function scheduleLayout() {
  syncPinMode();
  await nextTick();
  requestAnimationFrame(layoutPin);
}

function onResize() {
  void scheduleLayout();
}

function scrollToJourney() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("dest-journey")?.scrollIntoView({
    behavior: reduce ? "auto" : "smooth",
    block: "start"
  });
}

function goToPanel(index: number) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = pinRoot.value;
  const track = trackEl.value;
  const view = railEl.value;
  if (!root || !track || !view) return;
  if (!canPin.value) {
    const panel = track.children.item(index);
    if (panel instanceof HTMLElement) {
      panel.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        inline: "start",
        block: "nearest"
      });
    }
    return;
  }
  const distance = Math.max(0, track.scrollWidth - view.clientWidth);
  const count = locations.value.length;
  const portion = count <= 1 ? 0 : index / (count - 1);
  const top =
    window.scrollY +
    root.getBoundingClientRect().top -
    headerOffset() +
    distance * portion;
  window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
}

let wideQuery: MediaQueryList | null = null;
let reduceQuery: MediaQueryList | null = null;
let resizeObserver: ResizeObserver | null = null;

function observeRails() {
  resizeObserver?.disconnect();
  if (railEl.value) resizeObserver?.observe(railEl.value);
  if (trackEl.value) resizeObserver?.observe(trackEl.value);
}

watch(
  () => locations.value.map(loc => loc.id).join("|"),
  () => {
    void scheduleLayout();
  }
);

watch(
  railEl,
  (node, prev) => {
    prev?.removeEventListener("scroll", onRailScroll);
    node?.addEventListener("scroll", onRailScroll, { passive: true });
    syncDrag();
    observeRails();
  },
  { flush: "post" }
);

onMounted(() => {
  wideQuery = window.matchMedia("(min-width: 900px)");
  reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  wideQuery.addEventListener("change", onResize);
  reduceQuery.addEventListener("change", onResize);
  window.addEventListener("scroll", requestScroll, { passive: true });
  window.addEventListener("resize", onResize);
  resizeObserver = new ResizeObserver(() => layoutPin());
  observeRails();
  void scheduleLayout();
});

onUnmounted(() => {
  window.removeEventListener("scroll", requestScroll);
  window.removeEventListener("resize", onResize);
  wideQuery?.removeEventListener("change", onResize);
  reduceQuery?.removeEventListener("change", onResize);
  railEl.value?.removeEventListener("scroll", onRailScroll);
  resizeObserver?.disconnect();
});
</script>

<style src="@/components/home/home-motion.css"></style>
<style src="./destination-luxe.css"></style>

<style scoped>
.mast {
  --spot-x: 70%;
  --spot-y: 36%;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: min(84svh, 52rem);
  color: #fff;
  background: #161311;
  isolation: isolate;
}

.mast__media,
.mast__veil,
.mast__spot {
  position: absolute;
  inset: 0;
}

.mast__media {
  overflow: hidden;
  pointer-events: none;
}

.mast__img,
.mast__lens {
  position: absolute;
  left: 0;
  width: 100%;
  height: 125%;
  object-fit: cover;
  object-position: center 30%;
}

.mast__veil {
  z-index: 1;
  background:
    linear-gradient(
      100deg,
      rgba(18, 28, 24, 0.62) 0%,
      rgba(12, 11, 10, 0.08) 46%,
      rgba(12, 11, 10, 0.28) 100%
    ),
    linear-gradient(
      180deg,
      rgba(12, 11, 10, 0.12) 0%,
      rgba(12, 11, 10, 0.05) 40%,
      rgba(12, 11, 10, 0.78) 100%
    );
}

.mast__lens {
  z-index: 2;
  opacity: 0;
  transition: opacity 0.35s ease;
  -webkit-mask-image: radial-gradient(
    circle 12rem at var(--spot-x) var(--spot-y),
    #000 58%,
    transparent 74%
  );
  mask-image: radial-gradient(
    circle 12rem at var(--spot-x) var(--spot-y),
    #000 58%,
    transparent 74%
  );
}

.mast__spot {
  z-index: 3;
  background: radial-gradient(
    circle 13rem at var(--spot-x) var(--spot-y),
    rgba(196, 163, 90, 0.5),
    transparent 68%
  );
  mix-blend-mode: soft-light;
  opacity: 0;
  transition: opacity 0.35s ease;
}

.mast__hint {
  position: absolute;
  top: 1.2rem;
  right: max(1.25rem, calc((100% - 1240px) / 2));
  z-index: 4;
  margin: 0;
  font-family: var(--font-display);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.82);
}

.mast__content {
  position: relative;
  z-index: 4;
  padding: clamp(3rem, 9vh, 5.5rem) 0 clamp(1.4rem, 4vh, 2.4rem);
}

.mast__chip {
  margin: 0 0 0.9rem;
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--gy-gold);
}

.places :deep(h1) {
  max-width: 8em;
  margin: 0;
  font-size: clamp(2.5rem, 7.48vw, 5.85rem);
  line-height: 1;
}

.mast__lead {
  max-width: 28rem;
  margin: 1rem 0 0;
  font-family: var(--font-body);
  font-size: 1.02rem;
  font-weight: 500;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);
}

.mast__actions {
  margin-top: 1.4rem;
}

.mast :deep(.section-divider) {
  position: relative;
  z-index: 4;
}

.journey {
  position: relative;
  color: #fff;
  background:
    radial-gradient(ellipse at 0% 0%, rgba(196, 163, 90, 0.2), transparent 42%),
    linear-gradient(165deg, #1a211e 0%, #24302a 58%, #3a3228 100%);
}

.journey__sticky {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.15rem 0 1.2rem;
}

.journey.is-pin .journey__sticky {
  position: sticky;
  top: var(--header-offset);
  height: calc(100svh - var(--header-offset));
}

.journey.is-flow .journey__sticky {
  position: relative;
  height: auto;
}

.journey__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem 1.5rem;
  width: min(1240px, calc(100% - 2.5rem));
  margin-inline: auto;
}

.journey h2 {
  margin: 0;
  font-size: clamp(2.6rem, 5vw, 4.4rem);
  line-height: 1;
}

.journey__nav {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.4rem;
  max-width: 42rem;
}

.journey__nav button {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 44px;
  padding: 0.35rem 0.85rem;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.86);
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  cursor: pointer;
}

.journey__nav button span {
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: -0.02em;
  text-transform: none;
}

.journey__nav button.is-active {
  background: var(--gy-gold);
  color: #1a211e;
}

.journey__nav button:focus-visible,
.journey__panel:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: 3px;
}

.journey__progress {
  width: min(1240px, calc(100% - 2.5rem));
  height: 2px;
  margin-inline: auto;
  background: rgba(255, 255, 255, 0.16);
}

.journey__progress span {
  display: block;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, var(--gy-gold), #d7e0d4);
  transform: scaleX(0.2);
  transform-origin: left center;
}

.journey__viewport {
  flex: 1;
  min-height: 0;
}

.journey.is-pin .journey__viewport {
  overflow: hidden;
  touch-action: pan-y;
}

.journey.is-flow .journey__viewport {
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-padding-inline: max(1.25rem, calc((100% - 1240px) / 2));
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  cursor: grab;
  touch-action: pan-x;
}

.journey.is-flow .journey__viewport::-webkit-scrollbar {
  display: none;
}

.journey__viewport.is-dragging,
.journey__viewport.is-coasting {
  cursor: grabbing;
  scroll-snap-type: none;
}

.journey__track {
  display: flex;
  gap: 1rem;
  height: 100%;
  padding-inline: max(1.25rem, calc((100% - 1240px) / 2));
}

.journey.is-pin .journey__track {
  will-change: transform;
}

.journey.is-flow .journey__track {
  width: max-content;
  height: auto;
  padding-bottom: 0.35rem;
}

.journey__panel {
  display: grid;
  min-width: 0;
  overflow: hidden;
  border-radius: 28px;
  background: #1c2420;
  color: #fff;
  text-decoration: none;
  box-shadow: 0 24px 50px rgba(0, 0, 0, 0.22);
}

.journey.is-pin .journey__panel {
  flex: 0 0 min(76vw, 1040px);
  grid-template-columns: 1.28fr 0.9fr;
  height: 100%;
  opacity: 0.72;
  transition: opacity 0.45s ease;
}

.journey.is-pin .journey__panel.is-active {
  opacity: 1;
}

.journey.is-flow .journey__panel {
  flex: 0 0 min(86vw, 34rem);
  grid-template-columns: 1fr;
  grid-template-rows: minmax(16rem, 52vw) auto;
  min-height: min(70svh, 36rem);
  scroll-snap-align: start;
}

.journey__media {
  position: relative;
  min-height: 0;
  background:
    radial-gradient(
      circle at 30% 20%,
      rgba(196, 163, 90, 0.45),
      transparent 42%
    ),
    linear-gradient(160deg, var(--gy-forest), #1c2420 70%);
}

.journey__media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.journey__copy {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.65rem;
  min-width: 0;
  padding: clamp(1.1rem, 2vw, 1.8rem);
  background:
    linear-gradient(180deg, rgba(196, 163, 90, 0.16), transparent 32%),
    rgba(18, 24, 21, 0.78);
}

.journey__index {
  font-family: var(--font-display);
  font-weight: 800;
  letter-spacing: -0.035em;
  font-size: clamp(2.69rem, 6vw, 4.62rem);
  line-height: 1;
  color: var(--gy-gold);
}

.journey__copy h3 {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(2.6rem, 4vw, 4.4rem);
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1;
}

.journey__copy p {
  margin: 0;
  max-width: 28rem;
  font-family: var(--font-body);
  font-size: 0.98rem;
  font-weight: 500;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.86);
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.journey__copy .text-link {
  margin-top: 0.35rem;
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.journey__panel:hover .text-link::after,
.journey__panel:focus-visible .text-link::after {
  transform: scaleX(1);
}

.journey__panel:hover .text-link span,
.journey__panel:focus-visible .text-link span {
  transform: translateX(12px);
}

.state {
  padding: clamp(3rem, 8vw, 5rem) 0;
  color: var(--gy-muted);
  font-family: var(--font-display);
}

.index {
  position: relative;
  z-index: 1;
  padding: clamp(1.5rem, 4vw, 2.5rem) 0 clamp(4rem, 8vw, 6rem);
}

.index h2 {
  margin: 0;
  font-size: clamp(2.35rem, 6vw, 4.2rem);
  line-height: 1;
}

.index__head {
  margin-bottom: clamp(1.4rem, 3vw, 2.2rem);
}

.index__deck {
  display: grid;
  gap: 1rem;
}

.index-card {
  position: sticky;
  overflow: hidden;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 28px 60px rgba(22, 21, 19, 0.14);
}

.index-card__bar {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  height: var(--stack-step);
  padding: 0 1.15rem;
  background: linear-gradient(
    90deg,
    rgba(196, 163, 90, 0.28),
    rgba(98, 112, 99, 0.18) 46%,
    rgba(255, 255, 255, 0.55)
  );
  border-bottom: 1px solid rgba(196, 163, 90, 0.35);
}

.index-card__bar span,
.index-card__bar strong {
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.index-card__bar span {
  color: var(--gy-gold-deep);
  font-size: 1.35rem;
}

.index-card__bar strong {
  min-width: 0;
  overflow: hidden;
  font-size: clamp(1.35rem, 2vw, 1.85rem);
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.index-card__main {
  display: grid;
  grid-template-columns: minmax(0, 0.86fr) minmax(0, 1.14fr);
  min-height: min(42vh, 24rem);
}

.index-card__media {
  min-height: 16rem;
  background:
    linear-gradient(160deg, rgba(196, 163, 90, 0.35), transparent 46%), #2a3330;
}

.index-card__media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.index-card__body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
  min-width: 0;
  padding: clamp(1.1rem, 2vw, 1.8rem);
  overflow: auto;
}

.index-card__body h3 {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(2.4rem, 4vw, 3.8rem);
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1;
}

.index-card__body p {
  margin: 0;
  font-family: var(--font-body);
  font-size: 0.98rem;
  font-weight: 500;
  line-height: 1.6;
  color: var(--gy-muted);
}

.index-card__body .gy-btn {
  max-width: 100%;
  white-space: normal;
  text-align: center;
}

.index-card__notes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem 0.85rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.index-card__notes li {
  font-family: var(--font-display);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
}

.index-card__stays {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 0.8rem;
}

.index-card__stays a {
  color: var(--gy-forest);
  font-family: var(--font-display);
  font-size: 0.82rem;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 0.16em;
  overflow-wrap: anywhere;
}

.index__more {
  margin-top: clamp(1.8rem, 4vw, 2.6rem);
}

@media (hover: hover) and (prefers-reduced-motion: no-preference) {
  .mast:hover .mast__lens,
  .mast:focus-within .mast__lens,
  .mast:hover .mast__spot,
  .mast:focus-within .mast__spot {
    opacity: 1;
  }
}

@media (max-width: 899px) {
  .journey__head {
    flex-direction: column;
    align-items: flex-start;
    width: min(1240px, calc(100% - 1.5rem));
  }

  .journey__nav {
    width: 100%;
    flex-wrap: nowrap;
    justify-content: flex-start;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .journey__nav::-webkit-scrollbar {
    display: none;
  }

  .journey__nav button {
    flex: 0 0 auto;
  }

  .journey__progress,
  .journey__track {
    width: min(1240px, calc(100% - 1.5rem));
  }

  .journey__track {
    padding-inline: 0;
    margin-inline: auto;
  }

  .journey.is-flow .journey__viewport {
    scroll-padding-inline: 0.75rem;
  }

  .journey.is-flow .journey__track {
    width: max-content;
    padding-inline: 0.75rem;
    margin-inline: 0;
  }
}

@media (max-width: 720px) {
  .index-card__main {
    grid-template-columns: 1fr;
    min-height: 0;
  }

  .index-card__media {
    aspect-ratio: 16 / 10;
    min-height: 0;
    max-height: 14rem;
  }

  .places :deep(h1) {
    font-size: clamp(2.6rem, 9.28vw, 3.86rem);
  }
}

@media (hover: none), (prefers-reduced-motion: reduce) {
  .mast__hint {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mast__img,
  .mast__lens,
  .journey.is-pin .journey__panel,
  .journey__progress span {
    transition: none;
    animation: none;
  }

  .mast__img,
  .mast__lens {
    height: 100%;
    transform: none !important;
  }

  .mast__lens {
    display: none;
  }

  .journey.is-pin .journey__panel {
    opacity: 1;
  }
}
</style>

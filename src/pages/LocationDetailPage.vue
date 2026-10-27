<template>
  <q-page v-if="location" class="dest-luxe home-motion detail">
    <SeoHead
      :title="`${location.name} | Greyon`"
      :description="description || location.name"
      :image="heroImage || undefined"
    />

    <section class="hero" data-sheet="Hero">
      <div class="hero__media">
        <img v-if="heroImage" class="hero__img" :src="heroImage" alt="" />
        <div class="hero__veil" />
      </div>
      <div class="dest-wrap hero__content">
        <p v-reveal class="eyebrow eyebrow--light">Destination</p>
        <RevealWords tag="h1" :text="location.name" />
        <div v-reveal class="hero__actions">
          <button class="gy-btn gy-btn--light" type="button" @click="bookHere">
            Book in {{ location.name }}
          </button>
          <button
            v-if="hotelsHere.length"
            class="gy-btn gy-btn--ghost"
            type="button"
            @click="scrollToId('dest-hotels')"
          >
            See hotels
          </button>
        </div>
      </div>
      <SectionDivider :fill="heroEdge" />
    </section>

    <section
      v-if="description || portraitImage"
      id="dest-story"
      class="story"
      data-sheet="Story"
      :aria-labelledby="description ? 'story-title' : undefined"
    >
      <div class="dest-wrap story__grid">
        <div v-if="description" class="story__copy">
          <p v-reveal class="eyebrow">The place</p>
          <h2 id="story-title" v-reveal class="story__body">
            {{ description }}
          </h2>
          <div v-reveal class="story__actions">
            <router-link class="gy-btn gy-btn--outline" to="/locations">
              All destinations
            </router-link>
          </div>
        </div>
        <figure v-if="portraitImage" class="portrait dest-tilt">
          <div class="portrait__frame">
            <img :src="portraitImage" :alt="location.name" />
          </div>
        </figure>
      </div>
      <SectionDivider v-if="highlights.length" fill="#1a211e" />
      <SectionDivider
        v-else-if="!gallery.length"
        kind="angle"
        fill="var(--gy-white)"
      />
    </section>

    <section
      v-if="highlights.length"
      id="dest-highlights"
      class="highlights"
      data-sheet="Highlights"
      aria-labelledby="highlights-title"
    >
      <div class="marquee is-static" :aria-label="highlights.join(', ')">
        <div class="marquee__track">
          <span v-for="item in highlights" :key="item" class="marquee__item">
            <em>{{ item }}</em>
            <span class="marquee__mark" />
          </span>
        </div>
      </div>
      <div class="dest-wrap highlights__copy">
        <p v-reveal class="eyebrow eyebrow--light">Notes</p>
        <h2 id="highlights-title" v-reveal>Highlights</h2>
      </div>
      <SectionDivider
        kind="angle"
        :fill="gallery.length ? 'var(--gy-cream)' : 'var(--gy-white)'"
      />
    </section>

    <section
      v-if="gallery.length"
      id="dest-gallery"
      class="gallery"
      data-sheet="Gallery"
      aria-labelledby="gallery-title"
    >
      <div class="dest-wrap gallery__head">
        <p v-reveal class="eyebrow">Photographs</p>
        <h2 id="gallery-title" v-reveal>In the frame</h2>
        <p v-reveal class="section-lead">
          Gallery images published for {{ location.name }}.
        </p>
      </div>
      <div class="dest-wrap gallery__stack">
        <article
          v-for="(src, index) in gallery"
          :key="`${index}-${src}`"
          class="photo-card"
          :style="photoStyle(index)"
        >
          <div class="photo-card__frame">
            <img
              :src="src"
              :alt="`${location.name} photograph ${index + 1}`"
              loading="lazy"
            />
            <p class="photo-card__meta">
              <span>{{ pad(index + 1) }}</span>
              <span>{{ location.name }}</span>
            </p>
          </div>
        </article>
      </div>
      <SectionDivider kind="angle" fill="var(--gy-white)" />
    </section>

    <section
      id="dest-hotels"
      class="stays"
      data-sheet="Stays"
      aria-labelledby="stays-title"
    >
      <div
        class="dest-wrap stays__grid"
        :class="{ 'is-empty': !hotelsHere.length }"
      >
        <div class="stays__intro">
          <p v-reveal class="eyebrow">Stay</p>
          <h2 id="stays-title" v-reveal> Greyon hotels here </h2>
          <p v-reveal class="section-lead">
            <template v-if="hotelsHere.length">
              Published properties in {{ location.name }}.
            </template>
            <template v-else>
              Hotels for this destination will appear once published.
            </template>
          </p>
        </div>
        <div v-if="hotelsHere.length" class="stays__cards">
          <div
            v-for="hotel in hotelsHere"
            :key="hotel.id"
            class="stays__tilt dest-tilt"
          >
            <HotelCard live :hotel="hotel" />
          </div>
        </div>
      </div>
      <SectionDivider v-if="hasVisit" fill="var(--gy-cream)" />
      <SectionDivider v-else-if="others.length" fill="#1a211e" />
    </section>

    <section
      v-if="hasVisit"
      id="dest-visit"
      class="visit"
      data-sheet="Visit"
      aria-labelledby="visit-title"
    >
      <div class="dest-wrap">
        <p v-reveal class="eyebrow">Visit</p>
        <h2 id="visit-title" v-reveal>
          {{ hasContact ? "Contact" : "Map" }}
        </h2>
        <p v-reveal class="section-lead">
          Reach the Greyon team for this destination.
        </p>
        <div v-if="hasContact" class="visit__grid">
          <article v-if="phone" class="visit-card dest-tilt glass-edge">
            <span>Phone</span>
            <a :href="`tel:${phone}`">{{ phone }}</a>
          </article>
          <article v-if="email" class="visit-card dest-tilt glass-edge">
            <span>Email</span>
            <a :href="`mailto:${email}`">{{ email }}</a>
          </article>
        </div>
        <div v-if="hasMap" class="visit__map glass-edge">
          <h3>Map</h3>
          <MapEmbed
            :lat="mapPoint?.lat ?? 0"
            :lng="mapPoint?.lng ?? 0"
            :embed-url="mapEmbedUrl"
          />
        </div>
      </div>
      <SectionDivider v-if="others.length" fill="#1a211e" />
    </section>

    <section
      v-if="others.length"
      id="dest-elsewhere"
      class="elsewhere"
      data-sheet="Elsewhere"
      aria-labelledby="elsewhere-title"
    >
      <div class="dest-wrap elsewhere__head">
        <p v-reveal class="eyebrow eyebrow--light">Continue</p>
        <h2 id="elsewhere-title" v-reveal> Other destinations </h2>
      </div>
      <div
        ref="elseRail"
        class="else-rail"
        tabindex="0"
        aria-label="Other destinations"
      >
        <article
          v-for="loc in others"
          :key="loc.id"
          class="else-card dest-tilt"
        >
          <router-link :to="`/locations/${loc.slug}`">
            <span class="else-card__media">
              <img
                v-if="loc.heroImage"
                :src="loc.heroImage"
                alt=""
                loading="lazy"
              />
            </span>
            <span class="else-card__name">{{ loc.name }}</span>
            <span v-if="loc.description" class="else-card__desc">{{
              loc.description
            }}</span>
          </router-link>
        </article>
      </div>
    </section>
  </q-page>

  <q-page v-else class="dest-luxe home-motion dest-missing">
    <SeoHead
      :title="
        cms.catalogSyncing
          ? 'Destination | Greyon'
          : 'Destination not found | Greyon'
      "
      description="Greyon destination"
    />
    <div class="dest-wrap">
      <p class="eyebrow">Destination</p>
      <h1>{{ cms.catalogSyncing ? "Loading" : "Not found" }}</h1>
      <p v-if="cms.catalogSyncing">Loading destination…</p>
      <p v-else-if="cms.catalogError" role="alert">{{ cms.catalogError }}</p>
      <p v-else>This destination is not published.</p>
      <router-link class="gy-btn" to="/locations">All destinations</router-link>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import RevealWords from "@/components/home/RevealWords.vue";
import { useDragScroll } from "@/components/home/useDragScroll";
import SectionDivider from "@/components/hotel/SectionDivider.vue";
import HotelCard from "@/components/HotelCard.vue";
import MapEmbed from "@/components/MapEmbed.vue";
import SeoHead from "@/components/SeoHead.vue";
import { useBookingStore } from "@/stores/booking-store";
import { useCmsStore } from "@/stores/cms-store";

const route = useRoute();
const router = useRouter();
const booking = useBookingStore();
const cms = useCmsStore();

const elseRail = ref<HTMLElement | null>(null);
useDragScroll(elseRail, { momentum: true });

const location = computed(() =>
  cms.getLocationBySlug(String(route.params.slug))
);

const description = computed(() => location.value?.description.trim() ?? "");
const heroImage = computed(() => location.value?.heroImage.trim() ?? "");
const gallery = computed(() =>
  (location.value?.gallery ?? []).map(src => src.trim()).filter(Boolean)
);
const highlights = computed(() =>
  (location.value?.highlights ?? []).map(item => item.trim()).filter(Boolean)
);
const portraitImage = computed(
  () => gallery.value.find(src => src !== heroImage.value) || ""
);
const phone = computed(() => location.value?.phone?.trim() ?? "");
const email = computed(() => location.value?.email?.trim() ?? "");
const hasContact = computed(() => Boolean(phone.value || email.value));

const hotelsHere = computed(() =>
  location.value
    ? cms.publishedHotels.filter(
        hotel => hotel.locationId === location.value?.id
      )
    : []
);

const mapPoint = computed(() => {
  const point = hotelsHere.value[0]?.coordinates;
  if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lng)) {
    return null;
  }
  if (point.lat === 0 && point.lng === 0) return null;
  return point;
});
const mapEmbedUrl = computed(() => hotelsHere.value[0]?.mapEmbedUrl ?? null);
const hasMap = computed(() => Boolean(mapPoint.value || mapEmbedUrl.value));
const hasVisit = computed(() => hasContact.value || hasMap.value);

const others = computed(() =>
  cms.publishedLocations.filter(loc => loc.id !== location.value?.id)
);

const heroEdge = computed(() => {
  if (description.value || portraitImage.value) return "var(--gy-cream)";
  if (highlights.value.length) return "#1a211e";
  if (gallery.value.length) return "var(--gy-cream)";
  return "var(--gy-white)";
});

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function photoStyle(index: number) {
  return { zIndex: index + 1 };
}

function scrollToId(id: string) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(id)?.scrollIntoView({
    behavior: reduce ? "auto" : "smooth",
    block: "start"
  });
}

function bookHere() {
  if (!location.value) return;
  booking.setSearch({
    locationSlug: location.value.slug,
    hotelSlug: ""
  });
  void router.push({ name: "booking" });
}
</script>

<style src="@/components/home/home-motion.css"></style>
<style src="./destination-luxe.css"></style>

<style scoped>
.hero {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: min(86svh, 52rem);
  color: #fff;
  background: #161311;
  isolation: isolate;
}

.hero__media,
.hero__veil {
  position: absolute;
  inset: 0;
}

.hero__media {
  overflow: hidden;
  pointer-events: none;
}

.hero__img {
  position: absolute;
  left: 0;
  width: 100%;
  height: 128%;
  object-fit: cover;
  object-position: center 32%;
}

.hero__veil {
  z-index: 1;
  background:
    linear-gradient(
      105deg,
      rgba(16, 22, 19, 0.66) 0%,
      rgba(12, 11, 10, 0.08) 48%,
      rgba(12, 11, 10, 0.3) 100%
    ),
    linear-gradient(
      180deg,
      rgba(12, 11, 10, 0.18) 0%,
      rgba(12, 11, 10, 0.04) 42%,
      rgba(12, 11, 10, 0.78) 100%
    );
}

.hero__content {
  position: relative;
  z-index: 4;
  padding: clamp(3rem, 10vh, 6rem) 0 clamp(1.5rem, 4vh, 2.6rem);
}

.detail :deep(h1) {
  max-width: 9em;
  margin: 0;
  font-size: var(--gy-text-display);
  line-height: 1;
  overflow-wrap: break-word;
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
  margin-top: 1.5rem;
}

.hero :deep(.section-divider) {
  position: relative;
  z-index: 4;
}

.story {
  position: relative;
  z-index: 2;
  padding: clamp(2.4rem, 6vw, 4.5rem) 0 clamp(3rem, 7vw, 5rem);
}

.story__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(0, 0.92fr);
  gap: clamp(1.4rem, 4vw, 3.5rem);
  align-items: center;
}

.story__body {
  margin: 0;
  max-width: 12em;
  font-size: var(--gy-text-4xl);
  line-height: 0.98;
}

.story__actions {
  margin-top: 1.6rem;
}

.portrait {
  margin: -4.5rem 0 0;
  padding: 0.7rem;
  background: linear-gradient(
    145deg,
    rgba(196, 163, 90, 0.95),
    rgba(98, 112, 99, 0.9) 58%,
    rgba(255, 255, 255, 0.45)
  );
  box-shadow: 0 28px 60px rgba(22, 21, 19, 0.18);
}

.portrait__frame {
  overflow: hidden;
  aspect-ratio: 3 / 4;
  background: #2c312e;
}

.portrait__frame img {
  width: 100%;
  height: 130%;
  object-fit: cover;
}

.highlights {
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
      rgba(98, 112, 99, 0.7),
      transparent 48%
    ),
    linear-gradient(155deg, #1a211e 0%, #2c312e 50%, #3a3228 100%);
  overflow: hidden;
}

.marquee {
  overflow: hidden;
  margin-bottom: clamp(1.6rem, 4vw, 2.6rem);
  padding-top: clamp(2.2rem, 5vw, 3.4rem);
  -webkit-mask-image: linear-gradient(
    90deg,
    transparent,
    #000 8%,
    #000 92%,
    transparent
  );
  mask-image: linear-gradient(
    90deg,
    transparent,
    #000 8%,
    #000 92%,
    transparent
  );
}

.marquee__track {
  display: flex;
  width: max-content;
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
  font-size: var(--gy-text-4xl);
  font-weight: 600;
  letter-spacing: normal;
  line-height: 1;
  white-space: nowrap;
}

.marquee__item:hover em {
  color: var(--gy-gold);
}

.marquee__mark {
  width: 0.48rem;
  height: 0.48rem;
  background: linear-gradient(135deg, var(--gy-gold), #d5dece);
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

.highlights h2 {
  margin: 0;
  font-size: var(--gy-text-4xl);
  line-height: 1;
}

.highlights__copy {
  position: relative;
  z-index: 1;
  padding-bottom: clamp(2.4rem, 6vw, 4rem);
}

.gallery {
  padding: clamp(2rem, 5vw, 3.5rem) 0 0.5rem;
}

.gallery h2,
.stays h2,
.visit h2,
.elsewhere h2 {
  margin: 0;
  font-size: var(--gy-text-4xl);
  line-height: 1;
}

.gallery__head,
.elsewhere__head {
  margin-bottom: clamp(1.2rem, 3vw, 2rem);
}

.gallery__stack {
  display: grid;
}

.photo-card {
  position: relative;
  height: min(70vh, 640px);
  margin-bottom: 1.25rem;
  padding: 0.55rem;
  border-radius: 28px;
  background: linear-gradient(
    145deg,
    rgba(196, 163, 90, 0.95),
    rgba(98, 112, 99, 0.88) 55%,
    rgba(255, 255, 255, 0.5)
  );
  box-shadow: 0 30px 70px rgba(22, 21, 19, 0.18);
}

.photo-card__frame {
  position: relative;
  height: 100%;
  overflow: hidden;
  border-radius: 22px;
  background:
    radial-gradient(
      circle at 30% 20%,
      rgba(196, 163, 90, 0.4),
      transparent 42%
    ),
    #24302a;
}

.photo-card img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-card__meta {
  position: absolute;
  left: 0.9rem;
  bottom: 0.9rem;
  display: flex;
  gap: 0.7rem;
  align-items: baseline;
  margin: 0;
  padding: 0.5rem 0.85rem;
  border-radius: 999px;
  background: rgba(22, 21, 19, 0.55);
  color: #fff;
  backdrop-filter: blur(12px);
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.stays {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  padding: clamp(2.5rem, 6vw, 4.5rem) 0 clamp(3rem, 7vw, 5rem);
  background: var(--gy-white);
}

.stays__grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 0.82fr) minmax(0, 1.18fr);
  gap: clamp(1.2rem, 3vw, 2.4rem);
  align-items: start;
}

.stays__grid.is-empty {
  grid-template-columns: minmax(0, 40rem);
}

.stays__cards {
  display: grid;
  gap: 1.1rem;
}

.stays__tilt {
  height: 100%;
}

.visit {
  padding: clamp(2.2rem, 5vw, 4rem) 0 clamp(3rem, 7vw, 5rem);
}

.visit__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 28rem));
  gap: 1rem;
  margin-top: 1.4rem;
}

.visit-card {
  display: grid;
  gap: 0.45rem;
  align-content: end;
  min-height: 11rem;
  padding: 1.25rem 1.3rem;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 18px 44px rgba(22, 21, 19, 0.08);
  backdrop-filter: blur(14px);
}

.visit-card span {
  font-family: var(--font-display);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
}

.visit-card a {
  font-family: var(--font-display);
  font-size: var(--gy-text-3xl);
  font-weight: 600;
  letter-spacing: normal;
  line-height: 1.05;
  color: var(--gy-ink);
  text-decoration: underline;
  text-underline-offset: 0.12em;
  overflow-wrap: anywhere;
}

.visit__map {
  margin-top: 1.3rem;
  padding: 1rem 1rem 1.15rem;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 22px 50px rgba(22, 21, 19, 0.08);
}

.visit__map h3 {
  margin: 0 0 0.75rem;
  font-family: var(--font-display);
  font-size: var(--gy-text-3xl);
  font-weight: 600;
  letter-spacing: normal;
}

.visit__map :deep(.map-embed) {
  padding: 0;
}

.visit__map :deep(.map-embed__frame) {
  min-height: 320px;
  border-radius: 16px;
}

.elsewhere {
  padding: clamp(2rem, 5vw, 3.5rem) 0 clamp(3.5rem, 8vw, 5.5rem);
  color: #fff;
  background:
    radial-gradient(
      ellipse at 100% 0%,
      rgba(196, 163, 90, 0.22),
      transparent 40%
    ),
    linear-gradient(165deg, #1a211e, #24302a 60%, #3a3228);
  overflow: hidden;
}

.else-rail {
  display: flex;
  gap: 0.9rem;
  padding: 0.85rem max(1.25rem, calc((100% - 1240px) / 2)) 1.2rem;
  overflow-x: auto;
  scroll-snap-type: x proximity;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  cursor: grab;
}

.else-rail::-webkit-scrollbar {
  display: none;
}

.else-rail:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: -4px;
}

.else-rail.is-dragging,
.else-rail.is-coasting {
  cursor: grabbing;
  scroll-snap-type: none;
}

.else-card {
  flex: 0 0 min(78vw, 24rem);
  scroll-snap-align: start;
}

.else-card a {
  display: grid;
  overflow: hidden;
  border-radius: 24px;
  background: #1c2420;
  color: #fff;
  text-decoration: none;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.22);
}

.else-card a:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: 3px;
}

.else-card__media {
  display: block;
  aspect-ratio: 16 / 11;
  background:
    linear-gradient(160deg, rgba(196, 163, 90, 0.4), transparent 42%), #24302a;
}

.else-card__media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.else-card__name,
.else-card__desc {
  display: block;
  padding-inline: 1rem;
}

.else-card__name {
  padding-top: 0.9rem;
  font-family: var(--font-display);
  font-size: var(--gy-text-2xl);
  font-weight: 600;
  letter-spacing: normal;
  line-height: 1.05;
}

.else-card__desc {
  padding-top: 0.45rem;
  padding-bottom: 1rem;
  font-family: var(--font-body);
  font-size: 0.88rem;
  font-weight: 400;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.78);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dest-missing {
  padding: clamp(4.5rem, 14vh, 8rem) 0 clamp(5rem, 16vh, 9rem);
}

.dest-missing h1 {
  margin: 0 0 0.85rem;
  font-size: var(--gy-text-4xl);
  line-height: 1;
}

.dest-missing p {
  margin: 0 0 1.4rem;
  max-width: 36rem;
  font-family: var(--font-body);
  font-weight: 400;
  color: var(--gy-muted);
}

@media (max-width: 900px) {
  .story__grid,
  .stays__grid,
  .visit__grid {
    grid-template-columns: 1fr;
  }

  .portrait {
    margin-top: 0.4rem;
  }

  .story__body {
    max-width: 16em;
  }
}

@media (max-width: 599px) {
  .detail :deep(h1) {
    font-size: var(--gy-text-display);
  }

  .hero__actions .gy-btn {
    width: 100%;
  }

  .photo-card {
    height: min(58vh, 460px);
    margin-bottom: 2.5rem;
  }

  .marquee__item em {
    font-size: var(--gy-text-2xl);
  }

  .visit__map :deep(.map-embed__frame) {
    min-height: 240px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero__img,
  .portrait__frame img,
  .marquee__item em,
  .marquee__track {
    transition: none;
    animation: none;
  }

  .hero__img,
  .portrait__frame img {
    height: 100%;
    transform: none !important;
  }

  .marquee {
    -webkit-mask-image: none;
    mask-image: none;
  }

  .marquee__track {
    width: auto;
    flex-wrap: wrap;
    padding-inline: clamp(1.25rem, 6vw, 5rem);
  }
}
</style>

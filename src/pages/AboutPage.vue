<template>
  <q-page class="dest-luxe home-motion rooms-luxe news-luxe story-luxe">
    <SeoHead
      title="About | Greyon"
      description="Greyon is a Cambodia hospitality brand offering hotels and serviced stays."
      :image="maskImage || undefined"
    />

    <div ref="pageEl">
      <div
        class="read-bar"
        data-sheet="Progress"
        role="progressbar"
        aria-label="Reading progress"
        :aria-valuenow="readPercent"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <span :style="barStyle" />
        <span v-if="showSheets" class="sheet-label">Progress</span>
      </div>

      <section
        id="about-story"
        class="mask"
        data-sheet="Story"
        aria-labelledby="about-title"
      >
        <span v-if="showSheets" class="sheet-label">Story</span>
        <div class="dest-wrap">
          <p v-reveal class="eyebrow">Greyon</p>
          <h1 id="about-title" class="mask__title"> About us </h1>
          <p v-reveal class="mask__lead">
            Greyon is a Cambodia hospitality brand focused on calm, modern stays
            — from city hotels to serviced apartments — with booking that stays
            simple for guests and teams.
          </p>
          <p v-reveal class="mask__body">
            We design each property around the destination: clear rooms,
            thoughtful amenities, and stay policies guests can understand before
            they book.
          </p>
          <div v-reveal class="mask__actions">
            <router-link class="gy-btn" to="/hotels">{{
              t("home.viewHotels")
            }}</router-link>
            <router-link class="gy-btn gy-btn--outline" to="/apartments"
              >Serviced Apartments</router-link
            >
            <router-link
              v-if="contactOn"
              class="gy-btn gy-btn--outline"
              to="/contact"
              >Contact us</router-link
            >
          </div>
        </div>
      </section>

      <section
        v-if="layers.length > 1"
        id="about-layers"
        class="layers"
        data-sheet="Layers"
        aria-label="Photographs"
      >
        <span v-if="showSheets" class="sheet-label">Layers</span>
        <div class="layers__stage">
          <figure
            v-for="(frame, index) in layers"
            :key="frame.id"
            class="layers__frame"
            :class="`is-${index}`"
          >
            <img :src="frame.src" :alt="frame.name" loading="lazy" />
            <figcaption class="layers__name">{{ frame.name }}</figcaption>
          </figure>
        </div>
      </section>

      <section
        v-if="lens"
        id="about-lens"
        class="stage"
        data-sheet="Lens"
        aria-labelledby="about-lens-title"
      >
        <span v-if="showSheets" class="sheet-label">Lens</span>
        <div class="stage__media">
          <img class="stage__img" :src="lens.src" alt="" />
          <div class="stage__veil" />
        </div>
        <div class="dest-wrap stage__content">
          <p v-reveal class="eyebrow eyebrow--light">{{ lens.kicker }}</p>
          <h2 id="about-lens-title" v-reveal>
            {{ lens.name }}
          </h2>
          <p v-if="lens.lead" v-reveal class="stage__lead">
            {{ lens.lead }}
          </p>
          <router-link class="gy-btn gy-btn--light" :to="lens.to">
            {{ lens.cta }}
          </router-link>
        </div>
        <SectionDivider fill="var(--gy-cream)" />
      </section>

      <div v-if="marqueeItems.length" class="marquee-host" data-sheet="Marquee">
        <span v-if="showSheets" class="sheet-label">Marquee</span>
        <HotelAmenityBand
          id="about-marquee"
          :items="marqueeItems"
          :show-copy="false"
          sheet="Marquee"
        />
      </div>

      <section
        v-if="serviceCards.length"
        id="about-services"
        class="services"
        data-sheet="Services"
        aria-labelledby="about-services-title"
      >
        <span v-if="showSheets" class="sheet-label">Services</span>
        <div class="dest-wrap">
          <p v-reveal class="eyebrow">On site</p>
          <h2 id="about-services-title" v-reveal> Services </h2>
        </div>
        <div class="dest-wrap services__grid">
          <article
            v-for="item in serviceCards"
            :key="item.id"
            class="service-card rooms-tilt glass-edge"
          >
            <p v-if="item.hotel" class="service-card__where">{{
              item.hotel
            }}</p>
            <h3>{{ item.name }}</h3>
            <p v-if="item.description">{{ item.description }}</p>
          </article>
        </div>
      </section>

      <section
        v-if="locations.length"
        id="about-places"
        class="residences"
        data-sheet="Places"
        aria-labelledby="about-places-title"
      >
        <span v-if="showSheets" class="sheet-label">Places</span>
        <div class="dest-wrap residences__head">
          <p v-reveal class="eyebrow">{{ t("nav.location") }}</p>
          <h2 id="about-places-title" v-reveal> Stacked places </h2>
          <p v-reveal class="section-lead">
            Each published destination, held so the next one covers the last.
          </p>
        </div>
        <div class="dest-wrap stack">
          <article
            v-for="(loc, index) in locations"
            :key="loc.id"
            class="stack-card"
            :style="stackStyle(index)"
          >
            <header class="stack-card__bar">
              <span>{{ pad(index + 1) }}</span>
              <strong>{{ loc.name }}</strong>
            </header>
            <div class="place-card">
              <div
                v-if="hostedImage(loc.heroImage)"
                class="place-card__media photo-reveal"
              >
                <img
                  :src="hostedImage(loc.heroImage)"
                  :alt="loc.name"
                  loading="lazy"
                />
              </div>
              <div class="place-card__body">
                <h3>{{ loc.name }}</h3>
                <p v-if="loc.description">{{ loc.description }}</p>
                <ul v-if="loc.highlights.length" class="place-card__notes">
                  <li v-for="item in loc.highlights" :key="item">{{ item }}</li>
                </ul>
                <p v-if="hotelsFor(loc.id).length" class="place-card__stays">
                  <router-link
                    v-for="hotel in hotelsFor(loc.id)"
                    :key="hotel.id"
                    :to="`/hotels/${hotel.slug}`"
                  >
                    {{ hotel.name }}
                  </router-link>
                </p>
                <router-link class="gy-btn" :to="`/locations/${loc.slug}`">
                  Open destination
                </router-link>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section
        v-if="hotels.length"
        id="about-stays"
        ref="pinRoot"
        class="rail"
        :class="canPin ? 'is-pin' : 'is-flow'"
        data-sheet="Stays"
        aria-labelledby="about-stays-title"
        @keydown="onRailKey"
      >
        <span v-if="showSheets" class="sheet-label">Stays</span>
        <div class="rail__sticky">
          <header class="rail__head">
            <div>
              <p v-reveal class="eyebrow eyebrow--light">{{
                t("nav.hotels")
              }}</p>
              <h2 id="about-stays-title" v-reveal>
                {{ t("home.stayWith") }}
              </h2>
              <p class="rail__count" aria-live="polite">
                {{ pad(activeIndex + 1) }} / {{ pad(hotels.length) }}
              </p>
            </div>
            <div class="rail__nav" role="group" :aria-label="t('nav.hotels')">
              <button
                v-for="(hotel, index) in hotels"
                :key="hotel.id"
                type="button"
                :class="{ 'is-active': activeIndex === index }"
                :aria-current="activeIndex === index ? 'true' : undefined"
                @click="goToPanel(index)"
              >
                {{ pad(index + 1) }} {{ hotel.name }}
              </button>
            </div>
          </header>
          <div class="rail__progress" aria-hidden="true">
            <span ref="barEl" />
          </div>
          <div
            ref="railEl"
            class="rail__viewport"
            :tabindex="canPin ? -1 : 0"
            :aria-label="canPin ? undefined : t('nav.hotels')"
          >
            <div ref="trackEl" class="rail__track">
              <div
                v-for="(hotel, index) in hotels"
                :key="hotel.id"
                class="room-panel rooms-tilt glass-edge"
                :class="{ 'is-active': activeIndex === index }"
              >
                <router-link
                  class="room-panel__hit"
                  :to="`/hotels/${hotel.slug}`"
                  :aria-label="hotel.name"
                >
                  <div class="room-panel__media">
                    <img
                      v-if="hostedImage(hotel.heroImage)"
                      :src="hostedImage(hotel.heroImage)"
                      alt=""
                      :loading="index < 2 ? 'eager' : 'lazy'"
                    />
                  </div>
                  <div class="room-panel__copy">
                    <span class="room-panel__index">{{ pad(index + 1) }}</span>
                    <p v-if="placeOf(hotel)" class="room-panel__where">
                      {{ placeOf(hotel) }}
                    </p>
                    <h3>{{ hotel.name }}</h3>
                    <p
                      v-if="hotel.shortDescription"
                      class="room-panel__excerpt"
                    >
                      {{ hotel.shortDescription }}
                    </p>
                    <p v-else-if="hotel.propertyType" class="room-panel__where">
                      {{ hotel.propertyType }}
                    </p>
                    <span class="text-link"
                      ><span>{{ t("home.viewHotels") }}</span></span
                    >
                  </div>
                </router-link>
              </div>
            </div>
          </div>
        </div>
        <div
          class="rail__spacer"
          :style="spacer ? { height: `${spacer}px` } : undefined"
          aria-hidden="true"
        />
        <SectionDivider kind="angle" fill="var(--gy-cream)" />
      </section>

      <section
        v-if="showCatalogError"
        class="room-state"
        data-sheet="Status"
        role="alert"
      >
        <span v-if="showSheets" class="sheet-label">Status</span>
        <div class="dest-wrap">
          <p>{{ cms.catalogError }}</p>
        </div>
      </section>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import HotelAmenityBand from "@/components/hotel/HotelAmenityBand.vue";
import { usePinnedRail } from "@/components/home/usePinnedRail";
import { useReadProgress } from "@/components/home/useReadProgress";
import SectionDivider from "@/components/hotel/SectionDivider.vue";
import SeoHead from "@/components/SeoHead.vue";
import { useAuthStore } from "@/stores/auth-store";
import { useCmsStore } from "@/stores/cms-store";
import type { Hotel, HotelServiceRef } from "@/types/greyon";
import { hostedImage } from "@/utils/hostedImage";

type Frame = {
  id: string;
  src: string;
  name: string;
};

type Lens = {
  src: string;
  name: string;
  lead: string;
  kicker: string;
  to: string;
  cta: string;
};

type ServiceCard = {
  id: string;
  name: string;
  description: string;
  hotel: string;
};

const cms = useCmsStore();
const auth = useAuthStore();
const route = useRoute();
const { t } = useI18n();

const pageEl = ref<HTMLElement | null>(null);
const { progress } = useReadProgress(pageEl);
const readPercent = computed(() => Math.round(progress.value * 100));
const barStyle = computed(() => ({
  transform: `scaleX(${progress.value})`
}));
const showSheets = computed(() => String(route.query.sheets ?? "") === "1");
const contactOn = computed(() => auth.featureEnabled("contact_public"));

const locations = computed(() => cms.publishedLocations);
const hotels = computed(() => cms.publishedHotels);

const {
  canPin,
  spacer,
  activeIndex,
  pinRoot,
  railEl,
  trackEl,
  barEl,
  goToPanel
} = usePinnedRail(computed(() => hotels.value.length));

const serviceCards = ref<ServiceCard[]>([]);

onMounted(() => {
  void loadServices();
});

const photos = computed(() => {
  const frames: Frame[] = [];
  const push = (id: string, src: string | undefined, name: string) => {
    const hosted = hostedImage(src);
    if (!hosted || !name.trim() || frames.some(frame => frame.src === hosted)) {
      return;
    }
    frames.push({ id, src: hosted, name: name.trim() });
  };
  for (const hotel of hotels.value) {
    push(`hotel-${hotel.id}`, hotel.heroImage, hotel.name);
    hotel.gallery.forEach((src, index) => {
      push(`hotel-${hotel.id}-${index}`, src, hotel.name);
    });
  }
  for (const loc of locations.value) {
    push(`loc-${loc.id}`, loc.heroImage, loc.name);
    loc.gallery.forEach((src, index) => {
      push(`loc-${loc.id}-${index}`, src, loc.name);
    });
  }
  return frames;
});

const maskImage = computed(() => photos.value[0]?.src ?? "");

const layers = computed(() => {
  const rest = photos.value.filter(frame => frame.src !== maskImage.value);
  const picked = (rest.length > 1 ? rest : photos.value).slice(0, 4);
  return picked.length > 1 ? picked : [];
});

const lens = computed<Lens | null>(() => {
  const frame = photos.value.find(item => item.src !== maskImage.value);
  if (!frame) return null;
  const hotel = hotels.value.find(item => item.name === frame.name);
  if (hotel) {
    return {
      src: frame.src,
      name: hotel.name,
      lead: hotel.shortDescription.trim() || hotel.propertyType?.trim() || "",
      kicker: t("nav.hotels"),
      to: `/hotels/${hotel.slug}`,
      cta: t("home.viewHotels")
    };
  }
  const loc = locations.value.find(item => item.name === frame.name);
  if (!loc) return null;
  return {
    src: frame.src,
    name: loc.name,
    lead: loc.description.trim(),
    kicker: t("nav.location"),
    to: `/locations/${loc.slug}`,
    cta: "Open destination"
  };
});

const marqueeItems = computed(() => {
  const seen = new Set<string>();
  const lines: string[] = [];
  const push = (value: string) => {
    const text = value.trim();
    const key = text.toLowerCase();
    if (!text || seen.has(key)) return;
    seen.add(key);
    lines.push(text);
  };
  for (const loc of locations.value) loc.highlights.forEach(push);
  for (const hotel of hotels.value) hotel.amenities.forEach(push);
  return lines;
});

const showCatalogError = computed(
  () =>
    Boolean(cms.catalogError) &&
    !cms.catalogSyncing &&
    !locations.value.length &&
    !hotels.value.length
);

function hotelsFor(locationId: string) {
  return hotels.value.filter(hotel => hotel.locationId === locationId);
}

function placeOf(hotel: Hotel) {
  return (
    hotel.area?.trim() ||
    hotel.propertyType?.trim() ||
    cms.getLocationById(hotel.locationId)?.name ||
    ""
  );
}

function stackStyle(index: number) {
  return { zIndex: index + 1 };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function onRailKey(event: KeyboardEvent) {
  if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
  const target = event.target;
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  ) {
    return;
  }
  event.preventDefault();
  goToPanel(activeIndex.value + (event.key === "ArrowRight" ? 1 : -1));
}

async function loadServices() {
  try {
    await cms.ensurePublicCatalog();
  } catch {
    serviceCards.value = [];
    return;
  }
  const next: ServiceCard[] = [];
  const seen = new Set<string>();
  const list = cms.publishedHotels;
  for (const hotel of list) {
    let detail = hotel;
    try {
      detail = await cms.hydrateHotelDetail(hotel.slug);
    } catch {
      continue;
    }
    for (const service of detail.services ?? []) {
      pushService(next, seen, service, hotel.name);
    }
  }
  serviceCards.value = next;
}

function pushService(
  next: ServiceCard[],
  seen: Set<string>,
  service: HotelServiceRef,
  hotelName: string
) {
  if (service.status && service.status !== "published") return;
  const name = service.name?.trim() ?? "";
  if (!name || seen.has(service.id)) return;
  seen.add(service.id);
  next.push({
    id: service.id,
    name,
    description: service.description?.trim() ?? "",
    hotel: hotelName
  });
}
</script>

<style src="@/components/home/home-motion.css"></style>
<style src="./destination-luxe.css"></style>
<style src="./rooms-luxe.css"></style>
<style src="./news-luxe.css"></style>
<style src="./story-luxe.css"></style>

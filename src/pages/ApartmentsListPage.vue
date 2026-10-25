<template>
  <q-page class="dest-luxe home-motion rooms-luxe apartments">
    <SeoHead
      title="Apartments | Greyon"
      :description="seoDescription"
      :image="mastImage || undefined"
    />

    <section v-spot class="mast" data-sheet="Mast" aria-labelledby="apt-title">
      <div ref="mastFrame" class="mast__media">
        <img
          v-if="mastImage"
          class="mast__img"
          :src="mastImage"
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
        <p v-if="mastPlace" v-reveal class="mast__chip">{{ mastPlace }}</p>
        <p v-reveal class="eyebrow eyebrow--light">Portfolio</p>
        <RevealWords id="apt-title" tag="h1" text="Apartments" />
        <p v-reveal="{ delay: '140ms' }" class="mast__lead">
          Serviced apartments and residences from the Greyon portfolio.
        </p>
        <div v-reveal="{ delay: '200ms' }" class="mast__actions">
          <button
            v-magnetic
            class="gy-btn gy-btn--light"
            type="button"
            @click="scrollTo(rooms.length ? 'apt-rooms' : 'apt-residences')"
          >
            {{ rooms.length ? "View the rooms" : "View residences" }}
          </button>
        </div>
      </div>

      <div v-if="apartments.length" class="mast__facts">
        <router-link
          v-for="hotel in apartments"
          :key="hotel.id"
          class="mast__fact glass-edge"
          :to="`/hotels/${hotel.slug}`"
        >
          <span>{{ placeName(hotel.locationId) || "Greyon" }}</span>
          <strong>{{ hotel.name }}</strong>
        </router-link>
      </div>
      <SectionDivider fill="#14110e" />
    </section>

    <section
      v-if="rooms.length"
      id="apt-rooms"
      ref="pinRoot"
      class="rail"
      :class="canPin ? 'is-pin' : 'is-flow'"
      data-sheet="Rooms"
      aria-labelledby="rooms-title"
      @keydown="onRailKey"
    >
      <div class="rail__sticky">
        <header class="rail__head">
          <div>
            <p v-reveal class="eyebrow eyebrow--light">Rooms</p>
            <h2 id="rooms-title" v-reveal="{ delay: '60ms' }">
              Stay in frame
            </h2>
            <p class="rail__count" aria-live="polite">
              {{ pad(activeIndex + 1) }} / {{ pad(rooms.length) }}
            </p>
          </div>
          <div class="rail__nav" role="group" aria-label="Rooms">
            <button
              v-for="(room, index) in rooms"
              :key="room.id"
              type="button"
              :class="{ 'is-active': activeIndex === index }"
              :aria-current="activeIndex === index ? 'true' : undefined"
              @click="goToPanel(index)"
            >
              {{ pad(index + 1) }} {{ room.name }}
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
          :aria-label="canPin ? undefined : 'Rooms'"
        >
          <div ref="trackEl" class="rail__track">
            <div
              v-for="(room, index) in rooms"
              :key="room.id"
              v-tilt="{ max: 6 }"
              class="room-panel rooms-tilt glass-edge"
              :class="{ 'is-active': activeIndex === index }"
            >
              <router-link
                v-if="pathOf(room)"
                class="room-panel__hit"
                :to="pathOf(room)"
                :aria-label="`View ${room.name}`"
              >
                <div class="room-panel__media">
                  <img
                    v-if="coverOf(room)"
                    :src="coverOf(room)"
                    :alt="room.name"
                    :loading="index < 2 ? 'eager' : 'lazy'"
                  />
                </div>
                <div class="room-panel__copy">
                  <span class="room-panel__index">{{ pad(index + 1) }}</span>
                  <p v-if="hotelFor(room)" class="room-panel__where">
                    {{ hotelFor(room)?.name }}
                  </p>
                  <h3>{{ room.name }}</h3>
                  <RoomFacts
                    tone="light"
                    compact
                    :bed-type="room.bedType"
                    :room-size="room.roomSize"
                    :max-guests="room.maxGuests"
                  />
                  <p v-if="priceOf(room)" class="room-panel__price">
                    <strong>${{ priceOf(room) }}</strong>
                    <span>per night · before taxes</span>
                  </p>
                  <span class="text-link"><span>View room</span></span>
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

    <section id="apt-filters" class="filters" data-sheet="Filters">
      <div class="dest-wrap">
        <p v-reveal class="eyebrow">Find a residence</p>
        <h2 v-reveal="{ delay: '60ms' }">In the portfolio</h2>
        <p v-reveal="{ delay: '100ms' }" class="section-lead">
          Filter the published apartments by destination or name.
        </p>
        <form class="filters__bar spin-edge" role="search" @submit.prevent>
          <label class="field">
            Keyword
            <input
              v-model="keyword"
              type="search"
              placeholder="Apartment name"
              autocomplete="off"
              enterkeyhint="search"
            />
          </label>
          <label class="field">
            Destination
            <select :value="locationFilter" @change="onLocationChange">
              <option value="">All destinations</option>
              <option
                v-for="loc in cms.publishedLocations"
                :key="loc.id"
                :value="loc.id"
              >
                {{ loc.name }}
              </option>
            </select>
          </label>
          <p class="filters__count" aria-live="polite">{{ resultLabel }}</p>
        </form>
      </div>
    </section>

    <section
      id="apt-residences"
      class="residences"
      data-sheet="Residences"
      aria-labelledby="residences-title"
    >
      <div class="dest-wrap residences__head">
        <p v-reveal class="eyebrow">Residences</p>
        <h2 id="residences-title" v-reveal="{ delay: '60ms' }">
          Stacked stays
        </h2>
        <p v-reveal="{ delay: '110ms' }" class="section-lead">
          Each published apartment, held so the next one covers the last.
        </p>
      </div>
      <div v-if="filtered.length" class="dest-wrap stack">
        <article
          v-for="(hotel, index) in filtered"
          :key="hotel.id"
          class="stack-card"
          :style="stackStyle(index)"
        >
          <header class="stack-card__bar">
            <span>{{ pad(index + 1) }}</span>
            <strong>{{ hotel.name }}</strong>
          </header>
          <div v-tilt="{ max: 5 }" class="rooms-tilt">
            <HotelCard live :hotel="hotel" />
          </div>
        </article>
      </div>
      <div v-else class="dest-wrap">
        <p v-if="showLoading" class="empty">Loading apartments…</p>
        <p v-else-if="showError" class="empty" role="alert">
          {{ cms.catalogError }}
        </p>
        <p v-else class="empty">
          No apartments match right now. Browse
          <router-link to="/hotels">all hotels</router-link>
          or check back soon.
        </p>
      </div>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import RevealWords from "@/components/home/RevealWords.vue";
import { useParallax } from "@/components/home/useParallax";
import { usePinnedRail } from "@/components/home/usePinnedRail";
import HotelCard from "@/components/HotelCard.vue";
import RoomFacts from "@/components/RoomFacts.vue";
import SectionDivider from "@/components/hotel/SectionDivider.vue";
import SeoHead from "@/components/SeoHead.vue";
import { useBookingStore } from "@/stores/booking-store";
import { useCmsStore } from "@/stores/cms-store";
import type { Hotel, RoomType } from "@/types/greyon";
import {
  queryHasSearchFields,
  searchParamsFromQuery
} from "@/utils/bookingSearchQuery";
import { isApartmentProperty } from "@/utils/propertyKind";
import { roomDetailPath } from "@/utils/roomPath";

const cms = useCmsStore();
const booking = useBookingStore();
const route = useRoute();
const router = useRouter();
const locationFilter = ref("");
const keyword = ref("");

const apartments = computed(() =>
  cms.publishedHotels.filter(hotel => isApartmentProperty(hotel))
);

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  return apartments.value.filter(hotel => {
    if (locationFilter.value && hotel.locationId !== locationFilter.value) {
      return false;
    }
    if (!kw) return true;
    const hotelText = `${hotel.name} ${hotel.shortDescription}`.toLowerCase();
    if (hotelText.includes(kw)) return true;
    return cms
      .getRoomTypesByHotelId(hotel.id)
      .some(room =>
        `${room.name} ${room.description}`.toLowerCase().includes(kw)
      );
  });
});

const rooms = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  const list: RoomType[] = [];
  for (const hotel of filtered.value) {
    for (const room of cms.getRoomTypesByHotelId(hotel.id)) {
      if (!kw) {
        list.push(room);
        continue;
      }
      const hotelText = `${hotel.name} ${hotel.shortDescription}`.toLowerCase();
      const roomText = `${room.name} ${room.description}`.toLowerCase();
      if (hotelText.includes(kw) || roomText.includes(kw)) list.push(room);
    }
  }
  return list;
});

const {
  canPin,
  spacer,
  activeIndex,
  pinRoot,
  railEl,
  trackEl,
  barEl,
  goToPanel
} = usePinnedRail(computed(() => rooms.value.length));

const mastFrame = ref<HTMLElement | null>(null);
const mastOffset = useParallax(mastFrame, 150);
const mastStyle = computed(() => ({
  transform: `translate3d(0, ${mastOffset.value}px, 0)`
}));

const mastHotel = computed(
  () =>
    apartments.value.find(hotel => hotel.heroImage.trim()) ??
    apartments.value[0] ??
    null
);

const mastImage = computed(() => {
  const hotel = mastHotel.value;
  if (!hotel) return "";
  return (
    hotel.heroImage.trim() ||
    hotel.gallery.find(src => src.trim())?.trim() ||
    ""
  );
});

const mastReveal = computed(() => {
  const hotel = mastHotel.value;
  const cover = mastImage.value;
  if (!hotel || !cover) return "";
  const fromGallery = hotel.gallery.find(
    src => src.trim() && src.trim() !== cover
  );
  if (fromGallery) return fromGallery.trim();
  const other = apartments.value.find(item => {
    if (item.id === hotel.id) return false;
    const hero = item.heroImage.trim();
    return (hero && hero !== cover) || item.gallery.some(src => src.trim());
  });
  if (!other) return "";
  const hero = other.heroImage.trim();
  if (hero && hero !== cover) return hero;
  return (
    other.gallery.find(src => src.trim() && src.trim() !== cover)?.trim() ?? ""
  );
});

const mastPlace = computed(() =>
  mastHotel.value ? placeName(mastHotel.value.locationId) : ""
);

const seoDescription = computed(() => {
  const names = apartments.value.map(hotel => hotel.name).filter(Boolean);
  return names.length
    ? `Serviced apartments and residences: ${names.join(", ")}.`
    : "Browse Greyon serviced apartments and residences across Cambodia.";
});

const resultLabel = computed(() => {
  const count = filtered.value.length;
  const noun = count === 1 ? "apartment" : "apartments";
  const place = cms.publishedLocations.find(
    loc => loc.id === locationFilter.value
  )?.name;
  return place ? `${place} · ${count} ${noun}` : `${count} ${noun}`;
});

const showLoading = computed(
  () => cms.catalogSyncing && !cms.publishedHotels.length
);
const showError = computed(
  () =>
    Boolean(cms.catalogError) &&
    !cms.catalogSyncing &&
    !cms.publishedHotels.length
);

function placeName(id: string) {
  return cms.getLocationById(id)?.name ?? "";
}

function hotelFor(room: RoomType): Hotel | undefined {
  const hotel = cms.getHotelById(room.hotelId);
  return hotel && isApartmentProperty(hotel) ? hotel : undefined;
}

function coverOf(room: RoomType) {
  return room.images.find(src => src.trim())?.trim() ?? "";
}

function nightly(roomId: string) {
  const plan = cms.getRatePlanByRoomTypeId(roomId);
  if (!plan || !(plan.basePrice > 0)) return null;
  return plan.basePrice;
}

function money(amount: number) {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
}

function priceOf(room: RoomType) {
  const amount = nightly(room.id);
  return amount == null ? "" : money(amount);
}

function pathOf(room: RoomType) {
  const hotel = hotelFor(room);
  return hotel ? roomDetailPath(hotel, room) : "";
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

function scrollTo(id: string) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(id)?.scrollIntoView({
    behavior: reduce ? "auto" : "smooth",
    block: "start"
  });
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

function applyLocationSlugFromQuery() {
  const slug =
    typeof route.query.locationSlug === "string"
      ? route.query.locationSlug
      : "";
  if (!slug) {
    locationFilter.value = "";
    return;
  }
  const loc = cms.publishedLocations.find(item => item.slug === slug);
  if (loc) locationFilter.value = loc.id;
}

function onLocationChange(event: Event) {
  const id = (event.target as HTMLSelectElement).value;
  locationFilter.value = id;
  const loc = cms.publishedLocations.find(item => item.id === id);
  const nextQuery = { ...route.query } as Record<string, string | string[]>;
  if (loc) nextQuery.locationSlug = loc.slug;
  else delete nextQuery.locationSlug;
  void router.replace({ query: nextQuery });
}

onMounted(() => {
  if (queryHasSearchFields(route.query)) {
    booking.setSearch(searchParamsFromQuery(route.query));
  }
  applyLocationSlugFromQuery();
});

watch(
  () => cms.publishedLocations.length,
  () => applyLocationSlugFromQuery()
);
</script>

<style src="@/components/home/home-motion.css"></style>
<style src="./destination-luxe.css"></style>
<style src="./rooms-luxe.css"></style>

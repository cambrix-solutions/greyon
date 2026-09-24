<template>
  <q-page v-if="location">
    <SeoHead
      :title="`${location.name} | Greyon`"
      :description="location.description"
      :image="location.heroImage"
    />
    <section class="loc-hero gy-card-media">
      <img :src="location.heroImage" :alt="location.name" />
      <div class="loc-hero__content gy-container">
        <p v-reveal class="gy-eyebrow">Destination</p>
        <h1 v-reveal="{ delay: '80ms' }" class="gy-display">{{
          location.name
        }}</h1>
      </div>
    </section>
    <div class="gy-container gy-section">
      <p v-reveal class="lead">{{ location.description }}</p>
      <ul v-reveal="{ delay: '80ms' }" class="highlights">
        <li v-for="item in location.highlights" :key="item">{{ item }}</li>
      </ul>
      <div v-reveal class="actions">
        <button class="gy-btn" type="button" @click="bookHere">
          Book in {{ location.name }}
        </button>
      </div>
      <section v-if="mapPoint" v-reveal class="map-block">
        <h2 class="gy-display">Map</h2>
        <MapEmbed
          :lat="mapPoint.lat"
          :lng="mapPoint.lng"
          :embed-url="mapEmbedUrl"
        />
      </section>
      <h2 v-reveal class="gy-display">Greyon hotels here</h2>
      <div class="gy-grid-3 q-mt-md">
        <HotelCard
          v-for="(hotel, i) in hotelsHere"
          :key="hotel.id"
          v-reveal="{ delay: `${i * 80}ms` }"
          class="gy-interactive"
          :hotel="hotel"
        />
      </div>
      <p v-if="!hotelsHere.length" class="gy-muted">
        Hotels for this destination will appear once published.
      </p>
    </div>
  </q-page>
  <q-page v-else class="gy-section gy-container">
    <h1 class="gy-display">Destination not found</h1>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import HotelCard from "@/components/HotelCard.vue";
import MapEmbed from "@/components/MapEmbed.vue";
import SeoHead from "@/components/SeoHead.vue";
import { useBookingStore } from "@/stores/booking-store";
import { useCmsStore } from "@/stores/cms-store";

const route = useRoute();
const router = useRouter();
const booking = useBookingStore();
const cms = useCmsStore();

const location = computed(() =>
  cms.getLocationBySlug(String(route.params.slug))
);
const hotelsHere = computed(() =>
  location.value
    ? cms.publishedHotels.filter(h => h.locationId === location.value?.id)
    : []
);
const mapPoint = computed(() => {
  const c = hotelsHere.value[0]?.coordinates;
  if (!c || !Number.isFinite(c.lat) || !Number.isFinite(c.lng)) return null;
  if (c.lat === 0 && c.lng === 0) return null;
  return c;
});

const mapEmbedUrl = computed(() => hotelsHere.value[0]?.mapEmbedUrl ?? null);

function bookHere() {
  if (!location.value) return;
  booking.setSearch({
    locationSlug: location.value.slug,
    hotelSlug: ""
  });
  void router.push({ name: "booking" });
}
</script>

<style scoped>
.loc-hero {
  position: relative;
  height: min(52vh, 460px);
  color: white;
}

.loc-hero__content {
  position: absolute;
  inset: auto 0 2rem;
  z-index: 1;
}

.loc-hero::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.55));
}

.loc-hero h1 {
  margin: 0;
  font-size: clamp(2.5rem, 6vw, 4rem);
}

.lead {
  max-width: 46rem;
  font-size: 1.1rem;
  line-height: 1.7;
}

.map-block {
  margin: 2rem 0 2.5rem;
}

.highlights {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  list-style: none;
  padding: 0;
  margin: 1.25rem 0;
}

.highlights li {
  background: var(--gy-stone);
  padding: 0.35rem 0.7rem;
}

.actions {
  margin-bottom: 2rem;
}
</style>

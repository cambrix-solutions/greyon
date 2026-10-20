<template>
  <q-page class="gy-section">
    <SeoHead
      title="Hotels | Greyon"
      description="Browse Greyon hotel portfolio across Cambodia."
    />
    <div class="gy-container">
      <div v-reveal>
        <p class="gy-eyebrow">Portfolio</p>
        <h1 class="gy-display page-title">Hotels</h1>
        <p class="gy-muted intro">
          MVP portfolio includes hotels only. Filter by destination or keyword.
        </p>
      </div>

      <div v-reveal="{ delay: '80ms' }" class="filters">
        <label>
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
        <label>
          Keyword
          <input v-model="keyword" type="search" placeholder="Hotel name" />
        </label>
      </div>

      <div class="gy-grid-3">
        <HotelCard
          v-for="(hotel, i) in filtered"
          :key="hotel.id"
          v-reveal="{ delay: `${Math.min(i, 5) * 70}ms` }"
          :hotel="hotel"
        />
      </div>
      <p v-if="!filtered.length" class="gy-muted q-mt-lg">No hotels found.</p>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import HotelCard from "@/components/HotelCard.vue";
import SeoHead from "@/components/SeoHead.vue";
import { useBookingStore } from "@/stores/booking-store";
import { useCmsStore } from "@/stores/cms-store";
import {
  queryHasSearchFields,
  searchParamsFromQuery
} from "@/utils/bookingSearchQuery";

const cms = useCmsStore();
const booking = useBookingStore();
const route = useRoute();
const router = useRouter();
const locationFilter = ref("");
const keyword = ref("");

function applyLocationSlugFromQuery() {
  const slug =
    typeof route.query.locationSlug === "string"
      ? route.query.locationSlug
      : "";
  if (!slug) {
    locationFilter.value = "";
    return;
  }
  const loc = cms.publishedLocations.find(l => l.slug === slug);
  if (loc) locationFilter.value = loc.id;
}

function onLocationChange(event: Event) {
  const id = (event.target as HTMLSelectElement).value;
  locationFilter.value = id;
  const loc = cms.publishedLocations.find(l => l.id === id);
  const nextQuery = { ...route.query } as Record<string, string | string[]>;
  if (loc) nextQuery.locationSlug = loc.slug;
  else delete nextQuery.locationSlug;
  void router.replace({ query: nextQuery });
}

onMounted(() => {
  // Support /hotels?locationSlug=…&specialRate=… deep links (hotels/search params).
  if (queryHasSearchFields(route.query)) {
    booking.setSearch(searchParamsFromQuery(route.query));
  }
  applyLocationSlugFromQuery();
});

watch(
  () => cms.publishedLocations.length,
  () => applyLocationSlugFromQuery()
);

const filtered = computed(() =>
  cms.publishedHotels.filter(h => {
    if (locationFilter.value && h.locationId !== locationFilter.value) {
      return false;
    }
    if (
      keyword.value &&
      !`${h.name} ${h.shortDescription}`
        .toLowerCase()
        .includes(keyword.value.toLowerCase())
    ) {
      return false;
    }
    return true;
  })
);
</script>

<style scoped>
.page-title {
  margin: 0 0 0.75rem;
  font-size: clamp(2.4rem, 5vw, 3.5rem);
}

.intro {
  max-width: 40rem;
  margin-bottom: 1.5rem;
}

.filters {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 220px));
  gap: 1rem;
  margin-bottom: 2rem;
}

@media (max-width: 600px) {
  .filters {
    grid-template-columns: 1fr;
  }
}

label {
  display: grid;
  gap: 0.4rem;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gy-muted);
}

input,
select {
  min-height: 2.6rem;
  border: 1px solid var(--gy-stone);
  background: var(--gy-white);
  padding: 0.45rem 0.6rem;
  font: inherit;
  text-transform: none;
}
</style>

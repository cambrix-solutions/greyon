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
          <select v-model="locationFilter">
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
import { computed, ref } from "vue";
import HotelCard from "@/components/HotelCard.vue";
import SeoHead from "@/components/SeoHead.vue";
import { useCmsStore } from "@/stores/cms-store";

const cms = useCmsStore();
const locationFilter = ref("");
const keyword = ref("");

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

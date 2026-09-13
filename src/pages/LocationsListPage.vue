<template>
  <q-page class="gy-section">
    <SeoHead
      title="Locations | Greyon"
      description="Explore Greyon hotels in Phnom Penh, Sihanoukville, Kampot, Kep, Siem Reap and Battambang."
    />
    <div class="gy-container">
      <div v-reveal>
        <p class="gy-eyebrow">Destinations</p>
        <h1 class="gy-display page-title">Locations</h1>
      </div>
      <div class="gy-grid-3">
        <router-link
          v-for="(loc, i) in cms.publishedLocations"
          :key="loc.id"
          v-reveal="{ delay: `${i * 70}ms` }"
          :to="`/locations/${loc.slug}`"
          class="loc-card gy-interactive"
        >
          <div class="gy-card-media loc-card__media">
            <img :src="loc.heroImage" :alt="loc.name" loading="lazy" />
          </div>
          <h2 class="gy-display">{{ loc.name }}</h2>
          <p class="gy-muted">{{ loc.description }}</p>
        </router-link>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import SeoHead from "@/components/SeoHead.vue";
import { useCmsStore } from "@/stores/cms-store";

const cms = useCmsStore();
</script>

<style scoped>
.page-title {
  margin: 0 0 1.75rem;
  font-size: clamp(2.4rem, 5vw, 3.5rem);
}

.loc-card h2 {
  margin: 0.85rem 0 0.4rem;
  font-size: 1.8rem;
}

.loc-card__media {
  aspect-ratio: 4 / 3;
}
</style>

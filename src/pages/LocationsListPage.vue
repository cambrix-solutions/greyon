<template>
  <q-page class="gy-section">
    <SeoHead
      title="Destinations | Greyon"
      description="Explore Greyon hotels in Phnom Penh, Sihanoukville, Kampot, Kep, Siem Reap and Battambang."
    />
    <div class="gy-container">
      <div v-reveal>
        <p class="gy-eyebrow">Greyon</p>
        <h1 class="gy-display page-title">Destinations</h1>
      </div>
      <div class="gy-grid-3">
        <router-link
          v-for="(loc, i) in cms.publishedLocations"
          :key="loc.id"
          v-reveal="{ delay: `${i * 70}ms` }"
          :to="`/locations/${loc.slug}`"
          class="loc-card gy-card gy-interactive"
        >
          <div class="gy-card-media loc-card__media">
            <img :src="loc.heroImage" :alt="loc.name" loading="lazy" />
          </div>
          <div class="loc-card__body">
            <h2 class="gy-display">{{ loc.name }}</h2>
            <p class="gy-muted">{{ loc.description }}</p>
          </div>
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

.loc-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  color: inherit;
}

.loc-card__media {
  aspect-ratio: 4 / 3;
  margin-bottom: 0.75rem;
}

.loc-card__body {
  padding: 0.1rem 0.2rem 0.15rem;
}

.loc-card h2 {
  margin: 0 0 0.4rem;
  font-size: clamp(1.35rem, 2vw, 1.65rem);
  line-height: 1.15;
}

.loc-card .gy-muted {
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

<template>
  <q-page class="gy-section map-page">
    <SeoHead
      title="Map | Greyon"
      description="Explore Greyon hotels across Cambodia on the map. Filter by destination."
    />
    <div class="gy-container">
      <header v-reveal class="map-page__head">
        <p class="gy-eyebrow">Explore</p>
        <h1 class="gy-display map-page__title">Map</h1>
        <p class="gy-muted map-page__lead">
          Choose a destination to recenter the map and see Greyon properties
          nearby.
        </p>
      </header>
      <DestinationsMap
        v-reveal="{ delay: '80ms' }"
        :initial-slug="initialSlug"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import DestinationsMap from "@/components/DestinationsMap.vue";
import SeoHead from "@/components/SeoHead.vue";

const route = useRoute();
const initialSlug = computed(() => {
  const raw = route.query.locationSlug ?? route.query.destination;
  return typeof raw === "string" ? raw : "";
});
</script>

<style scoped>
.map-page__head {
  margin-bottom: 1.5rem;
}

.map-page__title {
  margin: 0 0 0.6rem;
  font-size: var(--gy-text-display);
}

.map-page__lead {
  max-width: 36rem;
  margin: 0;
}
</style>

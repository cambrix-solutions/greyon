<template>
  <ul v-if="items.length" class="landmark-list">
    <li
      v-for="(item, index) in items"
      :key="`${item.place}-${item.distance ?? index}`"
      v-reveal="{ delay: `${140 + Number(index) * 35}ms` }"
      class="landmark"
    >
      <span class="landmark__place">{{ item.place }}</span>
      <span v-if="item.distance" class="landmark__meta">{{
        item.distance
      }}</span>
    </li>
  </ul>
</template>

<script setup lang="ts">
defineProps<{
  items: { place: string; distance?: string }[];
}>();
</script>

<style scoped>
.landmark-list {
  display: grid;
  grid-template-columns: 1fr;
  column-gap: clamp(1.5rem, 3vw, 2.75rem);
  row-gap: 0;
  margin: 0.5rem 0 0;
  padding: 0;
  list-style: none;
}

.landmark {
  display: grid;
  gap: 0.2rem;
  padding: 0.85rem 0;
  border-bottom: 1px solid color-mix(in srgb, var(--gy-forest) 18%, transparent);
}

.landmark__place {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.02rem;
  letter-spacing: -0.01em;
  line-height: 1.3;
  color: var(--gy-forest);
}

.landmark__meta {
  margin: 0;
  font-family: var(--font-body);
  font-size: 0.92rem;
  font-weight: 400;
  line-height: 1.45;
  color: var(--gy-gold);
}

@media (min-width: 700px) {
  .landmark-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1100px) {
  .landmark-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>

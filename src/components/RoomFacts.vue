<template>
  <ul class="room-facts" :class="{ 'room-facts--compact': compact }">
    <li v-if="bedType">
      <q-icon name="king_bed" size="16px" />
      <span>{{ bedType }}</span>
    </li>
    <li v-if="roomSize">
      <q-icon name="square_foot" size="16px" />
      <span>{{ roomSize }}</span>
    </li>
    <li v-if="maxGuests">
      <q-icon name="group" size="16px" />
      <span>Up to {{ maxGuests }} guests</span>
    </li>
  </ul>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    bedType?: string;
    roomSize?: string;
    maxGuests?: number;
    compact?: boolean;
  }>(),
  { compact: false }
);
</script>

<style scoped>
.room-facts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem 1.15rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.room-facts li {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.88rem;
  color: var(--gy-ink);
}

.room-facts--compact li {
  font-size: 0.8rem;
  color: var(--gy-muted);
}

.room-facts .q-icon {
  color: var(--gy-gold-deep);
}
</style>

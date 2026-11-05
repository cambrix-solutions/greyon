<template>
  <div class="room-view-controls" @pointerdown.stop @click.stop>
    <RoomPanoramaButton @open="emit('panorama')" />
    <template v-if="showArrows">
      <button
        type="button"
        class="room-view-controls__arrow"
        aria-label="Previous photo"
        @click="emit('prev')"
      >
        <q-icon name="chevron_left" size="22px" />
      </button>
      <button
        type="button"
        class="room-view-controls__arrow"
        aria-label="Next photo"
        @click="emit('next')"
      >
        <q-icon name="chevron_right" size="22px" />
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import RoomPanoramaButton from "@/components/RoomPanoramaButton.vue";

withDefaults(
  defineProps<{
    showArrows?: boolean;
  }>(),
  { showArrows: false }
);

const emit = defineEmits<{
  panorama: [];
  prev: [];
  next: [];
}>();
</script>

<style scoped>
.room-view-controls {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
}

.room-view-controls__arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  margin: 0;
  padding: 0;
  border: 1px solid var(--gy-gold);
  border-radius: 2px;
  background: var(--gy-white);
  color: var(--gy-forest);
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(69, 76, 75, 0.16);
  transition: background-color 0.18s ease;
}

.room-view-controls__arrow:hover,
.room-view-controls__arrow:focus-visible {
  background: var(--gy-forest);
  color: var(--gy-gold);
}

.room-view-controls__arrow:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .room-view-controls__arrow {
    transition-duration: 0.01s;
  }
}
</style>

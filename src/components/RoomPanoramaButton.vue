<template>
  <button
    type="button"
    class="pano-btn"
    aria-label="Open 360° view"
    @click="emit('open')"
  >
    <svg class="pano-btn__globe" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.25" />
      <ellipse cx="12" cy="12" rx="3.4" ry="8.25" />
      <path d="M4.2 12h15.6" />
    </svg>
    <span class="pano-btn__label">360°</span>
  </button>
</template>

<script setup lang="ts">
const emit = defineEmits<{ open: [] }>();
</script>

<style scoped>
.pano-btn {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
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

.pano-btn:hover,
.pano-btn:focus-visible {
  background: var(--gy-forest);
  color: var(--gy-gold);
}

.pano-btn:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: 2px;
}

.pano-btn__globe {
  display: block;
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.4;
}

.pano-btn__label {
  font-family: var(--font-display);
  font-size: 0.56rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.01em;
  color: var(--gy-gold);
}

@media (prefers-reduced-motion: reduce) {
  .pano-btn {
    transition-duration: 0.01s;
  }
}
</style>

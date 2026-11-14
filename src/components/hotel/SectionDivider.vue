<template>
  <div
    class="section-divider"
    :class="`section-divider--${kind}`"
    :style="{ color: fill }"
    aria-hidden="true"
  >
    <svg viewBox="0 0 1440 40" preserveAspectRatio="none">
      <rect x="0" y="0" width="1440" height="40" />
    </svg>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    kind?: "curve" | "angle";
    /** Color of the section this edge belongs to. */
    fill?: string;
  }>(),
  {
    kind: "curve",
    fill: "var(--gy-cream)"
  }
);
</script>

<style scoped>
.section-divider {
  display: block;
  line-height: 0;
  pointer-events: none;
}

.section-divider svg {
  display: block;
  width: 100%;
  height: 1.25rem;
}

.section-divider path,
.section-divider polygon,
.section-divider rect {
  fill: currentColor;
}
</style>

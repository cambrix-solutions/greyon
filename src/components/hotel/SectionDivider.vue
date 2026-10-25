<template>
  <div
    class="section-divider"
    :class="`section-divider--${kind}`"
    :style="{ color: fill }"
    aria-hidden="true"
  >
    <svg viewBox="0 0 1440 100" preserveAspectRatio="none">
      <path
        v-if="kind === 'curve'"
        d="M0,52 C220,100 460,4 740,38 C1040,74 1220,8 1440,48 L1440,100 L0,100 Z"
      />
      <polygon v-else points="0,100 1440,0 1440,100" />
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
  height: clamp(2.75rem, 6vw, 5.25rem);
}

.section-divider path,
.section-divider polygon {
  fill: currentColor;
}
</style>

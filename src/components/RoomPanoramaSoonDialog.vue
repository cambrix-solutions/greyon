<template>
  <q-dialog
    :model-value="modelValue"
    transition-show="fade"
    transition-hide="fade"
    aria-labelledby="pano-soon-title"
    aria-describedby="pano-soon-body"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="pano-soon">
      <h2 id="pano-soon-title" class="pano-soon__title">
        360° view coming soon
      </h2>
      <p id="pano-soon-body" class="pano-soon__body">
        The interactive tour for this room will be added here.
      </p>
      <button type="button" class="pano-soon__close" @click="close">
        Close
      </button>
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [open: boolean];
}>();

function close() {
  emit("update:modelValue", false);
}
</script>

<style scoped>
.pano-soon {
  width: min(22rem, calc(100vw - 2rem));
  margin: 0;
  padding: 1.35rem 1.4rem 1.2rem;
  border: 1px solid var(--gy-gold);
  border-radius: 12px;
  background: var(--gy-forest);
  color: var(--gy-gold);
  animation: pano-soon-in 0.22s ease;
}

.pano-soon__title {
  margin: 0 0 0.55rem;
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.02em;
  color: var(--gy-gold);
}

.pano-soon__body {
  margin: 0 0 1.15rem;
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
  color: var(--gy-gold);
}

.pano-soon__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 1.15rem;
  border: 1px solid var(--gy-gold);
  border-radius: 8px;
  background: var(--gy-gold);
  color: var(--gy-forest);
  font-family: var(--font-display);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    color 0.18s ease;
}

.pano-soon__close:hover,
.pano-soon__close:focus-visible {
  background: var(--gy-forest);
  color: var(--gy-gold);
}

.pano-soon__close:focus-visible {
  outline: 2px solid var(--gy-gold);
  outline-offset: 2px;
}

@keyframes pano-soon-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pano-soon {
    animation-duration: 0.01s;
  }

  .pano-soon__close {
    transition-duration: 0.01s;
  }
}
</style>

<template>
  <div class="gy-counter">
    <div class="gy-counter__text">
      <span :id="labelId" class="gy-counter__label">{{ label }}</span>
      <span v-if="hint" class="gy-counter__hint">{{ hint }}</span>
    </div>
    <div class="gy-counter__controls" role="group" :aria-labelledby="labelId">
      <button
        type="button"
        class="gy-counter__btn"
        :disabled="modelValue <= min"
        :aria-label="`Fewer ${label.toLowerCase()}`"
        @click="set(modelValue - 1)"
      >
        <q-icon name="remove" size="18px" />
      </button>
      <output class="gy-counter__value" aria-live="polite">{{
        modelValue
      }}</output>
      <button
        type="button"
        class="gy-counter__btn"
        :disabled="modelValue >= max"
        :aria-label="`More ${label.toLowerCase()}`"
        @click="set(modelValue + 1)"
      >
        <q-icon name="add" size="18px" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/** −/+ stepper row used in the booking search "Guests & rooms" popover. */
const props = defineProps<{
  modelValue: number;
  label: string;
  hint?: string;
  min: number;
  max: number;
}>();

const emit = defineEmits<{ (e: "update:modelValue", value: number): void }>();

const labelId = `gy-counter-${Math.random().toString(36).slice(2, 8)}`;

function set(value: number) {
  emit("update:modelValue", Math.min(props.max, Math.max(props.min, value)));
}
</script>

<style scoped>
.gy-counter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 0;
}

.gy-counter + .gy-counter {
  border-top: 1px solid rgba(69, 76, 75, 0.1);
}

.gy-counter__text {
  display: grid;
  gap: 0.1rem;
}

.gy-counter__label {
  font-family: var(--font-display);
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--gy-gold);
}

.gy-counter__hint {
  font-size: 0.8rem;
  color: var(--gy-forest);
}

.gy-counter__controls {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
}

.gy-counter__btn {
  display: inline-grid;
  place-items: center;
  width: 2.15rem;
  height: 2.15rem;
  border: 1px solid rgba(69, 76, 75, 0.28);
  border-radius: 999px;
  background: var(--gy-white);
  color: var(--gy-forest);
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease;
}

.gy-counter__btn:hover:not(:disabled) {
  border-color: var(--gy-forest);
  color: var(--gy-forest);
}

.gy-counter__btn:focus-visible {
  outline: 2px solid var(--gy-forest);
  outline-offset: 2px;
}

.gy-counter__btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.gy-counter__value {
  min-width: 1.5rem;
  text-align: center;
  font-family: var(--font-display);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
</style>

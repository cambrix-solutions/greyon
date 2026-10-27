<template>
  <q-menu
    v-if="!sheet"
    :model-value="modelValue"
    no-parent-event
    anchor="bottom left"
    self="top left"
    :offset="[0, 12]"
    max-height="90vh"
    transition-show="jump-down"
    transition-hide="fade"
    class="gy-pop"
    :class="contentClass"
    @update:model-value="emit('update:modelValue', $event)"
    @show="emit('show')"
    @hide="emit('hide')"
  >
    <div class="gy-pop__body" role="dialog" :aria-label="title">
      <slot />
    </div>
    <footer v-if="$slots.footer" class="gy-pop__footer">
      <slot name="footer" />
    </footer>
  </q-menu>

  <q-dialog
    v-else
    :model-value="modelValue"
    position="bottom"
    transition-show="slide-up"
    transition-hide="slide-down"
    @update:model-value="emit('update:modelValue', $event)"
    @show="emit('show')"
    @hide="emit('hide')"
  >
    <div
      class="gy-sheet"
      :class="contentClass"
      role="dialog"
      :aria-label="title"
    >
      <header class="gy-sheet__head">
        <span class="gy-sheet__grip" aria-hidden="true" />
        <h2 class="gy-sheet__title">{{ title }}</h2>
        <button
          type="button"
          class="gy-sheet__close"
          aria-label="Close"
          @click="emit('update:modelValue', false)"
        >
          <q-icon name="close" size="22px" />
        </button>
      </header>
      <div class="gy-sheet__body">
        <slot />
      </div>
      <footer v-if="$slots.footer" class="gy-sheet__footer">
        <slot name="footer" />
      </footer>
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
/**
 * Booking-search panel: an anchored popover on tablet/desktop, a bottom sheet
 * with a sticky footer on phones. Place it inside the trigger element — the
 * menu anchors to its parent node.
 */
defineProps<{
  modelValue: boolean;
  sheet: boolean;
  title: string;
  contentClass?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "show"): void;
  (e: "hide"): void;
}>();
</script>

<style>
/* Unscoped: q-menu / q-dialog content is teleported to <body>. */
.gy-pop {
  border-radius: 18px !important;
  background: var(--gy-white);
  box-shadow:
    0 24px 60px rgba(28, 36, 33, 0.18),
    0 2px 8px rgba(28, 36, 33, 0.06) !important;
  border: 1px solid rgba(69, 76, 75, 0.08);
  color: var(--gy-forest);
}

.gy-pop__body {
  padding: 1.35rem 1.5rem 0.75rem;
}

.gy-pop__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1.5rem 1.1rem;
  border-top: 1px solid rgba(69, 76, 75, 0.1);
}

.gy-sheet {
  display: flex;
  flex-direction: column;
  width: 100vw;
  max-width: 100vw !important;
  max-height: 92dvh;
  background: var(--gy-white);
  border-radius: 20px 20px 0 0;
  color: var(--gy-forest);
  overflow: hidden;
}

.gy-sheet__head {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.15rem 3rem 0.85rem;
  border-bottom: 1px solid rgba(69, 76, 75, 0.1);
}

.gy-sheet__grip {
  position: absolute;
  top: 0.45rem;
  left: 50%;
  width: 2.5rem;
  height: 4px;
  margin-left: -1.25rem;
  border-radius: 999px;
  background: rgba(69, 76, 75, 0.18);
}

.gy-sheet__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.3;
}

.gy-sheet__close {
  position: absolute;
  right: 0.65rem;
  top: 50%;
  transform: translateY(-40%);
  display: inline-grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--gy-forest);
  cursor: pointer;
}

.gy-sheet__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 1rem 1.15rem;
}

.gy-sheet__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.85rem 1.15rem calc(0.85rem + env(safe-area-inset-bottom));
  border-top: 1px solid rgba(69, 76, 75, 0.1);
  background: var(--gy-white);
  box-shadow: 0 -10px 24px rgba(28, 36, 33, 0.06);
}
</style>

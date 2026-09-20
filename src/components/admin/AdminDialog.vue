<template>
  <q-dialog
    :model-value="modelValue"
    :persistent="persistent"
    :position="position"
    :full-height="fullHeight"
    :maximized="maximized"
    transition-show="scale"
    transition-hide="fade"
    class="admin-dialog-host"
    @update:model-value="onUpdate"
    @hide="$emit('hide')"
  >
    <q-card
      class="admin-dialog"
      :class="[
        `admin-dialog--${size}`,
        { 'admin-dialog--drawer': position === 'right' || position === 'left' }
      ]"
    >
      <header class="admin-dialog__head">
        <div v-if="icon" class="admin-dialog__icon" aria-hidden="true">
          <q-icon :name="icon" size="22px" />
        </div>
        <div class="admin-dialog__copy">
          <p v-if="eyebrow" class="admin-dialog__eyebrow">{{ eyebrow }}</p>
          <h2 class="admin-dialog__title">{{ title }}</h2>
          <p v-if="subtitle" class="admin-dialog__sub">{{ subtitle }}</p>
          <slot name="header-extra" />
        </div>
        <q-btn
          flat
          dense
          round
          icon="close"
          class="admin-dialog__close"
          aria-label="Close"
          v-close-popup
        />
      </header>

      <div v-if="$slots.notice" class="admin-dialog__notice">
        <slot name="notice" />
      </div>

      <div class="admin-dialog__body">
        <slot />
      </div>

      <footer v-if="$slots.actions" class="admin-dialog__foot">
        <slot name="actions" />
      </footer>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: boolean;
    title: string;
    eyebrow?: string;
    subtitle?: string;
    icon?: string;
    size?: "sm" | "md" | "lg" | "xl" | "2xl";
    persistent?: boolean;
    position?: "standard" | "right" | "left" | "top" | "bottom";
    fullHeight?: boolean;
    maximized?: boolean;
  }>(),
  {
    size: "md",
    persistent: true,
    position: "standard",
    fullHeight: false,
    maximized: false
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  hide: [];
}>();

function onUpdate(value: boolean) {
  emit("update:modelValue", value);
}
</script>

<style scoped>
.admin-dialog {
  display: flex;
  flex-direction: column;
  width: min(640px, 96vw);
  max-height: min(92vh, 920px);
  overflow: hidden;
  border-radius: 20px !important;
  border: 1px solid rgba(28, 36, 33, 0.08);
  box-shadow: 0 32px 72px rgba(18, 17, 16, 0.2) !important;
  background: #fff;
}

.admin-dialog--sm {
  width: min(480px, 96vw);
}

.admin-dialog--md {
  width: min(680px, 96vw);
}

.admin-dialog--lg {
  width: min(860px, 96vw);
}

.admin-dialog--xl {
  width: min(1040px, 96vw);
}

.admin-dialog--2xl {
  width: min(1180px, 97vw);
}

.admin-dialog--drawer {
  width: min(460px, 100vw);
  max-height: 100vh;
  height: 100%;
  border-radius: 0 !important;
  border-left: 1px solid rgba(28, 36, 33, 0.08);
}

.admin-dialog--drawer .admin-dialog__foot {
  flex-direction: column;
  align-items: stretch;
}

.admin-dialog--drawer .admin-dialog__foot :deep(.full-width) {
  width: 100%;
}

.admin-dialog__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.85rem;
  padding: 1.25rem 1.4rem 1.1rem;
  border-bottom: 1px solid rgba(28, 36, 33, 0.07);
  background:
    radial-gradient(
      ellipse 80% 120% at 0% 0%,
      rgba(196, 163, 90, 0.12),
      transparent 55%
    ),
    linear-gradient(180deg, #fbfaf8 0%, #fff 100%);
  flex-shrink: 0;
}

.admin-dialog__icon {
  display: grid;
  place-items: center;
  width: 2.65rem;
  height: 2.65rem;
  flex-shrink: 0;
  border-radius: 12px;
  background: rgba(154, 123, 60, 0.12);
  color: var(--gy-gold-deep);
  margin-top: 0.1rem;
}

.admin-dialog__copy {
  flex: 1;
  min-width: 0;
}

.admin-dialog__eyebrow {
  margin: 0 0 0.25rem;
  font-size: 0.66rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
}

.admin-dialog__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(1.28rem, 2.1vw, 1.55rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: var(--gy-ink);
}

.admin-dialog__sub {
  margin: 0.4rem 0 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--gy-muted);
  max-width: 42rem;
}

.admin-dialog__close {
  color: var(--gy-muted);
  margin-top: -0.1rem;
  background: rgba(28, 36, 33, 0.04);
}

.admin-dialog__close:hover {
  background: rgba(28, 36, 33, 0.08);
  color: var(--gy-ink);
}

.admin-dialog__notice {
  margin: 0 1.4rem;
  padding: 0.75rem 0.9rem;
  border-radius: 12px;
  background: rgba(154, 123, 60, 0.08);
  border: 1px solid rgba(154, 123, 60, 0.16);
  font-size: 0.84rem;
  line-height: 1.45;
  color: var(--gy-ink);
  flex-shrink: 0;
}

.admin-dialog__notice:first-of-type {
  margin-top: 1rem;
}

.admin-dialog__body {
  flex: 1 1 auto;
  overflow: auto;
  padding: 1.15rem 1.4rem 1.35rem;
  display: grid;
  gap: 1rem;
  -webkit-overflow-scrolling: touch;
  background: #f7f6f3;
}

.admin-dialog__body :deep(.q-gutter-md) {
  margin-top: 0;
}

.admin-dialog__body :deep(.q-gutter-md > *) {
  margin-top: 0;
}

.admin-dialog__body :deep(.q-field--outlined .q-field__control) {
  background: #fff;
  border-radius: 12px;
}

.admin-dialog__body :deep(.q-field--outlined .q-field__control:before) {
  border-color: rgba(28, 36, 33, 0.12);
}

.admin-dialog__body
  :deep(.q-field--outlined.q-field--focused .q-field__control:before) {
  border-color: var(--gy-gold-deep);
}

.admin-dialog__body :deep(.q-textarea .q-field__control) {
  min-height: 6.5rem;
}

.admin-dialog__body :deep(.q-toggle) {
  padding: 0.35rem 0.15rem;
}

.admin-dialog__foot {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.55rem;
  padding: 0.95rem 1.4rem 1.15rem;
  border-top: 1px solid rgba(28, 36, 33, 0.07);
  background: #fff;
  flex-shrink: 0;
}

.admin-dialog__foot :deep(.q-btn) {
  border-radius: 10px;
  min-height: 2.55rem;
  padding: 0.5rem 1.25rem;
  font-weight: 600;
}

.admin-dialog__foot :deep(.q-btn--flat) {
  font-weight: 500;
}

@media (max-width: 600px) {
  .admin-dialog__head,
  .admin-dialog__body,
  .admin-dialog__foot {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .admin-dialog__notice {
    margin-left: 1rem;
    margin-right: 1rem;
  }

  .admin-dialog__icon {
    display: none;
  }
}
</style>

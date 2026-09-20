<template>
  <section class="admin-form-section">
    <header
      v-if="title || hint || $slots.aside"
      class="admin-form-section__head"
    >
      <div class="admin-form-section__copy">
        <p v-if="eyebrow" class="admin-form-section__eyebrow">{{ eyebrow }}</p>
        <h3 v-if="title" class="admin-form-section__title">{{ title }}</h3>
        <p v-if="hint" class="admin-form-section__hint">{{ hint }}</p>
      </div>
      <div v-if="$slots.aside" class="admin-form-section__aside">
        <slot name="aside" />
      </div>
    </header>
    <div
      class="admin-form-section__fields"
      :class="[
        `admin-form-section__fields--${columns}`,
        { 'admin-form-section__fields--dense': dense }
      ]"
    >
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    eyebrow?: string;
    hint?: string;
    columns?: 1 | 2 | 3;
    dense?: boolean;
  }>(),
  {
    columns: 1,
    dense: false
  }
);
</script>

<style scoped>
.admin-form-section {
  display: grid;
  gap: 0.85rem;
  padding: 1rem 1.05rem 1.1rem;
  background: #fff;
  border: 1px solid rgba(28, 36, 33, 0.07);
  border-radius: 14px;
}

.admin-form-section__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
}

.admin-form-section__eyebrow {
  margin: 0 0 0.15rem;
  font-size: 0.64rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
}

.admin-form-section__title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 650;
  letter-spacing: -0.01em;
  color: var(--gy-ink);
}

.admin-form-section__hint {
  margin: 0.25rem 0 0;
  font-size: 0.8rem;
  line-height: 1.4;
  color: var(--gy-muted);
}

.admin-form-section__fields {
  display: grid;
  gap: 0.75rem;
}

.admin-form-section__fields--dense {
  gap: 0.55rem;
}

.admin-form-section__fields--2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.admin-form-section__fields--3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.admin-form-section__fields > .admin-form-span-2,
.admin-form-section__fields :deep(.admin-form-span-2) {
  grid-column: span 2;
}

.admin-form-section__fields > .admin-form-span-3,
.admin-form-section__fields :deep(.admin-form-span-3) {
  grid-column: 1 / -1;
}

@media (max-width: 720px) {
  .admin-form-section__fields--2,
  .admin-form-section__fields--3 {
    grid-template-columns: 1fr;
  }

  .admin-form-section__fields > .admin-form-span-2,
  .admin-form-section__fields > .admin-form-span-3 {
    grid-column: auto;
  }
}
</style>

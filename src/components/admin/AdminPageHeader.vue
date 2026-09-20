<template>
  <header v-reveal class="admin-page-head">
    <div class="admin-page-head__copy">
      <p v-if="eyebrow" class="admin-page-head__eyebrow">{{ eyebrow }}</p>
      <h1 class="admin-page-head__title">{{ title }}</h1>
      <p v-if="subtitle" class="admin-page-head__sub">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="admin-page-head__actions">
      <slot name="actions" />
    </div>
  </header>
  <div
    v-if="$slots.toolbar"
    v-reveal="{ delay: '90ms' }"
    class="admin-page-toolbar"
  >
    <slot name="toolbar" />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  eyebrow?: string;
  subtitle?: string;
}>();
</script>

<style scoped>
.admin-page-head {
  display: flex;
  justify-content: space-between;
  gap: 0.85rem;
  align-items: start;
  flex-wrap: wrap;
  margin-bottom: 0.85rem;
}

.admin-page-head__actions :deep(.q-btn),
.admin-page-toolbar :deep(.q-btn) {
  border-radius: 8px;
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease;
}

.admin-page-head__actions :deep(.q-btn:hover),
.admin-page-toolbar :deep(.q-btn:hover) {
  transform: translateY(-1px);
}

.admin-page-head__eyebrow {
  margin: 0 0 0.15rem;
  font-size: 0.66rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--gy-gold-deep);
}

.admin-page-head__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(1.4rem, 2.2vw, 1.75rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.15;
}

.admin-page-head__sub {
  margin: 0.3rem 0 0;
  color: var(--gy-muted);
  max-width: 40rem;
  font-size: 0.88rem;
}

.admin-page-head__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.admin-page-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  align-items: center;
  margin-bottom: 0.85rem;
}

.admin-page-toolbar > * {
  flex: 1 1 160px;
  max-width: 100%;
}

.admin-page-toolbar :deep(.q-field--outlined .q-field__control) {
  border-radius: 10px;
}

@media (max-width: 600px) {
  .admin-page-head__actions {
    width: 100%;
  }

  .admin-page-head__actions :deep(.q-btn) {
    flex: 1 1 auto;
  }
}
</style>

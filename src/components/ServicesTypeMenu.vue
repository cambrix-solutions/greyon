<template>
  <div
    class="svc-type"
    role="menu"
    aria-label="Our Services"
    @mouseenter="emit('keep-open')"
    @mouseleave="emit('request-close')"
  >
    <ul class="svc-type__list">
      <li v-for="item in items" :key="item.slug">
        <router-link
          :to="item.path"
          class="svc-type__link"
          role="menuitem"
          @click="emit('navigate')"
        >
          <span class="svc-type__label">{{ item.label }}</span>
          <q-icon name="arrow_forward" size="16px" aria-hidden="true" />
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { SERVICE_TYPE_ITEMS } from "@/utils/propertyKind";

const items = SERVICE_TYPE_ITEMS;

const emit = defineEmits<{
  (e: "keep-open"): void;
  (e: "request-close"): void;
  (e: "navigate"): void;
}>();
</script>

<style scoped>
.svc-type {
  min-width: min(16.5rem, calc(100vw - 2rem));
  padding: 0.45rem;
  background: var(--gy-cream);
  color: var(--gy-forest);
  border: 1px solid rgba(98, 112, 99, 0.16);
  border-radius: 12px;
  box-shadow: 0 16px 36px rgba(69, 76, 75, 0.12);
  animation: svc-type-in 0.18s ease;
}

.svc-type__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.1rem;
}

.svc-type__link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: 2.65rem;
  padding: 0.55rem 0.75rem;
  border-radius: 8px;
  color: var(--gy-forest);
  text-decoration: none;
  font-family: var(--font-display);
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  transition:
    background 0.18s ease,
    color 0.18s ease;
}

.svc-type__link :deep(.q-icon) {
  color: var(--gy-gold-deep);
  opacity: 0.7;
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.svc-type__link:hover,
.svc-type__link:focus-visible {
  background: rgba(98, 112, 99, 0.08);
  color: var(--gy-forest);
  outline: none;
}

.svc-type__link:hover :deep(.q-icon),
.svc-type__link:focus-visible :deep(.q-icon) {
  opacity: 1;
  transform: translateX(2px);
}

@keyframes svc-type-in {
  from {
    opacity: 0;
    transform: translateY(-0.25rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .svc-type {
    animation: none;
  }

  .svc-type__link,
  .svc-type__link :deep(.q-icon) {
    transition: none;
  }
}
</style>
